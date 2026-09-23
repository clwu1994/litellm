import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import Onboarding from "./page";

const never = new Promise<never>(() => {});

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    throw never;
  },
}));

describe("Onboarding page Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese suspense fallback and hides the English", () => {
    renderWithProviders(<Onboarding />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
