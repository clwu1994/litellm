import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import { findTooltipTriggerBeside } from "@/../tests/i18nTooltip";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import PublicModelHub from "./public_model_hub";
import { AgentCard, MCPServerData, ModelGroupInfo } from "./PublicModelHubTableColumns";

const { apiGetMock } = vi.hoisted(() => ({ apiGetMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() })),
}));

vi.mock("./networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./networking")>();
  return {
    ...actual,
    apiClient: { ...actual.apiClient, get: apiGetMock },
    modelHubPublicModelsCall: vi.fn().mockResolvedValue([]),
    getPublicModelHubInfo: vi.fn(),
    agentHubPublicModelsCall: vi.fn().mockResolvedValue([]),
    mcpHubPublicServersCall: vi.fn().mockResolvedValue([]),
    skillHubPublicCall: vi.fn().mockResolvedValue({ plugins: [] }),
    getUiConfig: vi.fn().mockResolvedValue({}),
  };
});

vi.mock("./navbar", () => ({
  default: vi.fn(() => <div data-testid="navbar">Navbar Component</div>),
}));

import { agentHubPublicModelsCall, getPublicModelHubInfo, mcpHubPublicServersCall } from "./networking";

const MODEL_HUB_PATH = "/public/v1/model_hub";

const HUB_INFO = {
  docs_title: "LiteLLM Gateway",
  custom_docs_description: null,
  litellm_version: "1.0.0",
  useful_links: { Docs: { url: "https://docs.example.com", index: 0 } },
};

const model = (overrides: Partial<ModelGroupInfo> & { model_group: string }): ModelGroupInfo => ({
  providers: ["openai"],
  mode: "chat",
  supports_function_calling: false,
  supports_vision: false,
  supports_parallel_function_calling: false,
  ...overrides,
});

const agent = (overrides: Partial<AgentCard> = {}): AgentCard => ({
  protocolVersion: "1.0",
  name: "Billing Router",
  description: "routes billing questions",
  url: "https://agent.example.com",
  version: "2.0",
  capabilities: { streaming: true },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [{ id: "s1", name: "Skill One", description: "First skill", tags: [] }],
  ...overrides,
});

const mcpServer = (overrides: Partial<MCPServerData> = {}): MCPServerData => ({
  server_id: "srv-1",
  name: "exa_test",
  server_name: "exa_test",
  alias: "Exa",
  transport: "http",
  auth_type: "api_key",
  mcp_info: { server_name: "exa_test", description: "Search helpers" },
  ...overrides,
});

const FACET_VALUES: Record<string, string[]> = {
  [`${MODEL_HUB_PATH}/providers`]: ["openai"],
  [`${MODEL_HUB_PATH}/modes`]: ["chat"],
  [`${MODEL_HUB_PATH}/features`]: ["vision"],
};

const listEnvelope = (rows: ModelGroupInfo[], totalCount: number = rows.length, pageSize: number = 50) => ({
  data: rows,
  meta: {
    total_count: totalCount,
    page: 1,
    page_size: pageSize,
    total_pages: Math.max(Math.ceil(totalCount / pageSize), 1),
  },
  links: { self: MODEL_HUB_PATH, first: MODEL_HUB_PATH, prev: null, next: null, last: MODEL_HUB_PATH },
});

let pendingRelease: (() => void) | null = null;

const respondWith = (rows: ModelGroupInfo[], options: { gate?: boolean } = {}) => {
  pendingRelease = null;
  apiGetMock.mockImplementation((path: string) => {
    const facet = FACET_VALUES[path];
    if (facet) {
      return Promise.resolve({
        data: facet,
        meta: { page: 1, page_size: 100, has_more: false },
        links: { self: path, prev: null, next: null },
      });
    }
    if (options.gate) {
      return new Promise((resolve) => {
        pendingRelease = () => resolve(listEnvelope(rows));
      });
    }
    return Promise.resolve(listEnvelope(rows));
  });
};

const releaseModels = async () => {
  await screen.findByText("正在加载模型…", {}, { timeout: 5000 });
  expect(pendingRelease).not.toBeNull();
  pendingRelease?.();
  pendingRelease = null;
  await waitFor(() => expect(screen.queryByText("正在加载模型…")).not.toBeInTheDocument());
};

const renderHub = (props: { isEmbedded?: boolean } = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <PublicModelHub {...props} />
    </QueryClientProvider>,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const hasParagraphText = (text: string): boolean =>
  screen.queryAllByText((_, el) => el?.tagName === "P" && normalize(el.textContent ?? "") === normalize(text)).length >
  0;

const hoverInfoNextTo = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.hover(findTooltipTriggerBeside(screen.getByText(label)));
};

