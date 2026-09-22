/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import {
  useMCPToolSearchSettings,
  useUpdateMCPToolSearchSettings,
} from "@/app/(dashboard)/hooks/mcpToolSearchSettings/useMCPToolSearchSettings";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";

import MCPToolSearchSettings from "./MCPToolSearchSettings";

vi.mock("@/app/(dashboard)/hooks/mcpToolSearchSettings/useMCPToolSearchSettings", () => ({
  useMCPToolSearchSettings: vi.fn(),
  useUpdateMCPToolSearchSettings: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

const STORED = {
  field_schema: {},
  values: {
    embedding_model: "text-embedding-3-small",
    top_k: 3,
    similarity_threshold: 0.25,
    core_tools: ["treasury-get_rates"],
  },
};

const settled = (overrides: Record<string, unknown> = {}) =>
  ({ data: STORED, isLoading: false, isError: false, error: null, ...overrides }) as unknown as ReturnType<
    typeof useMCPToolSearchSettings
  >;

const openTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

const renderSettings = (accessToken: string | null = "token") =>
  render(<MCPToolSearchSettings accessToken={accessToken} />);

describe("MCPToolSearchSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(useMCPToolSearchSettings).mockReturnValue(settled());
    vi.mocked(useUpdateMCPToolSearchSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMCPToolSearchSettings>);
    vi.mocked(fetchAvailableModels).mockResolvedValue([
      { model_group: "text-embedding-3-small", mode: "embedding" },
    ] as never);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the panel headings and fields in Chinese and hides the English originals", async () => {
    renderSettings();
    expect(await screen.findByText("原生 MCP 工具搜索")).toBeInTheDocument();

    const description = screen.getByText("原生 MCP 工具搜索").closest("div")?.parentElement;
    expect(description).toHaveTextContent(
      "控制原生 MCP 客户端用于发现工具的 mcp_tool_search 虚拟工具。设置嵌入模型后，工具会按其名称和描述的含义排序，因此像 “FX” 这样的查询可以找到 “foreign exchange rates” 工具。未设置时则使用关键字匹配。调用方始终只能看到其 Key、团队和服务器权限已允许的工具。",
    );
    expect(description).not.toHaveTextContent(
      "Controls the mcp_tool_search virtual tool that native MCP clients call to discover tools.",
    );
    expect(screen.getByText("排序")).toBeInTheDocument();
    expect(screen.getByText("核心工具")).toBeInTheDocument();
    expect(screen.getByText("嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("Top K 结果")).toBeInTheDocument();
    expect(screen.getByText("相似度阈值")).toBeInTheDocument();
    expect(screen.getByText("始终优先返回")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存设置" })).toBeInTheDocument();
    expect(screen.queryByText("Native MCP Tool Search")).not.toBeInTheDocument();
    expect(screen.queryByText("Ranking")).not.toBeInTheDocument();
    expect(screen.queryByText("Core Tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Embedding Model")).not.toBeInTheDocument();
    expect(screen.queryByText("Top K Results")).not.toBeInTheDocument();
    expect(screen.queryByText("Similarity Threshold")).not.toBeInTheDocument();
    expect(screen.queryByText("Always Returned First")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Settings" })).not.toBeInTheDocument();
  });

  it("renders the field tooltips in Chinese in the same open state and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();
    expect(await screen.findByText("原生 MCP 工具搜索")).toBeInTheDocument();

    const model = await openTooltip(user, "嵌入模型");
    expect(model).toHaveTextContent("模型列表中用于按含义对工具排序的嵌入模型。清除后将回退到关键字匹配。");
    expect(model).not.toHaveTextContent(
      "Embedding model from your model list used to rank tools by meaning. Clear it to fall back to keyword matching.",
    );

    const topK = await openTooltip(user, "Top K 结果");
    expect(topK).toHaveTextContent("一次搜索返回的排序工具数量上限。工具调用中更小的 top_k 优先。核心工具不计数。");
    expect(topK).not.toHaveTextContent(
      "Most ranked tools a search returns. A smaller top_k in the tool call wins. Core tools do not count.",
    );

    const threshold = await openTooltip(user, "相似度阈值");
    expect(threshold).toHaveTextContent("工具出现在语义结果中所需的最低余弦相似度。0 表示不设阈值。");
    expect(threshold).not.toHaveTextContent(
      "Lowest cosine similarity a tool needs to appear in semantic results. 0 means no cutoff.",
    );

    const alwaysFirst = await openTooltip(user, "始终优先返回");
    expect(alwaysFirst).toHaveTextContent(
      "每行一个工具名称，例如 my_server-get_rates。只要调用方有权使用，它们会排在排序结果之前。",
    );
    expect(alwaysFirst).not.toHaveTextContent(
      "One tool name per line, e.g. my_server-get_rates. Listed before ranked results whenever the caller is allowed to use them.",
    );
  });

  it("renders the embedding model placeholder and empty state in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAvailableModels).mockResolvedValue([] as never);
    vi.mocked(useMCPToolSearchSettings).mockReturnValue(
      settled({ data: { field_schema: {}, values: { embedding_model: null, top_k: 3, similarity_threshold: 0 } } }),
    );
    renderSettings();
    expect(await screen.findByPlaceholderText("关键字匹配（无嵌入模型）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Keyword matching (no embedding model)")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("嵌入模型"));

    expect(await screen.findByText("没有可用的嵌入模型")).toBeInTheDocument();
    expect(screen.queryByText("No embedding models available")).not.toBeInTheDocument();
  });

  it("renders the login-required and load-failure states in Chinese and hides the English originals", async () => {
    const { unmount } = renderSettings(null);
    expect(screen.getByText("请登录以配置工具搜索。")).toBeInTheDocument();
    expect(screen.queryByText("Please log in to configure tool search.")).not.toBeInTheDocument();
    unmount();

    vi.mocked(useMCPToolSearchSettings).mockReturnValue(
      settled({ data: undefined, isError: true, error: new Error("boom") }),
    );
    renderSettings();

    expect(await screen.findByText("无法加载 MCP 工具搜索设置")).toBeInTheDocument();
    expect(screen.queryByText("Could not load MCP tool search settings")).not.toBeInTheDocument();
  });
});
