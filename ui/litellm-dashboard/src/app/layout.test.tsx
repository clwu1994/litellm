import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";

import RootLayout from "./layout";

vi.mock("./globals.css", () => ({}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return {
    ...actual,
    getUiConfig: vi.fn(async () => ({ server_root_path: "", proxy_base_url: null })),
  };
});

const Probe = () => {
  const { t } = useTranslation();
  return <span data-testid="logout">{t("logout")}</span>;
};

const renderRoot = () =>
  render(
    <RootLayout>
      <Probe />
    </RootLayout>,
  );

describe("RootLayout", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage("zh");
  });

  it("declares Chinese and renders translated children in Chinese", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <Probe />
      </RootLayout>,
    );

    expect(html).toContain('lang="zh"');
    expect(html).toContain("退出登录");
    expect(html).not.toContain("Logout");
  });

  it("applies the stored preference through the mounted LocaleProvider", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");

    renderRoot();

    expect(await screen.findByTestId("logout")).toHaveTextContent("Logout");
    expect(document.documentElement.lang).toBe("en");
  });
});
