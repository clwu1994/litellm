import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import TagSelector from "./TagSelector";

describe("TagSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", () => {
    renderWithProviders(<TagSelector accessToken="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择或创建标签")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or create tags")).not.toBeInTheDocument();
  });
});
