# LiteLLM i18n Phase 0 (Python) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LiteLLM proxy error responses translatable to Chinese when a request negotiates `Accept-Language: zh`, with byte-identical English behavior otherwise.

**Architecture:** A new self-contained package `litellm/proxy/i18n/` holds locale negotiation, a message catalog, and pure translation functions. Wiring is five small edits inside the existing exception handlers in `litellm/proxy/proxy_server.py`, which is the entire upstream conflict surface. No raise site is modified, so a message missing from the catalog falls back to English.

**Tech Stack:** Python 3.13, FastAPI 0.128.8, Starlette, Pydantic v2, pytest.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md`

## Global Constraints

- Python max line length is 120
- Do not write comments unless absolutely necessary for complex logic, or as a tool directive (TODO with a reason, lint suppression with a reason)
- Every lint or type suppression must name the exact rule in brackets and carry a reason, e.g. `# pyright: ignore[reportArgumentType]  # stubs lack async overload`. `# type: ignore` is banned (LIT009)
- Annotate every variable with `: Final` (LIT010); do not rebind or mutate parameters (LIT011)
- No mutation and no mutable globals. LIT001 bans a mutable collection in any annotation, including a local's; LIT002 bans constructing one, meaning a list/dict/set literal, a comprehension producing one, or a call to `list`/`dict`/`set`/`deque`/`defaultdict`/`OrderedDict`/`Counter`/`ChainMap`. Build each value in one shot as a `tuple(...)`, `frozenset(...)`, or `MappingProxyType(...)` wrapper around a generator, comprehension, or dict literal, and compare against the input for equality to decide whether to return the original object
- Qualify every TypedDict field with `ReadOnly[...]` (LIT012)
- Fully typed, no `Any` and no coarse types like `dict[str, object]` as a parameter type; use `Mapping[str, object]`
- Do not throw for expected control flow; model failures as values
- Never edit or commit `ruff-strict-budget.json`, `type-discipline-budget.json`, `basedpyright-code-budget.json`, or `test-quality-budget.json`
- Tests mirror `litellm/` under `tests/test_litellm/`; name them `test_<filename>.py`
- Conventional commits, no attribution trailers, no `claude/` prefix or `/` in branch names
- Exact English passthrough is the contract: when no locale is negotiated, translation functions must return the **same object** they were given, not an equal copy

---

### Task 1: Shared glossary and Phase 0 inventories

This is the shared input for both plans. It produces no runtime code, and it freezes the lists that later phases consume so the catalog does not get reworked piecemeal.

**Files:**
- Create: `i18n/glossary.json`
- Create: `docs/i18n/inventory-python-messages.md`
- Create: `docs/i18n/inventory-ui-strings.md`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `i18n/glossary.json`, shape `{ "<english term>": ["<banned zh translation>", ...] }`
  - `docs/i18n/inventory-python-messages.md`, a frozen first-pass list of translatable Python messages
  - `docs/i18n/inventory-ui-strings.md`, a frozen first-pass list of translatable dashboard strings

- [ ] **Step 1: Write the glossary**

Create `i18n/glossary.json`:

```json
{
  "LiteLLM": ["轻量级LLM"],
  "OpenAI": [],
  "Anthropic": [],
  "Azure": [],
  "Bedrock": [],
  "Vertex": [],
  "API Key": ["接口密钥", "API密钥", "应用编程接口密钥"],
  "Virtual Key": ["虚拟密钥"],
  "Token": ["令牌"],
  "Endpoint": ["端点", "终结点"],
  "Base URL": ["基础地址", "基地址", "基础URL"],
  "Webhook": ["网络钩子", "网页钩子"],
  "SDK": ["软件开发工具包"],
  "JWT": ["JSON网络令牌"],
  "SSO": ["单点登录"],
  "OAuth": ["开放授权"],
  "MCP": ["模型上下文协议"]
}
```

Terms with an empty banned list are recorded so later phases know they are deliberately kept in English, even though there is no specific wrong translation to catch yet.

- [ ] **Step 2: Create the dashboard string inventory**

Create `docs/i18n/inventory-ui-strings.md`. Seed it with the output of this command, then group the result by route area:

```bash
cd ui/litellm-dashboard && grep -rEo '>[A-Z][a-z]+ [a-z]+' src --include=*.tsx | sort | uniq -c | sort -rn > ../../docs/i18n/inventory-ui-strings.txt
```

The markdown file records, per route area, the count of translatable strings and the list of files that hold them. The raw grep output is a starting point, not the deliverable: a reviewer reading this file must be able to see which route areas Phase 1 will consume and in what order.

- [ ] **Step 3: Create the Python message inventory**

Create `docs/i18n/inventory-python-messages.md`. Seed it with:

```bash
cd /Users/wuchanglong/Documents/workspace/litellm && grep -rhoE '(ProxyException|HTTPException)\([^)]*message="[^"]*"' litellm --include=*.py | sort -u > docs/i18n/inventory-python-messages.txt
```

The markdown file records the messages that are candidates for the catalog, ordered by how often the surrounding code path is reachable from the dashboard, and marks the initial catalog subset from Task 5 with a checkbox.

- [ ] **Step 4: Verify the glossary parses and is well formed**

Run:

```bash
python3 -c "import json,pathlib; d=json.loads(pathlib.Path('i18n/glossary.json').read_text()); assert d; assert all(isinstance(k,str) and isinstance(v,list) for k,v in d.items()); print('entries:', len(d))"
```

Expected: prints `entries: 17` (or however many entries were written), exit code 0.

- [ ] **Step 5: Commit**

```bash
git add i18n/glossary.json docs/i18n/
git commit -m "docs: add i18n glossary and phase 0 inventories"
```

---

### Task 2: Locale negotiation

