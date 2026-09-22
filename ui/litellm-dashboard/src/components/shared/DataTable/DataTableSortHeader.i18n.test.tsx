import type { ColumnDef } from "@tanstack/react-table";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";
import { DataTableMultiSortHeader, DataTableSortHeader } from "./DataTableSortHeader";

interface Person {
  id: string;
  name: string;
}

const ROWS: Person[] = [{ id: "a", name: "Alice" }];

const DROPDOWN_COLUMNS: ColumnDef<Person, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableSortHeader column={column} title="Name" variant="dropdown-tristate" />,
    cell: ({ row }) => <span data-testid="name-cell">{row.original.name}</span>,
  },
];

const MULTI_SORT_COLUMNS: ColumnDef<Person, unknown>[] = [
  {
    id: "spend",
    accessorKey: "name",
    header: ({ table }) => (
      <DataTableMultiSortHeader
        table={table}
        fields={[
          { id: "spend", label: "Spend" },
          { id: "max_budget", label: "Budget" },
        ]}
      />
    ),
    cell: ({ row }) => <span data-testid="name-cell">{row.original.name}</span>,
  },
];

describe("DataTableSortHeader Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese sort trigger label and menu items while the menu is open", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataTable data={ROWS} columns={DROPDOWN_COLUMNS} sortingMode="client" />);

    const trigger = screen.getByTestId("sort-trigger-name");
    expect(trigger).toHaveAttribute("aria-label", "name 的排序选项");
    expect(screen.queryByLabelText("Sort options for name")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: "升序" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Ascending" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "降序" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Descending" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "重置" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reset" })).not.toBeInTheDocument();
  });

  it("renders the Chinese multi-sort field options and the Chinese disjunction in the trigger label", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DataTable data={ROWS} columns={MULTI_SORT_COLUMNS} sortingMode="client" />);

    const trigger = screen.getByTestId("sort-trigger-spend");
    expect(trigger).toHaveAttribute("aria-label", "Spend 或 Budget 的排序选项");
    expect(screen.queryByLabelText("Sort options for Spend or Budget")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: "Spend 升序" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Spend ascending" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Budget 降序" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Budget descending" })).not.toBeInTheDocument();
  });
});
