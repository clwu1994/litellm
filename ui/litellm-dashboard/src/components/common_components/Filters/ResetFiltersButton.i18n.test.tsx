import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ResetFiltersButton } from "./ResetFiltersButton";

describe("ResetFiltersButton Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese reset label and hides the English default", () => {
    renderWithProviders(<ResetFiltersButton onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "重置筛选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset Filters" })).not.toBeInTheDocument();
  });

  it("keeps an explicit label override", () => {
    renderWithProviders(<ResetFiltersButton onClick={vi.fn()} label="Clear All" />);

    expect(screen.getByRole("button", { name: "Clear All" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重置筛选" })).not.toBeInTheDocument();
  });
});
