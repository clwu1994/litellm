import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { MCPServer } from "@/components/mcp_tools/types";

import { MCPServerView } from "./mcp_server_view";

vi.mock(".", () => ({
  MCPToolsViewer: () => <div>tools viewer</div>,
}));

vi.mock("./mcp_server_edit", () => ({
  default: () => <div>edit form</div>,
  EDIT_OAUTH_UI_STATE_KEY: "litellm-mcp-oauth-edit-state",
}));

const baseServer = {
  server_id: "srv-1",
  server_name: "demo server",
  alias: "demo_alias",
  description: "A demo MCP server",
  transport: "http",
  url: "https://example.com/mcp/secret-token",
  auth_type: "api_key",
} as MCPServer;

const renderView = (overrides: Partial<MCPServer> = {}, props: Record<string, unknown> = {}) =>
  renderWithProviders(
    <MCPServerView
      mcpServer={{ ...baseServer, ...overrides } as MCPServer}
      onBack={vi.fn()}
      isProxyAdmin
      isEditing={false}
      accessToken="tok"
      userRole="Admin"
      userID="u1"
      availableAccessGroups={[]}
      {...props}
    />,
  );

describe("MCPServerView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese back button, copy labels and unnamed fallback and hides the English originals", () => {
    renderView({ server_name: undefined, alias: undefined });

    expect(screen.getByRole("button", { name: "返回所有服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back to All Servers/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制服务器名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy server name")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制服务器 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy server id")).not.toBeInTheDocument();
    expect(screen.getByText("未命名服务器")).toBeInTheDocument();
    expect(screen.queryByText("Unnamed Server")).not.toBeInTheDocument();
  });

  it("renders the Chinese tabs and Overview labels and hides the English originals", () => {
    renderView();

    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "MCP 工具" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "MCP Tools" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Settings" })).not.toBeInTheDocument();

    expect(screen.getAllByText("传输方式")[0]).toBeInTheDocument();
    expect(screen.getAllByText("认证")[0]).toBeInTheDocument();
    expect(screen.getByText("主机 URL")).toBeInTheDocument();
    expect(screen.getByText("成本配置")).toBeInTheDocument();
    expect(screen.queryByText("Transport")).not.toBeInTheDocument();
    expect(screen.queryByText("Authentication")).not.toBeInTheDocument();
    expect(screen.queryByText("Host URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost Configuration")).not.toBeInTheDocument();
  });

  it("toggles the URL reveal control between the Chinese show and hide labels", async () => {
    const user = userEvent.setup();
    renderView();

    const showToggles = screen.getAllByLabelText("显示完整 URL");
    expect(showToggles[0]).toBeInTheDocument();
    expect(screen.queryByLabelText("Show full URL")).not.toBeInTheDocument();

    await user.click(showToggles[0]);

    expect(screen.getAllByLabelText("隐藏完整 URL")[0]).toBeInTheDocument();
    expect(screen.queryByLabelText("Hide full URL")).not.toBeInTheDocument();
  });

  it("renders the Chinese Settings summary labels, states and edit control and hides the English originals", async () => {
    const user = userEvent.setup();
    const oauthDelegateServer = {
      allow_all_keys: true,
      available_on_public_internet: false,
      auth_type: "oauth2",
      delegate_auth_to_upstream: true,
      allowed_tools: [],
      extra_headers: [],
      mcp_access_groups: ["group-a"],
    };
    renderView(oauthDelegateServer);

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(await screen.findByText("MCP 服务器设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByText("MCP Server Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["服务器名称", "Server Name"],
      ["别名", "Alias"],
      ["描述", "Description"],
      ["额外请求头", "Extra Headers"],
      ["允许所有密钥", "Allow All Keys"],
      ["网络访问", "Network Access"],
      ["将认证委托给上游", "Delegate Auth to Upstream"],
      ["访问组", "Access Groups"],
      ["允许的工具", "Allowed Tools"],
      ["成本", "Cost"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
    // "URL" is glossary-locked, so its Chinese value is identical to the English one.
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("已启用（PKCE 透传）")).toBeInTheDocument();
    expect(screen.queryByText("Enabled (PKCE passthrough)")).not.toBeInTheDocument();
    expect(screen.getByText("仅内部")).toBeInTheDocument();
    expect(screen.queryByText("Internal only")).not.toBeInTheDocument();
    expect(screen.getByText("已启用所有工具")).toBeInTheDocument();
    expect(screen.queryByText("All tools enabled")).not.toBeInTheDocument();
  });

  it("renders the Chinese disabled and public states and hides the English originals", async () => {
    const user = userEvent.setup();
    const passthroughServer = {
      allow_all_keys: false,
      available_on_public_internet: true,
      auth_type: "api_key",
      extra_headers: ["Authorization"],
      oauth_passthrough: true,
    };
    renderView(passthroughServer);

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(await screen.findByText("已禁用")).toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
    expect(screen.getByText("公开")).toBeInTheDocument();
    expect(screen.queryByText("Public")).not.toBeInTheDocument();
    expect(screen.getByText("OAuth 透传")).toBeInTheDocument();
    expect(screen.queryByText("OAuth Pass-through")).not.toBeInTheDocument();
  });

  it("renders the Chinese allowed-tools list and hides the English fallback", async () => {
    const user = userEvent.setup();
    renderView({ allowed_tools: ["search", "fetch"] });

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(await screen.findByText("search")).toBeInTheDocument();
    expect(screen.getByText("fetch")).toBeInTheDocument();
    expect(screen.queryByText("All tools enabled")).not.toBeInTheDocument();
  });
});
