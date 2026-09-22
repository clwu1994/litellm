import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { InheritedBudgetHint, inheritedBudgetGates } from "./InheritedBudgetHint";

const team = { team_id: "team-1", team_alias: "Platform", max_budget: 1200, budget_duration: "30d" };
const organization = {
  organization_id: "org-1",
  organization_alias: "Acme",
  litellm_budget_table: { max_budget: 5000, budget_duration: null },
};

describe("InheritedBudgetHint Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese message and gate scopes and hides the English originals", async () => {
    renderWithProviders(<InheritedBudgetHint gates={inheritedBudgetGates(team, organization)} />);

    await userEvent.setup().hover(screen.getByLabelText("question-circle"));

    const hint = screen.getByTestId("inherited-budget-hint");
    expect(hint).toHaveTextContent("此密钥没有自己的预算，但其花费仍计入：");
    expect(hint).toHaveTextContent("团队 Platform: $1,200.00 / 30d");
    expect(hint).toHaveTextContent("组织 Acme: $5,000.00");
    expect(hint).not.toHaveTextContent("This key has no budget of its own");
    expect(hint).not.toHaveTextContent("Team Platform");
    expect(hint).not.toHaveTextContent("Organization Acme");
  });
});
