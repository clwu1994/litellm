import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders as render } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import ChatUI from "./ChatUI";
import * as fetchModelsModule from "@/components/llm_calls/fetch_models";
import { makeOpenAIChatCompletionRequest } from "@/components/llm_calls/chat_completion";
import { makeOpenAIResponsesRequest } from "@/components/llm_calls/responses_api";

vi.mock("@/components/llm_calls/fetch_models", () => ({ fetchAvailableModels: vi.fn() }));
vi.mock("@/components/llm_calls/chat_completion", () => ({
  makeOpenAIChatCompletionRequest: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/components/llm_calls/responses_api", () => ({
  makeOpenAIResponsesRequest: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../llm_calls/anthropic_messages", () => ({ makeAnthropicMessagesRequest: vi.fn() }));
vi.mock("../../llm_calls/audio_transcriptions", () => ({
  makeOpenAIAudioTranscriptionRequest: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/components/networking", () => ({
  tagListCall: vi.fn().mockResolvedValue({}),
  vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }),
  getGuardrailsList: vi.fn().mockResolvedValue({ data: [] }),
  getPoliciesList: vi.fn().mockResolvedValue({ data: [] }),
  modelHubCall: vi.fn().mockResolvedValue({ data: [] }),
  fetchMCPServers: vi.fn().mockResolvedValue([]),
  fetchMCPToolsets: vi.fn().mockResolvedValue([]),
  listMCPTools: vi.fn().mockResolvedValue({ tools: [] }),
  callMCPTool: vi.fn(),
}));

import { fetchMCPServers, fetchMCPToolsets, listMCPTools, callMCPTool } from "@/components/networking";

const baseProps = {
  accessToken: "1234567890",
  token: "1234567890",
  userRole: "user",
  userID: "1234567890",
  disabledPersonalKeyCreation: false,
};

const renderChat = (props: Partial<React.ComponentProps<typeof ChatUI>> = {}) =>
  render(<ChatUI {...baseProps} {...props} />);

async function selectOption(placeholder: string, optionLabel: string) {
  const user = userEvent.setup({ delay: null });
  await user.click(await screen.findByPlaceholderText(placeholder));
  const options = await screen.findAllByText(optionLabel);
  await user.click(options[options.length - 1]);
}

const waitForReady = () => screen.findByText("测试密钥");

describe("ChatUI Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();
    await i18n.changeLanguage("zh");
    Element.prototype.scrollIntoView = vi.fn();
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "Model 1", mode: "chat" },
    ]);
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (fetchMCPToolsets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockResolvedValue({ tools: [] });
    (callMCPTool as ReturnType<typeof vi.fn>).mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese configuration sidebar and main chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.queryByText("Configurations")).not.toBeInTheDocument();
    expect(screen.getByText("Virtual Key 来源")).toBeInTheDocument();
    expect(screen.queryByText("Virtual Key Source")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Virtual Key 来源")).toHaveTextContent("当前 UI 会话");
    expect(screen.queryByText("Current UI Session")).not.toBeInTheDocument();

    expect(screen.getByText("自定义代理 Base URL")).toBeInTheDocument();
    expect(screen.queryByText("Custom Proxy Base URL")).not.toBeInTheDocument();
    expect(screen.getByText("Endpoint 类型")).toBeInTheDocument();
    expect(screen.queryByText("Endpoint Type")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 Endpoint")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an endpoint")).not.toBeInTheDocument();

    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.queryByText("Policies")).not.toBeInTheDocument();

    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    expect(screen.getByLabelText("模型设置")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model Settings")).not.toBeInTheDocument();

    expect(screen.getByText("测试密钥")).toBeInTheDocument();
    expect(screen.queryByText("Test Key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除对话" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Chat" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "获取代码" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Get Code" })).not.toBeInTheDocument();
    expect(screen.getByText("开始对话、生成图片或处理音频")).toBeInTheDocument();
    expect(screen.queryByText("Start a conversation, generate an image, or handle audio")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type your message... (Shift+Enter for new line)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();

    expect(screen.getByText("为我写一首诗")).toBeInTheDocument();
    expect(screen.getByText("解释量子计算")).toBeInTheDocument();
    expect(screen.getByText("起草一封请求开会的礼貌邮件")).toBeInTheDocument();
    expect(screen.queryByText("Write me a poem")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择模型"));
    expect(await screen.findByText("模式：chat")).toBeInTheDocument();
    expect(screen.queryByText("Mode: chat")).not.toBeInTheDocument();
    expect(screen.getByText("输入自定义模型")).toBeInTheDocument();
    expect(screen.queryByText("Enter custom model")).not.toBeInTheDocument();
  });

  it("renders the Chinese selector tooltips with their links while open", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.hover(screen.getByLabelText("关于向量存储"));
    expect(
      await screen.findByText("选择用于此 LLM API 调用的向量存储。你可以在", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("这里")).toBeInTheDocument();
    expect(screen.getByText("设置向量存储。", { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText("Select vector store(s) to use for this LLM API call.", { exact: false }),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("关于 Guardrails"));
    expect(
      await screen.findByText("选择用于此 LLM API 调用的 Guardrail。你可以在", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("设置 Guardrail。", { exact: false })).toBeInTheDocument();

    await user.hover(screen.getByLabelText("关于策略"));
    expect(await screen.findByText("选择应用于此 LLM API 调用的策略。", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("策略定义了根据条件应用哪些 Guardrail。", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("设置策略。", { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText("Select policy/policies to apply to this LLM API call.", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese custom key and proxy chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat({ proxySettings: { LITELLM_UI_API_DOC_BASE_URL: "http://localhost:5000" } });
    await waitForReady();

    expect(screen.getByText("填充")).toBeInTheDocument();
    expect(screen.queryByText("Fill")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("可选：输入自定义代理 URL（例如 http://localhost:5000）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Optional: Enter custom proxy URL (e.g., http://localhost:5000)"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Virtual Key 来源"));
    await user.click(await screen.findByRole("option", { name: "Virtual Key" }));
    expect(await screen.findByPlaceholderText("输入自定义 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter custom Virtual Key")).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText("填充"));
    });
    expect(await screen.findByText("API 调用将发送至：http://localhost:5000")).toBeInTheDocument();
    expect(screen.queryByText("API calls will be sent to: http://localhost:5000")).not.toBeInTheDocument();
    expect(screen.getByText("清除")).toBeInTheDocument();
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("renders the Chinese speech voice chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/audio/speech");

    expect(await screen.findByText("音色")).toBeInTheDocument();
    expect(screen.queryByText("Voice")).not.toBeInTheDocument();
    expect(screen.getByLabelText("音色")).toHaveTextContent("Alloy - 专业而自信");
    expect(screen.queryByText("Alloy - Professional and confident")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("音色"));
    const voiceLabels = [
      "Alloy - 专业而自信",
      "Ash - 随性放松",
      "Ballad - 流畅悦耳",
      "Coral - 温暖亲切",
      "Echo - 友好健谈",
      "Fable - 睿智沉稳",
      "Nova - 友好健谈",
      "Onyx - 低沉权威",
      "Sage - 睿智沉稳",
      "Shimmer - 明亮欢快",
    ];
    const listbox = await screen.findByRole("listbox");
    for (const label of voiceLabels) {
      expect(within(listbox).getByText(label), label).toBeInTheDocument();
    }
    expect(screen.queryByText("Shimmer - Bright and cheerful")).not.toBeInTheDocument();
  });

  it("renders the Chinese A2A agent chrome", async () => {
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/a2a/message/send");

    expect(await screen.findByText("选择 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Select Agent")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择一个 Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an Agent")).not.toBeInTheDocument();
    expect(screen.getByText("未找到 Agent。请通过 /v1/agents endpoint 创建 Agent。")).toBeInTheDocument();
    expect(screen.queryByText("No agents found. Create agents via /v1/agents endpoint.")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("向 A2A Agent 发送消息...")).toBeInTheDocument();
    expect(screen.getByText("你能帮我做什么？")).toBeInTheDocument();
    expect(screen.getByText("介绍一下你自己")).toBeInTheDocument();
    expect(screen.getByText("你能执行哪些任务？")).toBeInTheDocument();
  });

  it("renders the Chinese MCP server chrome and all-servers option", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择 MCP 服务器"));
    expect(await screen.findByText("所有 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("使用所有可用的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("All MCP Servers")).not.toBeInTheDocument();
  });

  it("renders the Chinese MCP tooltip, tool restriction and BYOK chrome", async () => {
    const user = userEvent.setup({ delay: null });
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp", is_byok: true, has_user_credential: true },
    ]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      tools: [{ name: "list_repos", description: "List repositories" }],
    });
    renderChat();
    await waitForReady();

    await user.hover(screen.getByLabelText("关于 MCP 服务器和 Toolset"));
    expect(await screen.findByText("选择对话中要使用的 MCP 服务器或 Toolset。")).toBeInTheDocument();
    expect(screen.queryByText("Select MCP servers or toolsets to use in your conversation.")).not.toBeInTheDocument();

    await selectOption("选择 MCP 服务器", "github");
    expect(await screen.findByText("限制 github 的可用工具：")).toBeInTheDocument();
    expect(screen.queryByText("Limit tools for github:")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("所有工具（默认）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("All tools (default)")).not.toBeInTheDocument();
    expect(screen.getByText("github 需要你的 API Key")).toBeInTheDocument();
    expect(screen.queryByText("github requires your API key")).not.toBeInTheDocument();
    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByText("重新连接")).toBeInTheDocument();
    expect(screen.queryByText("Reconnect")).not.toBeInTheDocument();
  });

  it("renders the Chinese MCP direct-mode server and tool chrome", async () => {
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
    ]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      tools: [{ name: "list_repos", inputSchema: { type: "object", properties: {} } }],
    });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/mcp-rest/tools/call");
    expect(await screen.findByText("MCP 服务器")).toBeInTheDocument();

    await selectOption("选择 MCP 服务器", "github");
    expect(await screen.findByText("选择工具")).toBeInTheDocument();
    expect(screen.queryByText("Select Tool")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要调用的工具")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a tool to call")).not.toBeInTheDocument();
  });

  it("renders the Chinese image-edit upload chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/images/edits");

    expect(await screen.findByText("点击或拖拽图片上传")).toBeInTheDocument();
    expect(screen.queryByText("Click or drag images to upload")).not.toBeInTheDocument();
    expect(screen.getByText("支持 PNG、JPG、JPEG、GIF、WebP。支持多张图片。")).toBeInTheDocument();
    expect(
      screen.queryByText("Support for PNG, JPG, JPEG, GIF, WebP. Multiple images supported."),
    ).not.toBeInTheDocument();

    const dropZone = screen.getByText("点击或拖拽图片上传");
    fireEvent.drop(dropZone, { dataTransfer: { files: [new File(["a"], "doc.pdf", { type: "application/pdf" })] } });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("“doc.pdf” 不是支持的图片。请使用 PNG、JPEG、GIF 或 WebP。"),
    );

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File(["a"], "one.png", { type: "image/png" })] },
    });

    expect(await screen.findByAltText("上传预览 1")).toBeInTheDocument();
    expect(screen.queryByAltText("Upload preview 1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除 one.png")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove one.png")).not.toBeInTheDocument();
    expect(screen.getByText("添加更多")).toBeInTheDocument();
    expect(screen.queryByText("Add more")).not.toBeInTheDocument();
    void user;
  });

  it("renders the Chinese transcription upload chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/audio/transcriptions");

    expect(await screen.findByText("点击或拖拽音频文件上传")).toBeInTheDocument();
    expect(screen.queryByText("Click or drag audio file to upload")).not.toBeInTheDocument();
    expect(
      screen.getByText("支持 MP3、MP4、MPEG、MPGA、M4A、WAV、WEBM 格式。最大文件大小：25 MB。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Support for MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM formats.", { exact: false }),
    ).not.toBeInTheDocument();

    const dropZone = screen.getByText("点击或拖拽音频文件上传");
    fireEvent.drop(dropZone, { dataTransfer: { files: [new File(["a"], "notes.txt", { type: "text/plain" })] } });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "“notes.txt” 不是支持的音频文件。请使用 MP3、MP4、MPEG、MPGA、M4A、WAV 或 WEBM。",
      ),
    );

    fireEvent.drop(dropZone, { dataTransfer: { files: [new File(["a"], "clip.wav", { type: "audio/wav" })] } });
    expect(await screen.findByText("clip.wav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    void user;
  });

  it("renders the Chinese model empty states", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(await screen.findByPlaceholderText("选择模型"));
    fireEvent.change(screen.getByPlaceholderText("选择模型"), { target: { value: "zzz" } });
    expect(await screen.findByText("此密钥没有可用模型")).toBeInTheDocument();
    expect(screen.queryByText("No models available for this key")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
  });

  it("renders the Chinese model load failure", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderChat();
    await waitForReady();

    await waitFor(() => expect(screen.getByPlaceholderText("选择模型")).toHaveAttribute("placeholder", "选择模型"));
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByPlaceholderText("选择模型"));
    fireEvent.change(screen.getByPlaceholderText("选择模型"), { target: { value: "zzz" } });
    expect(await screen.findByText("无法为此密钥加载模型")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load models for this key")).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("renders the Chinese loading and endpoint-specific model empty states", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );
    renderChat();
    await waitForReady();

    expect(await screen.findByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese enter-key-to-load-models state", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(screen.getByLabelText("Virtual Key 来源"));
    await user.click(await screen.findByRole("option", { name: "Virtual Key" }));
    await user.click(await screen.findByPlaceholderText("选择模型"));
    fireEvent.change(screen.getByPlaceholderText("选择模型"), { target: { value: "zzz" } });
    expect(await screen.findByText("输入 Virtual Key 以加载模型")).toBeInTheDocument();
    expect(screen.queryByText("Enter a Virtual Key to load models")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-models-for-endpoint state", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "SpeechModel", mode: "audio_speech" },
    ]);
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(await screen.findByPlaceholderText("选择模型"));
    fireEvent.change(screen.getByPlaceholderText("选择模型"), { target: { value: "zzz" } });
    expect(await screen.findByText("此 Endpoint 没有可用模型")).toBeInTheDocument();
    expect(screen.queryByText("No models available for this endpoint")).not.toBeInTheDocument();
  });

  it("renders the Chinese unavailable model-settings tooltip while open", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "ImageModel", mode: "image_generation" },
    ]);
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/images/generations");
    await selectOption("选择模型", "ImageModel");

    expect(await screen.findByLabelText("模型设置不可用")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model Settings unavailable")).not.toBeInTheDocument();
    fireEvent.focus(screen.getByLabelText("模型设置不可用"));
    expect(await screen.findByText("高级参数目前仅支持聊天模型")).toBeInTheDocument();
    expect(
      screen.queryByText("Advanced parameters are only supported for chat models currently"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese generated code dialog and copy toasts", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderChat();
    await waitForReady();

    await user.click(screen.getByRole("button", { name: "获取代码" }));

    expect(await screen.findByText("生成的代码")).toBeInTheDocument();
    expect(screen.queryByText("Generated Code")).not.toBeInTheDocument();
    expect(screen.getByText("SDK 类型")).toBeInTheDocument();
    expect(screen.queryByText("SDK Type")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "复制到剪贴板" }));
    expect(toast.success).toHaveBeenCalledWith("已复制到剪贴板！");

    writeText.mockRejectedValueOnce(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "复制到剪贴板" }));
    expect(toast.error).toHaveBeenCalledWith("无法复制到剪贴板");
  });

  it("renders the Chinese toolsets modal", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(screen.getByLabelText("关于 MCP 服务器和 Toolset"));

    expect(await screen.findByText("Toolset 的工作原理")).toBeInTheDocument();
    expect(screen.queryByText("How Toolsets Work")).not.toBeInTheDocument();
    expect(screen.getByText("是来自一个或多个 MCP 服务器的特定工具的命名集合。", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText("Toolset 不会暴露服务器上的所有工具，而是让 Agent 只获得它需要的工具。", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("are named collections of specific tools from one or more MCP servers.", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("如何使用 Toolset：")).toBeInTheDocument();
    expect(screen.queryByText("How to use a toolset:")).not.toBeInTheDocument();
    expect(screen.getByText("在 MCP 服务器下拉菜单中选择一个", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("（紫色徽章）。", { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText("(purple badge) from the MCP Servers dropdown.", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("工具选择器只会显示该 Toolset 中包含的工具。")).toBeInTheDocument();
    expect(screen.getByText("选择一个工具，填写其参数，然后发送。")).toBeInTheDocument();
    expect(screen.getByText("工具调用会自动路由到正确的底层 MCP 服务器。")).toBeInTheDocument();
    expect(screen.getByText("示例：")).toBeInTheDocument();
    expect(screen.getByText("GitHub Read-only", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Toolset 可能只包含 GitHub MCP 服务器中的", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("list_repos")).toBeInTheDocument();
    expect(screen.getByText("get_file")).toBeInTheDocument();
    expect(screen.getByText("，从而防止 Agent 执行写入操作。", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Example:")).not.toBeInTheDocument();
    expect(screen.getByText("创建 Toolset：")).toBeInTheDocument();
    expect(screen.queryByText("Creating toolsets:")).not.toBeInTheDocument();
    expect(screen.getByText("管理员可以在", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("标签页中创建和管理 Toolset。", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText("随后可以将 Toolset 分配给密钥和团队，以限定其工具访问范围。", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("tab. Toolsets can then be assigned to keys and teams to scope their tool access.", {
        exact: false,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });

  it("renders the Chinese clear-chat toast", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(screen.getByRole("button", { name: "清除对话" }));
    expect(toast.success).toHaveBeenCalledWith("聊天记录已清除。");
  });

  it("renders the Chinese code-interpreter banner, prompts and toggle toast", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "gpt-4o", mode: "chat" },
    ]);
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/responses");
    await selectOption("选择模型", "gpt-4o");

    expect(screen.getByText("Code Interpreter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "启用 Code Interpreter" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "启用 Code Interpreter" }));

    expect(toast.success).toHaveBeenCalledWith("Code Interpreter 已启用！");
    expect(await screen.findByText("Code Interpreter 已启用")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "禁用" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disable" })).not.toBeInTheDocument();
    expect(screen.getByText("生成示例销售数据 CSV 并创建图表")).toBeInTheDocument();
    expect(screen.getByText("创建一张对比各 AI 网关提供商（包括 LiteLLM）的 PNG 柱状图")).toBeInTheDocument();
    expect(screen.getByText("生成 LLM 定价数据的 CSV 并将其可视化为折线图")).toBeInTheDocument();
    expect(screen.queryByText("Generate sample sales data CSV and create a chart")).not.toBeInTheDocument();
  });

  it("renders the Chinese running-code status while a request is in flight", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "gpt-4o", mode: "chat" },
    ]);
    (makeOpenAIResponsesRequest as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/responses");
    await selectOption("选择模型", "gpt-4o");
    await user.click(screen.getByRole("button", { name: "启用 Code Interpreter" }));

    const input = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("正在运行 Python 代码...")).toBeInTheDocument();
    expect(screen.queryByText("Running Python code...")).not.toBeInTheDocument();
  });

  it("renders the Chinese unsupported-provider notice inside the chat sidebar", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "claude-3", mode: "chat" },
    ]);
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/responses");
    await selectOption("选择模型", "claude-3");

    expect(await screen.findByText("申请支持其他提供商")).toBeInTheDocument();
    expect(screen.queryByText("Request support for other providers")).not.toBeInTheDocument();
  });

  it("renders the Chinese validation toasts", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    const input = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");

    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请先选择模型再发送请求"));
    vi.clearAllMocks();

    await selectOption("选择 Endpoint", "/v1/images/edits");
    const imageInput = await screen.findByText("点击或拖拽图片上传");
    fireEvent.keyDown(imageInput, { key: "Enter", code: "Enter" });
    fireEvent.change(screen.getByPlaceholderText("描述你希望如何编辑图片..."), { target: { value: "edit" } });
    fireEvent.keyDown(screen.getByPlaceholderText("描述你希望如何编辑图片..."), { key: "Enter", code: "Enter" });
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请至少上传一张图片用于编辑"));
    vi.clearAllMocks();

    await selectOption("选择 Endpoint", "/v1/a2a/message/send");
    fireEvent.change(screen.getByPlaceholderText("向 A2A Agent 发送消息..."), { target: { value: "hi" } });
    fireEvent.keyDown(screen.getByPlaceholderText("向 A2A Agent 发送消息..."), { key: "Enter", code: "Enter" });
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请选择一个 Agent 以发送消息"));
    void user;
  });

  it("renders the Chinese provide-key validation toast", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择模型", "Model 1");
    await user.click(screen.getByLabelText("Virtual Key 来源"));
    await user.click(await screen.findByRole("option", { name: "Virtual Key" }));

    const input = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请提供 Virtual Key 或选择当前 UI 会话"));
  });

  it("renders the Chinese cancelled-request toast", async () => {
    const user = userEvent.setup({ delay: null });
    (makeOpenAIChatCompletionRequest as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    renderChat();
    await waitForReady();

    await selectOption("选择模型", "Model 1");
    const input = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await user.click(await screen.findByLabelText("停止请求"));
    expect(toast.info).toHaveBeenCalledWith("请求已取消");
  });

  it("renders the Chinese audio and MCP message displays", async () => {
    (fetchModelsModule.fetchAvailableModels as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model_group: "WhisperModel", mode: "audio_transcription" },
    ]);
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/audio/transcriptions");
    await selectOption("选择模型", "WhisperModel");
    const dropZone = await screen.findByText("点击或拖拽音频文件上传");
    fireEvent.drop(dropZone, { dataTransfer: { files: [new File(["a"], "clip.wav", { type: "audio/wav" })] } });
    await screen.findByText("clip.wav");
    const prompt = screen.getByPlaceholderText("可选：为转录添加上下文或提示词...");
    fireEvent.change(prompt, { target: { value: "meeting" } });
    fireEvent.keyDown(prompt, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("🎵 音频文件：clip.wav", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("提示词：meeting", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("🎵 Audio file: clip.wav", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt: meeting", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the Chinese MCP tool call message and success copy", async () => {
    const user = userEvent.setup({ delay: null });
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
    ]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      tools: [{ name: "list_repos", inputSchema: { type: "object", properties: {} } }],
    });
    (callMCPTool as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/mcp-rest/tools/call");
    await selectOption("选择 MCP 服务器", "github");
    await selectOption("选择要调用的工具", "list_repos");
    await user.click(screen.getByLabelText("发送消息"));
    await waitFor(() => expect(callMCPTool).toHaveBeenCalled());

    expect(await screen.findByText("🔧 MCP 工具：list_repos", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("参数：", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("🔧 MCP Tool: list_repos", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Arguments:", { exact: false })).not.toBeInTheDocument();
    expect(await screen.findByText("工具执行成功。")).toBeInTheDocument();
    expect(screen.queryByText("Tool executed successfully.")).not.toBeInTheDocument();
  });

  it("renders the Chinese response error message", async () => {
    (makeOpenAIChatCompletionRequest as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("kaboom"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderChat();
    await waitForReady();

    await selectOption("选择模型", "Model 1");
    const input = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(await screen.findByText("获取响应出错：", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Error fetching response:", { exact: false })).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("renders the Chinese custom model input placeholder", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(await screen.findByPlaceholderText("选择模型"));
    await user.click((await screen.findAllByText("输入自定义模型")).at(-1)!);

    expect(await screen.findByPlaceholderText("输入自定义模型名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter custom model name")).not.toBeInTheDocument();
  });

  it("renders the Chinese image-generation input placeholder", async () => {
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/images/generations");
    expect(await screen.findByPlaceholderText("描述你想要生成的图片...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe the image you want to generate...")).not.toBeInTheDocument();
  });

  it("renders the Chinese speech input placeholder", async () => {
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/audio/speech");
    expect(await screen.findByPlaceholderText("输入要转换为语音的文本...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter text to convert to speech...")).not.toBeInTheDocument();
  });

  it("renders the Chinese MCP direct tooltip, no-server empty state and toolset count", async () => {
    const user = userEvent.setup({ delay: null });
    (fetchMCPToolsets as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        toolset_id: "ts-1",
        toolset_name: "My Toolset",
        tools: [
          { server_id: "srv-1", tool_name: "one" },
          { server_id: "srv-1", tool_name: "two" },
        ],
      },
    ]);
    renderChat();
    await waitForReady();

    await user.click(await screen.findByPlaceholderText("选择 MCP 服务器"));
    expect(await screen.findByText("Toolset（2 个工具）")).toBeInTheDocument();
    expect(screen.queryByText("Toolset (2 tools)")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await selectOption("选择 Endpoint", "/mcp-rest/tools/call");
    await user.hover(screen.getByLabelText("关于 MCP 服务器和 Toolset"));
    expect(await screen.findByText("选择一个 MCP 服务器或 Toolset 以直接测试工具。")).toBeInTheDocument();
    expect(screen.queryByText("Select an MCP server or toolset to test tools directly.")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-MCP-servers empty state", async () => {
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await user.click(await screen.findByPlaceholderText("选择 MCP 服务器"));
    fireEvent.change(screen.getByPlaceholderText("选择 MCP 服务器"), { target: { value: "zzz" } });
    expect(await screen.findByText("没有 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("No MCP servers")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading-tool-schema and wait-tool-schema copy", async () => {
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
    ]);
    (fetchMCPToolsets as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        toolset_id: "ts-1",
        toolset_name: "My Toolset",
        tools: [{ server_id: "srv-1", tool_name: "list_repos" }],
      },
    ]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/mcp-rest/tools/call");
    await selectOption("选择 MCP 服务器", "My Toolset");
    await selectOption("选择要调用的工具", "list_repos");

    expect(await screen.findByText("正在加载工具定义...")).toBeInTheDocument();
    expect(screen.queryByText("Loading tool schema...")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("发送消息"));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请等待工具定义加载完成"));
  });

  it("renders the Chinese required-parameters validation toast", async () => {
    (fetchMCPServers as ReturnType<typeof vi.fn>).mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
    ]);
    (listMCPTools as ReturnType<typeof vi.fn>).mockResolvedValue({
      tools: [
        {
          name: "list_repos",
          inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
        },
      ],
    });
    const user = userEvent.setup({ delay: null });
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/mcp-rest/tools/call");
    await selectOption("选择 MCP 服务器", "github");
    await selectOption("选择要调用的工具", "list_repos");

    await user.click(screen.getByLabelText("发送消息"));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请填写所有必填参数"));
  });

  it("renders the Chinese image-processing failure toast", async () => {
    const user = userEvent.setup({ delay: null });
    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = vi.fn(function (this: FileReader) {
      setTimeout(() => this.onerror?.(new Error("read error") as unknown as ProgressEvent<FileReader>), 0);
    });
    renderChat();
    await waitForReady();

    await selectOption("选择模型", "Model 1");
    // eslint-disable-next-line testing-library/no-node-access -- the sr-only file input carries no accessible name
    const input = screen
      .getByLabelText("附加图片或 PDF")
      .parentElement?.parentElement?.querySelector("input[type=file]");
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["a"], "one.png", { type: "image/png" })] },
    });
    await screen.findByAltText("上传预览");

    const messageInput = screen.getByPlaceholderText("输入你的消息...（Shift+Enter 换行）");
    fireEvent.change(messageInput, { target: { value: "describe" } });
    fireEvent.keyDown(messageInput, { key: "Enter", code: "Enter" });

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("图片处理失败。请重试。"));
    FileReader.prototype.readAsDataURL = originalReadAsDataURL;
  });

  it("reports the Chinese too-many-images validation toast", async () => {
    renderChat();
    await waitForReady();

    await selectOption("选择 Endpoint", "/v1/images/edits");
    const dropZone = await screen.findByText("点击或拖拽图片上传");
    const files = Array.from({ length: 11 }, (_, i) => new File(["a"], `img-${i}.png`, { type: "image/png" }));
    fireEvent.drop(dropZone, { dataTransfer: { files } });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("最多只能上传 10 张图片。"));
  });
});
