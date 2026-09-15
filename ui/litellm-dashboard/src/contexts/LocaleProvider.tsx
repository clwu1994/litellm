"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import i18n from "@/i18n";
import { normalizeLocale } from "@/i18n/config";
import { readStoredLocale } from "@/i18n/localeStorage";
import { useLocale } from "@/i18n/useLocale";

const LocaleEffects = () => {
  const { i18n: instance } = useTranslation();
  const { locale } = useLocale();

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== normalizeLocale(instance.language)) {
      void instance.changeLanguage(stored);
    }
  }, [instance]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <LocaleEffects />
    {children}
  </I18nextProvider>
);
