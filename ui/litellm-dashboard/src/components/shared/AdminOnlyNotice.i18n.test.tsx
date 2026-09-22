import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { AdminOnlyNotice } from "./AdminOnlyNotice";

describe("AdminOnlyNotice Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese admin-only notice and hides the English original", () => {
    renderWithProviders(<AdminOnlyNotice pageTitle="Teams" />);

    expect(screen.getByText("Teams 仅对管理员用户可用。")).toBeInTheDocument();
    expect(screen.queryByText("Teams is only available to admin users.")).not.toBeInTheDocument();
  });
});
