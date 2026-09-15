"use client";

import { useTranslation } from "react-i18next";

import { SUPPORTED_LOCALES, normalizeLocale, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/useLocale";

const LABEL_KEYS: Record<Locale, "languageZh" | "languageEn"> = {
  zh: "languageZh",
  en: "languageEn",
};

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  return (
    <label className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm">
      <span>{t("language")}</span>
      <select
        aria-label={t("language")}
        className="rounded-sm border border-border bg-transparent px-1 py-0.5 text-sm"
        value={locale}
        onChange={(event) => setLocale(normalizeLocale(event.target.value) ?? locale)}
      >
        {SUPPORTED_LOCALES.map((option) => (
          <option key={option} value={option}>
            {t(LABEL_KEYS[option])}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
