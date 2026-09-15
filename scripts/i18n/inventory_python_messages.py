from __future__ import annotations

import argparse
import re
from collections import Counter
from dataclasses import dataclass
from itertools import groupby
from pathlib import Path
from types import MappingProxyType
from typing import Final, Mapping, Sequence

REPO_ROOT: Final = Path(__file__).resolve().parents[2]
SCOPE: Final = "litellm/proxy"
QUOTES: Final = "\"'"
PREFIX_CHARS: Final = frozenset("fFrRbBuU")
CALL_PATTERN: Final = re.compile(r"(?<![\w.])(ProxyException|HTTPException)\s*\(")
KEYWORD_PATTERN: Final = re.compile(r"\b(message|detail)\s*=")


@dataclass(frozen=True)
class MessageSite:
    path: str
    message: str
    source: str


@dataclass(frozen=True)
class Group:
    wave: int
    name: str
    files: tuple[str, ...]


@dataclass(frozen=True)
class FileMessages:
    path: str
    messages: tuple[tuple[str, int], ...]


@dataclass(frozen=True)
class GroupReport:
    group: Group
    distinct: int
    call_sites: int
    files: tuple[FileMessages, ...]


def _skip_string(text: str, index: int) -> int:
    quote = text[index]
    if text.startswith(quote * 3, index):
        cursor = index + 3
        while cursor < len(text):
            if text[cursor] == "\\":
                cursor += 2
            elif text.startswith(quote * 3, cursor):
                return cursor + 3
            else:
                cursor += 1
        return len(text)
    cursor = index + 1
    while cursor < len(text) and text[cursor] != "\n":
        if text[cursor] == "\\":
            cursor += 2
        elif text[cursor] == quote:
            return cursor + 1
        else:
            cursor += 1
    return cursor


def _call_end(text: str, open_index: int) -> int:
    depth = 0
    cursor = open_index
    while cursor < len(text):
        char = text[cursor]
        if char in QUOTES:
            cursor = _skip_string(text, cursor)
            continue
        if char == "#":
            while cursor < len(text) and text[cursor] != "\n":
                cursor += 1
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return cursor
        cursor += 1
    return -1


def _read_literal(text: str, index: int) -> tuple[str, str, int] | None:
    cursor = index
    while cursor < len(text) and text[cursor] in " \t\r\n":
        cursor += 1
    source_start = cursor
    while cursor < len(text) and text[cursor] in PREFIX_CHARS:
        cursor += 1
    if cursor >= len(text) or text[cursor] not in QUOTES:
        return None
    quote = text[cursor]
    if text.startswith(quote * 3, cursor):
        end = cursor + 3
        while end < len(text):
            if text[end] == "\\":
                end += 2
            elif text.startswith(quote * 3, end):
                return text[cursor + 3 : end], text[source_start : end + 3], end + 3
            else:
                end += 1
        return None
    end = cursor + 1
    while end < len(text):
        if text[end] == "\\":
            end += 2
        elif text[end] == quote:
            return text[cursor + 1 : end], text[source_start : end + 1], end + 1
        else:
            end += 1
    return None


def _call_literals(text: str, match: re.Match[str]) -> tuple[tuple[str, str], ...]:
    kind = match.group(1)
    open_index = match.end() - 1
    end = _call_end(text, open_index)
    if end < 0:
        return ()
    body = text[open_index + 1 : end]
    keyword = "message" if kind == "ProxyException" else "detail"
    return tuple(
        (literal[0], literal[1])
        for keyword_match in KEYWORD_PATTERN.finditer(body)
        if keyword_match.group(1) == keyword
        for literal in (_read_literal(body, keyword_match.end()),)
        if literal is not None
    )


def extract_file(display_path: str, text: str) -> tuple[MessageSite, ...]:
    return tuple(
        MessageSite(path=display_path, message=message, source=source)
        for match in CALL_PATTERN.finditer(text)
        for message, source in _call_literals(text, match)
    )


def extract_scope(repo_root: Path) -> tuple[MessageSite, ...]:
    scope_root = repo_root / SCOPE
    return tuple(
        site
        for path in sorted(scope_root.rglob("*.py"))
        for site in extract_file(path.relative_to(repo_root).as_posix(), path.read_text(encoding="utf-8"))
    )


def sites_by_path(sites: Sequence[MessageSite]) -> Mapping[str, tuple[MessageSite, ...]]:
    ordered = sorted(sites, key=lambda site: site.path)
    return MappingProxyType({path: tuple(group) for path, group in groupby(ordered, key=lambda site: site.path)})


