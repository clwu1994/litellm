import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { IdCell } from "./id_cell";

describe("IdCell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default copy label and hides the English original", () => {
    renderWithProviders(<IdCell value="key-1" copyable />);

    expect(screen.getByLabelText("复制 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy ID")).not.toBeInTheDocument();
  });
});
