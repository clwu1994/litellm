import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ImpactPreviewAlert from "./impact_preview_alert";

const globalImpact = {
  affected_keys_count: -1,
  affected_teams_count: -1,
  sample_keys: [],
  sample_teams: [],
};

const specificImpact = {
  affected_keys_count: 3,
  affected_teams_count: 1,
  sample_keys: ["sk-abc", "sk-def", "sk-ghi"],
  sample_teams: ["team-alpha"],
};

const oneKeyNoTeam = {
  affected_keys_count: 1,
  affected_teams_count: 0,
  sample_keys: ["sk-1"],
  sample_teams: [],
};

const manyKeys = {
  affected_keys_count: 10,
  affected_teams_count: 0,
  sample_keys: ["k1", "k2", "k3", "k4", "k5"],
  sample_teams: [],
};

const findLine = (text: string) => screen.getAllByText((_, element) => element?.textContent === text).at(0) ?? null;

describe("ImpactPreviewAlert Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title and plural count line", () => {
    renderWithProviders(<ImpactPreviewAlert impactResult={specificImpact} />);

    expect(screen.getByText("影响预览")).toBeInTheDocument();
    expect(screen.queryByText("Impact Preview")).not.toBeInTheDocument();
    expect(findLine("此附件将影响 3 个密钥和 1 个团队。")).toBeInTheDocument();
    expect(screen.getByText("3 个密钥")).toBeInTheDocument();
    expect(screen.getByText("1 个团队")).toBeInTheDocument();
    expect(screen.queryByText("3 keys")).not.toBeInTheDocument();
    expect(screen.queryByText("1 team")).not.toBeInTheDocument();
  });

  it("renders the Chinese singular key and plural team words", () => {
    renderWithProviders(<ImpactPreviewAlert impactResult={oneKeyNoTeam} />);

    expect(findLine("此附件将影响 1 个密钥和 0 个团队。")).toBeInTheDocument();
    expect(screen.queryByText("1 key")).not.toBeInTheDocument();
    expect(screen.queryByText("0 teams")).not.toBeInTheDocument();
  });

  it("renders the Chinese sample labels and hides the English ones", () => {
    renderWithProviders(<ImpactPreviewAlert impactResult={specificImpact} />);

    expect(screen.getByText("密钥：")).toBeInTheDocument();
    expect(screen.queryByText("Keys:")).not.toBeInTheDocument();
    expect(screen.getByText("团队：")).toBeInTheDocument();
    expect(screen.queryByText("Teams:")).not.toBeInTheDocument();
  });

  it("renders the Chinese truncation line when more than five samples exist", () => {
    renderWithProviders(<ImpactPreviewAlert impactResult={manyKeys} />);

    expect(screen.getByText("另外还有 5 个...")).toBeInTheDocument();
    expect(screen.queryByText("and 5 more...")).not.toBeInTheDocument();
  });

  it("renders the Chinese global scope warning", () => {
    renderWithProviders(<ImpactPreviewAlert impactResult={globalImpact} />);

    expect(findLine("全局范围 — 这将影响所有密钥和团队。")).toBeInTheDocument();
    expect(screen.getByText("所有密钥和团队")).toBeInTheDocument();
    expect(screen.queryByText(/Global scope/)).not.toBeInTheDocument();
  });

  it("selects the singular and plural count words in English", async () => {
    await i18n.changeLanguage("en");

    const first = renderWithProviders(<ImpactPreviewAlert impactResult={specificImpact} />);
    expect(findLine("This attachment would affect 3 keys and 1 team.")).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<ImpactPreviewAlert impactResult={oneKeyNoTeam} />);
    expect(findLine("This attachment would affect 1 key and 0 teams.")).toBeInTheDocument();
  });

  it("renders the English global scope warning byte-identically after the Trans conversion", async () => {
    await i18n.changeLanguage("en");

    renderWithProviders(<ImpactPreviewAlert impactResult={globalImpact} />);

    expect(findLine("Global scope — this will affect all keys and teams.")).toBeInTheDocument();
  });
});