def _file_messages(sites: Sequence[MessageSite]) -> tuple[tuple[str, int], ...]:
    counts = Counter(site.message for site in sites)
    return tuple(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def build_report(group: Group, grouped: Mapping[str, tuple[MessageSite, ...]]) -> GroupReport:
    group_sites = tuple(site for path in group.files for site in grouped.get(path, ()))
    return GroupReport(
        group=group,
        distinct=len({site.message for site in group_sites}),
        call_sites=len(group_sites),
        files=tuple(
            FileMessages(path=path, messages=_file_messages(grouped[path])) for path in group.files if path in grouped
        ),
    )


def _code_span(message: str) -> str:
    return f"`` {message} ``" if "`" in message else f"`{message}`"


def render_summary(reports: Sequence[GroupReport]) -> str:
    header = "| Wave | Message group | Distinct messages | Call sites | Files |\n| --- | --- | ---: | ---: | ---: |"
    rows = (
        f"| {report.group.wave} | {report.group.name} | {report.distinct} | {report.call_sites} | {len(report.files)} |"
        for report in reports
    )
    return "\n".join((header, *rows)) + "\n"


def render_group(report: GroupReport) -> str:
    header = "\n".join(
        (
            f"### {report.group.name}",
            "",
            f"{report.distinct} distinct messages, {report.call_sites} call sites, {len(report.files)} files.",
        )
    )
    blocks = (
        "\n".join(
            (f"`{file_messages.path}`", "")
            + tuple(
                f"- [ ] {_code_span(message)}" + (f"  (x{count})" if count > 1 else "")
                for message, count in file_messages.messages
            )
        )
        for file_messages in report.files
    )
    return header + "\n\n" + "\n\n".join(blocks) + "\n"


GROUPS: Final = (
    Group(
        wave=1,
        name="Auth and RBAC",
        files=(
            "litellm/proxy/auth/auth_checks.py",
            "litellm/proxy/auth/auth_checks_organization.py",
            "litellm/proxy/auth/auth_exception_handler.py",
            "litellm/proxy/auth/auth_utils.py",
            "litellm/proxy/auth/handle_jwt.py",
            "litellm/proxy/auth/login_utils.py",
            "litellm/proxy/auth/password_policy.py",
            "litellm/proxy/auth/resolvers/grants.py",
            "litellm/proxy/auth/route_checks.py",
            "litellm/proxy/auth/user_api_key_auth.py",
            "litellm/proxy/management_helpers/team_member_permission_checks.py",
        ),
    ),
    Group(
        wave=1,
        name="SSO and login",
        files=(
            "litellm/proxy/management_endpoints/sso/saml_sso.py",
            "litellm/proxy/management_endpoints/ui_sso.py",
        ),
    ),
    Group(
        wave=1,
        name="Key management",
        files=("litellm/proxy/management_endpoints/key_management_endpoints.py",),
    ),
    Group(
        wave=1,
        name="Spend and budgets",
        files=(
            "litellm/proxy/management_endpoints/cost_tracking_settings.py",
            "litellm/proxy/spend_tracking/spend_management_endpoints.py",
        ),
    ),
    Group(
        wave=1,
        name="JWT key mapping",
        files=("litellm/proxy/management_endpoints/jwt_key_mapping_endpoints.py",),
    ),
    Group(
        wave=1,
        name="Model management",
        files=("litellm/proxy/management_endpoints/model_management_endpoints.py",),
    ),
    Group(
        wave=1,
        name="Teams",
        files=(
            "litellm/proxy/management_endpoints/team_callback_endpoints.py",
            "litellm/proxy/management_endpoints/team_endpoints.py",
        ),
    ),
    Group(
        wave=1,
        name="Users",
        files=("litellm/proxy/management_endpoints/internal_user_endpoints.py",),
    ),
    Group(
        wave=1,
        name="Organizations and customers",
        files=(
            "litellm/proxy/management_endpoints/customer_endpoints.py",
            "litellm/proxy/management_endpoints/organization_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Guardrails",
        files=(
            "litellm/proxy/guardrails/guardrail_endpoints.py",
            "litellm/proxy/guardrails/guardrail_hooks/akto/akto.py",
            "litellm/proxy/guardrails/guardrail_hooks/bedrock_guardrails.py",
            "litellm/proxy/guardrails/guardrail_hooks/model_armor/model_armor.py",
            "litellm/proxy/guardrails/guardrail_hooks/onyx/onyx.py",
            "litellm/proxy/guardrails/guardrail_hooks/prompt_security/prompt_security.py",
            "litellm/proxy/guardrails/usage_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Config overrides and router settings",
        files=(
            "litellm/proxy/management_endpoints/auto_router_endpoints.py",
            "litellm/proxy/management_endpoints/cache_settings_endpoints.py",
            "litellm/proxy/management_endpoints/config_override_endpoints.py",
            "litellm/proxy/ui_crud_endpoints/proxy_setting_endpoints.py",
            "litellm/proxy/ui_crud_endpoints/user_banner_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Tools tags and search",
        files=(
            "litellm/proxy/management_endpoints/tag_management_endpoints.py",
            "litellm/proxy/management_endpoints/tool_management_endpoints.py",
            "litellm/proxy/search_endpoints/search_tool_management.py",
        ),
    ),
    Group(
        wave=2,
        name="Policy engine",
        files=(
            "litellm/proxy/management_endpoints/policy_endpoints/endpoints.py",
            "litellm/proxy/policy_engine/policy_endpoints.py",
            "litellm/proxy/policy_engine/policy_resolve_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Files and batches",
        files=(
            "litellm/proxy/batches_endpoints/common_utils.py",
            "litellm/proxy/fine_tuning_endpoints/endpoints.py",
            "litellm/proxy/openai_files_endpoints/batch_file_validation.py",
            "litellm/proxy/openai_files_endpoints/common_utils.py",
            "litellm/proxy/openai_files_endpoints/files_endpoints.py",
            "litellm/proxy/openai_files_endpoints/storage_backend_service.py",
        ),
    ),
    Group(
        wave=2,
        name="Agents and A2A",
        files=(
            "litellm/proxy/a2a/endpoints.py",
            "litellm/proxy/agent_endpoints/a2a_endpoints.py",
            "litellm/proxy/agent_endpoints/a2a_routing.py",
            "litellm/proxy/agent_endpoints/endpoints.py",
            "litellm/proxy/discovery_endpoints/agent_skills_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Pass-through endpoints",
        files=(
            "litellm/proxy/pass_through_endpoints/llm_passthrough_endpoints.py",
            "litellm/proxy/pass_through_endpoints/managed_id_rewriter.py",
            "litellm/proxy/pass_through_endpoints/pass_through_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Prompts",
        files=("litellm/proxy/prompts/prompt_endpoints.py",),
    ),
    Group(
        wave=2,
        name="Vector stores",
        files=(
            "litellm/proxy/vector_store_endpoints/endpoints.py",
            "litellm/proxy/vector_store_endpoints/management_endpoints.py",
            "litellm/proxy/vector_store_endpoints/utils.py",
        ),
    ),
    Group(
        wave=2,
        name="Access groups and workflows",
        files=(
            "litellm/proxy/management_endpoints/access_group_endpoints.py",
            "litellm/proxy/management_endpoints/workflow_management_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Memory and caching",
        files=(
            "litellm/proxy/caching_routes.py",
            "litellm/proxy/memory/memory_endpoints.py",
        ),
    ),
    Group(
        wave=2,
        name="Credentials",
        files=("litellm/proxy/credential_endpoints/endpoints.py",),
    ),
    Group(
        wave=3,
        name="Proxy core",
        files=(
            "litellm/proxy/common_request_processing.py",
            "litellm/proxy/common_utils/debug_utils.py",
            "litellm/proxy/common_utils/http_parsing_utils.py",
            "litellm/proxy/custom_auth_auto.py",
            "litellm/proxy/health_endpoints/_health_endpoints.py",
            "litellm/proxy/litellm_pre_call_utils.py",
            "litellm/proxy/plugin_routes.py",
            "litellm/proxy/proxy_server.py",
            "litellm/proxy/public_endpoints/public_endpoints.py",
            "litellm/proxy/response_api_endpoints/endpoints.py",
            "litellm/proxy/utils.py",
        ),
    ),
    Group(
        wave=3,
        name="MCP server",
        files=(
            "litellm/proxy/_experimental/mcp_server/auth/user_api_key_auth_mcp.py",
            "litellm/proxy/_experimental/mcp_server/byok_oauth_endpoints.py",
            "litellm/proxy/_experimental/mcp_server/discoverable_endpoints.py",
            "litellm/proxy/_experimental/mcp_server/mcp_server_manager.py",
            "litellm/proxy/_experimental/mcp_server/outbound_credentials/adapter.py",
            "litellm/proxy/_experimental/mcp_server/rest_endpoints.py",
            "litellm/proxy/_experimental/mcp_server/server.py",
            "litellm/proxy/_experimental/mcp_server/tool_search.py",
            "litellm/proxy/management_endpoints/mcp_management_endpoints.py",
        ),
    ),
    Group(
        wave=3,
        name="Other endpoints",
        files=(
            "litellm/proxy/container_endpoints/handler_factory.py",
            "litellm/proxy/container_endpoints/ownership.py",
            "litellm/proxy/example_config_yaml/pipeline_test_guardrails.py",
            "litellm/proxy/hooks/cache_control_check.py",
            "litellm/proxy/hooks/responses_id_security.py",
            "litellm/proxy/image_endpoints/endpoints.py",
            "litellm/proxy/logging_endpoints/callback_logs_endpoints.py",
            "litellm/proxy/management_endpoints/gateway_request_endpoints.py",
            "litellm/proxy/management_endpoints/user_agent_analytics_endpoints.py",
        ),
    ),
)


def main() -> None:
    parser: Final = argparse.ArgumentParser(
        description="List distinct ProxyException message= and HTTPException detail= literals under litellm/proxy."
    )
    parser.add_argument("--summary", action="store_true", help="Print the per-group counts table only.")
    args: Final = parser.parse_args()
    grouped: Final = sites_by_path(extract_scope(REPO_ROOT))
    reports: Final = tuple(build_report(group, grouped) for group in GROUPS)
    print(render_summary(reports) if args.summary else "\n".join(render_group(report) for report in reports))


if __name__ == "__main__":
    main()
