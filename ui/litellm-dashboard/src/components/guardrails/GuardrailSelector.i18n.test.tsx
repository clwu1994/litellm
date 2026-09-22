import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import * as networking from "../networking";
import GuardrailSelector from "./GuardrailSelector";

vi.mock("../networking");

describe("GuardrailSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.getGuardrailsList).mockResolvedValue({ guardrails: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", async () => {
    renderWithProviders(<GuardrailSelector accessToken="tok" onChange={vi.fn()} value={[]} />);

    expect(await screen.findByPlaceholderText("选择 Guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select guardrails")).not.toBeInTheDocument();
  });

  it("renders the Chinese premium placeholder when disabled and hides the English original", async () => {
    renderWithProviders(<GuardrailSelector accessToken="tok" onChange={vi.fn()} value={[]} disabled />);

    expect(await screen.findByPlaceholderText("设置 Guardrails 是高级功能。")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Setting guardrails is a premium feature.")).not.toBeInTheDocument();
  });
});
