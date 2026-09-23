import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import type { MessageType } from "../chat_ui/types";
import { makeOpenAIResponsesRequest } from "./responses_api";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
}));

const mockResponsesCreate = vi.fn();
const mockClient = { responses: { create: mockResponsesCreate } };

vi.mock("openai", () => ({
  default: {
    OpenAI: vi.fn(function () {
      return mockClient;
    }),
  },
}));

const messages: MessageType[] = [{ role: "user", content: "Hello" }];

describe("responses_api Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("throws the Chinese Virtual Key error and hides the English", async () => {
    await expect(makeOpenAIResponsesRequest(messages, vi.fn(), "gpt-4", null)).rejects.toThrow("需要 Virtual Key");
    await expect(makeOpenAIResponsesRequest(messages, vi.fn(), "gpt-4", null)).rejects.not.toThrow(
      "Virtual Key is required",
    );
  });

  it("throws the Chinese model-required error and hides the English", async () => {
    await expect(makeOpenAIResponsesRequest(messages, vi.fn(), "  ", "test-token")).rejects.toThrow(
      "需要模型。发送请求前请先选择一个模型。",
    );
    await expect(makeOpenAIResponsesRequest(messages, vi.fn(), "  ", "test-token")).rejects.not.toThrow(
      "Model is required. Please select a model before sending a request.",
    );
  });

  it("toasts the Chinese generation failure and hides the English", async () => {
    mockResponsesCreate.mockRejectedValue(new Error("boom"));

    await expect(makeOpenAIResponsesRequest(messages, vi.fn(), "gpt-4", "test-token")).rejects.toThrow("boom");

    expect(toast.fromError).toHaveBeenCalledWith("生成模型响应时出错。请重试。错误：Error: boom");
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while generating model response. Please try again. Error: Error: boom",
    );
  });
});
