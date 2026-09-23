import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { useBlockUnpricedConfig } from "./use_block_unpriced_config";

vi.mock("@/components/networking", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from "@/components/networking";

const renderBlockHook = () =>
  renderHook(() => useBlockUnpricedConfig({ accessToken: "test-token", t: i18n.getFixedT("zh", "costTracking") }));

describe("useBlockUnpricedConfig Chinese toasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese enable and disable toasts", async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ enabled: true });
    const { result } = renderBlockHook();

    await act(async () => {
      await result.current.setBlockUnpriced(true);
    });
    expect(toast.success).toHaveBeenCalledWith("现在将阻止没有定价的模型请求");
    expect(toast.success).not.toHaveBeenCalledWith("Requests for models without pricing will now be blocked");

    vi.mocked(apiClient.patch).mockResolvedValueOnce({ enabled: false });
    await act(async () => {
      await result.current.setBlockUnpriced(false);
    });
    expect(toast.success).toHaveBeenCalledWith("现在允许没有定价的模型请求");
    expect(toast.success).not.toHaveBeenCalledWith("Requests for models without pricing are now allowed");
  });
});
