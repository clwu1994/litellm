"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./config";
import { storeLocale } from "./localeStorage";

export interface LocaleControls {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

export const useLocale = (): LocaleControls => {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language) ?? DEFAULT_LOCALE;
  const setLocale = useCallback(
    (next: Locale) => {
      void i18n.changeLanguage(next);
      storeLocale(next);
    },
    [i18n],
  );
  return { locale, setLocale };
};
