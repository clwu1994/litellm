import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import type { VectorStoreSearchResponse } from "@/components/chat_ui/types";
import ChatMessageBubble from "./ChatMessageBubble";
import { ChatComposer, CodeInterpreterToggle } from "./ChatComposer";
import CodeInterpreterOutput from "./CodeInterpreterOutput";
import CodeInterpreterTool from "./CodeInterpreterTool";
import EndpointSelector from "./EndpointSelector";
import { SearchResultsDisplay } from "./SearchResultsDisplay";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn(() => "https://example.com"),
  getGlobalLitellmHeaderName: vi.fn(() => "Authorization"),
}));

const CHART_ANNOTATION = {
  type: "container_file_citation" as const,
  container_id: "container-1",
  file_id: "file-1",
  filename: "chart.png",
  start_index: 0,
  end_index: 10,
};

describe("chat widgets Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    URL.createObjectURL = vi.fn(() => "blob:chart");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.unstubAllGlobals();
  });

  it("renders the Chinese code interpreter output chrome", () => {
    render(<CodeInterpreterOutput code="print('hello')" accessToken="token" />);

    expect(screen.getByText("已执行的 Python 代码")).toBeInTheDocument();
    expect(screen.queryByText("Python Code Executed")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading, download and unavailable image states", async () => {
    let resolveBlob: (value: Blob) => void = () => {};
    const pending = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: () => pending }));

    const { unmount } = render(
      <CodeInterpreterOutput code="code" annotations={[CHART_ANNOTATION]} accessToken="token" />,
    );
    expect(await screen.findByText("正在加载图片...")).toBeInTheDocument();
    expect(screen.queryByText("Loading image...")).not.toBeInTheDocument();
    resolveBlob(new Blob(["x"]));
    await waitFor(() => expect(screen.queryByText("正在加载图片...")).not.toBeInTheDocument());
    expect(await screen.findByText("下载")).toBeInTheDocument();
    expect(screen.queryByText("Download")).not.toBeInTheDocument();
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, blob: vi.fn() }));
    render(<CodeInterpreterOutput code="code" annotations={[CHART_ANNOTATION]} accessToken="token" />);
    expect(await screen.findByText("图片不可用")).toBeInTheDocument();
    expect(screen.queryByText("Image not available")).not.toBeInTheDocument();
  });

  it("renders the Chinese code interpreter tool chrome and its tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CodeInterpreterTool
        accessToken="token"
        enabled={false}
        onEnabledChange={vi.fn()}
        selectedContainerId={null}
        onContainerChange={vi.fn()}
        selectedModel="gpt-4o"
      />,
    );

    expect(screen.getByText("Code Interpreter")).toBeInTheDocument();
    expect(screen.getByLabelText("启用 Code Interpreter")).toBeInTheDocument();
    expect(screen.queryByLabelText("Enable Code Interpreter")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("关于 Code Interpreter"));
    expect(await screen.findByText("运行 Python 代码以生成文件、图表并分析数据。容器会自动创建。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Run Python code to generate files, charts, and analyze data. Container is created automatically.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese unsupported-provider notice", () => {
    render(
      <CodeInterpreterTool
        accessToken="token"
        enabled={false}
        onEnabledChange={vi.fn()}
        selectedContainerId={null}
        onContainerChange={vi.fn()}
        selectedModel="claude-3"
      />,
    );

    expect(screen.getByText("Code Interpreter 目前仅支持 OpenAI 模型。", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("申请支持其他提供商")).toBeInTheDocument();
    expect(screen.queryByText("Request support for other providers")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Code Interpreter is currently only supported for OpenAI models.", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese search source chrome", async () => {
    const user = userEvent.setup({ delay: null });
    const results: VectorStoreSearchResponse[] = [
      {
        object: "search",
        search_query: "pricing",
        data: [
          { score: 0.5, content: [{ text: "first", type: "text" }], attributes: { page: 2 } },
          { score: 0.4, content: [{ text: "second", type: "text" }], file_id: "f-2" },
        ],
      },
    ];
    render(<SearchResultsDisplay searchResults={results} />);

    expect(screen.getByText("隐藏来源")).toBeInTheDocument();
    expect(screen.queryByText("Hide sources")).not.toBeInTheDocument();
    expect(screen.getByText("查询：")).toBeInTheDocument();
    expect(screen.queryByText("Query:")).not.toBeInTheDocument();
    expect(screen.getByText("2 条结果")).toBeInTheDocument();
    expect(screen.queryByText("2 results")).not.toBeInTheDocument();
    expect(screen.getByText("结果 1")).toBeInTheDocument();
    expect(screen.queryByText("Result 1")).not.toBeInTheDocument();

    await user.click(screen.getByText("结果 1"));
    expect(await screen.findByText("元数据：")).toBeInTheDocument();
    expect(screen.queryByText("Metadata:")).not.toBeInTheDocument();

    await user.click(screen.getByText("隐藏来源"));
    expect(screen.getByText("显示来源（2）")).toBeInTheDocument();
    expect(screen.queryByText("Show sources (2)")).not.toBeInTheDocument();
  });

  it("renders the English singular result count, the zh-unreachable results_one leaf", async () => {
    await i18n.changeLanguage("en");
    const results: VectorStoreSearchResponse[] = [
      {
        object: "search",
        search_query: "pricing",
        data: [{ score: 0.5, content: [{ text: "only", type: "text" }] }],
      },
    ];
    render(<SearchResultsDisplay searchResults={results} />);

    expect(screen.getByText("1 result")).toBeInTheDocument();
    expect(screen.queryByText("1 results")).not.toBeInTheDocument();
  });

  it("aliases the message role and renders the Chinese generated image alt", () => {
    const roles: Array<[string, string]> = [
      ["user", "用户"],
      ["assistant", "助手"],
      ["system", "系统"],
      ["tool", "工具"],
    ];
    for (const [role, chinese] of roles) {
      const { unmount } = render(
        <ChatMessageBubble
          message={{ role, content: "hello" }}
          isLastMessage={false}
          endpointType={EndpointType.CHAT}
          mcpEvents={[]}
          codeInterpreterResult={null}
          accessToken="token"
        />,
      );
      expect(screen.getByText(chinese), role).toBeInTheDocument();
      expect(screen.queryByText(role), role).not.toBeInTheDocument();
      unmount();
    }

    render(
      <ChatMessageBubble
        message={{ role: "assistant", content: "https://example.com/i.png", isImage: true }}
        isLastMessage={false}
        endpointType={EndpointType.CHAT}
        mcpEvents={[]}
        codeInterpreterResult={null}
        accessToken="token"
      />,
    );
    expect(screen.getByAltText("生成的图片")).toBeInTheDocument();
    expect(screen.queryByAltText("Generated image")).not.toBeInTheDocument();
  });

  it("renders the Chinese composer aria labels and the code interpreter toggle", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<ChatComposer value="hi" onChange={vi.fn()} onSubmit={vi.fn()} placeholder="输入" />);
    expect(screen.getByLabelText("发送消息")).toBeInTheDocument();
    expect(screen.queryByLabelText("Send message")).not.toBeInTheDocument();
    unmount();

    render(
      <ChatComposer value="hi" onChange={vi.fn()} onSubmit={vi.fn()} onCancel={vi.fn()} placeholder="输入" isLoading />,
    );
    expect(screen.getByLabelText("停止请求")).toBeInTheDocument();
    expect(screen.queryByLabelText("Stop request")).not.toBeInTheDocument();
    unmount();

    const enabled = render(<CodeInterpreterToggle enabled={false} onToggle={vi.fn()} />);
    expect(screen.getByLabelText("启用 Code Interpreter")).toBeInTheDocument();
    await user.hover(screen.getByLabelText("启用 Code Interpreter"));
    expect(await screen.findByText("启用 Code Interpreter")).toBeInTheDocument();
    enabled.unmount();

    render(<CodeInterpreterToggle enabled onToggle={vi.fn()} />);
    expect(screen.getByLabelText("Code Interpreter 已启用（点击禁用）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Code Interpreter enabled (click to disable)")).not.toBeInTheDocument();
  });

  it("renders the Chinese endpoint selector placeholder", () => {
    render(<EndpointSelector endpointType={null} onEndpointChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择 Endpoint")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an endpoint")).not.toBeInTheDocument();
  });

  it("reports the Chinese code interpreter disabled toast is unreachable while disabled", () => {
    render(
      <CodeInterpreterTool
        accessToken="token"
        enabled={false}
        onEnabledChange={vi.fn()}
        selectedContainerId={null}
        onContainerChange={vi.fn()}
        selectedModel="claude-3"
      />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("aria-disabled", "true");
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
