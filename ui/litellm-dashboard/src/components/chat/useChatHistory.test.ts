import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useChatHistory } from "./useChatHistory";

describe("useChatHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not leak conversations between different users on the same browser", () => {
    const { result: alice } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "alice" },
    });
    act(() => {
      alice.current.createConversation("gpt-4");
    });
    expect(alice.current.conversations).toHaveLength(1);

    const { result: bob } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "bob" },
    });
    expect(bob.current.conversations).toHaveLength(0);
  });

  it("reloads conversations scoped to the new user when userId changes", () => {
    const { result, rerender } = renderHook(({ userId }) => useChatHistory(null, userId), {
      initialProps: { userId: "alice" },
    });
    act(() => {
      result.current.createConversation("gpt-4");
    });
    expect(result.current.conversations).toHaveLength(1);

    rerender({ userId: "bob" });
    expect(result.current.conversations).toHaveLength(0);

    rerender({ userId: "alice" });
    expect(result.current.conversations).toHaveLength(1);
  });

  it("stores a language-neutral sentinel title and retitles from the first user message", () => {
    const { result } = renderHook(() => useChatHistory(null, "alice"));
    let conversationId = "";
    act(() => {
      conversationId = result.current.createConversation("gpt-4");
    });

    expect(result.current.conversations[0].title).toBe("");

    act(() => {
      result.current.appendMessage(conversationId, { role: "user", content: "hello there" });
    });

    expect(result.current.conversations[0].title).toBe("hello there");
  });
});