**Files:**
- Create: `litellm/proxy/i18n/__init__.py`
- Create: `litellm/proxy/i18n/negotiation.py`
- Test: `tests/test_litellm/proxy/i18n/__init__.py`
- Test: `tests/test_litellm/proxy/i18n/test_negotiation.py`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `SUPPORTED_PRIMARY_SUBTAGS: Final[frozenset[str]]` in `litellm/proxy/i18n/negotiation.py`, equal to `frozenset({"zh", "en"})`. English is the source language, so a request that prefers English resolves to `None` rather than to a locale
  - `negotiate_locale(accept_language: str | None) -> str | None`, returns `"zh"` or `None`

- [ ] **Step 1: Create the package with an empty init**

Create `litellm/proxy/i18n/__init__.py` with a docstring only:

```python
"""Request-scoped message translation for proxy error responses."""
```

Create `tests/test_litellm/proxy/i18n/__init__.py` as an empty file.

- [ ] **Step 2: Write the failing tests**

Create `tests/test_litellm/proxy/i18n/test_negotiation.py`:

```python
import pytest

from litellm.proxy.i18n.negotiation import negotiate_locale


@pytest.mark.parametrize(
    "header,expected",
    [
        (None, None),
        ("", None),
        ("zh", "zh"),
        ("zh-CN", "zh"),
        ("zh-Hant", "zh"),
        ("zh-TW", "zh"),
        ("zh-CN,zh;q=0.9,en;q=0.8", "zh"),
        ("zh,en", "zh"),
        ("en", None),
        ("en-US,en;q=0.9", None),
        ("en,zh", None),
        ("en;q=1.0,zh;q=0.7", None),
        ("zh;q=0.3,en;q=0.9", None),
        ("fr-FR", None),
        ("*", None),
        ("zh;q=0", None),
        ("ZH-cn", "zh"),
        ("  zh  ", "zh"),
        ("zh;q=notanumber,en", None),
        ("de,fr;q=0.8", None),
    ],
)
def test_negotiate_locale(header: str | None, expected: str | None) -> None:
    assert negotiate_locale(header) == expected
```

The mixed-language cases are the point of this table. Negotiation serves the first supported tag in descending preference order, so `en,zh` and `zh;q=0.3,en;q=0.9` both resolve to `None`: a client that prefers English must not be forced into Chinese merely because Chinese is also acceptable. Only when Chinese outranks English does translation apply.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_negotiation.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'litellm.proxy.i18n.negotiation'`

- [ ] **Step 4: Implement negotiation**

Create `litellm/proxy/i18n/negotiation.py`:

```python
"""RFC 9110 Accept-Language negotiation over the locales the proxy can serve.

English is the source language, so serving it is the no-translation outcome and only
Chinese carries a catalog. The first supported tag in descending preference order
decides, so a client that prefers English is never forced into Chinese just because
Chinese is also acceptable.
"""

from __future__ import annotations

import re
from typing import Final

ZH: Final = "zh"
EN: Final = "en"
SUPPORTED_PRIMARY_SUBTAGS: Final[frozenset[str]] = frozenset({ZH, EN})

_TAG: Final = re.compile(r"^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$")


def _quality(params: str) -> float:
    for param in params.split(";"):
        name, _, value = param.partition("=")
        if name.strip().lower() != "q":
            continue
        try:
            return float(value.strip())
        except ValueError:
            return 0.0
    return 1.0


def _preference(index: int, part: str) -> tuple[float, int, str] | None:
    raw_tag, _, params = part.strip().partition(";")
    tag: Final = raw_tag.strip()
    quality: Final = _quality(params)
    if not tag or not _TAG.match(tag) or quality <= 0.0:
        return None
    return (quality, -index, tag)


def _ranked_tags(header: str) -> tuple[str, ...]:
    preferences: Final = (
        preference
        for preference in (_preference(index, part) for index, part in enumerate(header.split(",")))
        if preference is not None
    )
    return tuple(tag for _, _, tag in sorted(preferences, reverse=True))


def negotiate_locale(accept_language: str | None) -> str | None:
    """Return the locale to translate into, or None to serve the English source unchanged."""
    if not accept_language:
        return None
    for tag in _ranked_tags(accept_language):
        primary = tag.split("-", 1)[0].lower()
        if primary not in SUPPORTED_PRIMARY_SUBTAGS:
            continue
        return ZH if primary == ZH else None
    return None
```

The ranking is built in one shot as a generator fed to `tuple(...)`. An earlier draft seeded an empty `list` and appended to it, which LIT001 and LIT002 both reject; do not reintroduce that shape.

A tag the proxy does not serve (`fr`, `*`, an unparseable token) is skipped rather than treated as a match, so an unsupported language falls through to the next preference and ultimately to the English source.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_negotiation.py -v`
Expected: PASS, 20 passed

- [ ] **Step 6: Commit**

```bash
git add litellm/proxy/i18n/__init__.py litellm/proxy/i18n/negotiation.py tests/test_litellm/proxy/i18n/
git commit -m "feat(proxy): add Accept-Language negotiation for i18n"
```

---

### Task 3: Message catalog matcher

**Files:**
- Create: `litellm/proxy/i18n/matcher.py`
- Test: `tests/test_litellm/proxy/i18n/test_matcher.py`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `CatalogError(ValueError)`
  - `CompiledTemplate` NamedTuple with fields `source: str`, `regex: re.Pattern[str]`, `translation: str`
  - `Catalog` NamedTuple with fields `exact: Mapping[str, str]`, `patterns: tuple[CompiledTemplate, ...]`
  - `build_pattern(template: str) -> re.Pattern[str]`
  - `build_catalog(exact: Mapping[str, str], templates: Mapping[str, str]) -> Catalog`, raises `CatalogError` on an ambiguous or placeholder-inconsistent catalog
  - `Catalog.translate(message: str) -> str`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_litellm/proxy/i18n/test_matcher.py`:

```python
import pytest

from litellm.proxy.i18n.matcher import CatalogError, build_catalog, build_pattern


def test_build_pattern_matches_placeholder_and_is_anchored() -> None:
    pattern = build_pattern("Invalid key = {key}. Retry.")
    match = pattern.fullmatch("Invalid key = sk-123. Retry.")
    assert match is not None
    assert match.group("key") == "sk-123"
    assert pattern.fullmatch("prefix Invalid key = sk-123. Retry.") is None


