import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { getAvailablePages } from "@/components/page_utils";
import i18n from "@/i18n/bootstrapI18n";

import PageVisibilitySettings from "./PageVisibilitySettings";

describe("PageVisibilitySettings page descriptions", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every description from the nav catalog in Chinese and hides the English originals", async () => {
    await i18n.changeLanguage("zh");
    const user = userEvent.setup();
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "配置页面可见性" }));

    const pages = getAvailablePages(i18n.getFixedT("zh", "nav"));
    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      const zh = i18n.t(page.descriptionKey, { ns: "nav", lng: "zh" });
      const en = i18n.t(page.descriptionKey, { ns: "nav", lng: "en" });

      expect(zh, `${page.descriptionKey} should be translated`).not.toBe(en);
      expect(screen.getAllByText(zh).length, `${page.descriptionKey} should render in Chinese`).toBeGreaterThan(0);
      expect(screen.queryAllByText(en), `${page.descriptionKey} should not render in English`).toHaveLength(0);
    }
  });
});
