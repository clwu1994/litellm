import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { FiltersButton } from "./FiltersButton";

describe("FiltersButton Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese toggle label and hides the English default", () => {
    renderWithProviders(<FiltersButton onClick={vi.fn()} active={false} hasActiveFilters={false} />);

    expect(screen.getByRole("button", { name: "筛选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Filters" })).not.toBeInTheDocument();
  });

  it("keeps an explicit label override", () => {
    renderWithProviders(
      <FiltersButton onClick={vi.fn()} active={false} hasActiveFilters={false} label="Advanced Filters" />,
    );

    expect(screen.getByRole("button", { name: "Advanced Filters" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "筛选" })).not.toBeInTheDocument();
  });
});
