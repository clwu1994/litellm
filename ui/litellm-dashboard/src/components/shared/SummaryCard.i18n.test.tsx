import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import SummaryCard from "./SummaryCard";

describe("SummaryCard Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese calculation label and hides the English original", () => {
    renderWithProviders(<SummaryCard label="总节省" value="$1" info="解释" />);

    expect(screen.getByLabelText("总节省 的计算方式")).toBeInTheDocument();
    expect(screen.queryByLabelText("How 总节省 is calculated")).not.toBeInTheDocument();
  });
});
