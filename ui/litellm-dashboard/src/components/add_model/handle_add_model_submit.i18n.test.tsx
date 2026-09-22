import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { handleAddModelSubmit, prepareModelAddRequest } from "./handle_add_model_submit";

const mockModelCreateCall = vi.fn();

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("../networking", () => ({
  modelCreateCall: (...args: unknown[]) => mockModelCreateCall(...args),
}));

const t = i18n.getFixedT(null, "models");

const validValues = {
  model_mappings: [{ public_name: "m", litellm_model: "m" }],
  model_name: "m",
};

describe("handleAddModelSubmit Chinese toasts", () => {
  beforeEach(async () => {
    mockModelCreateCall.mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese parse-failure toast and the Chinese create-failure toast for bad JSON", async () => {
    await prepareModelAddRequest({ ...validValues, litellm_extra_params: "not json" }, "token", null, t);

    expect(toast.fromError).toHaveBeenCalledWith(expect.stringContaining("解析 LiteLLM 额外参数失败："));
    expect(toast.fromError).toHaveBeenCalledWith(expect.stringContaining("解析 litellm_extra_params 失败："));
    expect(toast.fromError).toHaveBeenCalledWith(expect.stringContaining("创建模型失败："));
    expect(toast.fromError).not.toHaveBeenCalledWith(expect.stringContaining("Failed to parse LiteLLM Extra Params:"));
  });

  it("renders the Chinese add-failure toast when the create call rejects", async () => {
    mockModelCreateCall.mockRejectedValue(new Error("nope"));

    await handleAddModelSubmit({ ...validValues }, "token", { resetFields: vi.fn() }, { t });

    expect(toast.fromError).toHaveBeenCalledWith(expect.stringContaining("添加模型失败："));
    expect(toast.fromError).not.toHaveBeenCalledWith(expect.stringContaining("Failed to add model:"));
  });
});
