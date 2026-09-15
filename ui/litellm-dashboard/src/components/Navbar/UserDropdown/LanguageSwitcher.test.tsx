import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import { LocaleProvider } from "@/contexts/LocaleProvider";
import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";

import LanguageSwitcher from "./LanguageSwitcher";

const Probe = () => {
  const { t } = useTranslation();
  return <span data-testid="probe">{t("logout")}</span>;
};

const renderSwitcher = () =>
  render(
    <LocaleProvider>
      <LanguageSwitcher />
      <Probe />
    </LocaleProvider>,
  );

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage("zh");
  });

  it("offers Chinese and English and selects Chinese by default", async () => {
    renderSwitcher();
    const select = await screen.findByRole("combobox", { name: "语言" });
    expect(select).toHaveValue("zh");
    expect(screen.getByRole("option", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
  });

  it("switches the whole tree to English and persists the choice", async () => {
    renderSwitcher();
    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "语言" }), "en");
    expect(await screen.findByTestId("probe")).toHaveTextContent("Logout");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });
});
