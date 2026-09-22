/* eslint-disable testing-library/no-node-access -- The guide paragraph splits its first clause into a <strong>, so the paragraph text is reached from that node */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcpServers/useMCPToolsets";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { toast } from "@/lib/toast";
import type { MCPToolset } from "@/components/mcp_tools/types";

import { MCPToolsetsTab } from "./MCPToolsetsTab";

vi.mock("@/components/networking", () => ({
  createMCPToolset: vi.fn(),
  updateMCPToolset: vi.fn(),
  deleteMCPToolset: vi.fn(),
  listMCPTools: vi.fn(),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({ useMCPToolsets: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({ useMCPServers: vi.fn() }));

const user = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const toolset: MCPToolset = {
  toolset_id: "ts-1",
  toolset_name: "github-tools",
  description: "GitHub helpers",
  tools: [{ server_id: "srv-1", tool_name: "search" }],
  created_at: "2026-01-01T00:00:00Z",
} as MCPToolset;

const renderTab = (toolsets: MCPToolset[] = [], servers: unknown[] = [], isLoading = false) => {
  vi.mocked(useMCPToolsets).mockReturnValue({ data: toolsets, isLoading } as unknown as ReturnType<
    typeof useMCPToolsets
  >);
  vi.mocked(useMCPServers).mockReturnValue({ data: servers } as unknown as ReturnType<typeof useMCPServers>);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
      <MCPToolsetsTab accessToken="sk-test" userRole="Admin" />
    </QueryClientProvider>,
  );
};

const openCreate = async (u: ReturnType<typeof user>) => {
  await u.click(screen.getByRole("button", { name: "新建工具集" }));
  await screen.findByRole("heading", { name: "新建工具集" });
};

const openEdit = async (u: ReturnType<typeof user>) => {
  await u.click(await screen.findByRole("button", { name: "打开工具集操作" }));
  await u.click(await screen.findByRole("menuitem", { name: "编辑" }));
  await screen.findByRole("heading", { name: "编辑工具集" });
};

describe("MCPToolsetsTab Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(networking.getProxyBaseUrl).mockReturnValue("http://localhost:4000");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the page header, usage guide and empty state in Chinese and hides the English originals", () => {
    renderTab();

    expect(screen.getByText("MCP 工具集")).toBeInTheDocument();
    expect(
      screen.getByText("来自一个或多个 MCP 服务器的精选工具集合。通过 MCP 权限下拉菜单将工具集分配给 Key 和团队。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建工具集" })).toBeInTheDocument();
    expect(screen.getByText("工具集如何工作")).toBeInTheDocument();
    const guide = screen.getByText("API Keys → Edit Key → MCP Servers").closest("p");
    expect(guide).toHaveTextContent(
      "创建工具集后，通过 API Keys → Edit Key → MCP Servers 将其分配给某个 Key，然后让 MCP 客户端指向该工具集的 URL。客户端只会看到你选择的工具。",
    );
    expect(guide).not.toHaveTextContent("Create a toolset, assign it to a key via");
    expect(screen.getByText("Claude Code / Cursor 配置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
    expect(screen.getByText("还没有工具集")).toBeInTheDocument();
    expect(screen.getByText("创建工具集，为 Key 和团队提供一组精选的 MCP 工具。")).toBeInTheDocument();
    expect(screen.queryByText("MCP Toolsets")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Curated collections of tools from one or more MCP servers. Assign toolsets to keys and teams via the MCP permissions dropdown.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New Toolset" })).not.toBeInTheDocument();
    expect(screen.queryByText("How toolsets work")).not.toBeInTheDocument();
    expect(screen.queryByText("Claude Code / Cursor config")).not.toBeInTheDocument();
    expect(screen.queryByText("No toolsets yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Create a toolset to give keys and teams a curated set of MCP tools."),
    ).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese and hides the English original", () => {
    renderTab([], [], true);

    expect(screen.getByText("正在加载工具集…")).toBeInTheDocument();
    expect(screen.queryByText("Loading toolsets…")).not.toBeInTheDocument();
  });

  it("renders the create dialog in Chinese and hides the English originals", async () => {
    const u = user();
    renderTab();
    await openCreate(u);

    expect(screen.getByText("工具集名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 github-linear-tools")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("可选描述")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索 MCP 服务器...")).toBeInTheDocument();
    expect(screen.getByText("未配置 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("可用工具")).toBeInTheDocument();
    expect(screen.getByText("你的工具集")).toBeInTheDocument();
    expect(screen.getByText("（0 个工具）")).toBeInTheDocument();
    expect(screen.getByText("尚未添加工具")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByText("New Toolset")).not.toBeInTheDocument();
    expect(screen.queryByText("Toolset Name")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. github-linear-tools")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Optional description")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search MCP servers...")).not.toBeInTheDocument();
    expect(screen.queryByText("No MCP servers configured")).not.toBeInTheDocument();
    expect(screen.queryByText("Available Tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Your Toolset")).not.toBeInTheDocument();
    expect(screen.queryByText("(0 tools)")).not.toBeInTheDocument();
    expect(screen.queryByText("No tools added yet")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: "创建工具集" }));
    expect(await screen.findByText("请输入工具集名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a toolset name")).not.toBeInTheDocument();
  });

  it("renders the server search states and clear control in Chinese and hides the English originals", async () => {
    const u = user();
    renderTab(
      [],
      [
        { server_id: "srv-1", alias: "github", server_name: "github" },
        { server_id: "srv-2", alias: "linear", server_name: "linear" },
      ],
    );
    await openCreate(u);

    fireEvent.change(screen.getByPlaceholderText("搜索 MCP 服务器..."), { target: { value: "zzz" } });

    expect(screen.getByText("没有匹配搜索的服务器")).toBeInTheDocument();
    expect(screen.queryByText("No servers match your search")).not.toBeInTheDocument();
    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("renders the edit dialog, selected-tool count and per-server tool list in Chinese and hides the English originals", async () => {
    const u = user();
    vi.mocked(networking.listMCPTools).mockResolvedValue(
      [] as unknown as Awaited<ReturnType<typeof networking.listMCPTools>>,
    );
    renderTab([toolset], [{ server_id: "srv-1", alias: "github", server_name: "github" }]);
    await openEdit(u);

    expect(screen.getAllByText("描述").length).toBeGreaterThan(0);
    expect(screen.getByText("已选择 1 个")).toBeInTheDocument();
    expect(screen.getByText("（1 个工具）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByText("Edit Toolset")).not.toBeInTheDocument();
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    expect(screen.queryByText("(1 tools)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();

    await u.click(screen.getByText("github"));

    expect(await screen.findByText("未找到此服务器的工具。")).toBeInTheDocument();
    expect(screen.queryByText("No tools found for this server.")).not.toBeInTheDocument();
  });

  it("renders the create, update and delete toasts in Chinese and hides the English originals", async () => {
    const u = user();
    vi.mocked(networking.createMCPToolset).mockResolvedValue(
      {} as Awaited<ReturnType<typeof networking.createMCPToolset>>,
    );
    vi.mocked(networking.updateMCPToolset).mockResolvedValue(
      {} as Awaited<ReturnType<typeof networking.updateMCPToolset>>,
    );
    vi.mocked(networking.deleteMCPToolset).mockResolvedValue(
      undefined as Awaited<ReturnType<typeof networking.deleteMCPToolset>>,
    );
    renderTab([toolset]);

    await openCreate(u);
    fireEvent.change(screen.getByPlaceholderText("例如 github-linear-tools"), { target: { value: "solo" } });
    await u.click(screen.getByRole("button", { name: "创建工具集" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("工具集已创建"));
    expect(toast.success).not.toHaveBeenCalledWith("Toolset created");

    await openEdit(u);
    await u.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("工具集已更新"));
    expect(toast.success).not.toHaveBeenCalledWith("Toolset updated");

    await u.click(await screen.findByRole("button", { name: "打开工具集操作" }));
    await u.click(await screen.findByRole("menuitem", { name: "删除" }));
    expect(await screen.findByRole("heading", { name: "删除工具集" })).toBeInTheDocument();
    expect(
      screen.getByText("确定要删除此工具集吗？使用它的 Key 和团队将失去对所限定工具的访问权限。"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Delete Toolset")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Are you sure you want to delete this toolset? Keys and teams using it will lose access to the scoped tools.",
      ),
    ).not.toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "删除" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("工具集已删除"));
    expect(toast.success).not.toHaveBeenCalledWith("Toolset deleted");
  });
});
