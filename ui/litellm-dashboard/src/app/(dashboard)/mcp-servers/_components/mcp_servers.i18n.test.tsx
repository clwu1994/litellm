import { fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import type { MCPServerProps } from "@/components/mcp_tools/types";
import { toast } from "@/lib/toast";

import MCPServers from "./mcp_servers";

vi.mock("@/components/networking", () => ({
  fetchMCPServers: vi.fn(),
  fetchMCPServerHealth: vi.fn(),
  deleteMCPServer: vi.fn(),
  listMCPUserEnvVarStatus: vi.fn().mockResolvedValue([]),
  fetchDiscoverableMCPServers: vi.fn().mockResolvedValue({ servers: [], categories: [] }),
  importMCPServers: vi.fn(),
}));

vi.mock("./CreateMCPServer", () => ({ default: () => null }));
vi.mock("./ImportMCPServers", () => ({ default: () => null }));
vi.mock("./mcp_discovery", () => ({ default: () => null }));
vi.mock("./MCPToolsetsTab", () => ({ MCPToolsetsTab: () => null }));
vi.mock("./MCPSubmissionsTab", () => ({ MCPSubmissionsTab: () => null }));
vi.mock("./mcp_connect", () => ({ default: () => null }));
vi.mock("./mcp_server_view", () => ({ MCPServerView: () => null }));
vi.mock("./MCPNetworkSettings", () => ({ default: () => null }));
vi.mock("./UserEnvVarsModal", () => ({ default: () => null }));
vi.mock("@/components/mcp_tools/ByokCredentialModal", () => ({ ByokCredentialModal: () => null }));
vi.mock("@/components/Settings/AdminSettings/MCPSemanticFilterSettings/MCPSemanticFilterSettings", () => ({
  default: () => null,
}));
vi.mock("@/components/Settings/AdminSettings/MCPToolSearchSettings/MCPToolSearchSettings", () => ({
  default: () => null,
}));

const SERVERS = [
  {
    server_id: "server-1",
    server_name: "Test Server 1",
    alias: "test-server-1",
    url: "https://example.com/mcp",
    transport: "http",
    auth_type: "none",
    created_at: "2024-01-01T00:00:00Z",
    created_by: "user-1",
    updated_at: "2024-01-01T00:00:00Z",
    updated_by: "user-1",
    teams: [{ team_id: "team-a", team_alias: "Team A" }],
    mcp_access_groups: ["group-1"],
  },
];

const ADMIN_PROPS: MCPServerProps = { accessToken: "123", userRole: "Admin", userID: "admin-user-id" };

const renderList = (props: Partial<MCPServerProps> = {}) =>
  renderWithProviders(<MCPServers {...ADMIN_PROPS} {...props} />);

const waitForTitle = () => waitFor(() => expect(screen.getByText("MCP 服务器")).toBeInTheDocument());

const waitForCard = () => waitFor(() => expect(screen.getByText("Test Server 1")).toBeInTheDocument());

describe("MCPServers list Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    vi.mocked(networking.fetchMCPServers).mockResolvedValue(SERVERS);
    vi.mocked(networking.fetchMCPServerHealth).mockResolvedValue([]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese list chrome and hides the English originals", async () => {
    renderList();
    await waitForTitle();
    await waitForCard();

    expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("配置和管理你的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Configure and manage your MCP servers")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "从 JSON 导入" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import from JSON" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 添加新 MCP 服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add New MCP Server" })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["所有服务器", "All Servers"],
      ["工具集", "Toolsets"],
      ["连接", "Connect"],
      ["语义筛选", "Semantic Filter"],
      ["工具搜索", "Tool Search"],
      ["网络设置", "Network Settings"],
      ["已提交的 MCP", "Submitted MCPs"],
    ] as const) {
      expect(screen.getByRole("tab", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: en })).not.toBeInTheDocument();
    }

    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.getByText("访问组")).toBeInTheDocument();
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.queryByText("Access Group")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("按名称、别名、URL 或 ID 搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by name, alias, URL, or ID")).not.toBeInTheDocument();

    expect(screen.getByText("排序")).toBeInTheDocument();
    expect(screen.queryByText("Sort")).not.toBeInTheDocument();
    expect(screen.getByText("最近创建")).toBeInTheDocument();
    expect(screen.queryByText("Recently created")).not.toBeInTheDocument();

    expect(screen.getByText("1 个服务器中的 1 个")).toBeInTheDocument();
    expect(screen.queryByText("1 of 1 servers")).not.toBeInTheDocument();
  });

  it("renders the Chinese internal-user filter and submit button and hides the English originals", async () => {
    renderList({ userRole: "Internal User" });
    await waitForTitle();

    expect(screen.getByText("所有可用服务器")).toBeInTheDocument();
    expect(screen.queryByText("All Available Servers")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 提交 MCP 服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Submit MCP Server" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add New MCP Server" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import from JSON" })).not.toBeInTheDocument();
  });

  it("renders the Chinese sort options in the open listbox and hides the English originals", async () => {
    const user = userEvent.setup();
    renderList();
    await waitForTitle();

    await user.click(screen.getByText("最近创建"));

    const listbox = await screen.findByRole("listbox");
    for (const [zh, en] of [
      ["最近创建", "Recently created"],
      ["最近更新", "Recently updated"],
      ["名称（A→Z）", "Name (A→Z)"],
      ["健康状态（异常优先）", "Health (unhealthy first)"],
    ] as const) {
      expect(within(listbox).getByText(zh)).toBeInTheDocument();
      expect(within(listbox).queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese team filter options in the open listbox and hides the English originals", async () => {
    const user = userEvent.setup();
    renderList();
    await waitForTitle();

    await user.click(screen.getByText("全部服务器"));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("全部服务器")).toBeInTheDocument();
    expect(within(listbox).getByText("个人")).toBeInTheDocument();
    expect(within(listbox).queryByText("All Servers")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Personal")).not.toBeInTheDocument();
  });

  it("renders the Chinese access-group filter and its tooltip in the same open state", async () => {
    const user = userEvent.setup();
    renderList();
    await waitForTitle();

    expect(screen.getByText("所有访问组")).toBeInTheDocument();
    expect(screen.queryByText("All Access Groups")).not.toBeInTheDocument();
    expect(screen.getByLabelText("关于访问组")).toBeInTheDocument();
    expect(screen.queryByLabelText("About access groups")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("关于访问组"));

    expect(
      await screen.findByText(
        "MCP 访问组是一组有权访问特定 MCP 服务器的用户或团队。使用访问组来管理谁可以连接哪些服务器。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "An MCP Access Group is a set of users or teams that have permission to access specific MCP servers. Use access groups to control and organize who can connect to which servers.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese loading state and hides the English original", async () => {
    vi.mocked(networking.fetchMCPServers).mockImplementation(() => new Promise(() => {}));
    renderList();

    expect(await screen.findByText("正在加载 MCP 服务器…")).toBeInTheDocument();
    expect(screen.queryByText("Loading MCP servers...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
    renderList();
    await waitForTitle();

    expect(await screen.findByText("尚未配置 MCP 服务器。点击“+ 添加新 MCP 服务器”开始。")).toBeInTheDocument();
    expect(
      screen.queryByText("No MCP servers configured. Click '+ Add New MCP Server' to get started."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match state and hides the English original", async () => {
    renderList();
    await waitForTitle();

    fireEvent.change(screen.getByPlaceholderText("按名称、别名、URL 或 ID 搜索"), {
      target: { value: "zzz-no-match" },
    });

    expect(await screen.findByText("没有服务器符合当前筛选或搜索条件。")).toBeInTheDocument();
    expect(screen.queryByText("No servers match the current filters or search.")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete dialog and reports the Chinese delete toast", async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    vi.mocked(networking.deleteMCPServer).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );
    renderList();
    await waitForTitle();
    await waitForCard();

    await user.click(screen.getByLabelText("服务器操作"));
    await user.click(await screen.findByRole("menuitem", { name: "删除" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("删除 MCP 服务器？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete MCP Server?")).not.toBeInTheDocument();
    expect(within(dialog).getByText("此操作不可撤销，所有关联配置都将被删除。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "This action is permanent and cannot be undone. All associated configurations will be removed.",
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Name")).not.toBeInTheDocument();
    // "ID" and "URL" are glossary-locked, so their Chinese values are identical to the English ones.
    expect(within(dialog).getByText("ID")).toBeInTheDocument();
    expect(within(dialog).getByText("URL")).toBeInTheDocument();
    expect(within(dialog).getByText("Test Server 1")).toBeInTheDocument();
    expect(within(dialog).getByText("server-1")).toBeInTheDocument();
    expect(within(dialog).getByText("https://example.com/mcp")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    const deleteButton = within(dialog).getByRole("button", { name: "删除" });
    expect(deleteButton).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    await user.click(deleteButton);

    expect(await within(dialog).findByRole("button", { name: "正在删除…" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Deleting..." })).not.toBeInTheDocument();

    resolveDelete();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("MCP 服务器删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Deleted MCP Server successfully");
  });

  it("renders the Chinese missing-auth message and hides the English original", async () => {
    renderList({ accessToken: null });

    expect(await screen.findByText("缺少必要的认证参数。")).toBeInTheDocument();
    expect(screen.queryByText("Missing required authentication parameters.")).not.toBeInTheDocument();
  });
});
