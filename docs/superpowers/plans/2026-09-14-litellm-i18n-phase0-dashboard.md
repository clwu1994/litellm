# LiteLLM i18n Phase 0 (Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the LiteLLM Admin UI a working zh/en language switch, defaulting to Chinese, with the locale sent to the proxy as `Accept-Language` on every request.

**Architecture:** react-i18next, client-side only, with no route changes. This is forced by `output: "export"` in `next.config.mjs`: there is no Next.js server or middleware, so a `/[locale]` route segment would require restructuring 48 `page.tsx` files and the proxy's static hosting path logic. i18next initializes synchronously at module load so the prerendered HTML is already Chinese and default-locale users see no flash. A single global `fetch` wrapper injects the locale header, because the repo's "single HTTP client" invariant does not hold in practice.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.14, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md`
Depends on: `i18n/glossary.json` from Task 1 of the Python plan.

## Global Constraints

- Next.js is configured with `output: "export"`, `trailingSlash: true`, `assetPrefix: "/litellm-asset-prefix"`. Do not add a server, middleware, or a `[locale]` route segment
- Default locale is `zh`. Do not detect the browser language
- Never put LiteLLM tokens or API keys in `localStorage`. The locale preference is not a secret and may use it
- `src/lib/http/client.ts` is the only file allowed to call `fetch` directly, enforced by the `no-restricted-syntax` rule whose override covers `src/lib/http/**`. Put the fetch wrapper there
- Tests come in three tiers: `Foo.test.tsx` is a unit test, `Foo.integration.test.tsx` renders a real tree and stubs only the network, Playwright specs live in `tests/e2e/ui/`. `src/**/*.test.ts` runs in the node `unit` project, `src/**/*.test.tsx` in the jsdom `component` project
- Never run the full unit suite. Pass explicit paths
- Test only behavior a user could perceive, and precisely enough that the test fails when the behavior breaks
- Prefer querying by role, label, or `data-slot`. Never assert on a component library's CSS class when an accessible query exists
- `eslint-budgets.json` is a ceiling on existing violations, not a target. New code must add zero `any`, zero `console`, and zero other budgeted violations. Do not edit `eslint-budgets.json`
- `knip.json` treats unused exports as warnings, so extra exports are tolerated, but a new dependency must actually be imported
- Conventional commits, no attribution trailers

---

### Task 1: Dependencies, locale config, and preference storage

**Files:**
- Modify: `ui/litellm-dashboard/package.json`
- Modify: `ui/litellm-dashboard/package-lock.json`
- Create: `ui/litellm-dashboard/src/i18n/config.ts`
- Create: `ui/litellm-dashboard/src/i18n/localeStorage.ts`
- Test: `ui/litellm-dashboard/src/i18n/config.test.ts`
- Test: `ui/litellm-dashboard/src/i18n/localeStorage.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `SUPPORTED_LOCALES: readonly ["zh", "en"]`
  - `type Locale = "zh" | "en"`
  - `DEFAULT_LOCALE: Locale` equal to `"zh"`
  - `LOCALE_STORAGE_KEY: string` equal to `"litellm_locale"`
  - `normalizeLocale(value: string | null | undefined): Locale | null`
  - `type LocaleStorage = Pick<Storage, "getItem" | "setItem">`
  - `readStoredLocale(storage?: LocaleStorage): Locale`
  - `storeLocale(locale: Locale, storage?: LocaleStorage): void`

- [ ] **Step 1: Install the dependencies**

Run:

```bash
cd ui/litellm-dashboard && npm install --save-exact i18next@26.4.2 react-i18next@17.0.14
```

Expected: both packages appear in `package.json` dependencies with exact versions and `package-lock.json` is updated. If npm reports a cache permission error, rerun with `--cache /tmp/npm-cache`.

- [ ] **Step 2: Write the failing config tests**

Create `src/i18n/config.test.ts`:

```ts
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
```

Create `src/i18n/localeStorage.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run --project unit src/i18n/config.test.ts src/i18n/localeStorage.test.ts`
Expected: FAIL with "Failed to resolve import ./config"

- [ ] **Step 4: Implement config**

Create `src/i18n/config.ts`:

```ts
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
```

- [ ] **Step 5: Implement locale storage**

Create `src/i18n/localeStorage.ts`:

```ts
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
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run --project unit src/i18n/config.test.ts src/i18n/localeStorage.test.ts`
Expected: PASS, 13 passed

