import type { ColumnDef } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTable } from "./DataTable";

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

describe("DataTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state and hides the English one", () => {
    renderWithProviders(<DataTable data={[]} columns={COLUMNS} />);

    expect(screen.getByText("无结果")).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
    expect(screen.getByText("没有符合搜索或筛选条件的行。")).toBeInTheDocument();
    expect(screen.queryByText("No rows match your search or filters.")).not.toBeInTheDocument();
  });

  it("renders the Chinese default loading message in the skeleton row", () => {
    renderWithProviders(<DataTable data={[]} columns={COLUMNS} isLoading />);

    expect(screen.getByText("加载中…")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("keeps an explicit loadingMessage override", () => {
    renderWithProviders(<DataTable data={[]} columns={COLUMNS} isLoading loadingMessage="Fetching rows" />);

    expect(screen.getByText("Fetching rows")).toBeInTheDocument();
    expect(screen.queryByText("加载中…")).not.toBeInTheDocument();
  });
});
