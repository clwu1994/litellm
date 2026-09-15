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
    expect(captured[0]?.headers["Accept-Language"]).toBe("en");
  });

  it("keeps a Request input's own headers while adding the locale", async () => {
    let seen: HeadersInit | undefined;
    const spy = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen = init?.headers;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const localized = createLocaleFetch(spy, () => "zh");
    await localized(new Request("http://x", { headers: { Authorization: "Bearer t" } }));
    const merged = new Headers(seen);
    expect(merged.get("Authorization")).toBe("Bearer t");
    expect(merged.get("Accept-Language")).toBe("zh");
  });

  it("does not override a Request input's own Accept-Language", async () => {
    let seen: HeadersInit | undefined;
    const spy = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen = init?.headers ?? (input instanceof Request ? input.headers : undefined);
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const localized = createLocaleFetch(spy, () => "zh");
    await localized(new Request("http://x", { headers: { "Accept-Language": "en" } }));
    expect(new Headers(seen).get("Accept-Language")).toBe("en");
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