- [ ] **Step 7: Commit**

```bash
git add ui/litellm-dashboard/package.json ui/litellm-dashboard/package-lock.json ui/litellm-dashboard/src/i18n/
git commit -m "feat(ui): add i18n locale config and preference storage"
```

---

### Task 2: Translation resources and synchronous i18next initialization

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/locales/zh/common.json`
- Create: `ui/litellm-dashboard/src/i18n/locales/en/common.json`
- Create: `ui/litellm-dashboard/src/i18n/resources.ts`
- Create: `ui/litellm-dashboard/src/i18n/i18next.d.ts`
- Create: `ui/litellm-dashboard/src/i18n/index.ts`
- Test: `ui/litellm-dashboard/src/i18n/index.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LOCALE`, `normalizeLocale` from Task 1; `readStoredLocale` from Task 1
- Produces:
  - `resources` in `src/i18n/resources.ts`, shape `{ zh: { common: ... }, en: { common: ... } }`
  - default export `i18n` from `src/i18n/index.ts`, an initialized `i18next` instance
  - `currentLocale(): Locale` exported from `src/i18n/index.ts`

Note: `initAsync: false` is required for synchronous initialization so the static export prerenders Chinese. `initImmediate` does not exist in i18next 26 and would silently leave initialization async. `react.useSuspense` defaults to `true`, which would demand a Suspense boundary during prerender, so it is disabled.

- [ ] **Step 1: Write the shared translation files**

Create `src/i18n/locales/zh/common.json`:

```json
{
  "language": "语言",
  "languageZh": "中文",
  "languageEn": "English",
  "logout": "退出登录"
}
```

Create `src/i18n/locales/en/common.json`:

```json
{
  "language": "Language",
  "languageZh": "中文",
  "languageEn": "English",
  "logout": "Logout"
}
```

- [ ] **Step 2: Write the failing initialization test**

Create `src/i18n/index.test.ts`:

```ts
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
    await i18n.changeLanguage("zh");
  });

  it("switches to English on request", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("logout")).toBe("Logout");
    await i18n.changeLanguage("zh");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run --project unit src/i18n/index.test.ts`
Expected: FAIL with "Failed to resolve import ./index"

- [ ] **Step 4: Implement resources and initialization**

Create `src/i18n/resources.ts`:

```ts
import enCommon from "./locales/en/common.json";
import zhCommon from "./locales/zh/common.json";

export const resources = {
  en: { common: enCommon },
  zh: { common: zhCommon },
};
```

Create `src/i18n/i18next.d.ts`:

```ts
import type zhCommon from "./locales/zh/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof zhCommon;
    };
  }
}
```

Chinese is the source of truth for key typing, so a key that exists only in `en` is a compile error.

Create `src/i18n/bootstrapI18n.ts`:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./config";
import { readStoredLocale } from "./localeStorage";
import { resources } from "./resources";

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  interpolation: { escapeValue: false },
  initAsync: false,
  returnNull: false,
  react: { useSuspense: false },
});

export const currentLocale = (): Locale => normalizeLocale(i18n.language) ?? DEFAULT_LOCALE;

export default i18n;
```

Create `src/i18n/index.ts`:

```ts
import i18n, { currentLocale } from "./bootstrapI18n";

export { currentLocale };
export default i18n;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run --project unit src/i18n/index.test.ts`
Expected: PASS, 5 passed

- [ ] **Step 6: Verify the key type augmentation has teeth**

Temporarily change `i18n.t("logout")` in `src/i18n/index.test.ts` to `i18n.t("logoutTypo")`, then run:

```bash
cd ui/litellm-dashboard && npx tsc --noEmit -p tsconfig.json
```

Expected: a type error naming `logoutTypo`. Revert the change. If `tsc` reports no error, the augmentation is not being picked up: confirm `src/i18n/i18next.d.ts` is inside the `include` globs in `tsconfig.json` and that `resolveJsonModule` is true (it is).

- [ ] **Step 7: Commit**

```bash
git add ui/litellm-dashboard/src/i18n/
git commit -m "feat(ui): add zh/en resources and synchronous i18next init"
```

---

### Task 3: Global locale-aware fetch wrapper

