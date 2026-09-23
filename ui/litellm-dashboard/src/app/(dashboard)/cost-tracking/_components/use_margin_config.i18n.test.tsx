import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { useMarginConfig } from "./use_margin_config";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => ""),
  getGlobalLitellmHeaderName: vi.fn(() => "Authorization"),
}));

vi.mock("./provider_display_helpers", () => ({
  getProviderBackendValue: vi.fn((enumKey: string) => (enumKey === "OpenAI" ? "openai" : null)),
}));

vi.mock("@/components/provider_info_helpers", () => ({
  Providers: { OpenAI: "OpenAI" },
}));

const renderMarginHook = () =>
  renderHook(() => useMarginConfig({ accessToken: "test-token", t: i18n.getFixedT("zh", "costTracking") }));

const DEFAULT_MARGIN_PARAMS = {
  selectedProvider: "OpenAI",
  marginType: "percentage" as const,
  percentageValue: "10",
  fixedAmountValue: "",
};

const addMargin = (
  result: { current: ReturnType<typeof useMarginConfig> },
  params: Partial<Parameters<ReturnType<typeof useMarginConfig>["handleAddMargin"]>[0]>,
) =>
  act(async () => {
    await result.current.handleAddMargin({ ...DEFAULT_MARGIN_PARAMS, ...params });
  });

describe("useMarginConfig Chinese toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese fetch failure toast", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderMarginHook();

    await act(async () => {
      await result.current.fetchMarginConfig();
    });

    expect(toast.fromError).toHaveBeenCalledWith("获取加价配置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to fetch margin configuration");
  });

  it("renders the Chinese save success and failure toasts", async () => {
    const { result } = renderMarginHook();

    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({ values: {} }) } as Response);
    await act(async () => {
      await result.current.saveMarginConfig({ openai: 0.1 });
    });
    expect(toast.success).toHaveBeenCalledWith("加价配置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Margin configuration updated successfully");

    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    await act(async () => {
      await result.current.saveMarginConfig({ openai: 0.1 });
    });
    expect(toast.fromError).toHaveBeenCalledWith("更新设置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update settings");

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.saveMarginConfig({ openai: 0.1 });
    });
    expect(toast.fromError).toHaveBeenCalledWith("更新加价配置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update margin configuration");
  });

  it("renders the Chinese add-margin validation toasts", async () => {
    const { result } = renderMarginHook();

    await addMargin(result, { selectedProvider: undefined });
    expect(toast.fromError).toHaveBeenCalledWith("请选择提供商");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select a provider");

    await addMargin(result, { selectedProvider: "Unknown" });
    expect(toast.fromError).toHaveBeenCalledWith("选择的提供商无效");
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid provider selected");

    await addMargin(result, { percentageValue: "2000" });
    expect(toast.fromError).toHaveBeenCalledWith("百分比必须在 0% 到 1000% 之间");
    expect(toast.fromError).not.toHaveBeenCalledWith("Percentage must be between 0% and 1000%");

    await addMargin(result, { marginType: "fixed", fixedAmountValue: "-1" });
    expect(toast.fromError).toHaveBeenCalledWith("固定金额必须为非负数");
    expect(toast.fromError).not.toHaveBeenCalledWith("Fixed amount must be non-negative");
  });

  it("renders the Chinese duplicate margin toast for a named provider and for global", async () => {
    const { result } = renderMarginHook();

    act(() => {
      result.current.setMarginConfig({ openai: 0.1, global: 0.05 });
    });

    await addMargin(result, {});
    expect(toast.fromError).toHaveBeenCalledWith("OpenAI 的加价已存在。请在上方表格中编辑。");
    expect(toast.fromError).not.toHaveBeenCalledWith("Margin for OpenAI already exists. Edit it in the table above.");

    await addMargin(result, { selectedProvider: "global" });
    expect(toast.fromError).toHaveBeenCalledWith("全局 的加价已存在。请在上方表格中编辑。");
    expect(toast.fromError).not.toHaveBeenCalledWith("Margin for Global already exists. Edit it in the table above.");
  });
});
