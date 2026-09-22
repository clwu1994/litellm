import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { SimpleTable } from "./simple_table";

describe("SimpleTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading message and hides the English original", () => {
    renderWithProviders(<SimpleTable data={[]} columns={[{ header: "Name" }]} isLoading />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty message and hides the English original", () => {
    renderWithProviders(<SimpleTable data={[]} columns={[{ header: "Name" }]} />);

    expect(screen.getByText("无数据")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });
});