**Files:**
- Create: `ui/litellm-dashboard/src/lib/http/localeFetch.ts`
- Test: `ui/litellm-dashboard/src/lib/http/localeFetch.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `LOCALE_HEADER: string` equal to `"Accept-Language"`
  - `interface FetchHost { fetch: typeof fetch }`
  - `createLocaleFetch(originalFetch: typeof fetch, getLocale: () => string): typeof fetch`
  - `installLocaleFetch(host: FetchHost, getLocale: () => string): void`, idempotent per host

Rationale, from the design spec: `src/lib/http/client.ts` claims to be the only `fetch` caller, but `eslint-suppressions.json` carries 205 grandfathered `no-restricted-syntax` exemptions across 39 files, 150 of them in `src/components/networking.tsx`, and the lint selector only matches a bare `fetch(` identifier. A wrapper installed on the global object is the only single point that covers all of them.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/http/localeFetch.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createLocaleFetch, installLocaleFetch } from "./localeFetch";

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
}

const headerRecord = (headers: HeadersInit | undefined): Record<string, string> => {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
};

const recordingFetch = (captured: CapturedRequest[]) =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({ url: String(input), headers: headerRecord(init?.headers) });
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

describe("createLocaleFetch", () => {
  it("adds Accept-Language when the caller did not set one", async () => {
    const captured: CapturedRequest[] = [];
    const localized = createLocaleFetch(recordingFetch(captured), () => "zh");
    await localized("http://localhost/key/generate");
    expect(captured[0]?.headers["Accept-Language"]).toBe("zh");
  });

  it("respects an explicit caller value instead of overwriting it", async () => {
    const captured: CapturedRequest[] = [];
    const localized = createLocaleFetch(recordingFetch(captured), () => "zh");
    await localized("http://x", { headers: { "Accept-Language": "en" } });
    expect(captured[0]?.headers["Accept-Language"]).toBe("en");
  });

  it("detects the header case-insensitively on a plain object", async () => {
    const captured: CapturedRequest[] = [];
    const localized = createLocaleFetch(recordingFetch(captured), () => "zh");
    await localized("http://x", { headers: { "accept-language": "en" } });
    expect(captured[0]?.headers["accept-language"]).toBe("en");
    expect(captured[0]?.headers["Accept-Language"]).toBeUndefined();
  });

  it("detects the header when caller passes a Headers instance", async () => {
    const captured: CapturedRequest[] = [];
    const localized = createLocaleFetch(recordingFetch(captured), () => "zh");
    await localized("http://x", { headers: new Headers({ "Accept-Language": "en" }) });
    expect(captured[0]?.headers["accept-language"]).toBe("en");
  });

  it("detects the header when caller passes an array of pairs", async () => {
    const captured: CapturedRequest[] = [];
    const localized = createLocaleFetch(recordingFetch(captured), () => "zh");
    await localized("http://x", { headers: [["Accept-Language", "en"]] });
    expect(captured[0]?.headers["accept-language"]).toBe("en");
  });

  it("reads the locale at call time so a language switch takes effect immediately", async () => {
    const captured: CapturedRequest[] = [];
    let locale = "zh";
    const localized = createLocaleFetch(recordingFetch(captured), () => locale);
    await localized("http://x");
    locale = "en";
    await localized("http://x");
    expect(captured[0]?.headers["Accept-Language"]).toBe("zh");
    expect(captured[1]?.headers["Accept-Language"]).toBe("en");
  });

  it("preserves the rest of the request init", async () => {
    const captured: CapturedRequest[] = [];
    let receivedBody: BodyInit | null | undefined;
    const spy = (async (input: RequestInfo | URL, init?: RequestInit) => {
      captured.push({ url: String(input), headers: headerRecord(init?.headers) });
      receivedBody = init?.body;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const localized = createLocaleFetch(spy, () => "zh");
    await localized("http://x", { method: "POST", body: JSON.stringify({ a: 1 }) });
    expect(receivedBody).toBe('{"a":1}');
  });
});

describe("installLocaleFetch", () => {
  it("patches the host fetch and is idempotent", async () => {
    const captured: CapturedRequest[] = [];
    const host = { fetch: recordingFetch(captured) };
    installLocaleFetch(host, () => "zh");
    installLocaleFetch(host, () => "en");
    await host.fetch("http://x");
    expect(captured[0]?.headers["Accept-Language"]).toBe("zh");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run --project unit src/lib/http/localeFetch.test.ts`
Expected: FAIL with "Failed to resolve import ./localeFetch"

- [ ] **Step 3: Implement the wrapper**

Create `src/lib/http/localeFetch.ts`:

```ts
export const LOCALE_HEADER = "Accept-Language";

const INSTALL_MARKER = "__litellmLocaleFetchInstalled";

export interface FetchHost {
  fetch: typeof fetch;
  [INSTALL_MARKER]?: boolean;
}

const headerPresent = (headers: HeadersInit | undefined, name: string): boolean => {
  if (!headers) return false;
  const target = name.toLowerCase();
  if (headers instanceof Headers) return headers.has(name);
  if (Array.isArray(headers)) return headers.some(([key]) => key.toLowerCase() === target);
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
};

const withLocaleHeader = (headers: HeadersInit | undefined, value: string): HeadersInit => {
  if (headers instanceof Headers) {
    const next = new Headers(headers);
    next.set(LOCALE_HEADER, value);
    return next;
  }
  if (Array.isArray(headers)) return [...headers, [LOCALE_HEADER, value]];
  return { ...(headers ?? {}), [LOCALE_HEADER]: value };
};

export const createLocaleFetch = (originalFetch: typeof fetch, getLocale: () => string): typeof fetch => {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (headerPresent(init?.headers, LOCALE_HEADER)) return originalFetch(input, init);
    return originalFetch(input, { ...init, headers: withLocaleHeader(init?.headers, getLocale()) });
  };
};

export const installLocaleFetch = (host: FetchHost, getLocale: () => string): void => {
  if (host[INSTALL_MARKER]) return;
  host[INSTALL_MARKER] = true;
  const original = host.fetch;
  host.fetch = createLocaleFetch((input, init) => original(input, init), getLocale);
};
```

The marker is what makes a second install a no-op, so a later caller cannot silently re-wrap and shadow the first locale getter.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run --project unit src/lib/http/localeFetch.test.ts`
Expected: PASS, 8 passed

- [ ] **Step 5: Install the wrapper at i18n module load**

Replace the body of `src/i18n/index.ts` with:

```ts
import { installLocaleFetch } from "@/lib/http/localeFetch";

import i18n, { currentLocale } from "./bootstrapI18n";

export { currentLocale };
export default i18n;

if (typeof window !== "undefined") {
  installLocaleFetch(globalThis, currentLocale);
}
```

`src/i18n/index.ts` is imported by `LocaleProvider`, which the root layout renders, so installation happens during client module evaluation and before any component can issue a request. The `typeof window` guard keeps server-side prerender from patching Node's global fetch.

- [ ] **Step 6: Confirm the earlier i18n test still passes**

Run: `npx vitest run --project unit src/i18n/index.test.ts src/lib/http/localeFetch.test.ts`
Expected: PASS. In the node test project `window` is undefined, so the install is skipped and no global is patched.

- [ ] **Step 7: Commit**

```bash
git add ui/litellm-dashboard/src/lib/http/localeFetch.ts ui/litellm-dashboard/src/lib/http/localeFetch.test.ts ui/litellm-dashboard/src/i18n/index.ts
git commit -m "feat(ui): inject Accept-Language on every dashboard request"
```

---

### Task 4: Locale provider and hook

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/useLocale.ts`
- Create: `ui/litellm-dashboard/src/contexts/LocaleProvider.tsx`
- Modify: `ui/litellm-dashboard/src/app/layout.tsx`
- Test: `ui/litellm-dashboard/src/contexts/LocaleProvider.test.tsx`

**Interfaces:**
- Consumes: `DEFAULT_LOCALE`, `normalizeLocale`, `Locale` from Task 1; `storeLocale` from Task 1; default `i18n` from Task 2
- Produces:
  - `interface LocaleControls { locale: Locale; setLocale: (next: Locale) => void }`
  - `useLocale(): LocaleControls`
  - `LocaleProvider({ children }: { children: ReactNode })`

- [ ] **Step 1: Write the failing test**

Create `src/contexts/LocaleProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";
import { useLocale } from "@/i18n/useLocale";

import { LocaleProvider } from "./LocaleProvider";

const Probe = () => {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="logout">{t("logout")}</span>
      <button type="button" onClick={() => setLocale("en")}>
        switch
      </button>
    </div>
  );
};

const renderProbe = () =>
  render(
    <LocaleProvider>
      <Probe />
    </LocaleProvider>,
  );

describe("LocaleProvider", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage("zh");
    document.documentElement.lang = "";
  });

  it("stamps the document language with the default locale", async () => {
    renderProbe();
    expect(await screen.findByTestId("locale")).toHaveTextContent("zh");
    expect(document.documentElement.lang).toBe("zh");
  });

  it("renders Chinese copy by default", async () => {
    renderProbe();
    expect(await screen.findByTestId("logout")).toHaveTextContent("退出登录");
  });

  it("switches, persists, and updates the document language", async () => {
    renderProbe();
    await userEvent.click(await screen.findByRole("button", { name: "switch" }));
    expect(await screen.findByTestId("logout")).toHaveTextContent("Logout");
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("honours a stored preference on mount", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en");
    await i18n.changeLanguage("en");
    renderProbe();
    expect(await screen.findByTestId("logout")).toHaveTextContent("Logout");
    expect(document.documentElement.lang).toBe("en");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --project component src/contexts/LocaleProvider.test.tsx`
Expected: FAIL with "Failed to resolve import @/i18n/useLocale"

- [ ] **Step 3: Implement the hook**

Create `src/i18n/useLocale.ts`:

```ts
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
```

- [ ] **Step 4: Implement the provider**

Create `src/contexts/LocaleProvider.tsx`:

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "@/i18n";
import { useLocale } from "@/i18n/useLocale";

const HtmlLangSync = () => {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
};

export const LocaleProvider = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <HtmlLangSync />
    {children}
  </I18nextProvider>
);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run --project component src/contexts/LocaleProvider.test.tsx`
Expected: PASS, 4 passed

- [ ] **Step 6: Wire the provider into the root layout**

In `src/app/layout.tsx`, change the hardcoded language to Chinese:

```tsx
    <html lang="zh" suppressHydrationWarning>
