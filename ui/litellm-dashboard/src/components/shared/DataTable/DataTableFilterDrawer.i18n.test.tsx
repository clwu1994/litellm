import type { ColumnDef } from "@tanstack/react-table";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";
import { DataTableFilterDrawer } from "./DataTableFilterDrawer";
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

interface HarnessProps {
  title?: string;
  applyLabel?: string;
  resetLabel?: string;
}

function Harness({ title, applyLabel, resetLabel }: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <DataTable
      data={ROWS}
      columns={COLUMNS}
      filterMode="client"
      toolbar={(table) => (
        <>
          <DataTableToolbar table={table} onOpenFilters={() => setOpen(true)} />
          <DataTableFilterDrawer
            table={table}
            open={open}
            onOpenChange={setOpen}
            title={title}
            applyLabel={applyLabel}
            resetLabel={resetLabel}
          >
            {() => <span data-testid="drawer-body" />}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}

describe("DataTableFilterDrawer Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese drawer title, apply label and reset label while open", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByTestId("datatable-filters-trigger"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("筛选")).toBeInTheDocument();
    expect(within(dialog).queryByText("Filters")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "应用筛选" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Apply Filters" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });

  it("keeps explicit title, applyLabel and resetLabel overrides", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness title="Custom title" applyLabel="Custom apply" resetLabel="Custom reset" />);

    await user.click(screen.getByTestId("datatable-filters-trigger"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Custom title")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Custom apply" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Custom reset" })).toBeInTheDocument();
    expect(within(dialog).queryByText("筛选")).not.toBeInTheDocument();
  });
});
