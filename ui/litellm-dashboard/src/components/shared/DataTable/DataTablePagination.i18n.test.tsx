import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { DataTablePagination } from "./DataTablePagination";

const BASE_PROPS = {
  page: 0,
  pageSize: 25,
  rowCount: 100,
  onPageChange: () => {},
  onPageSizeChange: () => {},
};

describe("DataTablePagination Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese rows-per-page label and range", () => {
    renderWithProviders(<DataTablePagination {...BASE_PROPS} />);

    expect(screen.getByText("每页行数")).toBeInTheDocument();
    expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("显示第 1-25 条，共 100 条");
    expect(screen.queryByText("Showing 1-25 of 100")).not.toBeInTheDocument();
  });

  it("renders the Chinese page counter", () => {
    renderWithProviders(<DataTablePagination {...BASE_PROPS} />);

    expect(screen.getByTestId("pagination-page")).toHaveTextContent("第 1 页，共 4 页");
    expect(screen.queryByText("Page 1 of 4")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty range when there are no rows", () => {
    renderWithProviders(<DataTablePagination {...BASE_PROPS} rowCount={0} />);

    expect(screen.getByTestId("pagination-range")).toHaveTextContent("无结果");
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("renders the Chinese navigation aria labels", () => {
    renderWithProviders(<DataTablePagination {...BASE_PROPS} />);

    expect(screen.getByTestId("pagination-first")).toHaveAttribute("aria-label", "转到第一页");
    expect(screen.getByTestId("pagination-prev")).toHaveAttribute("aria-label", "转到上一页");
    expect(screen.getByTestId("pagination-next")).toHaveAttribute("aria-label", "转到下一页");
    expect(screen.getByTestId("pagination-last")).toHaveAttribute("aria-label", "转到最后一页");
    expect(screen.queryByLabelText("Go to first page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Go to previous page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Go to next page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Go to last page")).not.toBeInTheDocument();
  });
});