```

and wrap the tree in `LocaleProvider`:

```tsx
      <body className={inter.className}>
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <NuqsAdapter>
              <ReactQueryProvider>
                <AuthProvider>{children}</AuthProvider>
                <Toaster />
              </ReactQueryProvider>
            </NuqsAdapter>
          </ThemeProvider>
        </LocaleProvider>
      </body>
```

Add `import { LocaleProvider } from "@/contexts/LocaleProvider";` alongside the other imports.

- [ ] **Step 7: Run the existing layout test**

Run: `npx vitest run --project component src/app/\(dashboard\)/layout.test.tsx`
Expected: PASS. If it fails because a provider is now missing elsewhere, re-run with the specific failing path and fix the wrapper rather than the assertion.

- [ ] **Step 8: Commit**

```bash
git add ui/litellm-dashboard/src/i18n/useLocale.ts ui/litellm-dashboard/src/contexts/LocaleProvider.tsx ui/litellm-dashboard/src/app/layout.tsx
git commit -m "feat(ui): add LocaleProvider and locale hook"
```

---

### Task 5: Language switcher in the account menu

**Files:**
- Create: `ui/litellm-dashboard/src/components/Navbar/UserDropdown/LanguageSwitcher.tsx`
- Modify: `ui/litellm-dashboard/src/components/Navbar/UserDropdown/UserDropdown.tsx`
- Test: `ui/litellm-dashboard/src/components/Navbar/UserDropdown/LanguageSwitcher.test.tsx`

**Interfaces:**
- Consumes: `SUPPORTED_LOCALES`, `normalizeLocale`, `Locale` from Task 1; `useLocale` from Task 4; default `i18n` from Task 2
- Produces: default export `LanguageSwitcher`, a self-contained control that needs `I18nextProvider` from `LocaleProvider` above it

- [ ] **Step 1: Write the failing test**

Create `src/components/Navbar/UserDropdown/LanguageSwitcher.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it } from "vitest";