def test_build_pattern_escapes_regex_metacharacters() -> None:
    pattern = build_pattern("Missing (model) {model}?")
    assert pattern.fullmatch("Missing (model) gpt-4?") is not None
    assert pattern.fullmatch("Missing model gpt-4?") is None


def test_catalog_prefers_exact_match() -> None:
    catalog = build_catalog({"No models configured on proxy": "未配置模型"}, {})
    assert catalog.translate("No models configured on proxy") == "未配置模型"


def test_catalog_translates_template_and_fills_placeholders() -> None:
    catalog = build_catalog(
        {},
        {"Invalid key = {key}. Retry.": "无效的 key = {key}。请重试。"},
    )
    assert catalog.translate("Invalid key = sk-abc. Retry.") == "无效的 key = sk-abc。请重试。"


def test_catalog_returns_input_when_nothing_matches() -> None:
    catalog = build_catalog({"a": "b"}, {"x {y}": "z {y}"})
    assert catalog.translate("unrelated message") == "unrelated message"


def test_build_catalog_rejects_placeholder_mismatch() -> None:
    with pytest.raises(CatalogError, match="placeholder"):
        build_catalog({}, {"Invalid key = {key}": "无效的 key = {other}"})


def test_build_catalog_rejects_duplicate_placeholder_count() -> None:
    with pytest.raises(CatalogError, match="placeholder"):
        build_catalog({}, {"Key {key} and key {key}": "key {key}"})


def test_build_catalog_rejects_duplicate_placeholder_name() -> None:
    with pytest.raises(CatalogError, match="duplicate"):
        build_catalog({}, {"Key {key} and key {key}": "key {key} and key {key}"})


def test_build_catalog_rejects_template_that_matches_another_template() -> None:
    with pytest.raises(CatalogError, match="ambiguous"):
        build_catalog(
            {},
            {
                "Invalid key = {key}": "a {key}",
                "Invalid key = {key} and model = {model}": "b {key} {model}",
            },
        )


def test_build_catalog_rejects_template_matching_an_exact_message() -> None:
    with pytest.raises(CatalogError, match="ambiguous"):
        build_catalog(
            {"Invalid key = sk-1"},
            {"Invalid key = {key}": "a {key}"},
        )


