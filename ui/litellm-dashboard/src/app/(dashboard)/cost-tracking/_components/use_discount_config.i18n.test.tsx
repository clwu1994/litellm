import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { useDiscountConfig } from "./use_discount_config";

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

const renderDiscountHook = () =>
  renderHook(() => useDiscountConfig({ accessToken: "test-token", t: i18n.getFixedT("zh", "costTracking") }));

describe("useDiscountConfig Chinese toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese fetch failure toast", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderDiscountHook();

    await act(async () => {
      await result.current.fetchDiscountConfig();
    });

    expect(toast.fromError).toHaveBeenCalledWith("获取折扣配置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to fetch discount configuration");
  });

  it("renders the Chinese save success and failure toasts", async () => {
    const { result } = renderDiscountHook();

    vi.spyOn(global, "fetch").mockResolvedValue({ ok: true, json: async () => ({ values: {} }) } as Response);
    await act(async () => {
      await result.current.saveDiscountConfig({ openai: 0.05 });
    });
    expect(toast.success).toHaveBeenCalledWith("折扣配置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Discount configuration updated successfully");

    vi.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    await act(async () => {
      await result.current.saveDiscountConfig({ openai: 0.05 });
    });
    expect(toast.fromError).toHaveBeenCalledWith("更新设置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update settings");

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.saveDiscountConfig({ openai: 0.05 });
    });
    expect(toast.fromError).toHaveBeenCalledWith("更新折扣配置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update discount configuration");
  });

  it("renders the Chinese add-provider validation toasts", async () => {
    const { result } = renderDiscountHook();

    await act(async () => {
      await result.current.handleAddProvider(undefined, "");
    });
    expect(toast.fromError).toHaveBeenCalledWith("请选择提供商并输入折扣百分比");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select a provider and enter discount percentage");

    await act(async () => {
      await result.current.handleAddProvider("OpenAI", "200");
    });
    expect(toast.fromError).toHaveBeenCalledWith("折扣必须在 0% 到 100% 之间");
    expect(toast.fromError).not.toHaveBeenCalledWith("Discount must be between 0% and 100%");

    await act(async () => {
      await result.current.handleAddProvider("Unknown", "5");
    });
    expect(toast.fromError).toHaveBeenCalledWith("选择的提供商无效");
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid provider selected");
  });

  it("renders the Chinese duplicate discount toast", async () => {
    const { result } = renderDiscountHook();

    act(() => {
      result.current.setDiscountConfig({ openai: 0.05 });
    });

    await act(async () => {
      await result.current.handleAddProvider("OpenAI", "5");
    });

    expect(toast.fromError).toHaveBeenCalledWith("OpenAI 的折扣已存在。请在上方表格中编辑。");
    expect(toast.fromError).not.toHaveBeenCalledWith("Discount for OpenAI already exists. Edit it in the table above.");
  });
});
