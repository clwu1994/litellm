import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import BetaBadge from "./BetaBadge";

vi.mock("@/app/(dashboard)/hooks/useDisableShowNewBadge", () => ({
  useDisableShowNewBadge: vi.fn(),
}));

import { useDisableShowNewBadge } from "@/app/(dashboard)/hooks/useDisableShowNewBadge";

describe("BetaBadge localized copy", () => {
  beforeEach(async () => {
    vi.mocked(useDisableShowNewBadge).mockReturnValue(false);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Beta badge under zh, matching the chat integrations value", () => {
    renderWithProviders(<BetaBadge />);

    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});
