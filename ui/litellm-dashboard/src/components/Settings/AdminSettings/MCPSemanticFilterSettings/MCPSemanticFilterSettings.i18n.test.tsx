/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { useMCPSemanticFilterSettings } from "@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useMCPSemanticFilterSettings";
import { useUpdateMCPSemanticFilterSettings } from "@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useUpdateMCPSemanticFilterSettings";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import { toast } from "@/lib/toast";

import MCPSemanticFilterSettings from "./MCPSemanticFilterSettings";

vi.mock("@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useMCPSemanticFilterSettings", () => ({
  useMCPSemanticFilterSettings: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/mcpSemanticFilterSettings/useUpdateMCPSemanticFilterSettings", () => ({
  useUpdateMCPSemanticFilterSettings: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("./MCPSemanticFilterTestPanel", () => ({
  default: () => <div data-testid="mcp-test-panel" />,
}));

vi.mock("./semanticFilterTestUtils", () => ({
  getCurlCommand: vi.fn().mockReturnValue("curl ..."),
  runSemanticFilterTest: vi.fn(),
}));

const STORED = {
  field_schema: { properties: { enabled: { description: "Enable semantic filtering for MCP tools" } } },
  values: { enabled: true, embedding_model: "text-embedding-3-small", top_k: 10, similarity_threshold: 0.3 },
};

const openTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

const settled = (overrides: Record<string, unknown> = {}) =>
  ({ data: STORED, isLoading: false, isError: false, error: null, ...overrides }) as unknown as ReturnType<
    typeof useMCPSemanticFilterSettings
  >;

const renderSettings = (accessToken: string | null = "token") =>
  render(<MCPSemanticFilterSettings accessToken={accessToken} />);

describe("MCPSemanticFilterSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(useMCPSemanticFilterSettings).mockReturnValue(settled());
    vi.mocked(useUpdateMCPSemanticFilterSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateMCPSemanticFilterSettings>);
    vi.mocked(fetchAvailableModels).mockResolvedValue([
      { model_group: "text-embedding-3-large", mode: "embedding" },
    ] as never);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the settings panel in Chinese and hides the English originals", async () => {
    renderSettings();
    expect(await screen.findByText("语义工具筛选")).toBeInTheDocument();

    expect(
      screen.getByText(
        "根据查询相关性对 MCP 工具进行语义筛选。这可以减少上下文窗口大小并提高工具选择准确性。点击“保存设置”以将更改应用到所有 pod（10 秒内生效）。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("启用语义筛选")).toBeInTheDocument();
    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("Top K 结果")).toBeInTheDocument();
    expect(screen.getByText("相似度阈值")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存设置" })).toBeInTheDocument();
    expect(screen.queryByText("Semantic Tool Filtering")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Filter MCP tools semantically based on query relevance. This reduces context window size and improves tool selection accuracy. Click 'Save Settings' to apply changes across all pods (takes effect within 10 seconds).",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Enable Semantic Filtering")).not.toBeInTheDocument();
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Embedding Model")).not.toBeInTheDocument();
    expect(screen.queryByText("Top K Results")).not.toBeInTheDocument();
    expect(screen.queryByText("Similarity Threshold")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save Settings/ })).not.toBeInTheDocument();
  });

  it("renders the field tooltips in Chinese in the same open state and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(await screen.findByText("语义工具筛选")).toBeInTheDocument();

    const enable = await openTooltip(user, "启用语义筛选");
    expect(enable).toHaveTextContent("启用后，将仅根据语义相似度把最相关的 MCP 工具包含在请求中");
    expect(enable).not.toHaveTextContent(
      "When enabled, only the most relevant MCP tools will be included in requests based on semantic similarity",
    );

    const model = await openTooltip(user, "嵌入模型");
    expect(model).toHaveTextContent("用于为语义匹配生成嵌入的模型");
    expect(model).not.toHaveTextContent("The model used to generate embeddings for semantic matching");

    const topK = await openTooltip(user, "Top K 结果");
    expect(topK).toHaveTextContent("筛选后返回的最大工具数量");
    expect(topK).not.toHaveTextContent("Maximum number of tools to return after filtering");

    const threshold = await openTooltip(user, "相似度阈值");
    expect(threshold).toHaveTextContent("工具被纳入所需的最低相似度分数（0-1）");
    expect(threshold).not.toHaveTextContent("Minimum similarity score (0-1) for a tool to be included");
  });

  it("renders the embedding model placeholder in Chinese and hides the English original", async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValue([] as never);
    renderSettings();

    expect(await screen.findByPlaceholderText("选择嵌入模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select embedding model")).not.toBeInTheDocument();
  });

  it("renders the loading placeholder in Chinese and hides the English original", async () => {
    vi.mocked(fetchAvailableModels).mockReturnValue(new Promise(() => {}) as never);
    renderSettings();

    expect(await screen.findByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the login-required, load-failure and update-failure states in Chinese and hides the English originals", async () => {
    const { unmount } = renderSettings(null);
    expect(screen.getByText("请登录以配置语义筛选设置。")).toBeInTheDocument();
    expect(screen.queryByText("Please log in to configure semantic filter settings.")).not.toBeInTheDocument();
    unmount();

    vi.mocked(useMCPSemanticFilterSettings).mockReturnValue(
      settled({ data: undefined, isError: true, error: new Error("boom") }),
    );
    const errored = renderSettings();
    expect(await screen.findByText("无法加载 MCP 语义筛选设置")).toBeInTheDocument();
    expect(screen.queryByText("Could not load MCP Semantic Filter settings")).not.toBeInTheDocument();
    errored.unmount();

    vi.mocked(useMCPSemanticFilterSettings).mockReturnValue(settled());
    vi.mocked(useUpdateMCPSemanticFilterSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("boom"),
    } as unknown as ReturnType<typeof useUpdateMCPSemanticFilterSettings>);
    renderSettings();
    expect(await screen.findByText("无法更新设置")).toBeInTheDocument();
    expect(screen.queryByText("Could not update settings")).not.toBeInTheDocument();
  });

  it("renders the saved alert and update toast in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    vi.mocked(useUpdateMCPSemanticFilterSettings).mockReturnValue({
      mutate: vi.fn((_values: unknown, options: { onSuccess: () => void }) => options.onSuccess()),
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateMCPSemanticFilterSettings>);
    renderSettings();
    expect(await screen.findByText("语义工具筛选")).toBeInTheDocument();

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "保存设置" }));

    expect(await screen.findByText("设置保存成功")).toBeInTheDocument();
    expect(screen.queryByText("Settings saved successfully")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("设置已更新成功。更改将在 10 秒内应用到所有 pod。");
    expect(toast.success).not.toHaveBeenCalledWith(
      "Settings updated successfully. Changes will be applied across all pods within 10 seconds.",
    );
  });
});
