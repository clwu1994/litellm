import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { makeOpenAIChatCompletionRequest } from "@/components/llm_calls/chat_completion";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import { makeA2AStreamMessageRequest } from "../../llm_calls/a2a_send_message";
import { fetchAvailableAgents } from "../../llm_calls/fetch_agents";
import CompareUI from "./CompareUI";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([{ model_group: "gpt-4" }, { model_group: "gpt-3.5-turbo" }]),
}));

vi.mock("@/components/llm_calls/chat_completion", () => ({
  makeOpenAIChatCompletionRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../llm_calls/a2a_send_message", () => ({
  makeA2AStreamMessageRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../llm_calls/fetch_agents", () => ({
  fetchAvailableAgents: vi.fn().mockResolvedValue([{ agent_id: "agent-1", agent_name: "Agent One" }]),
}));

let capturedOnImageUpload: ((file: File) => false) | null = null;

vi.mock("../chat_ui/ChatImageUpload", () => ({
  default: ({ onImageUpload }: { onImageUpload: (file: File) => false }) => {
    capturedOnImageUpload = onImageUpload;
    return <div data-testid="chat-image-upload" />;
  },
}));

vi.mock("./components/UnifiedSelector", () => ({
  UnifiedSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="unified-selector" onClick={() => onChange("Agent One")}>
      {value}
    </button>
  ),
}));

vi.mock("@/components/tag_management/TagSelector", () => ({
  default: () => <div data-testid="tag-selector" />,
}));

vi.mock("@/components/vector_store_management/VectorStoreSelector", () => ({
  default: () => <div data-testid="vector-store-selector" />,
}));

vi.mock("@/components/guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const renderCompare = (props: Partial<ComponentProps<typeof CompareUI>> = {}) =>
  render(<CompareUI accessToken="test-token" disabledPersonalKeyCreation={false} {...props} />);

const sendMessage = async (user: ReturnType<typeof userEvent.setup>, text = "hello") => {
  fireEvent.change(screen.getByPlaceholderText("输入消息...（Shift+Enter 换行）"), { target: { value: text } });
  await user.click(screen.getByLabelText("发送消息"));
};

const waitForModels = async () => {
  await screen.findByText("gpt-4");
};

const switchToAgents = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox", { name: "Endpoint" }));
  await user.click(await screen.findByRole("option", { name: "/a2a (Agents)" }));
};

const selectEveryAgent = async (user: ReturnType<typeof userEvent.setup>) => {
  const selectors = await screen.findAllByTestId("unified-selector");
  for (const selector of selectors) {
    await user.click(selector);
  }
};

