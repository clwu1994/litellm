import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import RouterSettingsAccordion from "./RouterSettingsAccordion";

vi.mock("../networking", () => ({ getRouterSettingsCall: vi.fn().mockResolvedValue({}) }));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([{ model_group: "global-model" }]),
  fetchAvailableModelsForTeam: vi.fn().mockResolvedValue([{ model_group: "gpt-5" }]),
}));

vi.mock("../Settings/RouterSettings/Fallbacks/FallbackSelectionForm", () => ({
  FallbackSelectionForm: () => <div data-testid="fallback-form" />,
}));

vi.mock("../router_settings/RouterSettingsForm", () => ({
  default: () => <div data-testid="router-settings-form" />,
}));

describe("RouterSettingsAccordion Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tab labels and hides the English originals", () => {
    renderWithProviders(<RouterSettingsAccordion accessToken="test-token" />);

    expect(screen.getByRole("tab", { name: "负载均衡" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "回退" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Loadbalancing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Fallbacks" })).not.toBeInTheDocument();
  });
});