def test_build_catalog_accepts_disjoint_templates() -> None:
    catalog = build_catalog(
        {},
        {
            "Invalid key = {key}": "a {key}",
            "Missing model {model}": "b {model}",
        },
    )
    assert catalog.translate("Missing model gpt-4") == "b gpt-4"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_matcher.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'litellm.proxy.i18n.matcher'`

- [ ] **Step 3: Implement the matcher**

Create `litellm/proxy/i18n/matcher.py`:

```python
"""Template matching for English proxy messages, keyed by a curated Chinese catalog.

A category like `Invalid key = {key}` is authored close to the English source rather
than as a hand-written regex, and ambiguity between entries is rejected at build time
instead of being resolved by list order.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from types import MappingProxyType
from typing import Final, NamedTuple

_PLACEHOLDER: Final = re.compile(r"\{([a-z_][a-z0-9_]*)\}")


class CatalogError(ValueError):
    """Raised when a catalog cannot be applied unambiguously."""


class CompiledTemplate(NamedTuple):
    source: str
    regex: re.Pattern[str]
    translation: str


class Catalog(NamedTuple):
    exact: Mapping[str, str]
    patterns: tuple[CompiledTemplate, ...]

    def translate(self, message: str) -> str:
        exact: Final = self.exact.get(message)
        if exact is not None:
            return exact
        for template in self.patterns:
            match = template.regex.fullmatch(message)
            if match is not None:
                return template.translation.format(**match.groupdict())
        return message


def _placeholders(text: str) -> tuple[str, ...]:
    return tuple(_PLACEHOLDER.findall(text))


def build_pattern(template: str) -> re.Pattern[str]:
    """Turn a message template with `{name}` slots into an anchored regex with named groups."""
    chunks: Final = _PLACEHOLDER.split(template)
    return re.compile(
        "".join(re.escape(chunk) if index % 2 == 0 else f"(?P<{chunk}>.+?)" for index, chunk in enumerate(chunks))
    )


def _validate_placeholders(template: str, translation: str) -> None:
    source_placeholders: Final = _placeholders(template)
    translation_placeholders: Final = _placeholders(translation)
    if len(frozenset(source_placeholders)) != len(source_placeholders):
        raise CatalogError(f"duplicate placeholder name in template {template!r}: {source_placeholders!r}")
    if sorted(source_placeholders) != sorted(translation_placeholders):
        raise CatalogError(
            f"placeholder mismatch for template {template!r}: source has "
            f"{source_placeholders!r}, translation has {translation_placeholders!r}"
        )
    try:
        translation.format(**dict.fromkeys(source_placeholders, "X"))
    except (KeyError, IndexError, ValueError) as error:
        raise CatalogError(f"translation for template {template!r} cannot be formatted: {error}") from error


def _validate_no_ambiguity(
    exact: Mapping[str, str],
    patterns: tuple[CompiledTemplate, ...],
) -> None:
    for exact_source in exact:
        for pattern in patterns:
            if pattern.regex.fullmatch(exact_source) is not None:
                raise CatalogError(
                    f"ambiguous catalog: exact message {exact_source!r} also matches template {pattern.source!r}"
                )
    for pattern in patterns:
        for other in patterns:
            if other.source == pattern.source:
                continue
            if pattern.regex.fullmatch(other.source) is not None:
                raise CatalogError(
                    f"ambiguous catalog: template {pattern.source!r} also matches template {other.source!r}"
                )


def build_catalog(exact: Mapping[str, str], templates: Mapping[str, str]) -> Catalog:
    """Compile and validate a catalog. Raises CatalogError if it cannot be applied unambiguously."""
    for template, translation in templates.items():
        _validate_placeholders(template, translation)
    patterns: Final = tuple(
        CompiledTemplate(source=template, regex=build_pattern(template), translation=translation)
        for template, translation in templates.items()
    )
    _validate_no_ambiguity(exact, patterns)
    return Catalog(exact=MappingProxyType(dict(exact)), patterns=patterns)
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_matcher.py -v`
Expected: PASS, 11 passed

- [ ] **Step 5: Commit**

```bash
git add litellm/proxy/i18n/matcher.py tests/test_litellm/proxy/i18n/test_matcher.py
git commit -m "feat(proxy): add validated message catalog matcher"
```

---

### Task 4: Pure translation functions

**Files:**
- Create: `litellm/proxy/i18n/translator.py`
- Create: `litellm/proxy/i18n/catalog/__init__.py`
- Create: `litellm/proxy/i18n/catalog/zh.py`
- Test: `tests/test_litellm/proxy/i18n/test_translator.py`
- Test: `tests/test_litellm/proxy/i18n/test_catalog_structure.py`

**Interfaces:**
- Consumes: `Catalog`, `build_catalog` from `litellm.proxy.i18n.matcher`; `ProblemDetail` from `litellm.types.proxy.management_endpoints.management_v1`
- Produces:
  - `CATALOG: Final[Catalog]` in `litellm/proxy/i18n/catalog/__init__.py`
  - `TRANSLATABLE_FIELDS: Final[frozenset[str]]` equal to `frozenset({"message", "detail", "title", "msg"})`
  - `catalog_for(locale: str | None) -> Catalog | None`
  - `translate_message(message: str, locale: str | None) -> str`
  - `translate_detail(detail: object, locale: str | None) -> object`
  - `translate_error_dict(error_dict: Mapping[str, object], locale: str | None) -> Mapping[str, object]`
  - `translate_validation_errors(errors: Sequence[object], locale: str | None) -> Sequence[object]`
  - `translate_problem(problem: ProblemDetail, locale: str | None) -> ProblemDetail`

The catalog is created in this task with a small real seed so the translator tests have something to translate. Task 5 grows it.

- [ ] **Step 1: Write the seed catalog**

Create `litellm/proxy/i18n/catalog/__init__.py`:

```python
"""Message catalogs. English is the source language and has no catalog."""

from collections.abc import Mapping
from types import MappingProxyType
from typing import Final

from litellm.proxy.i18n.catalog.zh import EXACT_MESSAGES, TEMPLATE_MESSAGES
from litellm.proxy.i18n.matcher import Catalog, build_catalog

CATALOG: Final[Catalog] = build_catalog(EXACT_MESSAGES, TEMPLATE_MESSAGES)

CATALOGS: Final[Mapping[str, Catalog]] = MappingProxyType({"zh": CATALOG})
```

Create `litellm/proxy/i18n/catalog/zh.py`:

```python
"""Chinese messages. Technical terms stay in English per i18n/glossary.json."""

from collections.abc import Mapping
from types import MappingProxyType
from typing import Final

EXACT_MESSAGES: Final[Mapping[str, str]] = MappingProxyType(
    {
        "No models configured on proxy": "proxy 上未配置任何模型",
        "Admin-only endpoint. Not allowed to access this.": "仅管理员可访问的 endpoint，无权访问。",
        "Internal server error": "服务器内部错误",
        "Invalid query parameter": "无效的查询参数",
        "The request query parameters are invalid.": "请求的查询参数无效。",
        "Unknown query parameter": "未知的查询参数",
        "Crossed TPM / RPM / Max Parallel Request Limit": "已超出 TPM / RPM / 最大并发请求限制",
    }
)

TEMPLATE_MESSAGES: Final[Mapping[str, str]] = MappingProxyType({})
```

- [ ] **Step 2: Write the failing translator tests**

Create `tests/test_litellm/proxy/i18n/test_translator.py`:

```python
from litellm.types.proxy.management_endpoints.management_v1 import ProblemDetail

from litellm.proxy.i18n.translator import (
    TRANSLATABLE_FIELDS,
    translate_detail,
    translate_error_dict,
    translate_message,
    translate_problem,
    translate_validation_errors,
)


def test_translatable_fields_are_exactly_the_human_readable_whitelist() -> None:
    assert TRANSLATABLE_FIELDS == frozenset({"message", "detail", "title", "msg"})


def test_translate_message_no_locale_is_identity() -> None:
    assert translate_message("No models configured on proxy", None) == "No models configured on proxy"


def test_translate_message_unknown_locale_is_identity() -> None:
    assert translate_message("No models configured on proxy", "fr") == "No models configured on proxy"


def test_translate_message_translates_when_zh() -> None:
    assert translate_message("No models configured on proxy", "zh") == "proxy 上未配置任何模型"


def test_translate_message_unknown_message_falls_back_to_english() -> None:
    assert translate_message("Something upstream added later", "zh") == "Something upstream added later"


def test_translate_error_dict_no_locale_returns_same_object() -> None:
    payload = {"message": "No models configured on proxy", "type": "no_llm_router", "code": "500"}
    assert translate_error_dict(payload, None) is payload


def test_translate_error_dict_zh_changes_only_message() -> None:
    payload = {"message": "No models configured on proxy", "type": "no_llm_router", "param": None, "code": "500"}
    translated = translate_error_dict(payload, "zh")
    assert translated == {
        "message": "proxy 上未配置任何模型",
        "type": "no_llm_router",
        "param": None,
        "code": "500",
    }
    assert payload["message"] == "No models configured on proxy"


def test_translate_error_dict_unmatched_returns_same_object() -> None:
    payload = {"message": "brand new upstream message", "type": "x", "code": "500"}
    assert translate_error_dict(payload, "zh") is payload


def test_translate_error_dict_ignores_non_whitelisted_string_fields() -> None:
    payload = {"message": "No models configured on proxy", "type": "No models configured on proxy", "code": "500"}
    translated = translate_error_dict(payload, "zh")
    assert translated["type"] == "No models configured on proxy"


def test_translate_detail_str_is_translated() -> None:
    assert translate_detail("No models configured on proxy", "zh") == "proxy 上未配置任何模型"


def test_translate_detail_non_str_is_returned_unchanged() -> None:
    payload = {"a": 1}
    assert translate_detail(payload, "zh") is payload
    assert translate_detail(None, "zh") is None


def test_translate_detail_dict_message_key_is_translated() -> None:
    assert translate_detail({"message": "No models configured on proxy"}, "zh") == {"message": "proxy 上未配置任何模型"}


def test_translate_detail_list_of_strings_is_translated_elementwise() -> None:
    assert translate_detail(["No models configured on proxy"], "zh") == ("proxy 上未配置任何模型",)


def test_translate_detail_list_of_numbers_is_returned_unchanged() -> None:
    payload = [1, 2]
    assert translate_detail(payload, "zh") is payload


def test_translate_validation_errors_no_locale_returns_same_object() -> None:
    errors = [{"loc": ("body", "model"), "msg": "Field required", "type": "missing"}]
    assert translate_validation_errors(errors, None) is errors


def test_translate_validation_errors_preserves_loc_and_type() -> None:
    errors = [{"loc": ("body", "model"), "msg": "Admin-only endpoint. Not allowed to access this.", "type": "value_error"}]
    translated = translate_validation_errors(errors, "zh")
    assert translated == (
        {"loc": ("body", "model"), "msg": "仅管理员可访问的 endpoint，无权访问。", "type": "value_error"},
    )


def test_translate_validation_errors_unmatched_returns_same_object() -> None:
    errors = [{"loc": ("body", "model"), "msg": "Field required", "type": "missing"}]
    assert translate_validation_errors(errors, "zh") is errors


def test_translate_problem_no_locale_returns_same_object() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Unknown query parameter", status=400, detail="nope")
    assert translate_problem(problem, None) is problem


def test_translate_problem_keeps_type_uri_and_status() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Unknown query parameter", status=400, detail="nope")
    translated = translate_problem(problem, "zh")
    assert translated.type == "urn:litellm:error:x"
    assert translated.status == 400
    assert translated.title == "未知的查询参数"
    assert translated.detail == "nope"


def test_translate_problem_unmatched_returns_same_object() -> None:
    problem = ProblemDetail(type="urn:litellm:error:x", title="Some new title", status=400, detail="Some new detail")
    assert translate_problem(problem, "zh") is problem
```

- [ ] **Step 3: Write the failing catalog structure test**

Create `tests/test_litellm/proxy/i18n/test_catalog_structure.py`:

```python
import json
from pathlib import Path

from litellm.proxy.i18n.catalog.zh import EXACT_MESSAGES, TEMPLATE_MESSAGES

GLOSSARY_PATH = Path(__file__).resolve().parents[4] / "i18n" / "glossary.json"


def squeeze(value: str) -> str:
    return value.replace(" ", "").lower()


def test_glossary_is_readable_from_the_repo_root() -> None:
    assert GLOSSARY_PATH.is_file()


def test_zh_catalog_does_not_use_banned_technical_term_translations() -> None:
    glossary: dict[str, list[str]] = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    forbidden = tuple((banned, term) for term, banned_list in glossary.items() for banned in banned_list)
    for source, translation in (*EXACT_MESSAGES.items(), *TEMPLATE_MESSAGES.items()):
        normalized_source = squeeze(source)
        normalized_translation = squeeze(translation)
        for banned, term in forbidden:
            if squeeze(term) not in normalized_source:
                continue
            assert squeeze(banned) not in normalized_translation, (
                f"term {term!r} must stay in English, but {translation!r} contains {banned!r}"
            )
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_translator.py tests/test_litellm/proxy/i18n/test_catalog_structure.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'litellm.proxy.i18n.translator'`

- [ ] **Step 5: Implement the translator**

Create `litellm/proxy/i18n/translator.py`:

```python
"""Pure translation of human-readable fields in proxy error payloads.

