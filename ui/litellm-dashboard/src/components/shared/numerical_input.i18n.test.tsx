import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import NumericalInput from "./numerical_input";

describe("NumericalInput Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default placeholder and hides the English original", () => {
    renderWithProviders(<NumericalInput />);

    expect(screen.getByPlaceholderText("输入数值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter a numerical value")).not.toBeInTheDocument();
  });
});
