import type { ColumnDef } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";
import { createSelectionColumn } from "./DataTableSelectionColumn";

interface Person {
  id: string;
  name: string;
}

const COLUMNS: ColumnDef<Person, unknown>[] = [
  createSelectionColumn<Person>(),
  { id: "name", accessorKey: "name", header: "Name", enableSorting: false },
];

const ROWS: Person[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];

describe("DataTableSelectionColumn Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese select-all and select-row aria labels", () => {
    renderWithProviders(<DataTable data={ROWS} columns={COLUMNS} getRowId={(row) => row.id} />);

    expect(screen.getByTestId("datatable-select-all")).toHaveAttribute("aria-label", "选择所有行");
    expect(screen.queryByLabelText("Select all rows")).not.toBeInTheDocument();
    expect(screen.getByTestId("datatable-select-row-a")).toHaveAttribute("aria-label", "选择行");
    expect(screen.queryByLabelText("Select row")).not.toBeInTheDocument();
  });
});
