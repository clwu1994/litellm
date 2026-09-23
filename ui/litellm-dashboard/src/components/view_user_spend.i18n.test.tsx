import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ViewUserSpend from "./view_user_spend";

vi.mock("./networking", () => ({
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
}));

describe("ViewUserSpend Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese spend and budget labels and hides the English", () => {
    renderWithProviders(<ViewUserSpend userSpend={5.5} userMaxBudget={null} selectedTeam={null} />);

    expect(screen.getByText("总消费")).toBeInTheDocument();
    expect(screen.queryByText("Total Spend")).not.toBeInTheDocument();
    expect(screen.getByText("最大预算")).toBeInTheDocument();
    expect(screen.queryByText("Max Budget")).not.toBeInTheDocument();
    expect(screen.getByText("无限制")).toBeInTheDocument();
    expect(screen.queryByText("No limit")).not.toBeInTheDocument();
  });

  it("renders the Chinese budget limit suffix with the amount", () => {
    renderWithProviders(
      <ViewUserSpend userSpend={5.5} userMaxBudget={null} selectedTeam={{ team_alias: "Team A", max_budget: 20 }} />,
    );

    expect(screen.getByText("$20.0000 限额")).toBeInTheDocument();
    expect(screen.queryByText("$20.0000 limit")).not.toBeInTheDocument();
  });
});
