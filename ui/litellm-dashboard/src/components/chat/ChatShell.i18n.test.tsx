import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ChatShell from "./ChatShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/ui/chat",
}));
vi.mock("@/utils/uiHref", () => ({ uiHref: (seg: string) => `/ui/${seg}`.replace(/\/$/, "") || "/ui" }));
vi.mock("@/contexts/ChatShellContext", () => ({
  useChatShell: () => ({
    conversations: [],
    activeConversationId: null,
    deleteConversation: vi.fn(),
    renameConversation: vi.fn(),
  }),
}));
vi.mock("./ConversationList", () => ({ default: () => <div data-testid="conversation-list" /> }));

const ZH_NOTICE = "这是一个 pre-v0 功能。请勿在生产环境使用，它可能会发生变化。欢迎在此分享反馈。";
const EN_NOTICE =
  "This is a pre-v0 feature. Do not use in production, it may change unexpectedly. Please share feedback here.";

describe("ChatShell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese pre-v0 notice with its link while hiding the English original", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );

    expect(screen.getByText((_content, element) => element?.textContent === ZH_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText((_content, element) => element?.textContent === EN_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "在此" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm/discussions/32085",
    );
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();
  });

  it("renders the Chinese sidebar actions and nav labels while hiding the English originals", () => {
    render(
      <ChatShell>
        <div />
      </ChatShell>,
    );

    expect(screen.getByRole("button", { name: "新建对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New Chat" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Chats" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "集成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Integrations" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Credentials" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "API Keys" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "日志" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logs" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "用量" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Usage" })).not.toBeInTheDocument();
  });
});