Every function is identity-preserving: when nothing needs to change it returns the
same object it was given, so the untranslated path serializes exactly as it did before.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from types import MappingProxyType
from typing import Final

from litellm.proxy.i18n.catalog import CATALOGS
from litellm.proxy.i18n.matcher import Catalog
from litellm.types.proxy.management_endpoints.management_v1 import ProblemDetail

TRANSLATABLE_FIELDS: Final[frozenset[str]] = frozenset({"message", "detail", "title", "msg"})

_ERROR_DICT_FIELDS: Final[tuple[str, ...]] = ("message",)
_VALIDATION_FIELDS: Final[tuple[str, ...]] = ("msg",)
_DETAIL_FIELDS: Final[tuple[str, ...]] = ("message", "detail", "title", "msg")
_PROBLEM_FIELDS: Final[tuple[str, ...]] = ("title", "detail")


def catalog_for(locale: str | None) -> Catalog | None:
    if locale is None:
        return None
    return CATALOGS.get(locale)


def translate_message(message: str, locale: str | None) -> str:
    catalog: Final = catalog_for(locale)
    if catalog is None:
        return message
    return catalog.translate(message)


def _translate_mapping(
    mapping: Mapping[str, object],
    fields: tuple[str, ...],
    locale: str | None,
) -> Mapping[str, object]:
    translated: Final = MappingProxyType(
        {
            key: translate_message(value, locale) if key in fields and isinstance(value, str) else value
            for key, value in mapping.items()
        }
    )
    return translated if translated != mapping else mapping


def translate_error_dict(error_dict: Mapping[str, object], locale: str | None) -> Mapping[str, object]:
    if locale is None:
        return error_dict
    return _translate_mapping(error_dict, _ERROR_DICT_FIELDS, locale)


def translate_detail(detail: object, locale: str | None) -> object:
    if locale is None:
        return detail
    if isinstance(detail, str):
        return translate_message(detail, locale)
    if isinstance(detail, Mapping):
        return _translate_mapping(detail, _DETAIL_FIELDS, locale)
    if isinstance(detail, (list, tuple)):
        return _translate_sequence(detail, _DETAIL_FIELDS, locale)
    return detail


def _translate_item(item: object, fields: tuple[str, ...], locale: str | None) -> object:
    if isinstance(item, Mapping):
        return _translate_mapping(item, fields, locale)
    if isinstance(item, str):
        return translate_message(item, locale)
    return item


