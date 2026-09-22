import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { getMCPOAuthUserCredentialStatus, listMCPTools } from "@/components/networking";
import { getToken, isTokenValid } from "@/utils/mcpTokenStore";

import MCPToolsViewer from "./mcp_tools";

vi.mock("@/components/networking", () => ({
  listMCPTools: vi.fn(),
  callMCPTool: vi.fn(),
  getMCPOAuthUserCredentialStatus: vi.fn(),
}));

vi.mock("@/utils/mcpTokenStore", () => ({
  isTokenValid: vi.fn(),
  getToken: vi.fn(),
  removeToken: vi.fn(),
}));

vi.mock("@/hooks/useToolsOAuthFlow", () => ({
  useToolsOAuthFlow: () => ({ startOAuthFlow: vi.fn(), status: "idle", error: null }),
}));

vi.mock("@/hooks/useUserMcpOAuthFlow", () => ({
  useUserMcpOAuthFlow: () => ({ startOAuthFlow: vi.fn(), status: "idle", error: null }),
}));

const tool = {
  name: "search_issues",
  description: "Search issues",
  inputSchema: { type: "object", properties: { q: { type: "string" } } },
  mcp_info: { server_name: "slack", logo_url: "https://example.com/logo.png" },
};

const renderViewer = (props: Record<string, unknown> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MCPToolsViewer
        serverId="srv-1"
        accessToken="litellm-key"
        userRole="admin"
        userID="tin@berri.ai"
        serverAlias="slack"
        auth_type="oauth2"
        oauth2_flow="client_credentials"
        delegate_auth_to_upstream={false}
        {...props}
      />
    </QueryClientProvider>,
  );

describe("MCPToolsViewer Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(listMCPTools)
      .mockReset()
      .mockResolvedValue({ tools: [tool], error: null });
    vi.mocked(isTokenValid).mockReset().mockReturnValue(false);
    vi.mocked(getToken)
      .mockReset()
      .mockReturnValue(undefined as unknown as ReturnType<typeof getToken>);
    vi.mocked(getMCPOAuthUserCredentialStatus).mockReset().mockResolvedValue({
      server_id: "srv-1",
      has_credential: true,
      is_expired: false,
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the passthrough auth gate in Chinese and hides the English originals", async () => {
    renderViewer({ auth_type: "true_passthrough" });

    expect(await screen.findByText("需要认证")).toBeInTheDocument();
    expect(screen.getByText("认证后即可查看可用工具")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "授权" })).toBeInTheDocument();
    expect(screen.queryByText("Authentication required")).not.toBeInTheDocument();
    expect(screen.queryByText("Authenticate to view available tools")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Authorize" })).not.toBeInTheDocument();
  });

  it("renders the upstream auth gate in Chinese and hides the English original", async () => {
    vi.mocked(getMCPOAuthUserCredentialStatus).mockResolvedValue({
      server_id: "srv-1",
      has_credential: false,
      is_expired: false,
    });
    renderViewer({ oauth2_flow: null, delegate_auth_to_upstream: false });

    expect(await screen.findByText("通过上游提供商认证后即可查看可用工具")).toBeInTheDocument();
    expect(
      screen.queryByText("Authenticate with the upstream provider to view available tools"),
    ).not.toBeInTheDocument();
  });

  it("renders the loaded tool list in Chinese and hides the English originals", async () => {
    renderViewer();

    expect(await screen.findByPlaceholderText("搜索工具...")).toBeInTheDocument();
    expect(screen.getByText("可用工具")).toBeInTheDocument();
    expect(screen.getByText("工具测试平台")).toBeInTheDocument();
    expect(screen.getByText("选择一个工具进行测试")).toBeInTheDocument();
    expect(screen.getByText("从左侧栏选择一个工具，即可使用自定义输入开始测试其功能。")).toBeInTheDocument();
    expect(screen.getByAltText("slack 标志")).toBeInTheDocument();
    expect(screen.queryByText("Available Tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool Testing Playground")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a Tool to Test")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Choose a tool from the left sidebar to start testing its functionality with custom inputs."),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search tools...")).not.toBeInTheDocument();
    expect(screen.queryByAltText("slack logo")).not.toBeInTheDocument();
  });

  it("renders the selected-tool badge in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderViewer();

    await user.click(await screen.findByText("search_issues"));

    expect(screen.getByText("已选择")).toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  it("renders the additional-header configuration in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderViewer({ extraHeaders: ["X-Tenant"] });

    expect(await screen.findByText("额外请求头")).toBeInTheDocument();
    expect(screen.getByText("此服务器需要额外的请求头。点击“配置”以提供取值。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "配置" }));

    expect(screen.getByPlaceholderText("输入 X-Tenant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "加载工具" })).toBeInTheDocument();
    expect(screen.queryByText("Additional Headers")).not.toBeInTheDocument();
    expect(
      screen.queryByText('This server requires additional headers. Click "Configure" to provide values.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter X-Tenant")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load Tools" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("输入 X-Tenant"), { target: { value: "tenant-a" } });

    await user.click(screen.getByRole("button", { name: "隐藏" }));

    expect(screen.getByText("已配置 1 个请求头")).toBeInTheDocument();
    expect(screen.queryByText("1 header(s) configured")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide" })).not.toBeInTheDocument();
  });

  it("renders the no-tools and search-miss states in Chinese and hides the English originals", async () => {
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [], error: null });
    renderViewer();

    expect(await screen.findByText("无可用工具")).toBeInTheDocument();
    expect(screen.getByText("未找到此服务器的工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools available")).not.toBeInTheDocument();
    expect(screen.queryByText("No tools found for this server")).not.toBeInTheDocument();
  });

  it("renders the filtered-empty state in Chinese and hides the English originals", async () => {
    renderViewer();

    fireEvent.change(await screen.findByPlaceholderText("搜索工具..."), { target: { value: "zzz" } });

    expect(await screen.findByText("未找到工具")).toBeInTheDocument();
    expect(screen.getByText("没有匹配“zzz”的工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools found")).not.toBeInTheDocument();
    expect(screen.queryByText('No tools match "zzz"')).not.toBeInTheDocument();
  });

  it("renders the loading state in Chinese and hides the English original", async () => {
    vi.mocked(listMCPTools).mockReturnValue(new Promise(() => {}) as ReturnType<typeof listMCPTools>);
    renderViewer();

    expect(await screen.findByText("正在加载工具...")).toBeInTheDocument();
    expect(screen.queryByText("Loading tools...")).not.toBeInTheDocument();
  });

  it("renders the error state in Chinese and hides the English original", async () => {
    vi.mocked(listMCPTools).mockResolvedValue({
      tools: [],
      error: "boom",
      status: 500,
    } as unknown as Awaited<ReturnType<typeof listMCPTools>>);
    renderViewer();

    expect(await screen.findByText("错误：boom", undefined, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByText("Error: boom")).not.toBeInTheDocument();
  });

  it("keeps the English copy when the locale is English", async () => {
    await i18n.changeLanguage("en");
    renderViewer();

    expect(await screen.findByText("Available Tools")).toBeInTheDocument();
    expect(screen.getByText("Tool Testing Playground")).toBeInTheDocument();
  });

  it("keeps the English configured-header count when the locale is English", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("en");
    renderViewer({ extraHeaders: ["X-Tenant"] });

    await user.click(await screen.findByRole("button", { name: "Configure" }));
    fireEvent.change(screen.getByPlaceholderText("Enter X-Tenant"), { target: { value: "tenant-a" } });
    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.getByText("1 header(s) configured")).toBeInTheDocument();
  });
});
