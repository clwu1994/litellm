import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MCPAppsPanel from "./MCPAppsPanel";
import { fetchMCPServers, getMCPOAuthUserCredentialStatus, listMCPTools } from "../networking";
import type { MCPServer } from "../mcp_tools/types";

vi.mock("../networking", () => ({
  fetchMCPServers: vi.fn(),
  getMCPOAuthUserCredentialStatus: vi.fn(),
  listMCPTools: vi.fn(),
  deleteMCPOAuthUserCredential: vi.fn(),
}));

const { flowStatus } = vi.hoisted(() => ({ flowStatus: { value: "idle" } }));

vi.mock("@/hooks/useUserMcpOAuthFlow", () => ({
  useUserMcpOAuthFlow: () => ({ startOAuthFlow: vi.fn(), status: flowStatus.value }),
}));

const server = (server_id: string, server_name: string, overrides: Record<string, unknown> = {}) =>
  ({ server_id, server_name, auth_type: "none", connected_app_reachable: true, ...overrides }) as MCPServer;

const renderPanel = (token: string, selectedServers: string[] = [], connectMode = false) =>
  render(
    <MCPAppsPanel accessToken={token} selectedServers={selectedServers} onChange={vi.fn()} connectMode={connectMode} />,
  );

describe("MCPAppsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    flowStatus.value = "idle";
    vi.mocked(getMCPOAuthUserCredentialStatus).mockResolvedValue({
      server_id: "srv-any",
      has_credential: false,
      is_expired: false,
    });
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese list chrome and server fallback description while hiding the English originals", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t1a", "alpha"), server("srv-t1b", "beta")]);
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [{ name: "one" }, { name: "two" }] });
    renderPanel("apps-list");

    expect(await screen.findByRole("heading", { name: "MCP 服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "MCP Servers" })).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("浏览工具，一次授权，即可在对话中使用")).toBeInTheDocument();
    expect(screen.queryByText("Browse tools, authenticate once, use in chat")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索服务器...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search servers...")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "全部" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "All" })).not.toBeInTheDocument();
    expect(screen.getAllByText("MCP 服务器")).toHaveLength(3);
    expect(screen.queryByText("MCP server")).not.toBeInTheDocument();

    expect(await screen.findByText("4 个工具可用")).toBeInTheDocument();
    expect(screen.queryByText("4 tools available")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading-tools copy while hiding the English original", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t2", "alpha")]);
    vi.mocked(listMCPTools).mockImplementation(() => new Promise(() => {}));
    renderPanel("apps-loading");

    expect(await screen.findByText("正在加载工具...")).toBeInTheDocument();
    expect(screen.queryByText("Loading tools...")).not.toBeInTheDocument();
  });

  it("renders the Chinese connected tab count and detail status while hiding the English originals", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t3", "alpha")]);
    renderPanel("apps-connected", ["alpha"]);

    expect(await screen.findByRole("tab", { name: "已连接（1）" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Connected (1)" })).not.toBeInTheDocument();

    fireEvent.click(await screen.findByText("alpha"));

    expect(await screen.findByRole("heading", { name: "alpha" })).toBeInTheDocument();
    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "断开连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
  });

  it("renders the Chinese detail chrome while hiding the English originals", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t4", "alpha")]);
    renderPanel("apps-detail");

    fireEvent.click(await screen.findByText("alpha"));

    expect(await screen.findByRole("heading", { name: "alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByText("信息")).toBeInTheDocument();
    expect(screen.queryByText("Information")).not.toBeInTheDocument();
    expect(screen.getByText("服务器 ID")).toBeInTheDocument();
    expect(screen.queryByText("Server ID")).not.toBeInTheDocument();
    expect(screen.getByText("传输方式")).toBeInTheDocument();
    expect(screen.queryByText("Transport")).not.toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByText("未连接")).toBeInTheDocument();
    expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect" })).not.toBeInTheDocument();
    expect(screen.getByText("可用工具")).toBeInTheDocument();
    expect(screen.queryByText("Available Tools")).not.toBeInTheDocument();
    expect(await screen.findByText("没有可用工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools available")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match and no-connected empty states while hiding the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t5", "alpha")]);
    renderPanel("apps-empty");

    expect(await screen.findByText("alpha")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "已连接" }));
    expect(await screen.findByText("尚未连接任何服务器。")).toBeInTheDocument();
    expect(screen.queryByText("No servers connected yet.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "全部" }));
    fireEvent.change(screen.getByPlaceholderText("搜索服务器..."), { target: { value: "zzz" } });

    expect(await screen.findByText("没有服务器与搜索匹配。")).toBeInTheDocument();
    expect(screen.queryByText("No servers match your search.")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-servers and connect-mode empty states while hiding the English originals", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([]);
    const { unmount } = renderPanel("apps-none");

    expect(await screen.findByText("尚未配置 MCP 服务器。请在工具 -> MCP 服务器中添加服务器。")).toBeInTheDocument();
    expect(
      screen.queryByText("No MCP servers configured. Add servers in Tools -> MCP Servers."),
    ).not.toBeInTheDocument();
    unmount();

    renderPanel("apps-connect-empty", [], true);

    expect(
      await screen.findByText("此连接尚无可用 MCP 服务器。请联系管理员为你的用户或团队授予访问权限。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No MCP servers are available to this connection yet. Ask an admin to grant your user or team access.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("点击服务器以查看其工具并连接")).toBeInTheDocument();
    expect(screen.queryByText("Click a server to see its tools and connect")).not.toBeInTheDocument();
  });

  it("renders the Chinese unsupported, authorized and tool-load warning copy", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([
      server("srv-t7a", "alpha", { auth_type: "oauth2_token_exchange" }),
      server("srv-t7b", "beta", { auth_type: "oauth2", oauth2_flow: "client_credentials" }),
    ]);
    vi.mocked(listMCPTools).mockResolvedValue({ error: "nope" });
    const { unmount } = renderPanel("apps-unsupported", [], true);

    fireEvent.click(await screen.findByText("alpha"));
    expect(await screen.findByText("此连接不支持")).toBeInTheDocument();
    expect(screen.queryByText("Not supported on this connection")).not.toBeInTheDocument();
    unmount();

    vi.mocked(fetchMCPServers).mockResolvedValue([
      server("srv-t7c", "beta", { auth_type: "oauth2", oauth2_flow: "client_credentials" }),
    ]);
    renderPanel("apps-authorized");

    fireEvent.click(await screen.findByText("beta"));
    expect(await screen.findByText("已授权")).toBeInTheDocument();
    expect(screen.queryByText("Authorized")).not.toBeInTheDocument();
    unmount();

    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t7d", "alpha")]);
    renderPanel("apps-toast");

    fireEvent.click(await screen.findByText("alpha"));
    fireEvent.click(await screen.findByRole("button", { name: "连接" }));

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("无法加载 alpha 的工具"));
    expect(toast.warning).not.toHaveBeenCalledWith("Could not load tools for alpha");
  });

  it("resolves the singular and plural available-tool branches under English", async () => {
    await i18n.changeLanguage("en");
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-en1", "alpha")]);
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [{ name: "one" }] });
    const { unmount } = renderPanel("apps-en-one");

    expect(await screen.findByText("1 tool available")).toBeInTheDocument();
    expect(screen.queryByText("1 tools available")).not.toBeInTheDocument();
    unmount();

    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-en2", "alpha")]);
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [{ name: "one" }, { name: "two" }] });
    renderPanel("apps-en-two");

    expect(await screen.findByText("2 tools available")).toBeInTheDocument();
    expect(screen.queryByText("2 tool available")).not.toBeInTheDocument();
  });

  it("renders the Chinese connecting label while hiding the English original", async () => {
    flowStatus.value = "authorizing";
    vi.mocked(fetchMCPServers).mockResolvedValue([server("srv-t8", "alpha", { auth_type: "oauth2" })]);
    renderPanel("apps-connecting");

    expect(await screen.findByText("连接中…")).toBeInTheDocument();
    expect(screen.queryByText("Connecting…")).not.toBeInTheDocument();
  });
});
