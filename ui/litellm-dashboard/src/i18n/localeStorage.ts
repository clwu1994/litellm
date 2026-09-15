import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale, type Locale } from "./config";

export type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

const resolveStorage = (): LocaleStorage | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const readStoredLocale = (storage: LocaleStorage | undefined = resolveStorage()): Locale => {
  if (!storage) return DEFAULT_LOCALE;
  try {
    return normalizeLocale(storage.getItem(LOCALE_STORAGE_KEY)) ?? DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

export const storeLocale = (locale: Locale, storage: LocaleStorage | undefined = resolveStorage()): void => {
  if (!storage) return;
  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    return;
  }
};
