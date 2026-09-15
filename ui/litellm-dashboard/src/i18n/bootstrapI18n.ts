import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./config";
import { resources } from "./resources";

const initOptions = {
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
  react: { useSuspense: false },
};

void i18n.use(initReactI18next).init(initOptions);

export const currentLocale = (): Locale => normalizeLocale(i18n.language) ?? DEFAULT_LOCALE;

export default i18n;
