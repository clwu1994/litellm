import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import type { MessageType } from "@/components/chat_ui/types";
import { MessageDisplay } from "./MessageDisplay";

vi.mock("@/components/chat_ui/ReasoningContent", () => ({
  default: ({ reasoningContent }: { reasoningContent: string }) => (
    <div data-testid="reasoning-content">{reasoningContent}</div>
  ),
}));

vi.mock("@/components/chat_ui/ResponseMetrics", () => ({
  default: () => <div data-testid="response-metrics">ResponseMetrics</div>,
}));

vi.mock("../../chat_ui/SearchResultsDisplay", () => ({
  SearchResultsDisplay: () => <div data-testid="search-results">SearchResultsDisplay</div>,
}));

vi.mock("../../chat_ui/ChatImageRenderer", () => ({
  default: () => <div data-testid="chat-image-renderer" />,
}));

describe("MessageDisplay Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("labels the user turn in Chinese", () => {
    const messages: MessageType[] = [{ role: "user", content: "Hello" }];
    render(<MessageDisplay messages={messages} isLoading={false} />);

    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("falls back to the Chinese assistant label when the model is unknown", () => {
    const messages: MessageType[] = [{ role: "assistant", content: "Hi there!" }];
    render(<MessageDisplay messages={messages} isLoading={false} />);

    expect(screen.getByText("助手")).toBeInTheDocument();
    expect(screen.queryByText("Assistant")).not.toBeInTheDocument();
  });

  it("shows the Chinese waiting state for an unanswered turn", () => {
    const messages: MessageType[] = [{ role: "user", content: "Hello" }];
    render(<MessageDisplay messages={messages} isLoading={false} />);

    expect(screen.getByText("等待响应...")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for a response...")).not.toBeInTheDocument();
  });

  it("shows the Chinese generating state while the answer is in flight", () => {
    const messages: MessageType[] = [{ role: "user", content: "Hello" }];
    render(<MessageDisplay messages={messages} isLoading />);

    expect(screen.getByText("正在生成响应...")).toBeInTheDocument();
    expect(screen.queryByText("Generating response...")).not.toBeInTheDocument();
  });

  it("shows the Chinese generating state when no conversation block exists yet", () => {
    const messages: MessageType[] = [{ role: "system", content: "seed" }];
    render(<MessageDisplay messages={messages} isLoading />);

    expect(screen.getByText("正在生成响应...")).toBeInTheDocument();
    expect(screen.queryByText("Generating response...")).not.toBeInTheDocument();
  });
});
