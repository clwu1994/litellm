export const SUPPORTED_LOCALES = ["zh", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh";

export const LOCALE_STORAGE_KEY = "litellm_locale";

const isLocale = (value: string): value is Locale => (SUPPORTED_LOCALES as readonly string[]).includes(value);

export const normalizeLocale = (value: string | null | undefined): Locale | null => {
  if (!value) return null;
  const primary = value.trim().toLowerCase().split("-")[0];
  return isLocale(primary) ? primary : null;
};
