import { afterEach, describe, expect, it, vi } from "vitest";

import { deferToGlobalFetch } from "./globalFetch";

describe("deferToGlobalFetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the global fetch at call time, not at import time", async () => {
    const first = vi.fn(async () => new Response("first"));
    const second = vi.fn(async () => new Response("second"));

    vi.stubGlobal("fetch", first);
    expect(await (await deferToGlobalFetch("http://x")).text()).toBe("first");

    vi.stubGlobal("fetch", second);
    expect(await (await deferToGlobalFetch("http://x")).text()).toBe("second");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("forwards the caller's arguments", async () => {
    const seen: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        seen.push([input, init]);
        return new Response("{}");
      }),
    );

    await deferToGlobalFetch("http://x", { method: "POST" });

    expect(seen[0][0]).toBe("http://x");
    expect(seen[0][1]?.method).toBe("POST");
  });
});
