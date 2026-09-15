import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "@/contexts/LocaleProvider";

import i18n from "./bootstrapI18n";
import { LOCALE_STORAGE_KEY } from "./config";

const mapBackedStorage = (initial: Record<string, string>) => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const stubStoredLocale = (locale: string) => {
  vi.stubGlobal("localStorage", mapBackedStorage({ [LOCALE_STORAGE_KEY]: locale }));
  vi.stubGlobal("window", globalThis);
};

const Probe = () => {
  const { t } = useTranslation();
  return createElement("span", null, t("logout"));
};

describe("i18n hydration contract", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the module-load locale at the default when storage holds another one", async () => {
    stubStoredLocale("en");
    vi.resetModules();

    const { default: fresh } = await import("./bootstrapI18n");

    expect(fresh.language).toBe("zh");
  });

  it("renders Chinese on a server pass even when storage holds English", () => {
    stubStoredLocale("en");

    const html = renderToStaticMarkup(createElement(LocaleProvider, null, createElement(Probe)));

    expect(html).toContain("退出登录");
    expect(html).not.toContain("Logout");
  });
});
