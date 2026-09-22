import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import ConversationPanel from "./index";

vi.mock("./useConversation", () => ({
  useConversation: () => ({
    isLoading: false,
    messages: [{ role: "user", content: "Hello" }],
    inputMessage: "",
    variables: {},
    variablesFilled: true,
    extractedVariables: [],
    allVariablesFilled: true,
    messagesEndRef: { current: null },
    setInputMessage: vi.fn(),
    handleSendMessage: vi.fn(),
    handleCancelRequest: vi.fn(),
    handleClearConversation: vi.fn(),
    handleKeyDown: vi.fn(),
    handleVariableChange: vi.fn(),
  }),
}));

describe("ConversationPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese clear-chat action and hides the English original", () => {
    renderWithProviders(<ConversationPanel prompt={{}} accessToken="token" />);

    expect(screen.getByRole("button", { name: "清空对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Chat" })).not.toBeInTheDocument();
  });
});
