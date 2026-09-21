import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { MessageInput } from "./MessageInput";

describe("MessageInput Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese composer placeholder and send label", () => {
    render(<MessageInput value="" onChange={vi.fn()} onSend={vi.fn()} />);

    expect(screen.getByPlaceholderText("输入消息...（Shift+Enter 换行）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type your message... (Shift+Enter for new line)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
  });
});
