import { PaginationState } from "@tanstack/react-table";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { MemoryRow } from "@/components/networking";

import { MemoryTable } from "./MemoryTable";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const makeMemory = (overrides: Partial<MemoryRow> = {}): MemoryRow => ({
  memory_id: "mem-1",
  key: "user:profile",
  value: "The user prefers concise answers.",
  metadata: null,
  user_id: "user-42",
  team_id: "team-7",
  updated_at: "2024-05-01T12:00:00Z",
  ...overrides,
});

const baseProps = {
  data: [makeMemory()],
  isLoading: false,
  rowCount: 1,
  pagination: { pageIndex: 0, pageSize: 50 } as PaginationState,
  onPaginationChange: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  isRefreshing: false,
  onRefresh: vi.fn(),
  hasActiveSearch: false,
  onViewClick: vi.fn(),
  onEditClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("MemoryTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers and hides the English originals", () => {
    renderWithProviders(<MemoryTable {...baseProps} />);
    const table = screen.getByRole("table");

    expect(within(table).getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "预览" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "用户 ID" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "团队 ID" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "更新时间" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "操作" })).toBeInTheDocument();

    expect(within(table).queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Preview" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "User ID" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Team ID" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Updated" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions in the open menu and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryTable {...baseProps} />);

    const trigger = screen.getByTestId("memory-actions-mem-1");
    expect(trigger).toHaveAttribute("aria-label", "打开记忆操作菜单");
    expect(screen.queryByLabelText("Open memory actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: "查看" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "View" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-only copy and hides the English originals", () => {
    renderWithProviders(<MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={false} />);

    expect(screen.getByText("尚未存储任何记忆")).toBeInTheDocument();
    expect(screen.getByText("你的 Agent 存储在 /v1/memory 下的记忆将显示在这里。")).toBeInTheDocument();
    expect(screen.queryByText("No memories stored yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Memories your agents store under /v1/memory will appear here.")).not.toBeInTheDocument();
    expect(screen.queryByText("没有匹配的记忆")).not.toBeInTheDocument();
  });

  it("renders the Chinese filtered-empty copy and hides the English originals", () => {
    renderWithProviders(<MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={true} />);

    expect(screen.getByText("没有匹配的记忆")).toBeInTheDocument();
    expect(screen.getByText("没有记忆与你的搜索匹配。")).toBeInTheDocument();
    expect(screen.queryByText("No matching memories")).not.toBeInTheDocument();
    expect(screen.queryByText("No memories match your search.")).not.toBeInTheDocument();
    expect(screen.queryByText("尚未存储任何记忆")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message and hides the English original", () => {
    renderWithProviders(<MemoryTable {...baseProps} data={[]} rowCount={0} isLoading={true} />);

    expect(screen.getByText("正在加载记忆…")).toBeInTheDocument();
    expect(screen.queryByText("Loading memories…")).not.toBeInTheDocument();
  });

  it("renders the Chinese search placeholder and hides the English original", () => {
    renderWithProviders(<MemoryTable {...baseProps} />);

    expect(screen.getByPlaceholderText("按键前缀或 Memory ID 搜索…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by key prefix or memory ID…")).not.toBeInTheDocument();
  });
});

describe("MemoryTable English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryTable {...baseProps} />);
    const table = screen.getByRole("table");

    for (const header of ["ID", "Name", "Preview", "User ID", "Team ID", "Updated", "Actions"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }

    const trigger = screen.getByTestId("memory-actions-mem-1");
    expect(trigger).toHaveAttribute("aria-label", "Open memory actions");
    await user.click(trigger);
    expect(await screen.findByRole("menuitem", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Search by key prefix or memory ID…")).toBeInTheDocument();
  });

  it("keeps the original English empty and loading copy byte-identical", () => {
    const { unmount } = renderWithProviders(
      <MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={false} />,
    );
    expect(screen.getByText("No memories stored yet")).toBeInTheDocument();
    expect(screen.getByText("Memories your agents store under /v1/memory will appear here.")).toBeInTheDocument();
    unmount();

    renderWithProviders(<MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={true} />);
    expect(screen.getByText("No matching memories")).toBeInTheDocument();
    expect(screen.getByText("No memories match your search.")).toBeInTheDocument();

    renderWithProviders(<MemoryTable {...baseProps} data={[]} rowCount={0} isLoading={true} />);
    expect(screen.getByText("Loading memories…")).toBeInTheDocument();
  });
});