import { LocaleProvider } from "@/contexts/LocaleProvider";
import i18n from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";

import LanguageSwitcher from "./LanguageSwitcher";

const Probe = () => {
  const { t } = useTranslation();
  return <span data-testid="probe">{t("logout")}</span>;
};

const renderSwitcher = () =>
  render(
    <LocaleProvider>
      <LanguageSwitcher />
      <Probe />
    </LocaleProvider>,
  );

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await i18n.changeLanguage("zh");
  });

  it("offers Chinese and English and selects Chinese by default", async () => {
    renderSwitcher();
    const select = await screen.findByRole("combobox", { name: "语言" });
    expect(select).toHaveValue("zh");
    expect(screen.getByRole("option", { name: "中文" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
  });

  it("switches the whole tree to English and persists the choice", async () => {
    renderSwitcher();
    await userEvent.selectOptions(await screen.findByRole("combobox", { name: "语言" }), "en");
    expect(await screen.findByTestId("probe")).toHaveTextContent("Logout");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run --project component src/components/Navbar/UserDropdown/LanguageSwitcher.test.tsx`
Expected: FAIL with "Failed to resolve import ./LanguageSwitcher"

- [ ] **Step 3: Implement the switcher**

Create `src/components/Navbar/UserDropdown/LanguageSwitcher.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run --project component src/components/Navbar/UserDropdown/LanguageSwitcher.test.tsx`
Expected: PASS, 2 passed

- [ ] **Step 5: Mount it in the account menu and localize the logout label**

In `src/components/Navbar/UserDropdown/UserDropdown.tsx`, add the import:

```tsx
import { useTranslation } from "react-i18next";

import LanguageSwitcher from "./LanguageSwitcher";
```

Inside the component, add `const { t } = useTranslation();` next to the existing hooks, then in the `PopoverContent` insert the switcher between the separator and the logout button, and replace the hardcoded label:

```tsx
        <Separator />
        <LanguageSwitcher />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        >
          <LogOut className="size-4" />
          {t("logout")}
        </button>
```

- [ ] **Step 6: Run the existing account menu tests**

Run: `npx vitest run --project component src/components/Navbar/UserDropdown/UserDropdown.test.tsx`
Expected: PASS. Any assertion that queried the literal text `Logout` needs to query by role and accessible name instead, or wrap the test in `LocaleProvider` so the default Chinese copy is rendered. Fix the test, not the component.

- [ ] **Step 7: Commit**

```bash
git add ui/litellm-dashboard/src/components/Navbar/UserDropdown/
git commit -m "feat(ui): add language switcher to the account menu"
```

---

### Task 6: Pin the test environment to English

**Files:**
- Modify: `ui/litellm-dashboard/tests/setupTests.ts`

**Interfaces:**
- Consumes: default `i18n` from Task 2
- Produces: no new exports; the whole jsdom suite runs in English so the 796 pre-existing test files that assert English copy keep passing

Without this, the default locale flip to Chinese would break a large number of existing assertions. This step keeps the suite green while preserving the Chinese production default.

Scope note: in Phase 0 the only localized UI is the account menu, and its tests set the language themselves, so this pin has no observable effect yet. It is a safeguard that Phase 1 to N depend on, and Task 7 of this plan is what gives it teeth later. Verify it does not break the suite, but do not expect it to change any Phase 0 test outcome.

- [ ] **Step 1: Record the baseline for a representative existing test**

Run: `npx vitest run --project component src/app/\(dashboard\)/ui-theme/UIThemeSettings.test.tsx`
Expected: PASS. This file asserts English copy and is the canary for the locale default.

- [ ] **Step 2: Add the locale pin**

In `tests/setupTests.ts`, add these imports at the top:

```ts
import { beforeAll } from "vitest";

import i18n from "@/i18n";
```

and add this block next to the existing `afterEach` registration:

```ts
beforeAll(async () => {
  await i18n.changeLanguage("en");
});
```

- [ ] **Step 3: Run the language switcher test to confirm it still passes**

Run: `npx vitest run --project component src/components/Navbar/UserDropdown/LanguageSwitcher.test.tsx src/contexts/LocaleProvider.test.tsx`
Expected: PASS. Both tests set their own language in `beforeEach`, so the English pin must not leak into them. If either fails, the failing test's `beforeEach` is missing an explicit `changeLanguage`.

- [ ] **Step 4: Run the two suites that touch the account menu**

Run: `npx vitest run --project component src/components/Navbar/UserDropdown/UserDropdown.test.tsx src/components/navbar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add ui/litellm-dashboard/tests/setupTests.ts
git commit -m "test(ui): pin the dashboard test environment to English"
```

---

### Task 7: Key parity, glossary enforcement, and the lint backstop

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/localeParity.test.ts`
- Create: `ui/litellm-dashboard/src/i18n/glossary.test.ts`
- Modify: `ui/litellm-dashboard/eslint.config.mjs`

**Interfaces:**
- Consumes: `resources` from Task 2; `i18n/glossary.json` from Task 1 of the Python plan
- Produces: no runtime exports; three CI guarantees

- [ ] **Step 1: Write the failing parity test**

Create `src/i18n/localeParity.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { resources } from "./resources";

const flatten = (value: unknown, prefix = ""): string[] => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
};

const leafStrings = (value: unknown, prefix = ""): Array<{ key: string; value: string }> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [{ key: prefix, value: String(value) }];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafStrings(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("locale files", () => {
  it("define exactly the same keys in Chinese and English", () => {
    expect(flatten(resources.en).sort()).toEqual(flatten(resources.zh).sort());
  });

  it("define no empty strings", () => {
    const empties = leafStrings(resources.zh)
      .filter(({ value }) => value.trim() === "")
      .map(({ key }) => key);
    expect(empties).toEqual([]);
  });
});
```

- [ ] **Step 2: Write the failing glossary test**

Create `src/i18n/glossary.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { resources } from "./resources";

type Glossary = Record<string, string[]>;

const glossaryPath = resolve(process.cwd(), "../../i18n/glossary.json");
const glossary: Glossary = JSON.parse(readFileSync(glossaryPath, "utf-8"));

const squeeze = (value: string): string => value.replace(/\s+/g, "");

const leafPairs = (): Array<{ key: string; zh: string; en: string }> => {
  const collect = (value: unknown, prefix: string): Array<{ key: string; value: string }> => {
    if (typeof value === "object" && value !== null) {
      return Object.entries(value).flatMap(([key, child]) => collect(child, prefix ? `${prefix}.${key}` : key));
    }
    return [{ key: prefix, value: String(value) }];
  };
  const en = new Map(collect(resources.en, "").map(({ key, value }) => [key, value]));
  return collect(resources.zh, "").map(({ key, value }) => ({ key, zh: value, en: en.get(key) ?? "" }));
};

describe("glossary enforcement", () => {
  it("reads the single source of truth from the repo root", () => {
    expect(Object.keys(glossary).length).toBeGreaterThan(0);
  });

  it("keeps technical terms in English in every Chinese string", () => {
    const violations: string[] = [];
    for (const { key, zh, en } of leafPairs()) {
      for (const [term, bannedList] of Object.entries(glossary)) {
        if (!squeeze(en).includes(squeeze(term))) continue;
        for (const banned of bannedList) {
          if (squeeze(zh).includes(squeeze(banned))) {
            violations.push(`${key}: ${term} must stay in English but found ${banned}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
```

The check is contextual: a term is only enforced when the English source actually uses it, so a generic use of `key` in a non-API sense is not flagged.

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx vitest run --project unit src/i18n/localeParity.test.ts src/i18n/glossary.test.ts`
Expected: PASS, 4 passed. If the glossary test fails because `i18n/glossary.json` is missing, complete Task 1 of the Python plan first.

- [ ] **Step 4: Prove the parity test has teeth**

Temporarily delete the `"logout"` entry from `src/i18n/locales/en/common.json` and rerun:

Run: `npx vitest run --project unit src/i18n/localeParity.test.ts`
Expected: FAIL, reporting `common.logout` as an extra Chinese key. Restore the entry.

- [ ] **Step 5: Prove the glossary test has teeth**

Temporarily add `"tokenLabel": "Token"` to `src/i18n/locales/en/common.json` and `"tokenLabel": "令牌"` to `src/i18n/locales/zh/common.json`, then run:

Run: `npx vitest run --project unit src/i18n/glossary.test.ts`
Expected: FAIL, reporting that `Token` must stay in English but `令牌` was found in `common.tokenLabel`. Revert both files afterwards.

Note that the parity test will also fail while the temporary key is present in both files, which is expected; only the glossary failure is the signal here.

- [ ] **Step 6: Extend the lint selector to close the fetch bypass**

In `eslint.config.mjs`, find the `no-restricted-syntax` rule with the selector `CallExpression[callee.name='fetch']` and replace that single selector entry with three, keeping the same message:

```js
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            "Raw fetch() is only allowed in src/lib/http/. Use the shared client (createApiClient / apiClient) from @/lib/http/client instead.",
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='fetch']",
          message:
            "Raw fetch() is only allowed in src/lib/http/. Use the shared client (createApiClient / apiClient) from @/lib/http/client instead.",
        },
        {
          selector: "CallExpression[callee.object.name='globalThis'][callee.property.name='fetch']",
          message:
            "Raw fetch() is only allowed in src/lib/http/. Use the shared client (createApiClient / apiClient) from @/lib/http/client instead.",
        },
```

- [ ] **Step 7: Confirm the lint change adds no new violations**

Run: `npx eslint . 2>&1 | tail -20`
Expected: no `no-restricted-syntax` errors outside `src/lib/http/**`. The only `globalThis.fetch` call site, `src/lib/http/api.ts`, is inside the directory whose override disables the rule.

- [ ] **Step 8: Commit**

```bash
git add ui/litellm-dashboard/src/i18n/localeParity.test.ts ui/litellm-dashboard/src/i18n/glossary.test.ts ui/litellm-dashboard/eslint.config.mjs
git commit -m "test(ui): enforce locale key parity and technical-term glossary"
```

---

### Task 8: Verify the static export

**Files:**
- No source changes. This task produces evidence.

**Interfaces:**
- Consumes: everything from Tasks 1 to 7
- Produces: proof that the shipped static bundle is Chinese by default

- [ ] **Step 1: Build the dashboard**

Run:

```bash
cd ui/litellm-dashboard && npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 2: Prove the static export declares Chinese**

Run:

```bash
cd ui/litellm-dashboard && grep -rl 'lang="zh"' out | head -3 && grep -rl "退出登录" out/_next/static/chunks | head -3
```

Expected: both commands print at least one file. The first is the exported document language; the second confirms the Chinese catalog is bundled into the shipped chunks.

Important scope limit: Phase 0 does not localize any unconditionally-visible element, because the only localized UI is inside the account menu popover, whose contents are not part of the prerendered HTML. So an HTML text grep for a Chinese string is not a valid check here. The no-flash claim rests on two things that are checkable: `initAsync: false` is asserted by the initialization test in Task 2, and the exported document declares `lang="zh"`. Localizing the login page heading should be the first item of Phase 1 precisely so a HTML text grep becomes possible.

- [ ] **Step 3: Prove English is also shipped**

Run:

```bash
cd ui/litellm-dashboard && grep -rl "Logout" out/_next/static/chunks | head -3
```

Expected: at least one chunk contains `Logout`, confirming the English catalog is bundled and the switch is functional.

- [ ] **Step 4: Confirm the switcher renders Chinese in a running dashboard**

Run:

```bash
cd ui/litellm-dashboard && npm run dev
```

Open `http://localhost:3000`, log in, click the account menu in the top right, and confirm the language row reads `语言` with `中文` selected. Switch it to `English` and confirm the logout row changes to `Logout`, then reload and confirm the choice persisted. This is the user-visible proof that the switch works end to end; the build greps above only prove the catalogs shipped.

- [ ] **Step 5: Run the touched test files one more time**

Run:

```bash
cd ui/litellm-dashboard && npx vitest run --project unit src/i18n src/lib/http/localeFetch.test.ts && npx vitest run --project component src/contexts/LocaleProvider.test.tsx src/components/Navbar/UserDropdown/
```

Expected: PASS

- [ ] **Step 6: Record the evidence**

Capture the build output, the grep results, the browser observation from Step 4, and the test output into the PR description. A passing build alone is not evidence that the language switch works.

---

## Self-Review Notes

Coverage against the design spec:

- Section 6.1 library choice: Task 1 installs react-i18next, no route changes anywhere
- Section 6.2 directory structure: Tasks 1, 2, 3, 4, 5 create exactly those modules, with the fetch wrapper placed under `src/lib/http/` because the lint override scopes `fetch` there
- Section 6.3 sync initialization and no flash: Task 2 (`initAsync: false`, `useSuspense: false`), Task 8 Steps 2 and 3
- Section 6.4 persistence and storage failure handling: Task 1 tests
- Section 6.5 global injection, idempotency, caller precedence, three `HeadersInit` shapes, lint backstop: Task 3 tests and Task 7 Step 6
- Section 6.6 switcher placement: Task 5
- Section 6.7 namespace and key conventions: Task 2 uses the `common` namespace with semantic keys
- Section 8.1 tests: key parity and glossary in Task 7, provider behavior in Task 4, fetch injection in Task 3, English-pinned suite in Task 6
- Section 9 Phase 0 dashboard scope: Tasks 1 to 8

Deliberately deferred, per the spec's non-goals and phasing: extracting strings for every route area (Phase 1 to N), date and number formatting via `Intl`, type-safe key usage beyond the `common` namespace, and the WebSocket locale gap.