beforeEach(async () => {
  await i18n.changeLanguage("zh");
  vi.clearAllMocks();
  vi.mocked(getPublicModelHubInfo).mockResolvedValue(HUB_INFO);
  vi.mocked(agentHubPublicModelsCall).mockResolvedValue([]);
  vi.mocked(mcpHubPublicServersCall).mockResolvedValue([]);
  respondWith([model({ model_group: "gpt-4" })]);
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

describe("PublicModelHub Chinese copy", () => {
  it("renders the about, useful links and health chrome in Chinese and hides the English originals", async () => {
    renderHub();

    await screen.findByText("关于");
    expectLocalized("关于", "About");
    expectLocalized(
      "以 OpenAI 格式调用 100+ LLM 的代理服务器。",
      "Proxy Server to call 100+ LLMs in the OpenAI format.",
    );
    expectLocalized("基于 litellm 构建：v1.0.0", "Built with litellm: v1.0.0");
    expectLocalized("实用链接", "Useful Links");
    expectLocalized("健康与 Endpoint 状态", "Health and Endpoint Status");
    expectLocalized("服务状态：我还在运行！✓", "Service status: I'm alive! ✓");
  });

  it("renders the unavailable service status in Chinese and hides the English original", async () => {
    apiGetMock.mockRejectedValue(new Error("boom"));
    renderHub();

    await waitFor(() => expectLocalized("服务状态：服务不可用", "Service status: Service unavailable"));
  });

  it("renders the embedded explainer in Chinese and hides the English original", async () => {
    renderHub({ isEmbedded: true });

    await screen.findByText("这些是你的代理管理员指示在你的公司内可用的模型、Agent 和 MCP 服务器。");
    expectLocalized(
      "这些是你的代理管理员指示在你的公司内可用的模型、Agent 和 MCP 服务器。",
      "These are models, agents, and MCP servers your proxy admin has indicated are available in your company.",
    );
    expect(screen.queryByText("关于")).not.toBeInTheDocument();
  });

  it("renders the model filters in Chinese and hides the English originals", async () => {
    renderHub();
    await screen.findByText("可用模型");

    expectLocalized("可用模型", "Available Models");
    expectLocalized("搜索模型：", "Search Models:");
    expectLocalized("提供商：", "Provider:");
    expectLocalized("模式：", "Mode:");
    expectLocalized("功能：", "Features:");
    expect(screen.getByPlaceholderText("搜索模型名称...")).toBeInTheDocument();
    expect(screen.getByLabelText("搜索模型名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Search model names")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择提供商")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模式")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择功能")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search model names...")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select providers")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select modes")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select features")).not.toBeInTheDocument();
  });

  it("renders the empty provider combobox message in Chinese and hides the English original", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();
    await screen.findByText("可用模型");

    await user.click(screen.getByLabelText("选择提供商"));
    await user.keyboard("zzzz");

    expect(await screen.findByText("未找到提供商")).toBeInTheDocument();
    expect(screen.queryByText("No providers found")).not.toBeInTheDocument();
  });

  it("renders the model search tooltip in Chinese and hides the English original", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();
    await screen.findByText("可用模型");

    await hoverInfoNextTo(user, "搜索模型：");

    expect(
      await screen.findByText(
        "在所有页面中查找名称包含你所输入内容的已发布模型。试试 'grok'、'claude'、'gpt-4' 或 'sonnet'",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Finds every published model whose name contains what you type, across all pages. Try 'grok', 'claude', 'gpt-4', or 'sonnet'",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the empty model state in Chinese and hides the English originals", async () => {
    respondWith([], { gate: true });
    renderHub();

    await releaseModels();

    expectLocalized("没有可用的模型", "No models available");
    expectLocalized(
      "由代理管理员设为公开的模型将在此显示。",
      "Models made public by the proxy admin will appear here.",
    );
  });

  it("renders the no-match model state in Chinese and hides the English originals", async () => {
    respondWith([], { gate: true });
    renderHub();

    await releaseModels();
    fireEvent.change(screen.getByPlaceholderText("搜索模型名称..."), { target: { value: "zzzz" } });
    await releaseModels();

    expectLocalized("没有匹配的模型", "No matching models");
    expectLocalized("调整搜索或筛选条件以查看更多模型。", "Adjust the search or filters to see more models.");
  });

  it("renders the agents tab in Chinese and hides the English originals", async () => {
    vi.mocked(agentHubPublicModelsCall).mockResolvedValue([
      agent(),
      agent({ name: "Support Bot", description: "handles support tickets" }),
    ]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await user.click(await screen.findByRole("tab", { name: "Agent Hub" }));

    expectLocalized("可用 Agent", "Available Agents");
    expectLocalized("搜索 Agent：", "Search Agents:");
    expectLocalized("技能：", "Skills:");
    expectLocalized("正在显示 2 个 Agent 中的 2 个", "Showing 2 of 2 agents");
    expect(screen.getByPlaceholderText("按名称或描述搜索 Agent...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择技能")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select skills")).not.toBeInTheDocument();

    await hoverInfoNextTo(user, "搜索 Agent：");
    expect(await screen.findByText("按名称或描述搜索 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Search agents by name or description")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("按名称或描述搜索 Agent..."), "zzzz");
    await screen.findByText("没有匹配的 Agent");
    expectLocalized("没有匹配的 Agent", "No matching agents");
    expectLocalized("调整搜索或技能筛选以查看更多 Agent。", "Adjust the search or skill filter to see more agents.");
  });

  it("renders the MCP tab in Chinese and hides the English originals", async () => {
    vi.mocked(mcpHubPublicServersCall).mockResolvedValue([mcpServer()]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await user.click(await screen.findByRole("tab", { name: "MCP Hub" }));

    expectLocalized("可用 MCP 服务器", "Available MCP Servers");
    expectLocalized("搜索 MCP 服务器：", "Search MCP Servers:");
    expectLocalized("传输方式：", "Transport:");
    expectLocalized("正在显示 1 个 MCP 服务器中的 1 个", "Showing 1 of 1 MCP servers");
    expect(screen.getByPlaceholderText("搜索 MCP 服务器名称或描述...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择传输类型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select transport types")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search MCP server names or descriptions...")).not.toBeInTheDocument();

    await hoverInfoNextTo(user, "搜索 MCP 服务器：");
    expect(await screen.findByText("按名称或描述搜索 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Search MCP servers by name or description")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("搜索 MCP 服务器名称或描述..."), "zzzz");
    await screen.findByText("没有匹配的 MCP 服务器");
    expectLocalized("没有匹配的 MCP 服务器", "No matching MCP servers");
    expectLocalized(
      "调整搜索或传输筛选以查看更多服务器。",
      "Adjust the search or transport filter to see more servers.",
    );
  });

  it("renders the model details dialog in Chinese and hides the English originals", async () => {
    respondWith([model({ model_group: "gpt-4*", supported_openai_params: ["temperature"] })]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await user.click(await screen.findByRole("button", { name: "gpt-4*" }));

    await screen.findByText("模型概览");
    expectLocalized("模型名称：", "Model Name:");
    expectLocalized("模式：", "Mode:");
    expectLocalized("提供商：", "Providers:");
    expectLocalized("通配符路由", "Wildcard Routing");
    expectLocalized("支持的 OpenAI 参数", "Supported OpenAI Parameters");

    const intro = screen.getByText(/此模型使用通配符路由/);
    expect(intro).toHaveTextContent("此模型使用通配符路由。你可以在看到 * 符号的位置传入任意值。");
    expect(
      hasParagraphText("This model uses wildcard routing. You can pass any value where you see the * symbol."),
    ).toBe(false);

    const example = screen.getByText(/例如，对于/);
    expect(example).toHaveTextContent("例如，对于 gpt-4*，你可以使用任何匹配此模式的字符串（gpt-4my-custom-value）。");
    expect(
      hasParagraphText(
        "For example, with gpt-4*, you can use any string (gpt-4my-custom-value) that matches this pattern.",
      ),
    ).toBe(false);

    expectLocalized("复制到剪贴板", "Copy to clipboard");
    await user.click(screen.getByRole("button", { name: "复制到剪贴板" }));
    expect(toast.success).toHaveBeenCalledWith("已复制到剪贴板！");
    expect(toast.success).not.toHaveBeenCalledWith("Copied to clipboard!");
  });

  it("renders the agent details dialog in Chinese and hides the English originals", async () => {
    vi.mocked(agentHubPublicModelsCall).mockResolvedValue([
      agent({ documentationUrl: "https://docs.example.com/agent" }),
    ]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await user.click(await screen.findByRole("tab", { name: "Agent Hub" }));
    await user.click(await screen.findByRole("button", { name: "Billing Router" }));

    await screen.findByText("Agent 概览");
    expectLocalized("文档", "Documentation");
    expectLocalized("查看文档", "View Documentation");
    expectLocalized("用法示例（A2A 协议）", "Usage Example (A2A Protocol)");
    expectLocalized("第 1 步：获取 Agent 卡片", "Step 1: Retrieve Agent Card");
    expectLocalized("第 2 步：调用 Agent", "Step 2: Call the Agent");
    expect(screen.getAllByText("复制到剪贴板")).toHaveLength(2);
    expect(screen.queryAllByText("Copy to clipboard")).toHaveLength(0);
  });

  it("renders the MCP details dialog in Chinese and hides the English originals", async () => {
    vi.mocked(mcpHubPublicServersCall).mockResolvedValue([mcpServer()]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await user.click(await screen.findByRole("tab", { name: "MCP Hub" }));
    await user.click(await screen.findByRole("button", { name: "exa_test" }));

    await screen.findByText("服务器概览");
    expectLocalized("服务器名称：", "Server Name:");
    expectLocalized("传输方式：", "Transport:");
    expectLocalized("别名：", "Alias:");
    expectLocalized("认证类型：", "Auth Type:");
    expectLocalized("描述：", "Description:");
    expectLocalized("附加信息", "Additional Information");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("http")).toBeInTheDocument();
    expect(within(dialog).getByText("api_key")).toBeInTheDocument();
  });
});
