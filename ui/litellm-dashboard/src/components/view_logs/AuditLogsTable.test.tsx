import type { ColumnFiltersState, PaginationState } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { AuditLogsTable } from "./AuditLogsTable";
import type { AuditLogEntry } from "./AuditLogsTableColumns";

const ROWS: AuditLogEntry[] = [
  {
    id: "log-1",
    updated_at: "2026-07-20T12:00:00Z",
    changed_by: "default_user_id",
    changed_by_api_key: "sk-hash-abc",
    action: "created",
    table_name: "LiteLLM_TeamTable",
    object_id: "team-obj-123",
    before_value: {},
    updated_values: { foo: "bar" },
  },
  {
    id: "log-2",
    updated_at: "2026-07-20T11:00:00Z",
    changed_by: "user-42",
    changed_by_api_key: "sk-hash-def",
    action: "deleted",
    table_name: "LiteLLM_UserTable",
    object_id: "user-obj-456",
    before_value: { a: 1 },
    updated_values: {},
  },
];

const FIRST_PAGE: PaginationState = { pageIndex: 0, pageSize: 50 };

const AUDIT_COLUMN_HEADERS = [
  { zh: "时间戳", en: "Timestamp" },
  { zh: "操作", en: "Action" },
  { zh: "数据表", en: "Table" },
  { zh: "对象 ID", en: "Object ID" },
  { zh: "修改者", en: "Changed By" },
  { zh: "API Key（哈希）", en: "API Key (Hash)" },
];

const AUDIT_TABLE_NAMES = [
  { tableName: "LiteLLM_VerificationToken", zh: "密钥", en: "Keys" },
  { tableName: "LiteLLM_TeamTable", zh: "团队", en: "Teams" },
  { tableName: "LiteLLM_UserTable", zh: "用户", en: "Users" },
  { tableName: "LiteLLM_OrganizationTable", zh: "组织", en: "Organizations" },
  { tableName: "LiteLLM_ProxyModelTable", zh: "模型", en: "Models" },
];

const AUDIT_FILTER_LABELS = [
  { zh: "对象 ID", en: "Object ID" },
  { zh: "修改者", en: "Changed By" },
  { zh: "团队 ID", en: "Team ID" },
  { zh: "密钥哈希", en: "Key Hash" },
  { zh: "操作", en: "Action" },
  { zh: "数据表", en: "Table" },
];

const AUDIT_FILTER_PLACEHOLDERS = [
  { zh: "输入对象 ID…", en: "Enter object ID…" },
  { zh: "输入用户 ID…", en: "Enter user ID…" },
  { zh: "输入团队 ID…", en: "Enter team ID…" },
  { zh: "输入密钥哈希…", en: "Enter key hash…" },
];

function renderTable(overrides: Partial<React.ComponentProps<typeof AuditLogsTable>> = {}) {
  const props: React.ComponentProps<typeof AuditLogsTable> = {
    data: ROWS,
    rowCount: ROWS.length,
    isLoading: false,
    isRefreshing: false,
    pagination: FIRST_PAGE,
    onPaginationChange: vi.fn(),
    columnFilters: [],
    onColumnFiltersChange: vi.fn(),
    onRefresh: vi.fn(),
    onViewLog: vi.fn(),
    ...overrides,
  };
  render(<AuditLogsTable {...props} />);
  return props;
}