def _translate_sequence(
    items: Sequence[object],
    fields: tuple[str, ...],
    locale: str | None,
) -> Sequence[object]:
    translated: Final = tuple(_translate_item(item, fields, locale) for item in items)
    changed: Final = any(new_item is not original for new_item, original in zip(translated, items))
    return translated if changed else items


def translate_validation_errors(errors: Sequence[object], locale: str | None) -> Sequence[object]:
    if locale is None:
        return errors
    return _translate_sequence(errors, _VALIDATION_FIELDS, locale)


def translate_problem(problem: ProblemDetail, locale: str | None) -> ProblemDetail:
    if locale is None:
        return problem
    dumped: Final = problem.model_dump()
    translated: Final = _translate_mapping(dumped, _PROBLEM_FIELDS, locale)
    if translated is dumped:
        return problem
    return problem.model_copy(update=translated)
```

`model_copy` accepts a `Mapping`, so the frozen `MappingProxyType` is passed through without copying it into a mutable dict.

`translate_problem` compares against the single `dumped` mapping it passed in, so an unmatched problem returns the original object rather than a rebuilt copy.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_translator.py tests/test_litellm/proxy/i18n/test_catalog_structure.py -v`
Expected: PASS, 19 passed

- [ ] **Step 7: Commit**

```bash
git add litellm/proxy/i18n/translator.py litellm/proxy/i18n/catalog/ tests/test_litellm/proxy/i18n/
git commit -m "feat(proxy): add pure translation functions and seed zh catalog"
```

---

### Task 5: Grow the initial zh catalog

**Files:**
- Modify: `litellm/proxy/i18n/catalog/zh.py`
- Test: `tests/test_litellm/proxy/i18n/test_catalog_structure.py`

**Interfaces:**
- Consumes: `EXACT_MESSAGES`, `TEMPLATE_MESSAGES` from Task 4
- Produces: the same two mappings, grown to cover the auth, budget, and model-access messages listed in `docs/i18n/inventory-python-messages.md`

- [ ] **Step 1: Read the inventory and pick the initial subset**

Open `docs/i18n/inventory-python-messages.md` from Task 1. Select messages that are reachable from the dashboard's auth, key, budget, and model surfaces. Tick each selected entry in the inventory file so later phases can see what is already covered.

- [ ] **Step 2: Add the selected messages**

Extend `EXACT_MESSAGES` and `TEMPLATE_MESSAGES` in `litellm/proxy/i18n/catalog/zh.py`. Use `TEMPLATE_MESSAGES` for anything with an interpolated value. For the token error from `litellm/proxy/auth/user_api_key_auth.py`, add to `TEMPLATE_MESSAGES`:

```python
"Authentication Error, Invalid proxy server token passed. Received API Key = {api_key}, Key Hash (Token) ={token}. Unable to find token in cache or `LiteLLM_VerificationTokenTable`": "认证错误，无效的 proxy server Token。收到的 API Key = {api_key}，Key Hash (Token) ={token}。无法在缓存或 `LiteLLM_VerificationTokenTable` 中找到该 Token",
```

Every added entry must respect `i18n/glossary.json`: `Token`, `API Key`, `Endpoint` and the other listed terms stay in English.

- [ ] **Step 3: Add a drift-detection test**

Append to `tests/test_litellm/proxy/i18n/test_catalog_structure.py`. This pins the real upstream message strings so a future upstream rewording surfaces as a failure instead of a silent fallback to English:

```python
import pytest

from litellm.proxy.i18n.translator import translate_message

REAL_MESSAGES_THAT_MUST_STAY_COVERED: tuple[str, ...] = (
    "No models configured on proxy",
    "Admin-only endpoint. Not allowed to access this.",
    "Internal server error",
    "Unknown query parameter",
)


@pytest.mark.parametrize("message", REAL_MESSAGES_THAT_MUST_STAY_COVERED)
def test_real_upstream_messages_still_translate(message: str) -> None:
    assert translate_message(message, "zh") != message
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/ -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add litellm/proxy/i18n/catalog/zh.py docs/i18n/inventory-python-messages.md tests/test_litellm/proxy/i18n/test_catalog_structure.py
git commit -m "feat(proxy): seed zh catalog with high-traffic proxy messages"
```

---

### Task 6: Wire translation into the exception handlers

**Files:**
- Modify: `litellm/proxy/i18n/__init__.py`
- Create: `litellm/proxy/i18n/handlers.py`
- Modify: `litellm/proxy/proxy_server.py`
- Test: `tests/test_litellm/proxy/i18n/test_handlers.py`
- Test: `tests/test_litellm/proxy/i18n/test_proxy_server_wiring.py`

**Interfaces:**
- Consumes: `translate_error_dict`, `translate_detail`, `translate_message`, `translate_problem`, `translate_validation_errors` from Task 4; `negotiate_locale` from Task 2
- Produces:
  - `locale_for_request(request: Request) -> str | None` in `litellm/proxy/i18n/handlers.py`
  - `handle_http_exception(request: Request, exc: StarletteHTTPException) -> Response` in `litellm/proxy/i18n/handlers.py`
  - `install_i18n(app: FastAPI) -> None` in `litellm/proxy/i18n/handlers.py`, re-exported from `litellm/proxy/i18n/__init__.py`
  - `litellm/proxy/i18n/__init__.py` also re-exports `locale_for_request`, `translate_error_dict`, `translate_message`, `translate_problem`, `translate_validation_errors`

- [ ] **Step 1: Write the failing handler tests**

Create `tests/test_litellm/proxy/i18n/test_handlers.py`:

