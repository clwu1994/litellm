import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ChatMessages from "./ChatMessages";
import type { ChatMessage } from "./types";

const message = (overrides: Partial<ChatMessage>): ChatMessage => ({
  id: "m1",
  role: "assistant",
  content: "",
  timestamp: Date.now(),
  ...overrides,
});

const renderMessages = (messages: ChatMessage[], props: Partial<React.ComponentProps<typeof ChatMessages>> = {}) =>
  render(<ChatMessages messages={messages} isStreaming={false} {...props} />);

describe("ChatMessages Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese edit tooltip and editor actions while hiding the English originals", async () => {
    renderMessages([message({ id: "u1", role: "user", content: "hello there" })], { onEditMessage: vi.fn() });

    fireEvent.mouseOver(screen.getByText("hello there"));
    const editButton = await screen.findByRole("button");

    fireEvent.focus(editButton);
    expect(await screen.findByText("编辑消息")).toBeInTheDocument();
    expect(screen.queryByText("Edit message")).not.toBeInTheDocument();

    fireEvent.click(editButton);

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存并发送" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save & Send" })).not.toBeInTheDocument();
  });

  it("renders the Chinese stopped suffix while hiding the English marker", () => {
    renderMessages([message({ id: "a1", content: "partial answer [stopped]" })]);

    expect(screen.getByText("[已停止]")).toBeInTheDocument();
    expect(screen.queryByText("[stopped]")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool-card labels while hiding the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    const toolMessageInput = {
      id: "t1",
      role: "tool" as const,
      content: "",
      toolArgs: { query: "repos" },
      toolResult: "ok",
    };
    const toolMessage = message(toolMessageInput);
    renderMessages([toolMessage]);

    expect(screen.getByText("工具调用")).toBeInTheDocument();
    expect(screen.queryByText("Tool call")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("参数")).toBeInTheDocument();
    expect(screen.queryByText("Arguments")).not.toBeInTheDocument();
    expect(screen.getByText("结果")).toBeInTheDocument();
    expect(screen.queryByText("Result")).not.toBeInTheDocument();
  });

  it("renders the Chinese copy tooltip while hiding the English original", async () => {
    renderMessages([message({ id: "a1", content: "answer" })]);

    fireEvent.focus(screen.getByRole("button"));

    expect(await screen.findByText("复制")).toBeInTheDocument();
    expect(screen.queryByText("Copy")).not.toBeInTheDocument();
  });

  it("renders the Chinese copied tooltip after copying while hiding the English original", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderMessages([message({ id: "a1", content: "answer" })]);

    const copyButton = screen.getByRole("button");
    fireEvent.click(copyButton);
    fireEvent.focus(copyButton);

    expect(await screen.findByText("已复制！")).toBeInTheDocument();
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("renders the Chinese thinking placeholder while hiding the English original", () => {
    renderMessages([message({ id: "a1", content: "partial answer" })], { isStreaming: true });

    expect(screen.getByText("思考中...")).toBeInTheDocument();
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
  });
});
