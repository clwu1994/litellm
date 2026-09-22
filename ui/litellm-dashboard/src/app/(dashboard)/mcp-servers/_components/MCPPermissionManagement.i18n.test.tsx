import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPPermissionManagement from "./MCPPermissionManagement";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectTooltipPair, openTooltip } from "./mcpI18nTestUtils";

const defaultProps = {
  availableAccessGroups: ["team-a"],
  mcpServer: null,
  searchValue: "",
  setSearchValue: () => {},
  getAccessGroupOptions: () => [],
  mountedAuthType: undefined,
};

const mcpServer = (overrides: Record<string, unknown> = {}) =>
  ({
    server_id: "s1",
    url: "https://example.com/mcp",
    created_at: "2024-01-01T00:00:00Z",
    created_by: "user",
    updated_at: "2024-01-01T00:00:00Z",
    updated_by: "user",
    ...overrides,
  }) as never;

const renderWithForm = (props: Record<string, unknown> = {}, initialValues: Record<string, unknown> = {}) =>
  renderInMcpForm(
    <MCPPermissionManagement
      {...defaultProps}
      mountedAuthType={initialValues.auth_type as string | undefined}
      {...props}
    />,
    { allow_all_keys: false, ...initialValues },
  );

const expandPanel = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /权限管理/ }));
  return user;
};

