import { describe, expect, it, vi } from "vitest";

import type { LocaleStorage } from "./localeStorage";
import { readStoredLocale, storeLocale } from "./localeStorage";

const memoryStorage = (initial: Record<string, string> = {}): LocaleStorage & { values: Record<string, string> } => {
  const values: Record<string, string> = { ...initial };
  return {
    values,
    getItem: (key: string) => values[key] ?? null,
    setItem: (key: string, value: string) => {
      values[key] = value;
    },
  };
};

describe("locale storage", () => {
  it("defaults to Chinese when nothing is stored", () => {
    expect(readStoredLocale(memoryStorage())).toBe("zh");
  });

  it("returns the stored locale", () => {
    expect(readStoredLocale(memoryStorage({ litellm_locale: "en" }))).toBe("en");
  });

  it("ignores and falls back on an unsupported stored value", () => {
    expect(readStoredLocale(memoryStorage({ litellm_locale: "klingon" }))).toBe("zh");
  });

  it("normalizes a stored region tag", () => {
    expect(readStoredLocale(memoryStorage({ litellm_locale: "en-GB" }))).toBe("en");
  });

  it("persists the chosen locale under the shared key", () => {
    const storage = memoryStorage();
    storeLocale("en", storage);
    expect(storage.values["litellm_locale"]).toBe("en");
  });

  it("falls back to Chinese when reading throws", () => {
    const throwing: LocaleStorage = {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => undefined,
    };
    expect(readStoredLocale(throwing)).toBe("zh");
  });

  it("does not throw when writing fails", () => {
    const throwing: LocaleStorage = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
    };
    expect(() => storeLocale("en", throwing)).not.toThrow();
  });
});
