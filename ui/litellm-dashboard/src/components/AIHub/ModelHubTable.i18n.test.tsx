import * as networking from "@/components/networking";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ModelHubTable from "./ModelHubTable";

const mockUseUISettings = vi.hoisted(() => vi.fn());
const mockGetCookie = vi.hoisted(() => vi.fn());
const mockCheckTokenValidity = vi.hoisted(() => vi.fn());

vi.mock("@/components/networking", () => ({
  getUiConfig: vi.fn(),
  modelHubPublicModelsCall: vi.fn(),
  modelHubCall: vi.fn(),
  getConfigFieldSetting: vi.fn(),
  getProxyBaseUrl: vi.fn(() => "http://localhost:4000"),
  getAgentsList: vi.fn(),
  fetchMCPServers: vi.fn(),
  getUiSettings: vi.fn(),
  getClaudeCodeMarketplace: vi.fn(),
  getClaudeCodePluginsList: vi.fn(() => Promise.resolve({ plugins: [] })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/public_model_hub", () => ({
  default: () => <div>Public Model Hub</div>,
}));

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: mockUseUISettings,
}));

vi.mock("@/utils/cookieUtils", () => ({ getCookie: mockGetCookie }));
vi.mock("@/utils/jwtUtils", () => ({ checkTokenValidity: mockCheckTokenValidity }));

const UI_CONFIG = {
  server_root_path: "/",
  proxy_base_url: "http://localhost:4000",
  auto_redirect_to_sso: false,
  admin_ui_disabled: false,
  sso_configured: false,
};

const model = (overrides: Record<string, unknown> = {}) => ({
  model_group: "gpt-4",
  providers: ["openai"],
  max_input_tokens: 128000,
  max_output_tokens: 16384,
  input_cost_per_token: 0.0000025,
  output_cost_per_token: 0.00001,
  mode: "chat",
  tpm: 10000,
  rpm: 200,
  supports_parallel_function_calling: false,
  supports_vision: true,
  supports_function_calling: true,
  supported_openai_params: ["temperature"],
  is_public_model_group: true,
  ...overrides,
});

const agent = (overrides: Record<string, unknown> = {}) => ({
  agent_id: "agent-1",
  agent_card_params: { name: "Billing Router", description: "routes billing questions", version: "2.0" },
  litellm_params: { is_public: true },
  ...overrides,
});

const mcpServer = (overrides: Record<string, unknown> = {}) => ({
  server_id: "srv-1",
  server_name: "exa_test",
  alias: "Exa",
  description: "Search helpers",
  url: "https://mcp.example.com",
  transport: "http",
  auth_type: "api_key",
  created_at: "2026-01-01T00:00:00Z",
  created_by: "admin@example.com",
  updated_at: "2026-01-02T00:00:00Z",
  updated_by: "editor@example.com",
  teams: ["core"],
  mcp_access_groups: ["default"],
  allowed_tools: ["search"],
  extra_headers: [],
  mcp_info: { is_public: true },
  static_headers: {},
  status: "healthy",
  last_health_check: "2026-01-03T00:00:00Z",
  health_check_error: "connection refused",
  command: "npx exa",
  args: [],
  env: {},
  ...overrides,
});

const renderHub = (props: Partial<{ accessToken: string | null; publicPage: boolean; userRole: string | null }> = {}) =>
  renderWithProviders(
    <ModelHubTable
      accessToken={props.accessToken === undefined ? "test-token" : props.accessToken}
      publicPage={props.publicPage ?? false}
      premiumUser={false}
      userRole={props.userRole === undefined ? "Admin" : props.userRole}
    />,
  );

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const openRowAction = async (user: ReturnType<typeof userEvent.setup>, ariaLabel: string) => {
  await user.click(screen.getByLabelText(ariaLabel));
  await user.click(await screen.findByText("查看详情"));
};

