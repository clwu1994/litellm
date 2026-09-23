import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "./breadcrumb";

describe("Breadcrumb Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese navigation label and hides the English original", () => {
    renderWithProviders(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>日志</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );

    expect(screen.getByRole("navigation", { name: "面包屑导航" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "breadcrumb" })).not.toBeInTheDocument();
  });
});
