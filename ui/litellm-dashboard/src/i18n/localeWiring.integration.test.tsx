import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface RecordedRequest {
  url: string;
  acceptLanguage: string | null;
}

const recordingFetch = (recorded: RecordedRequest[]): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(new URL(String(input), globalThis.location.origin), init);
    recorded.push({ url: request.url, acceptLanguage: request.headers.get("Accept-Language") });
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

const lastRequest = (recorded: RecordedRequest[]): RecordedRequest => recorded[recorded.length - 1];

describe("Accept-Language wiring", () => {
  const recorded: RecordedRequest[] = [];

  beforeEach(() => {
    recorded.length = 0;
    delete (globalThis as { __litellmLocaleFetchInstalled?: boolean }).__litellmLocaleFetchInstalled;
    vi.stubGlobal("fetch", recordingFetch(recorded));
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as { __litellmLocaleFetchInstalled?: boolean }).__litellmLocaleFetchInstalled;
  });

  it("carries the current locale through the shared client and through networking helpers", async () => {
    const { default: i18n, currentLocale } = await import("@/i18n");
    const { apiClient, getAgentCreateMetadata } = await import("@/components/networking");

    await i18n.changeLanguage("zh");
    await apiClient.get("/model_group/info");
    expect(currentLocale()).toBe("zh");
    expect(lastRequest(recorded).acceptLanguage).toBe("zh");

    await getAgentCreateMetadata();
    expect(lastRequest(recorded).acceptLanguage).toBe("zh");

    await apiClient.get("/model_group/info", { headers: { "Accept-Language": "fr" } });
    expect(lastRequest(recorded).acceptLanguage).toBe("fr");

    await i18n.changeLanguage("en");
    await apiClient.get("/model_group/info");
    expect(lastRequest(recorded).acceptLanguage).toBe("en");
  });
});
