import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";
import { useLocale } from "@/i18n/useLocale";

import { LocaleProvider } from "./LocaleProvider";

const Probe = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="logout">{t("logout")}</span>
      <button type="button" onClick={() => setLocale("en")}>
        switch
      </button>
    </div>
  );
};

const renderProbe = () =>
  render(
    <LocaleProvider>
      <Probe />
    </LocaleProvider>,
  );

describe("LocaleProvider", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage("zh");
    document.documentElement.lang = "";
  });

  it("stamps the document language with the default locale", async () => {
    renderProbe();
    expect(await screen.findByTestId("locale")).toHaveTextContent("zh");
    expect(document.documentElement.lang).toBe("zh");
  });

  it("renders Chinese copy by default", async () => {
    renderProbe();
    expect(await screen.findByTestId("logout")).toHaveTextContent("退出登录");
  });

  it("switches, persists, and updates the document language", async () => {
    renderProbe();
    await userEvent.click(await screen.findByRole("button", { name: "switch" }));
    expect(await screen.findByTestId("logout")).toHaveTextContent("Logout");
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("honours a stored preference on mount", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    renderProbe();
    expect(await screen.findByTestId("logout")).toHaveTextContent("Logout");
    expect(document.documentElement.lang).toBe("en");
  });
});