describe("CompareUI Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    capturedOnImageUpload = null;
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header chrome", () => {
    renderCompare();

    expect(screen.getByText("Virtual Key 来源")).toBeInTheDocument();
    expect(screen.queryByText("Virtual Key Source")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Virtual Key 来源")).toBeInTheDocument();
    expect(screen.getByText("当前 UI 会话")).toBeInTheDocument();
    expect(screen.queryByText("Current UI Session")).not.toBeInTheDocument();
    expect(screen.getByText("Endpoint")).toBeInTheDocument();
    expect(screen.getByLabelText("Endpoint")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空所有对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Clear All Chats/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加对比" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Comparison/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese suggested prompts", () => {
    renderCompare();

    expect(screen.getByRole("button", { name: "为我写一首诗" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write me a poem" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "解释量子计算" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explain quantum computing" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "起草一封请求开会的礼貌邮件" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Draft a polite email requesting a meeting" })).not.toBeInTheDocument();
  });

  it("switches to a custom Virtual Key source in Chinese", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare();

    await user.click(screen.getByLabelText("Virtual Key 来源"));
    await user.click(await screen.findByRole("option", { name: "Virtual Key" }));

    expect(screen.getByPlaceholderText("输入 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter Virtual Key")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Virtual Key 来源")).toHaveTextContent("Virtual Key");
    expect(screen.queryByText("Current UI Session")).not.toBeInTheDocument();
  });

  it("asks for a key in Chinese when no key is available", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare({ accessToken: null });

    await sendMessage(user);

    expect(toast.fromError).toHaveBeenCalledWith("请提供 Virtual Key 或选择当前 UI 会话");
  });

  it("asks for a model in Chinese when none is selected", async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValueOnce([]);
    const user = userEvent.setup({ delay: null });
    renderCompare();

    await waitFor(() => expect(fetchAvailableModels).toHaveBeenCalled());
    await sendMessage(user);

    expect(toast.fromError).toHaveBeenCalledWith("发送消息前请先选择一个模型。");
  });

  it("shows the Chinese prompt placeholder once a turn has been sent", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await waitForModels();

    await sendMessage(user);

    expect(await screen.findByText("发送提示词以对比模型")).toBeInTheDocument();
    expect(screen.queryByText("Send a prompt to compare models")).not.toBeInTheDocument();
  });

  it("shows the Chinese gathering message while every response is in flight", async () => {
    vi.mocked(makeOpenAIChatCompletionRequest).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await waitForModels();

    await sendMessage(user);

    expect(await screen.findByText("正在收集所有模型的响应...")).toBeInTheDocument();
    expect(screen.queryByText("Gathering responses from all models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese follow-up prompts once every model has answered", async () => {
    vi.mocked(makeOpenAIChatCompletionRequest).mockImplementation((_history, onChunk) => {
      onChunk("hi", "gpt-4");
      return Promise.resolve(undefined);
    });
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await waitForModels();

    await sendMessage(user);

    expect(await screen.findByRole("button", { name: "能总结一下要点吗？" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Can you summarize the key points?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "你做了哪些假设？" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "What assumptions did you make?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "接下来的步骤是什么？" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "What are the next steps?" })).not.toBeInTheDocument();
  });

  it("renders the Chinese error message when a request fails", async () => {
    vi.mocked(makeOpenAIChatCompletionRequest).mockImplementation(() => Promise.reject(new Error("boom")));
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await waitForModels();

    await sendMessage(user);

    const errorMessages = await screen.findAllByText("获取响应出错：boom");
    expect(errorMessages[0]).toBeInTheDocument();
    expect(screen.queryAllByText("Error fetching response: boom")).toHaveLength(0);
  });

  it("renders the Chinese attachment chrome for an image", async () => {
    renderCompare();

    await waitFor(() => expect(capturedOnImageUpload).not.toBeNull());
    capturedOnImageUpload?.(new File(["x"], "photo.png", { type: "image/png" }));

    expect(await screen.findByText("附件已就绪，可以发送")).toBeInTheDocument();
    expect(screen.queryByText("Attachment ready to send")).not.toBeInTheDocument();
    expect(screen.getByAltText("上传预览")).toBeInTheDocument();
    expect(screen.queryByAltText("Upload preview")).not.toBeInTheDocument();
    expect(screen.getByText("图片")).toBeInTheDocument();
    expect(screen.queryByText("Image")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除附件")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove attachment")).not.toBeInTheDocument();
  });

  it("renders the Chinese attachment chrome for a PDF", async () => {
    renderCompare();

    await waitFor(() => expect(capturedOnImageUpload).not.toBeNull());
    capturedOnImageUpload?.(new File(["x"], "report.pdf", { type: "application/pdf" }));

    expect(await screen.findByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("附件已就绪，可以发送")).toBeInTheDocument();
  });

  it("renders the Chinese add-comparison tooltip while a slot is free", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare();

    await user.hover(screen.getByRole("button", { name: "添加对比" }));

    expect(await screen.findByText("再添加一个对比")).toBeInTheDocument();
    expect(screen.queryByText("Add another comparison")).not.toBeInTheDocument();
  });

  it("renders the Chinese comparison-limit tooltip once the limit is reached", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare();

    fireEvent.click(screen.getByRole("button", { name: "添加对比" }));
    // eslint-disable-next-line testing-library/no-node-access -- the disabled control's wrapping span is the tooltip target and has no accessible name of its own
    const trigger = screen.getByRole("button", { name: "添加对比" }).parentElement;
    if (!trigger) throw new Error("the add-comparison tooltip trigger is missing");
    await user.hover(trigger);

    expect(await screen.findByText("最多同时对比 3 个模型")).toBeInTheDocument();
    expect(screen.queryByText("Compare up to 3 models at a time")).not.toBeInTheDocument();
  });

  it("renders the Chinese agent prompt placeholder once a turn has been sent", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await switchToAgents(user);
    await selectEveryAgent(user);

    await sendMessage(user);

    expect(await screen.findByText("发送消息以对比 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Send a message to compare agents")).not.toBeInTheDocument();
  });

  it("asks for an agent in Chinese when none is selected", async () => {
    vi.mocked(fetchAvailableAgents).mockResolvedValueOnce([]);
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await switchToAgents(user);

    await sendMessage(user);

    expect(toast.fromError).toHaveBeenCalledWith("发送消息前请先选择一个 Agent。");
  });

  it("shows the Chinese gathering message while every agent response is in flight", async () => {
    vi.mocked(makeA2AStreamMessageRequest).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    renderCompare();
    await switchToAgents(user);
    await selectEveryAgent(user);

    await sendMessage(user);

    expect(await screen.findByText("正在收集所有 Agent 的响应...")).toBeInTheDocument();
    expect(screen.queryByText("Gathering responses from all agents...")).not.toBeInTheDocument();
  });
});
