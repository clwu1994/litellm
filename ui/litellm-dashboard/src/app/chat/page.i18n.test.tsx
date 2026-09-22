import React from "react";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { useChatHistory } from "@/components/chat/useChatHistory";

import ChatConversationPage from "./page";

const { mockMakeOpenAIResponsesRequest, mockFetchAvailableModels, shellState } = vi.hoisted(() => ({
  mockMakeOpenAIResponsesRequest: vi.fn(),
  mockFetchAvailableModels: vi.fn(),
  shellState: { storageUnavailable: false, selectedMCPServers: [] as string[] },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: mockFetchAvailableModels,
}));

vi.mock("@/components/llm_calls/responses_api", () => ({
  makeOpenAIResponsesRequest: mockMakeOpenAIResponsesRequest,
}));

vi.mock("@/components/chat/MCPConnectPicker", () => ({
  default: () => <div data-testid="mcp-connect-picker" />,
}));

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({ default: () => undefined }));

vi.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  coy: {},
  oneDark: {},
  oneLight: {},
  prism: {},
}));

vi.mock("@/contexts/ChatShellContext", () => ({
  useChatShell: () => {
    const history = useChatHistory(null, "i18n-test-user");
    return {
      accessToken: "sk-test",
      userId: "i18n-test-user",
      userEmail: "tester@example.com",
      userRole: "Admin",
      premiumUser: false,
      selectedMCPServers: shellState.selectedMCPServers,
      setSelectedMCPServers: vi.fn(),
      conversations: history.conversations,
      activeConversation: history.activeConversation,
      activeConversationId: history.currentActiveId,
      storageUnavailable: shellState.storageUnavailable,
      staleId: false,
      createConversation: history.createConversation,
      appendMessage: history.appendMessage,
      updateLastAssistantMessage: history.updateLastAssistantMessage,
      truncateFromMessage: history.truncateFromMessage,
      deleteConversation: vi.fn(),
      renameConversation: vi.fn(),
    };
  },
}));

const renderPage = () => render(<ChatConversationPage />);

const waitForModel = () => screen.findByRole("button", { name: /gpt-5\.4-mini/ });

const sendMessage = (placeholder: string) => {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value: "hello" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
};

describe("chat page Chinese copy", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    shellState.storageUnavailable = false;
    shellState.selectedMCPServers = [];
    mockFetchAvailableModels.mockResolvedValue([{ model_group: "gpt-5.4-mini" }]);
    mockMakeOpenAIResponsesRequest.mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese greeting, suggestions and composer while hiding the English originals", async () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(20);
    renderPage();
    await waitForModel();

    expect(screen.getByRole("heading", { name: "晚上好，tester" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Good evening, tester" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "写作" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "学习" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Learn" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编程" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Code" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "头脑风暴" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Brainstorm" })).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("今天我能帮你做什么？")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("How can I help you today?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();

    expect(screen.getByText("与 100+ LLM 和 MCP 工具对话；一次授权，即可在此使用。")).toBeInTheDocument();
    expect(
      screen.queryByText("Chat with 100+ LLMs + MCP tools; authenticate once, use them here."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开集成 ->" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Integrations ->" })).not.toBeInTheDocument();
  });

  it("renders the Chinese morning greeting and model picker chrome while hiding the English originals", async () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(9);
    mockFetchAvailableModels.mockResolvedValue([]);
    const user = userEvent.setup({ delay: null });
    renderPage();

    expect(await screen.findByRole("heading", { name: "早上好，tester" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Good morning, tester" })).not.toBeInTheDocument();

    const modelTrigger = screen.getByRole("button", { name: /选择模型/ });
    expect(modelTrigger).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select model/ })).not.toBeInTheDocument();

    await user.click(modelTrigger);
    expect(await screen.findByPlaceholderText("搜索模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese afternoon greeting and model-load failure toast", async () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(14);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchAvailableModels.mockRejectedValue(new Error("boom"));
    renderPage();

    expect(await screen.findByRole("heading", { name: "下午好，tester" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Good afternoon, tester" })).not.toBeInTheDocument();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("无法加载模型"));
    expect(toast.error).not.toHaveBeenCalledWith("Could not load models");
    consoleError.mockRestore();
  });

  it("renders the Chinese storage banner while hiding the English original", async () => {
    shellState.storageUnavailable = true;
    renderPage();
    await waitForModel();

    expect(screen.getByText("本次浏览器会话不会保存对话历史")).toBeInTheDocument();
    expect(screen.queryByText("Chat history won't be saved in this browser session")).not.toBeInTheDocument();
  });

  it("renders the Chinese conversation composer, tool count and scroll control while hiding the English originals", async () => {
    shellState.selectedMCPServers = ["alpha"];
    const { container } = renderPage();
    await waitForModel();

    sendMessage("今天我能帮你做什么？");

    expect(await screen.findByPlaceholderText("发送消息...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Send a message...")).not.toBeInTheDocument();
    expect(await screen.findByText("1 个工具已连接")).toBeInTheDocument();
    expect(screen.queryByText("1 tool connected")).not.toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- the scroll container exposes no role, label or data-slot
    const scrollContainer = container.querySelector(".overflow-auto.pt-6") as HTMLElement;
    Object.defineProperty(scrollContainer, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(scrollContainer, "clientHeight", { configurable: true, value: 100 });
    scrollContainer.scrollTop = 0;
    fireEvent.scroll(scrollContainer);

    expect(await screen.findByRole("button", { name: "滚动到底部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scroll to bottom" })).not.toBeInTheDocument();
  });

  it("renders the Chinese plural connected-tool count while hiding the English original", async () => {
    shellState.selectedMCPServers = ["alpha", "beta"];
    renderPage();
    await waitForModel();

    sendMessage("今天我能帮你做什么？");

    expect(await screen.findByText("2 个工具已连接")).toBeInTheDocument();
    expect(screen.queryByText("2 tools connected")).not.toBeInTheDocument();
  });

  it("resolves the singular and plural connected-tool branches under English", async () => {
    await i18n.changeLanguage("en");
    shellState.selectedMCPServers = ["alpha"];
    const { unmount } = renderPage();
    await waitForModel();

    sendMessage("How can I help you today?");

    expect(await screen.findByText("1 tool connected")).toBeInTheDocument();
    expect(screen.queryByText("1 tools connected")).not.toBeInTheDocument();
    unmount();
    localStorage.clear();

    shellState.selectedMCPServers = ["alpha", "beta"];
    renderPage();
    await waitForModel();

    sendMessage("How can I help you today?");

    expect(await screen.findByText("2 tools connected")).toBeInTheDocument();
    expect(screen.queryByText("2 tool connected")).not.toBeInTheDocument();
  });

  it("renders the Chinese partial-response notice while hiding the English original", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMakeOpenAIResponsesRequest.mockRejectedValue(new Error("kaboom"));
    renderPage();
    await waitForModel();

    sendMessage("今天我能帮你做什么？");

    expect(await screen.findByText("[出现问题。部分响应已保存。]")).toBeInTheDocument();
    expect(screen.queryByText("[Something went wrong. The partial response has been saved.]")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
