import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese reveal labels and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText("显示密码")).toBeInTheDocument();
    expect(screen.queryByLabelText("Show password")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("显示密码"));

    expect(screen.getByLabelText("隐藏密码")).toBeInTheDocument();
    expect(screen.queryByLabelText("Hide password")).not.toBeInTheDocument();
  });
});
