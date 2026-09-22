import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { PageHeader } from "./PageHeader";

describe("PageHeader Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese control-row label and hides the English original", () => {
    renderWithProviders(
      <PageHeader
        title="Teams"
        subtitle="Manage teams"
        icon={<span>icon</span>}
        primaryAction={<button>Add</button>}
      />,
    );

    expect(screen.getByRole("group", { name: "页面控件" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Page controls" })).not.toBeInTheDocument();
  });
});