```python
import json

import pytest
from fastapi import FastAPI
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from litellm.proxy.i18n.handlers import handle_http_exception, install_i18n, locale_for_request


def _request(accept_language: str | None) -> Request:
    headers = [] if accept_language is None else [(b"accept-language", accept_language.encode())]
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "query_string": b""})


def test_locale_for_request_reads_header() -> None:
    assert locale_for_request(_request("zh-CN")) == "zh"
    assert locale_for_request(_request("en-US")) is None
    assert locale_for_request(_request(None)) is None


def test_install_i18n_registers_http_exception_handler() -> None:
    app = FastAPI()
    install_i18n(app)
    assert app.exception_handlers[StarletteHTTPException] is handle_http_exception


@pytest.mark.asyncio
async def test_handle_http_exception_translates_detail_when_zh() -> None:
    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    response = await handle_http_exception(_request("zh"), exc)
    assert json.loads(response.body)["detail"] == "仅管理员可访问的 endpoint，无权访问。"


@pytest.mark.asyncio
async def test_handle_http_exception_preserves_status_and_headers() -> None:
    exc = StarletteHTTPException(
        status_code=429,
        detail="Admin-only endpoint. Not allowed to access this.",
        headers={"Retry-After": "30"},
    )
    response = await handle_http_exception(_request("zh"), exc)
    assert response.status_code == 429
    assert response.headers["Retry-After"] == "30"


@pytest.mark.asyncio
async def test_handle_http_exception_no_locale_matches_default_handler() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    ours = await handle_http_exception(_request(None), exc)
    default = await http_exception_handler(_request(None), exc)
    assert ours.body == default.body
    assert ours.status_code == default.status_code


@pytest.mark.asyncio
async def test_handle_http_exception_en_locale_matches_default_handler() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=403, detail="Admin-only endpoint. Not allowed to access this.")
    ours = await handle_http_exception(_request("en-US"), exc)
    default = await http_exception_handler(_request("en-US"), exc)
    assert ours.body == default.body


@pytest.mark.asyncio
async def test_handle_http_exception_non_str_detail_is_preserved() -> None:
    from fastapi.exception_handlers import http_exception_handler

    exc = StarletteHTTPException(status_code=400, detail={"code": 7, "message": "Admin-only endpoint. Not allowed to access this."})
    ours = await handle_http_exception(_request("zh"), exc)
    default = await http_exception_handler(_request("zh"), exc)
    assert ours.body == default.body
```

- [ ] **Step 2: Write the failing wiring test**

Create `tests/test_litellm/proxy/i18n/test_proxy_server_wiring.py`:

```python
import json

import pytest
from fastapi import FastAPI
from starlette.requests import Request

from litellm.proxy.i18n.handlers import install_i18n
from litellm.proxy._types import ProxyException


def _request(accept_language: str | None) -> Request:
    headers = [] if accept_language is None else [(b"accept-language", accept_language.encode())]
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "query_string": b""})


def test_real_proxy_app_has_i18n_http_exception_handler_registered() -> None:
    from starlette.exceptions import HTTPException as StarletteHTTPException

    from litellm.proxy.proxy_server import app

    assert StarletteHTTPException in app.exception_handlers


@pytest.mark.asyncio
async def test_real_proxy_app_translates_proxy_exception_message() -> None:
    from litellm.proxy.proxy_server import app

    handler = app.exception_handlers[ProxyException]
    exc = ProxyException(message="No models configured on proxy", type="no_llm_router", param=None, code=500)

    zh_response = await handler(_request("zh-CN"), exc)
    zh_body = json.loads(zh_response.body)
    assert zh_body["error"]["message"] == "proxy 上未配置任何模型"
    assert zh_body["error"]["type"] == "no_llm_router"
    assert zh_body["error"]["code"] == "500"

    en_response = await handler(_request(None), exc)
    default_response = await handler(_request("en-US"), exc)
    assert en_response.body == default_response.body
    assert json.loads(en_response.body)["error"]["message"] == "No models configured on proxy"
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_handlers.py tests/test_litellm/proxy/i18n/test_proxy_server_wiring.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'litellm.proxy.i18n.handlers'`

- [ ] **Step 4: Implement the handlers module**

Create `litellm/proxy/i18n/handlers.py`:

```python
"""HTTP-boundary translation wiring. The only module that knows about FastAPI."""

from __future__ import annotations

from typing import Final

from fastapi import FastAPI
from fastapi.exception_handlers import http_exception_handler as _default_http_exception_handler
from fastapi.responses import Response
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from litellm.proxy.i18n.negotiation import negotiate_locale
from litellm.proxy.i18n.translator import translate_detail

_ACCEPT_LANGUAGE: Final = "accept-language"


def locale_for_request(request: Request) -> str | None:
    return negotiate_locale(request.headers.get(_ACCEPT_LANGUAGE))


async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> Response:
    translated_detail = translate_detail(exc.detail, locale_for_request(request))
    if translated_detail is exc.detail:
        return await _default_http_exception_handler(request, exc)
    return await _default_http_exception_handler(
        request,
        StarletteHTTPException(status_code=exc.status_code, detail=translated_detail, headers=exc.headers),
    )


def install_i18n(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
```

`negotiation.py` imports nothing from `litellm.proxy.i18n`, so importing it at module scope creates no cycle.

- [ ] **Step 5: Export the public API**

Rewrite `litellm/proxy/i18n/__init__.py`:

```python
"""Request-scoped message translation for proxy error responses."""

from litellm.proxy.i18n.handlers import (
    handle_http_exception,
    install_i18n,
    locale_for_request,
)
from litellm.proxy.i18n.translator import (
    translate_detail,
    translate_error_dict,
    translate_message,
    translate_problem,
    translate_validation_errors,
)

__all__ = (
    "handle_http_exception",
    "install_i18n",
    "locale_for_request",
    "translate_detail",
    "translate_error_dict",
    "translate_message",
    "translate_problem",
    "translate_validation_errors",
)
```

- [ ] **Step 6: Run the handler tests to verify they pass**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/test_handlers.py -v`
Expected: PASS, 7 passed

- [ ] **Step 7: Wire the four call sites in proxy_server.py**

Add this import next to the other `litellm.proxy.*` imports near `litellm/proxy/proxy_server.py:536`:

```python
from litellm.proxy.i18n import (
    install_i18n,
    locale_for_request,
    translate_error_dict,
    translate_message,
    translate_problem,
    translate_validation_errors,
)
```

Then make these four edits, all inside the exception-handler block at `litellm/proxy/proxy_server.py:1663-1829`:

1. Register the HTTPException handler immediately above `@app.exception_handler(ProxyException)`:

```python
install_i18n(app)
```

2. In `openai_exception_handler`, change:

```python
    error_dict: Final = exc.to_dict()
