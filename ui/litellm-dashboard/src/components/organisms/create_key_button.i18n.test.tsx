import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  chooseSelectOption,
  cleanup,
  renderWithProviders,
  screen,
  testQueryClient,
  waitFor,
} from "../../../tests/test-utils";
import { modelAvailableCall, userFilterUICall } from "../networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import CreateKey from "./create_key_button";

const state = vi.hoisted(() => ({
  authorized: {
    accessToken: "test-token",
    userId: "test-user-id",
    userRole: "Admin",
    premiumUser: false,
  },
  can: {} as Record<string, boolean>,
  uiSettings: {} as Record<string, unknown>,
  tags: {} as Record<string, { name: string }>,
  teams: [] as { team_id: string; team_alias: string; models: string[]; organization_id?: string }[],
  organizations: [] as { organization_id: string; organization_alias: string }[],
  accessGroups: [] as { access_group_id: string; access_group_name: string }[],
  projects: [] as { project_id: string; project_alias: string; team_id?: string; models?: string[] }[],
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: React.ReactElement }) => <>{render}</>,
  TooltipContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SimpleTooltip: ({ children, content }: { children?: React.ReactNode; content?: React.ReactNode }) => (
    <div>
      {children}
      <div>{content}</div>
    </div>
  ),
}));

vi.mock("@/app/(dashboard)/guardrails/_components/content_filter/TagsInput", () => ({
  TagsInput: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    fromError: vi.fn(),
    dismiss: vi.fn(),
  },
}));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => state.authorized }));
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (capability: string) => state.can[capability] ?? true,
}));
vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: () => ({ data: state.organizations, isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/projects/useProjects", () => ({
  useProjects: () => ({ data: state.projects, isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: () => ({ data: { values: state.uiSettings } }),
}));
vi.mock("@/app/(dashboard)/hooks/tags/useTags", () => ({
  useTags: () => ({ data: state.tags, isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useInfiniteTeams: () => ({
    data: { pages: [{ teams: state.teams, total: state.teams.length, page: 1, page_size: 50, total_pages: 1 }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));
vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: () => ({ data: state.accessGroups, isLoading: false, isError: false }),
}));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPAccessGroups", () => ({
  useMCPAccessGroups: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({
  useMCPToolsets: () => ({ data: [], isLoading: false }),
}));

vi.mock("../networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../networking")>();
  const emptyMcpTools = { tools: [], error: null, message: null, stack_trace: null };
  return {
    ...actual,
    keyCreateCall: vi.fn().mockResolvedValue({ key: "sk-created", soft_budget: null }),
    keyCreateServiceAccountCall: vi.fn().mockResolvedValue({ key: "sk-service-account", soft_budget: null }),
    modelAvailableCall: vi.fn().mockResolvedValue({ data: [{ id: "gpt-4" }] }),
    getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
    getPoliciesList: vi.fn().mockResolvedValue({ policies: [] }),
    getPromptsList: vi.fn().mockResolvedValue({ prompts: [] }),
    getPossibleUserRoles: vi.fn().mockResolvedValue({}),
    userFilterUICall: vi.fn().mockResolvedValue([]),
    getAgentsList: vi.fn().mockResolvedValue({ agents: [] }),
    getClaudeCodePluginsList: vi.fn().mockResolvedValue({
      plugins: [
        { name: "public-skill", enabled: true },
        { name: "private-skill", enabled: false },
      ],
      count: 2,
    }),
    getPassThroughEndpointsCall: vi.fn().mockResolvedValue({ endpoints: [] }),
    vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }),
    listMCPTools: vi.fn().mockResolvedValue(emptyMcpTools),
    getRouterSettingsCall: vi.fn().mockResolvedValue({ router_settings: {} }),
  };
});

const OPENAPI_SCHEMA = {
  components: {
    schemas: {
      GenerateKeyRequest: {
        properties: {
          key: { type: "string", title: "Key" },
          soft_budget: { type: "number", title: "Soft Budget" },
          blocked: { type: "boolean", title: "Blocked" },
          max_budget: { type: "number", title: "Max Budget" },
        },
      },
    },
  },
};

const renderCreateKey = (props: Partial<React.ComponentProps<typeof CreateKey>> = {}) =>
  renderWithProviders(<CreateKey team={null} teams={[]} data={[]} addKey={vi.fn()} {...props} />);

