import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ModelHubTablePage from "../model_hub_table/page";
import ModelHubPage from "./page";

const never = new Promise<never>(() => {});

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    throw never;
  },
}));

describe("Model hub pages Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese model hub suspense fallback and hides the English", () => {
    renderWithProviders(<ModelHubPage />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese model hub table suspense fallback and hides the English", () => {
    renderWithProviders(<ModelHubTablePage />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
