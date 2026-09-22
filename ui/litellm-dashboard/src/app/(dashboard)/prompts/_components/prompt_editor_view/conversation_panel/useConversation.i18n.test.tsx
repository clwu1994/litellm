import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";

import { useConversation } from "./useConversation";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "http://localhost:4000"),
  getGlobalLitellmHeaderName: vi.fn(() => "Authorization"),
}));

const promptWithoutVariables = {
  name: "p",
  model: "gpt-4o",
  config: { temperature: 1, max_tokens: 100 },
  tools: [],
  developerMessage: "",
  messages: [{ role: "user", content: "Hello" }],
  environment: "development",
};

const promptWithVariables = {
  ...promptWithoutVariables,
  messages: [{ role: "user", content: "{{name}}" }],
};

describe("useConversation Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("toasts the Chinese access-token error and hides the English original", async () => {
    const { result } = renderHook(() => useConversation(promptWithVariables, null));

    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(toast.fromError).toHaveBeenCalledWith("需要访问 Token");
    expect(toast.fromError).not.toHaveBeenCalledWith("Access token is required");
  });

  it("toasts the Chinese unfilled-variables error and hides the English original", async () => {
    const { result } = renderHook(() => useConversation(promptWithVariables, "token"));

    await act(async () => {
      result.current.setInputMessage("Hello");
    });
    await act(async () => {
      await result.current.handleSendMessage();
    });

    expect(toast.fromError).toHaveBeenCalledWith("请填写所有模板变量");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please fill in all template variables");
  });

  it("toasts the Chinese cancellation message and hides the English original", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    const { result } = renderHook(() => useConversation(promptWithoutVariables, "token"));

    await act(async () => {
      result.current.setInputMessage("Hello");
    });
    await act(async () => {
      void result.current.handleSendMessage();
    });
    act(() => {
      result.current.handleCancelRequest();
    });

    expect(toast.info).toHaveBeenCalledWith("请求已取消");
    expect(toast.info).not.toHaveBeenCalledWith("Request cancelled");
  });

  it("toasts the Chinese cleared-chat message and hides the English original", () => {
    const { result } = renderHook(() => useConversation(promptWithoutVariables, "token"));

    act(() => {
      result.current.handleClearConversation();
    });

    expect(toast.success).toHaveBeenCalledWith("对话历史已清空。");
    expect(toast.success).not.toHaveBeenCalledWith("Chat history cleared.");
  });
});