describe("MCPPermissionManagement Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the header, key-access and network copy in Chinese and hides the English originals", async () => {
    renderWithForm();
    await expandPanel();

    expect(screen.getByText("权限管理 / 访问控制")).toBeInTheDocument();
    expect(screen.getByText("配置访问权限和安全设置（可选）")).toBeInTheDocument();
    expect(screen.getByText("允许所有 LiteLLM 密钥")).toBeInTheDocument();
    expect(screen.getByText("如果此服务器应对所有 Key“公开”，请启用。")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "允许所有 LiteLLM 密钥" })).toBeInTheDocument();
    expect(screen.getByText("仅限内部网络")).toBeInTheDocument();
    expect(screen.getByText("开启以仅允许内部网络中的调用方访问。")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "仅限内部网络" })).toBeInTheDocument();
    expect(screen.queryByText("Permission Management / Access Control")).not.toBeInTheDocument();
    expect(screen.queryByText("Configure access permissions and security settings (Optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Allow All LiteLLM Keys")).not.toBeInTheDocument();
    expect(screen.queryByText('Enable if this server should be "public" to all keys.')).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Allow All LiteLLM Keys" })).not.toBeInTheDocument();
    expect(screen.queryByText("Internal network only")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Internal network only" })).not.toBeInTheDocument();
  });

  it("renders the key-access and network tooltips in Chinese in the same open state and hides the English originals", async () => {
    renderWithForm();
    const user = await expandPanel();

    await expectTooltipPair(
      user,
      "允许所有 LiteLLM 密钥",
      "启用后，每个 API Key 都可以访问此 MCP 服务器。",
      "When enabled, every API key can access this MCP server.",
    );

    const tooltip = await openTooltip(user, "仅限内部网络");
    expect(tooltip).toHaveTextContent(
      "开启后，仅接受来自内部网络的请求。关闭以允许外部客户端（其他集群、ChatGPT 等）。无论此设置如何，始终需要 API Key 认证。",
    );
    expect(tooltip).not.toHaveTextContent(
      "When on, only requests from within your internal network are accepted. Turn off to allow external clients (other clusters, ChatGPT, etc). API key authentication is always required regardless of this setting.",
    );
  });

  it("renders the oauth2 delegation copy and warning in Chinese and hides the English originals", async () => {
    renderWithForm(
      {
        mcpServer: mcpServer({
          delegate_auth_to_upstream: true,
          available_on_public_internet: false,
        }),
      },
      { auth_type: "oauth2" },
    );
    const user = await expandPanel();

    expect(screen.getByText("将认证委托给上游（PKCE 透传）")).toBeInTheDocument();
    expect(screen.getByText("绕过 LiteLLM 认证，让客户端直接向上游 OAuth MCP 服务器认证。")).toBeInTheDocument();
    expect(screen.getByText("内部服务器启用了上游 OAuth 委托")).toBeInTheDocument();
    expect(
      screen.getByText(
        "此 MCP 服务器配置为仅限内部，但将认证委托给上游。匿名用户将能够在没有 LiteLLM 会话的情况下访问上游 OAuth2 /authorize 流程。请确保你的上游提供商和网络强制执行访问控制。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Delegate auth to upstream (PKCE passthrough)")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Bypass LiteLLM auth so clients authenticate directly with the upstream OAuth MCP server."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Internal server with upstream OAuth delegation")).not.toBeInTheDocument();

    await expectTooltipPair(
      user,
      "将认证委托给上游（PKCE 透传）",
      "开启后，LiteLLM 会跳过对此服务器自身的 API Key/SSO 检查，让客户端直接与上游 MCP 服务器完成 PKCE。仅在 Auth Type 为 oauth2 时生效。此路由不会进行支出跟踪或按 Key 限流。",
      "When on, LiteLLM skips its own API key/SSO check for this server and lets the client complete PKCE directly with the upstream MCP server. Only honored when Auth Type is oauth2. No spend tracking or per-key rate limiting will run on this route.",
    );
  });

  it("renders the OAuth pass-through copy in Chinese and hides the English originals", async () => {
    renderWithForm({}, { auth_type: "none", extra_headers: ["Authorization"] });
    const user = await expandPanel();

    expect(screen.getByText("OAuth 透传")).toBeInTheDocument();
    expect(
      screen.getByText("转发上游 OAuth 发现文档和 401 质询，让客户端直接与上游 MCP 服务器协商 OAuth。"),
    ).toBeInTheDocument();
    expect(screen.queryByText("OAuth pass-through")).not.toBeInTheDocument();

    const tooltip = await openTooltip(user, "OAuth 透传");
    expect(tooltip).toHaveTextContent(
      "开启后，此服务器被视为 OAuth 透传：网关会代理上游的 /.well-known/oauth-protected-resource 元数据，在未提供 bearer 时发出符合规范的 401 质询，并传播上游的 401/403 响应。仅在 Auth Type 为 None 且 Extra Headers 中包含 'Authorization' 时生效。",
    );
    expect(tooltip).not.toHaveTextContent(
      "When on, this server is treated as an OAuth pass-through: the gateway proxies the upstream /.well-known/oauth-protected-resource metadata, emits spec-compliant 401 challenges when no bearer is supplied, and propagates upstream 401/403 responses. Only honored when Auth Type is None and 'Authorization' is in Extra Headers.",
    );
  });

  it("renders the access-group and extra-header fields in Chinese and hides the English originals", async () => {
    renderWithForm(
      { mcpServer: mcpServer({ extra_headers: ["X-Tenant"] }) },
      { auth_type: "none", extra_headers: ["X-Tenant"] },
    );
    const user = await expandPanel();

    expect(screen.getByText("MCP 访问组")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择已有组，或输入以创建新组")).toBeInTheDocument();
    expect(screen.getByText("额外请求头")).toBeInTheDocument();
    expect(screen.getByText("已配置 1 个")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("当前：X-Tenant")).toBeInTheDocument();
    expect(screen.queryByText("MCP Access Groups")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select existing groups or type to create new ones")).not.toBeInTheDocument();
    expect(screen.queryByText("1 configured")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Currently: X-Tenant")).not.toBeInTheDocument();

    await expectTooltipPair(
      user,
      "MCP 访问组",
      "为此 MCP 服务器指定访问组。用户必须至少属于其中一个组才能访问该服务器。",
      "Specify access groups for this MCP server. Users must be in at least one of these groups to access the server.",
    );

    const tooltip = await openTooltip(user, "额外请求头");
    expect(tooltip).toHaveTextContent(
      "将传入请求中的自定义请求头转发到此 MCP 服务器（例如 Authorization、X-Custom-Header、User-Agent）",
    );
    expect(tooltip).not.toHaveTextContent(
      "Forward custom headers from incoming requests to this MCP server (e.g., Authorization, X-Custom-Header, User-Agent)",
    );
  });

  it("renders the extra-header placeholder when no headers are configured in Chinese and hides the English original", async () => {
    renderWithForm();
    await expandPanel();

    expect(screen.getByPlaceholderText("输入请求头名称（例如 Authorization、X-Custom-Header）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter header names (e.g., Authorization, X-Custom-Header)"),
    ).not.toBeInTheDocument();
  });

  it("renders the static-header editor in Chinese and hides the English originals", async () => {
    renderWithForm();
    const user = await expandPanel();

    expect(screen.getByText("静态请求头")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加静态请求头" })).toBeInTheDocument();
    expect(screen.queryByText("Static Headers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Static Header" })).not.toBeInTheDocument();

    const tooltip = await openTooltip(user, "静态请求头");
    expect(tooltip).toHaveTextContent("向此 MCP 服务器的每个请求都发送这些键值对请求头。");
    expect(tooltip).not.toHaveTextContent("Send these key-value headers with every request to this MCP server.");

    await user.click(screen.getByRole("button", { name: "添加静态请求头" }));
    const nameInput = screen.getByPlaceholderText("请求头名称（例如 X-API-Key）");
    const valueInput = screen.getByPlaceholderText("请求头取值");
    expect(screen.queryByPlaceholderText("Header name (e.g., X-API-Key)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Header value")).not.toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "X-Tenant" } });
    fireEvent.change(valueInput, { target: { value: "tenant-a" } });

    expect(screen.getByLabelText("清除请求头名称")).toBeInTheDocument();
    expect(screen.getByLabelText("清除请求头取值")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear header name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Clear header value")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("清除请求头名称"));
    await user.click(screen.getByLabelText("清除请求头取值"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("请求头名称为必填项")).toBeInTheDocument();
    expect(screen.getByText("请求头取值为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Header name is required")).not.toBeInTheDocument();
    expect(screen.queryByText("Header value is required")).not.toBeInTheDocument();
  });
});
