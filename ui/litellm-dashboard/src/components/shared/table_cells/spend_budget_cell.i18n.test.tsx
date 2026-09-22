import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { SpendBudgetCell } from "./spend_budget_cell";

describe("SpendBudgetCell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese unlimited label and hides the English original", () => {
    renderWithProviders(<SpendBudgetCell spend={0.5} maxBudget={null} />);

    expect(screen.getByText("· 无限制")).toBeInTheDocument();
    expect(screen.queryByText("· Unlimited")).not.toBeInTheDocument();
  });

  it("renders the Chinese budget phrase and hides the English original", () => {
    renderWithProviders(<SpendBudgetCell spend={25} maxBudget={100} />);

    expect(screen.getByText("共 $100")).toBeInTheDocument();
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "$25.0000 共 $100");
    expect(screen.queryByText("of $100")).not.toBeInTheDocument();
  });
});