const openDialog = async () => {
  const user = userEvent.setup();
  renderCreateKey();
  await user.click(screen.getByRole("button", { name: "+ 创建新密钥" }));
  return user;
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en), `English "${en}" still present for zh "${zh}"`).toHaveLength(0);
};

describe("CreateKey Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    testQueryClient.clear();
    state.authorized = { accessToken: "test-token", userId: "test-user-id", userRole: "Admin", premiumUser: false };
    state.can = {};
    state.uiSettings = {};
    state.tags = {};
    state.teams = [];
    state.organizations = [];
    state.projects = [];
    state.accessGroups = [];
    vi.mocked(userFilterUICall).mockReset().mockResolvedValue([]);
    vi.mocked(modelAvailableCall)
      .mockReset()
      .mockResolvedValue({ data: [{ id: "gpt-4" }] });
    vi.mocked(toast.fromError).mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("openapi.json")) {
          return { ok: true, status: 200, json: async () => OPENAPI_SCHEMA } as unknown as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
      }),
    );
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.unstubAllGlobals();
  });

  it("renders the ownership section in Chinese and hides the English originals", async () => {
    await openDialog();

    expect(screen.getByText("创建新密钥")).toBeInTheDocument();
    expect(screen.queryByText("Create New Key")).not.toBeInTheDocument();
    expectLocalized("密钥归属", "Key Ownership");
    expectLocalized("归属", "Owned By");
    expectLocalized("选择此 Virtual Key 的归属者", "Select who will own this Virtual Key");
    expectLocalized("你", "You");
    expectLocalized("服务账号", "Service Account");
    expectLocalized("其他用户", "Another User");
    expect(screen.getAllByText("Agent").length).toBeGreaterThan(0);
    expectLocalized("新", "New");
    expectLocalized("组织", "Organization");
    expectLocalized(
      "该密钥所属的组织。选择组织会筛选可用的团队。",
      "The organization this key belongs to. Selecting an organization filters the available teams.",
    );
    expectLocalized("团队", "Team");
    expectLocalized(
      "该密钥所属的团队，决定可用的模型和预算限制",
      "The team this key belongs to, which determines available models and budget limits",
    );
  });

  it("renders the user picker and agent sections in Chinese and hides the English originals", async () => {
    const user = await openDialog();

    await user.click(screen.getByText("其他用户"));

    expectLocalized("用户 ID", "User ID");
    expectLocalized(
      "将拥有此密钥并对其使用负责的用户",
      "The user who will own this key and be responsible for its usage",
    );
    expect(screen.getByPlaceholderText("输入邮箱以搜索用户")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type email to search for users")).not.toBeInTheDocument();
    expectLocalized("创建用户", "Create User");
    expectLocalized("通过邮箱搜索用户", "Search by email to find users");

    await user.click(screen.getByText("Agent", { selector: "label" }));

    expectLocalized("选择 Agent", "Select Agent");
    expect(screen.getByPlaceholderText("选择一个 Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an agent")).not.toBeInTheDocument();
    expectLocalized(
      "此密钥将由所选 Agent 用于向 LiteLLM 发起请求",
      "This key will be used by the selected agent to make requests to LiteLLM",
    );
  });

  it("renders the key details section in Chinese and hides the English originals", async () => {
    await openDialog();

    expectLocalized("密钥详情", "Key Details");
    expectLocalized("密钥名称", "Key Name");
    expectLocalized("用于标识此密钥的描述性名称", "A descriptive name to identify this key");
    expectLocalized("模型", "Models");
    expectLocalized(
      "选择此密钥可以访问的模型。选择“所有团队模型”可授予对团队所有可用模型的访问权限。留空表示允许访问所有模型。",
      "Select which models this key can access. Choose 'All Team Models' to grant access to all models available to the team. Leave empty to allow access to all models.",
    );
    expectLocalized("可选 - 留空表示允许访问所有模型", "optional - leave empty to allow access to all models");
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models")).not.toBeInTheDocument();
    expectLocalized("密钥类型", "Key Type");
    expectLocalized(
      "选择密钥类型以确定此密钥可以访问的路由和操作",
      "Select the type of key to determine what routes and operations this key can access",
    );
  });

  it("renders the optional settings in Chinese and hides the English originals", async () => {
    const user = await openDialog();

    await user.click(screen.getByText("可选设置"));

    expectLocalized("最大预算（USD）", "Max Budget (USD)");
    expectLocalized(
      "此密钥可以消费的最大美元金额。达到后，该密钥将被阻止继续发起请求",
      "Maximum amount in USD this key can spend. When reached, the key will be blocked from making further requests",
    );
    expectLocalized("预算不能超过团队最大预算：$不限", "Budget cannot exceed team max budget: $unlimited");
    expectLocalized("重置预算", "Reset Budget");
    expectLocalized(
      "预算重置的频率。例如设置为 'daily' 将每 24 小时重置一次预算",
      "How often the budget should reset. For example, setting 'daily' will reset the budget every 24 hours",
    );
    expectLocalized("团队重置预算：未设置", "Team Reset Budget: None");
    expectLocalized("预算窗口", "Budget Windows");
    expectLocalized(
      "设置多个独立的预算窗口（例如每小时 $10 且每月 $200）。每个窗口单独跟踪消费并按各自的时间表重置。",
      "Set multiple independent budget windows (e.g., hourly $10 AND monthly $200). Each window tracks spend separately and resets on its own schedule.",
    );
    expectLocalized("按模型预算", "Per-Model Budgets");
    expectLocalized(
      "按模型限制消费，每个模型有自己的重置窗口。对该密钥发出的每个请求都生效；用量显示在该密钥的信息页上。",
      "Cap spend on individual models, each with its own reset window. Enforced across every request this key makes; usage is reported on the key's info page.",
    );
    expectLocalized("预算回退", "Budget Fallbacks");
    expectLocalized(
      "当模型超出其按模型预算（model_max_budget）时，请求会自动改道到回退模型，而不是失败。可在高级设置中配置按模型预算。",
      "When a model exceeds its per-model budget (model_max_budget), requests automatically reroute to fallback models instead of failing. Configure per-model budgets in Advanced Settings.",
    );
    expectLocalized("每分钟 Token 数上限（TPM）", "Tokens per minute Limit (TPM)");
    expectLocalized(
      "此密钥每分钟可以处理的最大 Token 数。有助于控制用量和成本",
      "Maximum number of tokens this key can process per minute. Helps control usage and costs",
    );
    expectLocalized("TPM 不能超过团队 TPM 上限：不限", "TPM cannot exceed team TPM limit: unlimited");
    expectLocalized("每分钟请求数上限（RPM）", "Requests per minute Limit (RPM)");
    expectLocalized(
      "此密钥每分钟可以发起的最大 API 请求数。有助于防止滥用并管理负载",
      "Maximum number of API requests this key can make per minute. Helps prevent abuse and manage load",
    );
    expectLocalized("RPM 不能超过团队 RPM 上限：不限", "RPM cannot exceed team RPM limit: unlimited");
    expectLocalized("按标签速率限制", "Per-Tag Rate Limits");
    expectLocalized(
      "将速率限制限定到请求标签，使每个标签（例如一个 cell 或 group）拥有独立的 RPM 计数器。没有匹配标签的请求回退到密钥级限制。",
      "Scope rate limits to a request tag so each tag (e.g. a cell or group) gets its own RPM counter. Requests without a matching tag fall back to the key-level limit.",
    );
    expectLocalized("超出预算时限流", "Throttle on budget exceeded");
    expectLocalized(
      "当该密钥超出最大预算时，将其 TPM/RPM 限流到全局配置的百分比，而不是完全阻止访问。需要在 litellm_settings 中配置 budget_exceeded_throttle_percentage，并为该密钥设置 TPM/RPM 上限。",
      "When this key exceeds its max budget, throttle its TPM/RPM to the globally configured percentage instead of blocking access entirely. Requires budget_exceeded_throttle_percentage in litellm_settings and a TPM/RPM limit on the key.",
    );
    expectLocalized("启用提示词缓存", "Enable Prompt Caching");
    expectLocalized(
      "自动为使用该密钥的请求添加提示词缓存断点（cache_control 标记），降低重复提示词的输入成本。适用于 Anthropic 和 Bedrock Claude 模型；已自行设置 cache_control 标记的请求不受影响。",
      "Automatically add prompt caching breakpoints (cache_control markers) to requests made with this key, cutting input cost on repeated prompts. Applies to Anthropic and Bedrock Claude models; requests that already set their own cache_control markers are left untouched.",
    );
    expect(screen.getAllByText("Guardrails").length).toBeGreaterThan(0);
    expectLocalized(
      "为此密钥应用安全 Guardrails，以过滤内容或执行策略",
      "Apply safety guardrails to this key to filter content or enforce policies",
    );
    expectLocalized("选择现有 Guardrails 或输入新的", "Select existing guardrails or enter new ones");
    expect(screen.getByPlaceholderText("选择或输入 Guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter guardrails")).not.toBeInTheDocument();
    expectLocalized("禁用全局 Guardrails", "Disable Global Guardrails");
    expectLocalized(
      "启用后，该密钥将绕过所有配置为对每个请求运行的 Guardrails（全局 Guardrails）",
      "When enabled, this key will bypass any guardrails configured to run on every request (global guardrails)",
    );
    expectLocalized("为该密钥绕过全局 Guardrails", "Bypass global guardrails for this key");
    expectLocalized("策略", "Policies");
    expectLocalized(
      "为该密钥应用策略，以控制 Guardrails 和其他设置",
      "Apply policies to this key to control guardrails and other settings",
    );
    expectLocalized("高级功能 - 升级后可按密钥设置策略", "Premium feature - Upgrade to set policies by key");
    expectLocalized("提示词", "Prompts");
    expectLocalized("允许此密钥使用特定的提示词模板", "Allow this key to use specific prompt templates");
    expectLocalized("高级功能 - 升级后可按密钥设置提示词", "Premium feature - Upgrade to set prompts by key");
    expectLocalized("访问组", "Access Groups");
    expectLocalized(
      "为该密钥分配访问组。访问组控制该密钥可以使用的模型、MCP 服务和 agents",
      "Assign access groups to this key. Access groups control which models, MCP servers, and agents this key can use",
    );
    expectLocalized("选择要分配给该密钥的访问组", "Select access groups to assign to this key");
    expectLocalized("允许的直通路由", "Allowed Pass Through Routes");
    expectLocalized("允许此密钥使用特定的直通路由", "Allow this key to use specific pass through routes");
    expectLocalized(
      "高级功能 - 升级后可按密钥设置直通路由",
      "Premium feature - Upgrade to set pass through routes by key",
    );
    expectLocalized("允许的向量存储", "Allowed Vector Stores");
    expectLocalized(
      "选择此密钥可以访问的向量存储。如果未选择任何项，该密钥将可以访问所有可用的向量存储",
      "Select which vector stores this key can access. If none selected, the key will have access to all available vector stores",
    );
    expectLocalized(
      "选择此密钥可以访问的向量存储。留空表示可以访问所有向量存储",
      "Select vector stores this key can access. Leave empty for access to all vector stores",
    );
    expectLocalized("元数据", "Metadata");
    expectLocalized(
      "包含此密钥附加信息的 JSON 对象。用于跟踪或自定义逻辑",
      "JSON object with additional information about this key. Used for tracking or custom logic",
    );
    expect(screen.getByPlaceholderText("以 JSON 输入元数据")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter metadata as JSON")).not.toBeInTheDocument();
    expectLocalized("标签", "Tags");
    expectLocalized(
      "用于跟踪消费和/或基于标签路由的标签。用于分析和筛选",
      "Tags for tracking spend and/or doing tag-based routing. Used for analytics and filtering",
    );
    expectLocalized("用于跟踪消费和/或基于标签路由的标签。", "Tags for tracking spend and/or doing tag-based routing.");
    expect(screen.getByPlaceholderText("选择或输入标签")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter tags")).not.toBeInTheDocument();
  });

  it("renders the nested optional sections in Chinese and hides the English originals", async () => {
    const user = await openDialog();
    await user.click(screen.getByText("可选设置"));

    await user.click(screen.getByText("MCP 设置"));
    expectLocalized("允许的 MCP 服务", "Allowed MCP Servers");
    expectLocalized(
      "选择此密钥可以访问的 MCP 服务或访问组",
      "Select which MCP servers or access groups this key can access",
    );

    await user.click(screen.getByText("Agent 设置"));
    expectLocalized("允许的 Agents", "Allowed Agents");
    expectLocalized("选择此密钥可以访问的 agents 或访问组", "Select which agents or access groups this key can access");

    await user.click(screen.getByText("技能设置"));
    expectLocalized("允许的技能", "Allowed Skills");
    expectLocalized(
      "已启用的技能对所有密钥可见。在此为该密钥授予已禁用的（私有）Claude Code 插件",
      "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here",
    );
    expectLocalized(
      "选择此密钥可以在 Claude Code 市场中访问的私有技能",
      "Select private skills this key can access in the Claude Code marketplace",
    );
    expect(screen.getByPlaceholderText("选择技能（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select skills (optional)")).not.toBeInTheDocument();

    expectLocalized("日志设置", "Logging Settings");
    expect(screen.getByText(/密钥级日志设置是企业版功能，请联系我们 -/)).toBeInTheDocument();
    expect(screen.queryByText(/Key-level logging settings is an enterprise feature/)).not.toBeInTheDocument();

    await user.click(screen.getByText("路由设置"));
    await user.click(screen.getByText("模型别名"));
    expectLocalized("模型别名", "Model Aliases");
    expectLocalized(
      "为可在 API 调用中使用的模型创建自定义别名。这样可以为特定模型创建快捷方式。",
      "Create custom aliases for models that can be used in API calls. This allows you to create shortcuts for specific models.",
    );
    expectLocalized("密钥生命周期", "Key Lifecycle");
    expectLocalized("高级设置", "Advanced Settings");
    expect(
      screen.getAllByText(
        (_content, element) =>
          element?.tagName === "DIV" &&
          (element.textContent ?? "").includes("在我们的 文档 中了解更多关于高级设置的信息"),
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("documentation")).not.toBeInTheDocument();
  });

  it("renders the create action and validation messages in Chinese and hides the English originals", async () => {
    const user = await openDialog();

    expect(screen.getAllByRole("button", { name: "创建密钥" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Create Key" })).toHaveLength(0);

    await user.click(screen.getByText("服务账号"));

    expectLocalized("服务账号 ID", "Service Account ID");
    expectLocalized("此服务账号的唯一标识符", "Unique identifier for this service account");

    await user.click(screen.getByText("其他用户"));
    await user.click(screen.getAllByRole("button", { name: "创建密钥" })[0]);

    expect(await screen.findByText("请输入你要将密钥分配给的用户的用户 ID")).toBeInTheDocument();
    expect(
      screen.queryByText("Please input the user ID of the user you are assigning the key to"),
    ).not.toBeInTheDocument();
  });

  it("renders the creation toasts and saved-key dialog in Chinese", async () => {
    const user = await openDialog();

    await user.type(screen.getByLabelText(/密钥名称/), "contract-key");
    await user.click(screen.getAllByRole("button", { name: "创建密钥" })[0]);

    expect(await screen.findByText("保存你的密钥")).toBeInTheDocument();
    expect(screen.queryByText("Save your Key")).not.toBeInTheDocument();
    expect(vi.mocked(toast.info)).toHaveBeenCalledWith("正在发起 API 调用");
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Virtual Key 已创建");
  });

  it("renders the duplicate alias and agent-selection errors in Chinese", async () => {
    state.authorized = { ...state.authorized, userRole: "Admin" };
    const user = await openDialog();

    await user.click(screen.getByText("Agent", { selector: "label" }));
    await user.type(screen.getByLabelText(/服务账号 ID/), "agent-key");
    await user.click(screen.getAllByRole("button", { name: "创建密钥" })[0]);

    await waitFor(() => {
      expect(vi.mocked(toast.fromError)).toHaveBeenCalledWith("请选择一个 Agent");
    });
  });

  it("renders the duplicate alias error in Chinese", async () => {
    const user = userEvent.setup();
    renderCreateKey({ data: [{ team_id: null, key_alias: "contract-key" }] });
    await user.click(screen.getByRole("button", { name: "+ 创建新密钥" }));

    await user.type(screen.getByLabelText(/密钥名称/), "contract-key");
    await user.click(screen.getAllByRole("button", { name: "创建密钥" })[0]);

    await waitFor(() => {
      expect(vi.mocked(toast.fromError)).toHaveBeenCalledWith(
        expect.stringContaining("团队 ID 为 null 的团队中已存在密钥别名 contract-key，请提供其他密钥别名"),
      );
    });
  });

  it("renders the project field in Chinese when the Projects UI is enabled", async () => {
    state.uiSettings = { enable_projects_ui: true };
    await openDialog();

    expectLocalized("项目", "Project");
    expectLocalized(
      "将该密钥分配给一个项目。选择项目会将团队锁定为该项目所属的团队。",
      "Assign this key to a project. Selecting a project will lock the team to the project's team.",
    );
  });

  it("renders the premium edit help and placeholders in Chinese and hides the English originals", async () => {
    state.authorized = { ...state.authorized, premiumUser: true };
    const user = await openDialog();
    await user.click(screen.getByText("可选设置"));

    expectLocalized("选择现有策略或输入新的", "Select existing policies or enter new ones");
    expect(screen.getByPlaceholderText("选择或输入策略")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter policies")).not.toBeInTheDocument();
    expectLocalized("选择现有提示词或输入新的", "Select existing prompts or enter new ones");
    expect(screen.getByPlaceholderText("选择或输入提示词")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter prompts")).not.toBeInTheDocument();
    expectLocalized("选择现有直通路由或输入新的", "Select existing pass through routes or enter new ones");
    expect(screen.getByPlaceholderText("选择或输入直通路由")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter pass through routes")).not.toBeInTheDocument();
  });

  it("renders the user search loading state in Chinese and hides the English original", async () => {
    vi.mocked(userFilterUICall).mockReturnValue(new Promise(() => {}));
    const user = await openDialog();

    await user.click(screen.getByText("其他用户"));
    await user.type(screen.getByPlaceholderText("输入邮箱以搜索用户"), "a");

    expect(await screen.findByText("搜索中...")).toBeInTheDocument();
    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
  });

  it("renders the failed user search toast in Chinese and hides the English original", async () => {
    vi.mocked(userFilterUICall).mockRejectedValue(new Error("boom"));
    const user = await openDialog();

    await user.click(screen.getByText("其他用户"));
    await user.type(screen.getByPlaceholderText("输入邮箱以搜索用户"), "a");

    await waitFor(() => {
      expect(vi.mocked(toast.fromError)).toHaveBeenCalledWith("搜索用户失败");
    });
    expect(vi.mocked(toast.fromError)).not.toHaveBeenCalledWith("Failed to search for users");
  });

  it("renders the create-user modal title in Chinese and hides the English original", async () => {
    const user = await openDialog();

    await user.click(screen.getByText("其他用户"));
    await user.click(screen.getByRole("button", { name: "创建用户" }));

    expect(await screen.findByText("创建新用户")).toBeInTheDocument();
    expect(screen.queryByText("Create New User")).not.toBeInTheDocument();
  });

  it("renders the empty agent list copy in Chinese in the open state", async () => {
    const user = await openDialog();

    await user.click(screen.getByText("Agent", { selector: "label" }));
    await user.click(screen.getByPlaceholderText("选择一个 Agent"));

    expect(await screen.findByText("未找到 Agent")).toBeInTheDocument();
    expect(screen.queryByText("No agents found")).not.toBeInTheDocument();
  });

  it("renders the team-required note in Chinese and hides the English original", async () => {
    vi.mocked(modelAvailableCall).mockResolvedValue({ data: [{ id: "no-default-models" }] });
    await openDialog();

    expect(
      await screen.findByText(
        "请选择一个团队以继续配置你的 Virtual Key。如果没有看到任何团队，请联系 Proxy 管理员为你提供模型访问权限或将你添加到团队。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Please select a team to continue configuring your Virtual Key. If you do not see any teams, please contact your Proxy Admin to either provide you with access to models or to add you to a team.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the disabled-models help in Chinese and hides the English original", async () => {
    const user = await openDialog();

    const keyTypeTrigger = screen.getAllByRole("combobox").find((el) => el.textContent?.includes("AI API"));
    expect(keyTypeTrigger).toBeDefined();
    await chooseSelectOption(user, keyTypeTrigger as HTMLElement, /^管理 只能调用管理路由/);

    expectLocalized("该密钥类型的模型字段已禁用", "Models field is disabled for this key type");
  });
});
