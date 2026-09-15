import { describe, expect, it } from "vitest";

import i18n, { currentLocale } from "./index";

describe("i18next initialization", () => {
  it("is initialized synchronously so prerendered markup can be translated", () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it("defaults to Chinese when no preference is stored", () => {
    expect(currentLocale()).toBe("zh");
  });

  it("translates a common key", () => {
    expect(i18n.t("logout")).toBe("退出登录");
  });

  it("falls back to Chinese for an unsupported language", async () => {
    await i18n.changeLanguage("fr");
    expect(currentLocale()).toBe("zh");
    expect(i18n.t("logout")).toBe("退出登录");
    await i18n.changeLanguage("zh");
  });

  it("switches to English on request", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("logout")).toBe("Logout");
    await i18n.changeLanguage("zh");
  });
});
