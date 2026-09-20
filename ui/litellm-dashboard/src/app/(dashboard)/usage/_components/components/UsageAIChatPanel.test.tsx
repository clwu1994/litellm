import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { modelHubCall, usageAiChatStream } from "@/components/networking";
import UsageAIChatPanel from "./UsageAIChatPanel";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  }
});

vi.mock("@/components/networking", () => ({
  modelHubCall: vi.fn().mockResolvedValue({
    data: [{ model_group: "gpt-4" }, { model_group: "claude-3-opus" }],
  }),
  usageAiChatStream: vi.fn(),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  accessToken: "test-token",
};

describe("UsageAIChatPanel", () => {
  it("should render the panel when open", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Ask AI")).toBeInTheDocument();
    expect(screen.getByText("Ask about your spend, models, keys, and trends")).toBeInTheDocument();
  });

  it("should render model selector", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    // One library paints the prompt as its own text node and the other leaves it on the input's
    // placeholder attribute, so either one means the user is being told what to pick.
    const prompt = "Select a model (optional, defaults to gpt-4o-mini)";
    expect(screen.queryAllByText(prompt).length + screen.queryAllByPlaceholderText(prompt).length).toBeGreaterThan(0);
  });

  it("should render empty state message when no conversation", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Ask a question about your usage")).toBeInTheDocument();
  });

  it("should render the send button", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("should render input placeholder", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByPlaceholderText("Ask about your usage...")).toBeInTheDocument();
  });

  it("should render clear chat button", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("Clear chat")).toBeInTheDocument();
  });

  it("should have the panel element even when closed (just off-screen)", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} open={false} />);

    expect(screen.getByTestId("usage-ai-chat-panel")).toBeInTheDocument();
    expect(screen.getByTestId("usage-ai-chat-panel")).toHaveClass("translate-x-full");
  });

  it("should not have translate-x-full class when open", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} open={true} />);

    expect(screen.getByTestId("usage-ai-chat-panel")).not.toHaveClass("translate-x-full");
    expect(screen.getByTestId("usage-ai-chat-panel")).toHaveClass("translate-x-0");
  });
});

describe("UsageAIChatPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, empty state and input chrome and hides the English ones", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    expect(screen.getByText("询问 AI")).toBeInTheDocument();
    expect(screen.getByText("询问你的支出、模型、密钥和趋势")).toBeInTheDocument();
    expect(screen.getByText("询问有关你的用量的问题")).toBeInTheDocument();
    expect(screen.getByText("例如：“哪个模型花费最多？”")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("询问你的用量...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送" })).toBeInTheDocument();
    expect(screen.getByText("清空对话")).toBeInTheDocument();
    expect(screen.getByText("按 Enter 发送")).toBeInTheDocument();

    expect(screen.queryByText("Ask AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Ask about your spend, models, keys, and trends")).not.toBeInTheDocument();
    expect(screen.queryByText("Ask a question about your usage")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Ask about your usage...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(screen.queryByText("Clear chat")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter to send")).not.toBeInTheDocument();
  });

  it("renders the Chinese model placeholder and hides the English one", () => {
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    const prompt = "选择模型（可选，默认为 gpt-4o-mini）";
    expect(screen.queryAllByText(prompt).length + screen.queryAllByPlaceholderText(prompt).length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Select a model (optional, defaults to gpt-4o-mini)")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading and empty model states and hides the English ones", async () => {
    const user = userEvent.setup();
    vi.mocked(modelHubCall).mockReturnValueOnce(new Promise(() => {}) as never);
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("正在加载模型…")).toBeInTheDocument();
    expect(screen.queryByText("Loading models…")).not.toBeInTheDocument();

    cleanup();
    vi.mocked(modelHubCall).mockResolvedValueOnce({ data: [] } as never);
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool-call filter line and hides the English one", async () => {
    vi.mocked(usageAiChatStream).mockImplementationOnce(async (...args: unknown[]) => {
      const onDone = args[4] as () => void;
      const onToolCall = args[7] as (event: {
        tool_name: string;
        tool_label: string;
        arguments: Record<string, string>;
        status: "running" | "complete" | "error";
      }) => void;
      const toolCallEvent = {
        tool_name: "get_team_usage_data",
        tool_label: "Team Usage",
        arguments: { team_ids: "team-alpha" },
        status: "complete" as const,
      };
      onToolCall(toolCallEvent);
      onDone();
    });

    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("询问你的用量..."), { target: { value: "how much?" } });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("筛选条件：team-alpha")).toBeInTheDocument();
    expect(screen.queryByText("Filter: team-alpha")).not.toBeInTheDocument();
  });

  it("renders the Chinese stream error line and hides the English one", async () => {
    vi.mocked(usageAiChatStream).mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("询问你的用量..."), { target: { value: "how much?" } });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("错误：boom")).toBeInTheDocument();
    expect(screen.queryByText("Error: boom")).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback error message when the stream fails without one", async () => {
    vi.mocked(usageAiChatStream).mockRejectedValueOnce({} as never);
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("询问你的用量..."), { target: { value: "how much?" } });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("错误：获取回复失败，请重试。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to get response. Please try again.")).not.toBeInTheDocument();
  });

  it("renders the Chinese thinking indicator while a status-less stream is open and hides the English one", async () => {
    vi.mocked(usageAiChatStream).mockImplementationOnce(() => new Promise<void>(() => {}));
    renderWithProviders(<UsageAIChatPanel {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("询问你的用量..."), { target: { value: "how much?" } });
    fireEvent.click(screen.getByRole("button", { name: "发送" }));

    expect(await screen.findByText("思考中...")).toBeInTheDocument();
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
  });
});
