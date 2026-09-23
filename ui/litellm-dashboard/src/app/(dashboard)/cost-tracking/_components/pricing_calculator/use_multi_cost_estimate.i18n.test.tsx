import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { useMultiCostEstimate } from "./use_multi_cost_estimate";
import type { ModelEntry } from "./types";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => ""),
  getGlobalLitellmHeaderName: vi.fn(() => "Authorization"),
}));

const entry: ModelEntry = { id: "entry-1", model: "gpt-4", input_tokens: 1000, output_tokens: 500 };

const renderEstimateHook = () =>
  renderHook(() => useMultiCostEstimate("token123", i18n.getFixedT("zh", "costTracking")));

describe("useMultiCostEstimate Chinese error copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese fallback when the API error carries no detail", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    const { result } = renderEstimateHook();

    await act(async () => {
      result.current.debouncedFetchForEntry(entry);
      await vi.runAllTimersAsync();
    });

    expect(result.current.getMultiModelResult([entry]).entries[0].error).toBe("估算成本失败");
    expect(result.current.getMultiModelResult([entry]).entries[0].error).not.toBe("Failed to estimate cost");
  });

  it("renders the Chinese network error when the fetch throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));
    const { result } = renderEstimateHook();

    await act(async () => {
      result.current.debouncedFetchForEntry(entry);
      await vi.runAllTimersAsync();
    });

    expect(result.current.getMultiModelResult([entry]).entries[0].error).toBe("网络错误");
    expect(result.current.getMultiModelResult([entry]).entries[0].error).not.toBe("Network error");
  });
});
