import type { ColumnDef } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";
import { DataTableViewOptions } from "./DataTableViewOptions";

interface Person {
  id: string;
  name: string;
}

const COLUMNS: ColumnDef<Person, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span data-testid="name-cell">{row.original.name}</span>,
  },
];

const ROWS: Person[] = [{ id: "a", name: "Alice" }];

describe("DataTableViewOptions Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default view label", () => {
    renderWithProviders(
      <DataTable data={ROWS} columns={COLUMNS} toolbar={(table) => <DataTableViewOptions table={table} />} />,
    );

    expect(screen.getByRole("button", { name: "视图" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
  });
});
