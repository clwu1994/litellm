import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";
import type { MCPToolset } from "@/components/mcp_tools/types";

import { getMCPToolsetTableColumns } from "./MCPToolsetTableColumns";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "http://localhost:4000",
}));

const toolset: MCPToolset = {
  toolset_id: "ts-1",
  toolset_name: "github-tools",
  description: "GitHub helpers",
  tools: [
    { server_id: "srv-1", tool_name: "create_issue" },
    { server_id: "srv-1", tool_name: "list_issues" },
    { server_id: "srv-2", tool_name: "search" },
    { server_id: "srv-2", tool_name: "fetch" },
    { server_id: "srv-2", tool_name: "crawl" },
  ],
  created_at: "2026-01-01T00:00:00Z",
} as MCPToolset;

const renderTable = () => {
  const t = i18n.getFixedT(i18n.language, "mcpServers");
  const serverPrefixById = new Map([
    ["srv-1", "github"],
    ["srv-2", "exa"],
  ]);
  const deps = { isAdmin: true, serverPrefixById, onEditClick: vi.fn(), onDeleteClick: vi.fn(), t };
  render(
    <DataTable
      data={[toolset]}
      columns={getMCPToolsetTableColumns(deps)}
      getRowId={(row) => row.toolset_id}
      sortingMode="client"
      size="compact"
    />,
  );
};

describe("MCPToolsetTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and overflow count in Chinese and hides the English originals", () => {
    renderTable();

    expect(screen.getByText("工具集 ID")).toBeInTheDocument();
    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByText("工具")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByText("还有 1 个")).toBeInTheDocument();
    expect(screen.queryByText("Toolset ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.queryByText("+1 more")).not.toBeInTheDocument();
  });

  it("renders the row actions menu in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByLabelText("打开工具集操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open toolset actions")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("打开工具集操作"));

    expect(await screen.findByRole("menuitem", { name: "复制 Endpoint URL" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "复制工具集 ID" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copy endpoint URL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copy toolset ID" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders the copy toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", { value: { writeText }, configurable: true });
    renderTable();

    await user.click(screen.getByLabelText("打开工具集操作"));
    await user.click(await screen.findByRole("menuitem", { name: "复制 Endpoint URL" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制 Endpoint URL"));
    expect(toast.success).not.toHaveBeenCalledWith("Endpoint URL copied");

    await user.click(screen.getByLabelText("打开工具集操作"));
    await user.click(await screen.findByRole("menuitem", { name: "复制工具集 ID" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制工具集 ID"));
    expect(toast.success).not.toHaveBeenCalledWith("Toolset ID copied");
  });
});