describe("AuditLogsTable", () => {
  it("renders each audit column with the migrated shared cells", () => {
    renderTable();

    // Action -> StatusBadge with a capitalized label
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Deleted")).toBeInTheDocument();
    // Table name -> display mapping
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    // Changed By -> DefaultProxyAdminTag (default_user_id becomes a labeled tag; other ids stay raw)
    expect(screen.getByText("Default Proxy Admin")).toBeInTheDocument();
    expect(screen.getByText("user-42")).toBeInTheDocument();
    // Object ID + API key hash
    expect(screen.getByText("team-obj-123")).toBeInTheDocument();
    expect(screen.getByText("sk-hash-abc")).toBeInTheDocument();
  });

  it("opens the detail drawer from the Object ID identity cell with the full row", async () => {
    const user = userEvent.setup();
    const props = renderTable();

    await user.click(screen.getByText("team-obj-123"));

    expect(props.onViewLog).toHaveBeenCalledTimes(1);
    expect(props.onViewLog).toHaveBeenCalledWith(ROWS[0]);
  });

  it("drives the shared footer from the server rowCount and reports page changes", async () => {
    const user = userEvent.setup();
    const onPaginationChange = vi.fn();
    renderTable({ rowCount: 120, onPaginationChange });

    // ceil(120 / 50) = 3 pages, proving rowCount (not data length) feeds the footer
    expect(screen.getByTestId("pagination-page")).toHaveTextContent("Page 1 of 3");

    await user.click(screen.getByTestId("pagination-next"));
    expect(onPaginationChange).toHaveBeenCalledTimes(1);
  });

  it("shows skeleton rows while loading and no data rows", () => {
    renderTable({ isLoading: true, data: [] });

    expect(screen.getAllByTestId("skeleton-row").length).toBeGreaterThan(0);
    expect(screen.queryByText("No audit logs yet")).not.toBeInTheDocument();
  });

  it("uses a distinct empty state for unfiltered vs filtered-empty results", () => {
    const { unmount } = render(
      <AuditLogsTable
        data={[]}
        rowCount={0}
        isLoading={false}
        isRefreshing={false}
        pagination={FIRST_PAGE}
        onPaginationChange={vi.fn()}
        columnFilters={[]}
        onColumnFiltersChange={vi.fn()}
        onRefresh={vi.fn()}
        onViewLog={vi.fn()}
      />,
    );
    expect(screen.getByText("No audit logs yet")).toBeInTheDocument();
    unmount();

    renderTable({ data: [], rowCount: 0, columnFilters: [{ id: "action", value: "created" }] });
    expect(screen.getByText("No matching audit logs")).toBeInTheDocument();
  });

  it("renders the toolbar search box from the search props and forwards typed input", () => {
    const onSearchChange = vi.fn();
    renderTable({ searchValue: "team-", onSearchChange });

    const input = screen.getByPlaceholderText("Search audit logs by ID…");
    expect(input).toHaveValue("team-");

    fireEvent.change(input, { target: { value: "team-7" } });
    expect(onSearchChange).toHaveBeenCalledWith("team-7");
  });

  it("treats an active search as a filter for the empty state", () => {
    const emptySearchResult = { data: [], rowCount: 0, searchValue: "zzz", onSearchChange: vi.fn() };
    renderTable(emptySearchResult);

    expect(screen.getByText("No matching audit logs")).toBeInTheDocument();
  });

  it("renders active filter chips with human-readable labels", () => {
    const filters: ColumnFiltersState = [{ id: "action", value: "created" }];
    renderTable({ columnFilters: filters });

    const chip = screen.getByTestId("filter-chip-action");
    expect(chip).toHaveTextContent("Action:");
    expect(chip).toHaveTextContent("Created");
  });

  it("commits a text filter through the filter drawer and reports it to the parent", async () => {
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    renderTable({ onColumnFiltersChange });

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    fireEvent.change(await screen.findByPlaceholderText("Enter object ID…"), { target: { value: "obj-9" } });
    await user.click(screen.getByTestId("filter-drawer-apply"));

    expect(onColumnFiltersChange).toHaveBeenCalledTimes(1);
    const arg = onColumnFiltersChange.mock.calls[0][0];
    const committed = typeof arg === "function" ? arg([]) : arg;
    expect(committed).toEqual([{ id: "object_id", value: "obj-9" }]);
  });

  it("shows the human label on both filter triggers while unfiltered", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    const [action, table] = await screen.findAllByRole("combobox");

    expect(action).toHaveTextContent("All Actions");
    expect(table).toHaveTextContent("All Tables");
  });

  it("shows the human label on the filter triggers for an applied filter", async () => {
    const user = userEvent.setup();
    renderTable({
      columnFilters: [
        { id: "action", value: "created" },
        { id: "table_name", value: "LiteLLM_TeamTable" },
      ],
    });

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    const [action, table] = await screen.findAllByRole("combobox");

    expect(action).toHaveTextContent("Created");
    expect(table).toHaveTextContent("Teams");
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders every Chinese column header and hides the English ones", () => {
      renderTable();

      for (const { zh, en } of AUDIT_COLUMN_HEADERS) {
        expect(screen.getByText(zh)).toBeInTheDocument();
        expect(screen.queryByText(en)).not.toBeInTheDocument();
      }
    });

    it("renders every Chinese table name in the rows and hides the English ones", () => {
      renderTable({
        data: AUDIT_TABLE_NAMES.map(({ tableName }, index) => ({
          ...ROWS[0],
          id: `row-${index}`,
          table_name: tableName,
        })),
        rowCount: AUDIT_TABLE_NAMES.length,
      });

      for (const { zh, en } of AUDIT_TABLE_NAMES) {
        expect(screen.getByText(zh)).toBeInTheDocument();
        expect(screen.queryByText(en)).not.toBeInTheDocument();
      }
    });

    it("renders the Chinese loading message and hides the English one", async () => {
      renderTable({ isLoading: true, data: [] });

      expect(await screen.findByText("正在加载审计日志…")).toBeInTheDocument();
      expect(screen.queryByText("Loading audit logs…")).not.toBeInTheDocument();
    });

    it("renders the Chinese search placeholder and hides the English one", () => {
      renderTable({ searchValue: "", onSearchChange: vi.fn() });

      expect(screen.getByPlaceholderText("按 ID 搜索审计日志…")).toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Search audit logs by ID…")).not.toBeInTheDocument();
    });

    it("renders the Chinese empty state and hides the English one", () => {
      renderTable({ data: [], rowCount: 0 });

      expect(screen.getByText("暂无审计日志")).toBeInTheDocument();
      expect(screen.getByText("对密钥、团队、用户和模型的管理变更将显示在这里。")).toBeInTheDocument();
      expect(screen.queryByText("No audit logs yet")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Administrative changes to keys, teams, users, and models will appear here."),
      ).not.toBeInTheDocument();
    });

    it("renders the Chinese filtered empty state and hides the English one", () => {
      renderTable({ data: [], rowCount: 0, columnFilters: [{ id: "action", value: "created" }] });

      expect(screen.getByText("没有匹配的审计日志")).toBeInTheDocument();
      expect(screen.getByText("没有审计日志条目符合你的筛选条件。")).toBeInTheDocument();
      expect(screen.queryByText("No matching audit logs")).not.toBeInTheDocument();
      expect(screen.queryByText("No audit log entries match your filters.")).not.toBeInTheDocument();
    });

    it("renders the Chinese filter drawer chrome and hides the English one", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByTestId("datatable-filters-trigger"));
      const drawer = within(await screen.findByTestId("filter-drawer-body"));

      expect(screen.getByRole("heading", { name: "筛选" })).toBeInTheDocument();
      expect(screen.getByText("进一步筛选审计日志")).toBeInTheDocument();
      expect(screen.queryByText("Narrow down audit log entries")).not.toBeInTheDocument();

      for (const { zh, en } of AUDIT_FILTER_LABELS) {
        expect(drawer.getByText(zh)).toBeInTheDocument();
        expect(drawer.queryByText(en)).not.toBeInTheDocument();
      }
      for (const { zh, en } of AUDIT_FILTER_PLACEHOLDERS) {
        expect(screen.getByPlaceholderText(zh)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(en)).not.toBeInTheDocument();
      }
    });

    it("renders the Chinese action and table filter triggers and hides the English ones", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByTestId("datatable-filters-trigger"));
      const [action, table] = await screen.findAllByRole("combobox");

      expect(action).toHaveTextContent("全部操作");
      expect(table).toHaveTextContent("全部数据表");
      expect(screen.queryByText("All Actions")).not.toBeInTheDocument();
      expect(screen.queryByText("All Tables")).not.toBeInTheDocument();
    });

    it("renders every Chinese table option and hides the English ones", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByTestId("datatable-filters-trigger"));
      const [, table] = await screen.findAllByRole("combobox");
      await user.click(table);

      for (const { zh, en } of AUDIT_TABLE_NAMES) {
        expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
        expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
      }
    });

    it("keeps the audit action names in English in the filter options", async () => {
      const user = userEvent.setup();
      renderTable();

      await user.click(screen.getByTestId("datatable-filters-trigger"));
      const [action] = await screen.findAllByRole("combobox");
      await user.click(action);

      for (const name of ["Created", "Updated", "Deleted", "Rotated"]) {
        expect(await screen.findByRole("option", { name })).toBeInTheDocument();
      }
    });

    it("renders the Chinese filter chip labels while the action and table values stay English", () => {
      renderTable({
        columnFilters: [
          { id: "action", value: "created" },
          { id: "table_name", value: "LiteLLM_TeamTable" },
        ],
      });

      const actionChip = screen.getByTestId("filter-chip-action");
      expect(actionChip).toHaveTextContent("操作:");
      expect(actionChip).toHaveTextContent("Created");

      const tableChip = screen.getByTestId("filter-chip-table_name");
      expect(tableChip).toHaveTextContent("数据表:");
      expect(tableChip).toHaveTextContent("团队");
      expect(tableChip).not.toHaveTextContent("Teams");
    });
  });
});