```

to:

```python
    error_dict: Final = translate_error_dict(exc.to_dict(), locale_for_request(request))
```

3. In `otel_request_validation_exception_handler`, replace the two uses of `exc.errors()`:

```python
@app.exception_handler(RequestValidationError)
async def otel_request_validation_exception_handler(request: Request, exc: RequestValidationError):
    locale: Final = locale_for_request(request)
    validation_errors: Final[Sequence[_ValidationErrorDetail]] = cast(  # cast-ok: translation preserves the pydantic error mapping shape
        "Sequence[_ValidationErrorDetail]", translate_validation_errors(exc.errors(), locale)
    )
    if request.url.path.startswith(MANAGEMENT_V1_PREFIX):
        _close_dangling_otel_server_span(request, 400, exc=exc)
        return problem_response(
            translate_problem(
                ProblemDetail(
                    type=f"{PROBLEM_TYPE_BASE}invalid-query-parameter",
                    title="Invalid query parameter",
                    status=400,
                    detail="; ".join(
                        f"{'.'.join(str(part) for part in error['loc'][1:])}: {error['msg']}"
                        for error in validation_errors
                    )
                    or "The request query parameters are invalid.",
                ),
                locale,
            )
        )
    _close_dangling_otel_server_span(request, 422, exc=exc)
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(validation_errors)},
    )
```

The decorator line in the target file is `@app.exception_handler(RequestValidationError)`; only its body changes.

4. In `management_problem_exception_handler`, change:

```python
    return problem_response(exc.problem)
```

to:

```python
    return problem_response(translate_problem(exc.problem, locale_for_request(request)))
```

5. In `otel_unhandled_exception_handler`, change the hardcoded message:

```python
                "message": "Internal server error",
```

to:

```python
                "message": translate_message("Internal server error", locale_for_request(request)),
```

- [ ] **Step 8: Run the wiring test to verify it passes**

Run: `python3 -m pytest tests/test_litellm/proxy/i18n/ -v`
Expected: PASS

- [ ] **Step 9: Verify the upstream tests that assert exact error text still pass**

Run: `python3 -m pytest tests/test_litellm/proxy -k "auth" -q`
Expected: PASS. These tests never send `Accept-Language: zh`, so responses stay byte-identical.

- [ ] **Step 10: Commit**

```bash
git add litellm/proxy/i18n/ litellm/proxy/proxy_server.py tests/test_litellm/proxy/i18n/
git commit -m "feat(proxy): translate error responses when Accept-Language is zh"
```

---

### Task 7: Verify against a live proxy

**Files:**
- No source changes. This task produces evidence.

**Interfaces:**
- Consumes: the wired handlers from Task 6
- Produces: proof that a real proxy instance behaves as designed

- [ ] **Step 1: Start the proxy**

Run in a background terminal:

```bash
cd /Users/wuchanglong/Documents/workspace/litellm && python3 litellm/proxy/proxy_cli.py --config litellm/proxy/dev_config.yaml --detailed_debug --use_v2_migration_resolver 2>&1 | tee litellm.log
```

- [ ] **Step 2: Confirm Chinese without a header change**

Run:

```bash
curl -s -o /tmp/en.json -w "%{http_code}\n" http://localhost:4000/key/generate -X POST -H 'Content-Type: application/json' -d '{}'
curl -s -o /tmp/zh.json -w "%{http_code}\n" http://localhost:4000/key/generate -X POST -H 'Content-Type: application/json' -H 'Accept-Language: zh-CN' -d '{}'
python3 -c "import json; print('en:', json.load(open('/tmp/en.json'))['error']['message']); print('zh:', json.load(open('/tmp/zh.json'))['error']['message'])"
```

Expected: the two status codes are equal, the `en` message is the upstream English string, and the `zh` message is the Chinese catalog entry for a message that is in the catalog. If the auth error returned by this route is not yet in the catalog, the `zh` message equals the `en` message: that is the documented fallback, and the fix is to add that message to the catalog in Task 5, not to change the mechanism.

- [ ] **Step 3: Confirm the untranslated path is unchanged**

Run:

```bash
curl -s http://localhost:4000/key/generate -X POST -H 'Content-Type: application/json' -d '{}' > /tmp/no_header.json
cmp /tmp/no_header.json /tmp/en.json && echo "byte-identical without Accept-Language"
```

Expected: prints `byte-identical without Accept-Language`

- [ ] **Step 4: Record the evidence**

Append the exact commands and their output to the PR description when the branch is pushed. Do not claim success from the pytest output alone.

- [ ] **Step 5: Commit (only if Step 2 required a catalog addition)**

```bash
git add litellm/proxy/i18n/catalog/zh.py
git commit -m "feat(proxy): cover the auth error surfaced by the dashboard"
```

---

## Self-Review Notes

Coverage against the design spec:

- Section 4.1 trigger rules: Task 2 negotiation table tests
- Section 4.2 semantic invariant: Task 4 identity/idempotence tests plus Task 6 wiring tests on `type`, `code`, `loc`, and status
- Section 4.3 identity preservation: enforced in `_translate_mapping` and asserted with `is` comparisons
- Section 4.4 limitations: `zh-Hant` maps to `zh` via primary-subtag matching; no code needed beyond the documented note
- Section 5 glossary: Task 1 file, Task 4 structural test
- Section 7.1 to 7.5: Tasks 2, 3, 4
- Section 7.6 wiring: Task 6
- Section 8.2 tests: drift detection in Task 5, exact-text regression in Task 6 Step 10
- Section 9 Phase 0 Python scope: Tasks 1 to 7
- Section 10 risk "upstream reword": Task 5 Step 3 drift test

Deliberately deferred to later phases, as the spec states: the full catalog, the dashboards own strings, and the WebSocket locale limitation.
