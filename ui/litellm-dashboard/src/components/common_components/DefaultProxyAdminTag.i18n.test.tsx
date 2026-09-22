import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import DefaultProxyAdminTag from "./DefaultProxyAdminTag";

describe("DefaultProxyAdminTag Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default-admin label and hides the English original", () => {
    renderWithProviders(<DefaultProxyAdminTag userId="default_user_id" />);

    expect(screen.getByText("默认 Proxy 管理员")).toBeInTheDocument();
    expect(screen.queryByText("Default Proxy Admin")).not.toBeInTheDocument();
  });
});
