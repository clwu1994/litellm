import type { ColumnDef } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";
import { DataTableToolbar } from "./DataTableToolbar";

interface Person {
  id: string;
  name: string;
}

const COLUMNS: ColumnDef<Person, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    meta: { title: "Name" },
    filterFn: (row, columnId, value) => row.getValue<string>(columnId) === value,
    cell: ({ row }) => <span data-testid="name-cell">{row.original.name}</span>,
  },
];

const ROWS: Person[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

function Harness({ searchPlaceholder }: { searchPlaceholder?: string }) {
  return (
    <DataTable
      data={ROWS}
      columns={COLUMNS}
      filterMode="client"
      defaultColumnFilters={[{ id: "name", value: "Alice" }]}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchPlaceholder={searchPlaceholder}
          onSearchChange={vi.fn()}
          onRefresh={vi.fn()}
          onOpenFilters={vi.fn()}
        />
      )}
    />
  );
}

describe("DataTableToolbar Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese search, clear-all, filters, refresh and columns copy", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByPlaceholderText("搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除全部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(screen.getByTestId("datatable-filters-trigger")).toHaveTextContent("筛选");
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "列" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Columns" })).not.toBeInTheDocument();

    const refresh = screen.getByTestId("datatable-refresh");
    expect(refresh).toHaveAttribute("aria-label", "刷新");
    expect(refresh).toHaveAttribute("title", "刷新");
    expect(screen.queryByLabelText("Refresh")).not.toBeInTheDocument();
  });

  it("renders the Chinese interpolated remove-filter label over the raw filter label", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByTestId("filter-chip-remove-name")).toHaveAttribute("aria-label", "移除 Name 筛选条件");
    expect(screen.queryByLabelText("Remove Name filter")).not.toBeInTheDocument();
  });

  it("keeps an explicit searchPlaceholder override", () => {
    renderWithProviders(<Harness searchPlaceholder="Custom search" />);

    expect(screen.getByPlaceholderText("Custom search")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("搜索")).not.toBeInTheDocument();
  });
});
