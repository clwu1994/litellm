import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import NewBadge from "./NewBadge";

vi.mock("@/app/(dashboard)/hooks/useDisableShowNewBadge", () => ({ useDisableShowNewBadge: vi.fn(() => false) }));

describe("NewBadge Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese badge label and hides the English original", () => {
    renderWithProviders(<NewBadge />);

    expect(screen.getByText("新")).toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
  });
});
