import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, SUPPORTED_LOCALES, normalizeLocale } from "./config";

describe("locale config", () => {
  it("defaults to Chinese", () => {
    expect(DEFAULT_LOCALE).toBe("zh");
  });

  it("supports exactly Chinese and English", () => {
    expect(SUPPORTED_LOCALES).toEqual(["zh", "en"]);
  });

  it("uses a dedicated storage key", () => {
    expect(LOCALE_STORAGE_KEY).toBe("litellm_locale");
  });

  it("normalizes supported tags to their primary subtag", () => {
    expect(normalizeLocale("zh")).toBe("zh");
    expect(normalizeLocale("zh-CN")).toBe("zh");
    expect(normalizeLocale("zh-Hant-TW")).toBe("zh");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("EN")).toBe("en");
  });

  it("returns null for unsupported or empty values", () => {
    expect(normalizeLocale("fr-FR")).toBeNull();
    expect(normalizeLocale("")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
  });

  it("ignores surrounding whitespace", () => {
    expect(normalizeLocale("  zh-CN  ")).toBe("zh");
  });
});