beforeEach(async () => {
  await i18n.changeLanguage("zh");
  vi.clearAllMocks();
  vi.mocked(networking.getUiConfig).mockResolvedValue(UI_CONFIG);
  vi.mocked(networking.modelHubCall).mockResolvedValue({ data: [model()] });
  vi.mocked(networking.getConfigFieldSetting).mockResolvedValue({ field_value: false });
  vi.mocked(networking.getAgentsList).mockResolvedValue({ agents: [] });
  vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
  vi.mocked(networking.getUiSettings).mockResolvedValue({ values: {} });
  mockUseUISettings.mockReturnValue({ data: { values: {} }, isLoading: false });
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

describe("ModelHubTable Chinese copy", () => {
  it("renders the page chrome, tabs and make-public actions in Chinese and hides the English originals", async () => {
    renderHub();

    await screen.findByText("AI Hub");
    expectLocalized(
      "将模型、Agent 和 MCP 服务器设为公开，让开发者了解有哪些可用资源。",
      "Make models, agents, and MCP servers public for developers to know what's available.",
    );
    expectLocalized("Model Hub URL：", "Model Hub URL:");
    expect(screen.getByTitle("复制 URL")).toBeInTheDocument();
    expect(screen.queryByTitle("Copy URL")).not.toBeInTheDocument();
    expectLocalized("选择要设为公开的模型", "Select Models to Make Public");
    expectLocalized("选择要设为公开的 Agent", "Select Agents to Make Public");
    expectLocalized("选择要设为公开的 MCP 服务器", "Select MCP Servers to Make Public");
    expectLocalized("选择要设为公开的技能", "Select Skills to Make Public");
    expect(screen.getByRole("tab", { name: "Model Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Agent Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "MCP Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Skill Hub" })).toBeInTheDocument();
  });

  it("renders the member description for non-admin roles in Chinese and hides the English original", async () => {
    renderHub({ userRole: "User" });

    await screen.findByText("AI Hub");
    expectLocalized(
      "你个人可用的所有公开模型名称列表。",
      "A list of all public model names personally available to you.",
    );
  });

  it("renders the loading messages of all three hubs in Chinese and hides the English originals", async () => {
    vi.mocked(networking.modelHubCall).mockImplementation(() => new Promise(() => {}));
    vi.mocked(networking.getAgentsList).mockImplementation(() => new Promise(() => {}));
    vi.mocked(networking.fetchMCPServers).mockImplementation(() => new Promise(() => {}));
    renderHub();

    expect(await screen.findByText("正在加载模型…")).toBeInTheDocument();
    expectLocalized("正在加载模型…", "Loading models…");
    expectLocalized("正在加载 Agent…", "Loading agents…");
    expectLocalized("正在加载 MCP 服务器…", "Loading MCP servers…");
  });

  it("renders the empty states and counts of all three hubs in Chinese and hides the English originals", async () => {
    vi.mocked(networking.modelHubCall).mockResolvedValue({ data: [] });
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
    renderHub();

    await screen.findByText("暂无模型");
    expectLocalized("暂无模型", "No models yet");
    expectLocalized("添加到此代理的模型将在此显示。", "Models added to this proxy will appear here.");
    expectLocalized("正在显示 0 个模型中的 0 个", "Showing 0 of 0 models");
    expectLocalized("暂无 Agent", "No agents yet");
    expectLocalized("添加到此代理的 Agent 将在此显示。", "Agents added to this proxy will appear here.");
    expectLocalized("正在显示 0 个 Agent 中的 0 个", "Showing 0 of 0 agents");
    expectLocalized("暂无 MCP 服务器", "No MCP servers yet");
    expectLocalized("添加到此代理的 MCP 服务器将在此显示。", "MCP servers added to this proxy will appear here.");
    expectLocalized("正在显示 0 个 MCP 服务器", "Showing 0 MCP servers");
  });

  it("renders the no-match states and the agent search controls in Chinese and hides the English originals", async () => {
    vi.mocked(networking.getAgentsList).mockResolvedValue({ agents: [agent()] });
    const user = userEvent.setup();
    renderHub();

    await screen.findByText("gpt-4");
    expectLocalized("搜索 Agent：", "Search Agents:");
    expect(screen.getByPlaceholderText("按名称或描述搜索 Agent...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search agent names or descriptions...")).not.toBeInTheDocument();
    expectLocalized("正在显示 1 个 Agent 中的 1 个", "Showing 1 of 1 agents");

    fireEvent.change(screen.getByPlaceholderText("搜索模型名称..."), { target: { value: "zzzz" } });
    await screen.findByText("没有匹配的模型");
    expectLocalized("没有匹配的模型", "No matching models");
    expectLocalized("调整筛选条件以查看更多模型。", "Adjust the filters to see more models.");

    await user.type(screen.getByPlaceholderText("按名称或描述搜索 Agent..."), "zzzz");
    await screen.findByText("没有匹配的 Agent");
    expectLocalized("没有匹配的 Agent", "No matching agents");
    expectLocalized("调整搜索条件以查看更多 Agent。", "Adjust the search to see more agents.");

    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("renders the MCP singular count in Chinese and the English singular byte-identically", async () => {
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([mcpServer()] as never);
    renderHub();

    await screen.findByText("正在显示 1 个 MCP 服务器");
    expectLocalized("正在显示 1 个 MCP 服务器", "Showing 1 MCP server");

    cleanup();
    await i18n.changeLanguage("en");
    renderHub();
    expect(await screen.findByText("Showing 1 MCP server")).toBeInTheDocument();
  });

  it("renders the model details dialog in Chinese and hides the English originals", async () => {
    const dialogModel = { model_group: "", mode: undefined, tpm: 500, rpm: 100, is_public_model_group: false };
    vi.mocked(networking.modelHubCall).mockResolvedValue({ data: [model(dialogModel)] });
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await screen.findByText("公开模型名称");
    await openRowAction(user, "打开模型操作");

    expectLocalized("模型详情", "Model Details");
    expectLocalized("模型概览", "Model Overview");
    expectLocalized("模型组：", "Model Group:");
    expectLocalized("模式：", "Mode:");
    expectLocalized("提供商：", "Providers:");
    expectLocalized("Token 与成本信息", "Token & Cost Information");
    expectLocalized("最大输入 Token：", "Max Input Tokens:");
    expectLocalized("最大输出 Token：", "Max Output Tokens:");
    expectLocalized("每 100 万输入 Token 成本：", "Input Cost per 1M Tokens:");
    expectLocalized("每 100 万输出 Token 成本：", "Output Cost per 1M Tokens:");
    expectLocalized("能力", "Capabilities");
    expectLocalized("速率限制", "Rate Limits");
    expectLocalized("每分钟 Token 数：", "Tokens per Minute:");
    expectLocalized("每分钟请求数：", "Requests per Minute:");
    expectLocalized("支持的 OpenAI 参数", "Supported OpenAI Parameters");
    expectLocalized("用法示例", "Usage Example");
    expect(screen.getAllByText("未指定").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Not specified")).toHaveLength(0);
  });

  it("renders the no-capabilities copy in Chinese and hides the English original", async () => {
    vi.mocked(networking.modelHubCall).mockResolvedValue({
      data: [model({ supports_vision: false, supports_function_calling: false })],
    });
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await screen.findByText("gpt-4");
    await openRowAction(user, "打开模型操作");

    expectLocalized("未列出特殊能力", "No special capabilities listed");
  });

  it("renders the agent details dialog in Chinese and hides the English originals", async () => {
    vi.mocked(networking.getAgentsList).mockResolvedValue({
      agents: [
        {
          agent_id: "agent-1",
          agent_card_params: {
            name: "",
            description: "routes billing questions",
            version: "2.0",
            protocolVersion: "1.0",
            url: "https://agent.example.com",
            capabilities: { streaming: true },
            defaultInputModes: ["text"],
            defaultOutputModes: ["text"],
            skills: [
              {
                id: "s1",
                name: "Skill One",
                description: "First skill",
                tags: ["billing"],
                examples: ["example one"],
              },
            ],
            supportsAuthenticatedExtendedCard: true,
          },
          litellm_params: { is_public: true },
        },
      ],
    });
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await screen.findByText("公开模型名称");
    await openRowAction(user, "打开 Agent 操作");

    expectLocalized("Agent 详情", "Agent Details");
    expectLocalized("Agent 概览", "Agent Overview");
    expectLocalized("名称：", "Name:");
    expectLocalized("版本：", "Version:");
    expectLocalized("协议版本：", "Protocol Version:");
    expectLocalized("URL：", "URL:");
    expectLocalized("描述：", "Description:");
    expectLocalized("能力", "Capabilities");
    expectLocalized("输入/输出模式", "Input/Output Modes");
    expectLocalized("输入模式：", "Input Modes:");
    expectLocalized("输出模式：", "Output Modes:");
    expectLocalized("技能", "Skills");
    expectLocalized("示例：", "Examples:");
    expectLocalized("附加功能", "Additional Features");
    expectLocalized("支持经过认证的扩展卡片", "Supports Authenticated Extended Card");
    expectLocalized("ID：s1", "ID: s1");
  });

  it("renders the MCP details dialog in Chinese and hides the English originals", async () => {
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([mcpServer({ server_name: "" })] as never);
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderHub();

    await screen.findByText("公开模型名称");
    await openRowAction(user, "打开 MCP 服务器操作");

    expectLocalized("MCP 服务器详情", "MCP Server Details");
    expectLocalized("服务器概览", "Server Overview");
    expectLocalized("服务器名称：", "Server Name:");
    expectLocalized("服务器 ID：", "Server ID:");
    expectLocalized("别名：", "Alias:");
    expectLocalized("传输方式：", "Transport:");
    expectLocalized("认证类型：", "Auth Type:");
    expectLocalized("状态：", "Status:");
    expectLocalized("描述：", "Description:");
    expectLocalized("连接详情", "Connection Details");
    expectLocalized("命令：", "Command:");
    expectLocalized("允许的工具", "Allowed Tools");
    expectLocalized("团队", "Teams");
    expectLocalized("访问组", "Access Groups");
    expectLocalized("元数据", "Metadata");
    expectLocalized("创建者：", "Created By:");
    expectLocalized("更新者：", "Updated By:");
    expectLocalized("创建时间：", "Created At:");
    expectLocalized("更新时间：", "Updated At:");
    expectLocalized("上次健康检查：", "Last Health Check:");
    expectLocalized("健康检查错误：", "Health Check Error:");
    expectLocalized("用法示例", "Usage Example");
  });

  it("renders the public hub not-enabled state in Chinese and hides the English originals", async () => {
    vi.mocked(networking.modelHubPublicModelsCall).mockImplementation(() => new Promise(() => {}));
    renderHub({ accessToken: null, publicPage: true, userRole: "User" });

    expect(await screen.findByText("未启用公共 Model Hub。")).toBeInTheDocument();
    expectLocalized("未启用公共 Model Hub。", "Public Model Hub not enabled.");
    expectLocalized(
      "请联系你的代理管理员在其 Admin UI 中启用此功能。",
      "Ask your proxy admin to enable this on their Admin UI.",
    );
  });
});

describe("ModelHubTable English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    vi.mocked(networking.modelHubCall).mockResolvedValue({ data: [model()] });
    vi.mocked(networking.getConfigFieldSetting).mockResolvedValue({ field_value: false });
    vi.mocked(networking.getAgentsList).mockResolvedValue({ agents: [] });
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
    mockUseUISettings.mockReturnValue({ data: { values: {} }, isLoading: false });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural MCP server counts byte-identical", async () => {
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([mcpServer()] as never);
    renderHub();
    expect(await screen.findByText("Showing 1 MCP server")).toBeInTheDocument();
    cleanup();

    vi.mocked(networking.fetchMCPServers).mockResolvedValue([
      mcpServer(),
      mcpServer({ server_id: "srv-2", server_name: "other" }),
    ] as never);
    renderHub();
    expect(await screen.findByText("Showing 2 MCP servers")).toBeInTheDocument();
    expect(screen.queryByText("Showing 2 MCP server")).not.toBeInTheDocument();
  });

  it("keeps the MCP status wire values byte-identical", async () => {
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([mcpServer({ status: "unhealthy" })] as never);
    renderHub();

    expect(await screen.findByText("unhealthy")).toBeInTheDocument();
  });
});

describe("ModelHubTable public page routing", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(networking.getUiConfig).mockResolvedValue(UI_CONFIG);
    vi.mocked(networking.modelHubPublicModelsCall).mockResolvedValue([]);
    vi.mocked(networking.getUiSettings).mockResolvedValue({ values: {} });
    mockUseUISettings.mockReturnValue({ data: { values: {} }, isLoading: false });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dedicated public hub once the public page is allowed", async () => {
    renderHub({ accessToken: null, publicPage: true, userRole: "User" });

    expect(await screen.findByText("Public Model Hub")).toBeInTheDocument();
  });
});
