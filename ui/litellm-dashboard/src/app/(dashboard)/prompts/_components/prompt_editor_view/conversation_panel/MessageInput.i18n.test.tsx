import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import MessageInput from "./MessageInput";

const defaultProps = {
  inputMessage: "",
  isLoading: false,
  isDisabled: false,
  onInputChange: vi.fn(),
  onSend: vi.fn(),
  onKeyDown: vi.fn(),
  onCancel: vi.fn(),
};

describe("MessageInput Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and send label, hiding the English originals", () => {
    renderWithProviders(<MessageInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type your message... (Shift+Enter for new line)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送消息" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument();
  });

  it("renders the Chinese cancel action while loading and hides the English original", () => {
    renderWithProviders(<MessageInput {...defaultProps} isLoading />);

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the English placeholder byte-identically from the catalog", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<MessageInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("Type your message... (Shift+Enter for new line)")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("输入你的消息...（Shift+Enter 换行）")).not.toBeInTheDocument();
  });
});
