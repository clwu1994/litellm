import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import CodeBlock from "./CodeBlock";

describe("CodeBlock Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese copy control label and hides the English original", () => {
    renderWithProviders(<CodeBlock code="const a = 1;" language="typescript" />);

    expect(screen.getByRole("button", { name: "复制代码" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy code" })).not.toBeInTheDocument();
  });
});
