import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { type ReactElement, type ReactNode } from "react";

import { KeyResponse } from "../key_team_helpers/key_list";
import { KeyEditView } from "./key_edit_view";

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const emptyMcpTools = vi.hoisted(() => ({ tools: [], error: null, message: null, stack_trace: null }));

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return {
    ...actual,
    getUiSettings: vi.fn().mockResolvedValue({ values: { enable_projects_ui: false } }),
    getPromptsList: vi.fn().mockResolvedValue({
      prompts: [{ prompt_id: "prompt-1" }, { prompt_id: "prompt-2" }],
    }),
    modelAvailableCall: vi.fn().mockResolvedValue({
      data: [{ id: "gpt-4" }, { id: "gpt-3.5-turbo" }],
    }),
    tagListCall: vi.fn().mockResolvedValue({
      tag1: { name: "tag1", description: "Test tag 1" },
      tag2: { name: "tag2", description: "Test tag 2" },
    }),
    getGuardrailsList: vi.fn().mockResolvedValue({
      guardrails: [{ guardrail_name: "guardrail-1" }],
    }),
    getPoliciesList: vi.fn().mockResolvedValue({
      policies: [{ policy_name: "policy-1" }],
    }),
    getPassThroughEndpointsCall: vi.fn().mockResolvedValue({
      endpoints: [],
    }),
    vectorStoreListCall: vi.fn().mockResolvedValue({
      data: [],
    }),
    agentListCall: vi.fn().mockResolvedValue({
      data: [],
    }),
    fetchMCPServers: vi.fn().mockResolvedValue([]),
    fetchMCPAccessGroups: vi.fn().mockResolvedValue([]),
    listMCPTools: vi.fn().mockResolvedValue(emptyMcpTools),
    getAgentsList: vi.fn().mockResolvedValue({
      agents: [],
    }),
    getAgentAccessGroups: vi.fn().mockResolvedValue([]),
    getClaudeCodePluginsList: vi.fn().mockResolvedValue({ plugins: [], count: 0 }),
  };
});

vi.mock("../organisms/create_key_button", () => ({
  fetchTeamModels: vi.fn().mockResolvedValue(["team-model-1", "team-model-2"]),
}));

const routerSettingsMocks = vi.hoisted(() => ({
  receivedValue: undefined as { router_settings: Record<string, unknown> } | undefined,
  editedValue: null as Record<string, unknown> | null,
}));

vi.mock("../common_components/RouterSettingsAccordion", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    default: forwardRef(({ value }: { value?: { router_settings: Record<string, unknown> } }, ref) => {
      routerSettingsMocks.receivedValue = value;
      useImperativeHandle(ref, () => ({
        getValue: () => ({ router_settings: routerSettingsMocks.editedValue ?? value?.router_settings ?? {} }),
      }));
      return <div data-testid="router-settings-accordion" />;
    }),
  };
});

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: vi.fn().mockReturnValue({
    data: [
      {
        organization_id: "org-1",
        organization_alias: "Engineering",
        members: [{ user_id: "user-orbit", user_role: "org_admin" }],
      },
      { organization_id: "org-2", organization_alias: "Sales" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: vi.fn().mockReturnValue({
    data: [
      { access_group_id: "ag-1", access_group_name: "Group 1" },
      { access_group_id: "ag-2", access_group_name: "Group 2" },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("../mcp_server_management/MCPServerSelector", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: { servers?: string[]; accessGroups?: string[]; toolsets?: string[] };
    onChange?: (v: { servers: string[]; accessGroups: string[]; toolsets: string[] }) => void;
    placeholder?: string;
  }) => (
    <button
      type="button"
      data-testid="mcp-server-selector"
      data-placeholder={placeholder}
      onClick={() => onChange?.({ servers: ["mcp-1"], accessGroups: [], toolsets: value?.toolsets ?? [] })}
    >
      pick mcp server
    </button>
  ),
}));

vi.mock("../agent_management/AgentSelector", () => ({
  default: ({ onChange }: { onChange?: (v: { agents: string[]; accessGroups: string[] }) => void }) => (
    <button
      type="button"
      data-testid="agent-selector"
      onClick={() => onChange?.({ agents: ["agent-1"], accessGroups: [] })}
    >
      pick agent
    </button>
  ),
}));

vi.mock("../skills/SkillSelector", () => ({
  default: ({ onChange }: { onChange: (selected: string[]) => void }) => (
    <button type="button" data-testid="skill-selector" onClick={() => onChange(["private-skill"])}>
      pick skill
    </button>
  ),
}));

vi.mock("../common_components/AccessGroupSelector", () => ({
  default: ({
    value = [],
    onChange,
    placeholder,
  }: {
    value?: string[];
    onChange?: (v: string[]) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="access-group-selector"
      placeholder={placeholder}
      value={Array.isArray(value) ? value.join(",") : ""}
      onChange={(e) => onChange?.(e.target.value ? e.target.value.split(",").map((s) => s.trim()) : [])}
    />
  ),
}));

vi.mock("@/app/(dashboard)/guardrails/_components/content_filter/TagsInput", () => ({
  TagsInput: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
}));

vi.mock("../common_components/PassThroughRoutesSelector", () => ({
  default: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: ReactElement }) => <span data-testid="tooltip-trigger">{render}</span>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
  SimpleTooltip: ({ children, content }: { children?: ReactNode; content?: ReactNode }) => (
    <div>
      {children}
      <div>{content}</div>
    </div>
  ),
}));

const MOCK_KEY_DATA: KeyResponse = {
  token: "test-token-123",
  token_id: "test-token-123",
  key_name: "sk-...TUuw",
  key_alias: "asdasdas",
  spend: 0,
  max_budget: 0,
  expires: "null",
  models: [],
  aliases: {},
  config: {},
  user_id: "default_user_id",
  team_id: null,
  max_parallel_requests: 10,
  metadata: { logging: [], tags: ["test-tag"] },
  tpm_limit: 10,
  rpm_limit: 10,
  duration: "30d",
  budget_duration: "30d",
  budget_reset_at: "never",
  allowed_cache_controls: [],
  allowed_routes: [],
  permissions: {},
  model_spend: {},
  model_max_budget: {},
  soft_budget_cooldown: false,
  blocked: false,
  litellm_budget_table: {},
  organization_id: null,
  created_at: "2025-10-29T01:26:41.613000Z",
  updated_at: "2025-10-29T01:47:33.980000Z",
  team_spend: 100,
  team_alias: "",
  team_tpm_limit: 100,
  team_rpm_limit: 100,
  team_max_budget: 100,
  team_models: [],
  team_blocked: false,
  soft_budget: 200,
  team_model_aliases: {},
  team_member_spend: 0,
  team_metadata: {},
  end_user_id: "default_user_id",
  end_user_tpm_limit: 10,
  end_user_rpm_limit: 10,
  end_user_max_budget: 0,
  last_refreshed_at: Date.now(),
  api_key: "sk-...TUuw",
  user_role: "user",
  rpm_limit_per_model: {},
  tpm_limit_per_model: {},
  user_tpm_limit: 10,
  user_rpm_limit: 10,
  user_email: "test@example.com",
  object_permission: {
    object_permission_id: "067002ed-3b01-4bb3-b942-cefa400f0049",
    mcp_servers: [],
    mcp_access_groups: [],
    mcp_tool_permissions: {},
    vector_stores: [],
  },
  auto_rotate: false,
  rotation_interval: undefined,
  last_rotation_at: undefined,
  key_rotation_at: undefined,
};

const renderEdit = (premiumUser = true, overrides: Partial<KeyResponse> = {}) =>
  renderWithProviders(
    <KeyEditView
      keyData={{ ...MOCK_KEY_DATA, ...overrides }}
      onCancel={() => {}}
      onSubmit={async () => {}}
      accessToken="test-token"
      userID="test-user"
      userRole="proxy_admin"
      premiumUser={premiumUser}
    />,
  );

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en), `English "${en}" still present for zh "${zh}"`).toHaveLength(0);
};

describe("KeyEditView Chinese copy", () => {
  beforeEach(async () => {
    can.mockReturnValue(true);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the form labels and placeholders in Chinese and hides the English originals", async () => {
    renderEdit();

    await screen.findByText("密钥别名");
    expectLocalized("密钥别名", "Key Alias");
    expectLocalized("模型", "Models");
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models")).not.toBeInTheDocument();
    expectLocalized("密钥类型", "Key Type");
    expectLocalized("完全访问", "Full Access");
    expectLocalized("允许的路由", "Allowed Routes");
    expect(screen.getByPlaceholderText(/输入允许的路由（以逗号分隔）/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter allowed routes/)).not.toBeInTheDocument();
    expectLocalized("最大预算（USD）", "Max Budget (USD)");
    expect(screen.getAllByPlaceholderText("输入数值").length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Enter a numerical value")).not.toBeInTheDocument();
    expectLocalized("软预算（USD）", "Soft Budget (USD)");
    expect(screen.getByPlaceholderText("当消费超过此值时发出告警，但不阻止请求")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Get alerts when spend crosses this value, without blocking requests"),
    ).not.toBeInTheDocument();
    expectLocalized("重置预算", "Reset Budget");
    expectLocalized("预算窗口", "Budget Windows");
    expectLocalized("按模型预算", "Per-Model Budgets");
    expectLocalized("预算回退", "Budget Fallbacks");
    expectLocalized("TPM 上限", "TPM Limit");
    expectLocalized("RPM 上限", "RPM Limit");
    expectLocalized("超出预算时限流", "Throttle on budget exceeded");
    expectLocalized("启用提示词缓存", "Enable Prompt Caching");
    expectLocalized("最大并行请求数", "Max Parallel Requests");
    expectLocalized("模型 TPM 上限", "Model TPM Limit");
    expectLocalized("模型 RPM 上限", "Model RPM Limit");
    expectLocalized("预计输出 Token 数", "Estimated Output Tokens");
    expectLocalized("按模型预计输出 Token 数", "Estimated Output Tokens Per Model");
    expectLocalized("按标签速率限制", "Per-Tag Rate Limits");
    expect(screen.getAllByText("Guardrails").length).toBeGreaterThan(0);
    expectLocalized("禁用全局 Guardrails", "Disable Global Guardrails");
    expectLocalized("策略", "Policies");
    expectLocalized("标签", "Tags");
    expect(screen.getByPlaceholderText("选择或输入标签")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter tags")).not.toBeInTheDocument();
    expectLocalized("提示词", "Prompts");
    expectLocalized("访问组", "Access Groups");
    expect(screen.getAllByPlaceholderText("选择访问组（可选）").length).toBeGreaterThan(0);
    expect(screen.queryAllByPlaceholderText("Select access groups (optional)")).toHaveLength(0);
    expectLocalized("允许的直通路由", "Allowed Pass Through Routes");
    expectLocalized("向量存储", "Vector Stores");
    expect(screen.getByPlaceholderText("选择向量存储")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select vector stores")).not.toBeInTheDocument();
    expectLocalized("MCP 服务 / 访问组", "MCP Servers / Access Groups");
    expect(screen.getByTestId("mcp-server-selector")).toHaveAttribute(
      "data-placeholder",
      "选择 MCP 服务或访问组（可选）",
    );
    expectLocalized("组织", "Organization");
    expectLocalized("团队 ID", "Team ID");
    expectLocalized("路由设置", "Router Settings");
    expectLocalized("日志设置", "Logging Settings");
    expectLocalized("元数据", "Metadata");
    expectLocalized("取消", "Cancel");
    expectLocalized("保存更改", "Save Changes");
  });

  it("renders the empty-state placeholders in Chinese and hides the English originals", async () => {
    renderEdit(true, { budget_duration: null, team_id: null });

    await screen.findByText("密钥别名");
    expect(screen.getByText("永不重置")).toBeInTheDocument();
    expect(screen.queryByText("Never resets")).not.toBeInTheDocument();
    expect(screen.getByText("选择团队")).toBeInTheDocument();
    expect(screen.queryByText("Select team")).not.toBeInTheDocument();
  });

  it("renders the shared selector labels in Chinese and hides the English originals", async () => {
    renderEdit();

    await screen.findByText("密钥别名");
    expectLocalized("Agents / 访问组", "Agents / Access Groups");
    expectLocalized("技能", "Skills");
  });

  it("renders every field hint in Chinese and hides the English originals", async () => {
    renderEdit();

    await screen.findByText("密钥别名");

    const hints: [string, string][] = [
      [
        "该密钥允许的路由列表（以逗号分隔）。可以是具体路由（例如 '/chat/completions'）或路由模式（例如 'llm_api_routes'、'management_routes'、'/keys/*'）。留空表示允许所有路由。",
        "List of allowed routes for the key (comma-separated). Can be specific routes (e.g., '/chat/completions') or route patterns (e.g., 'llm_api_routes', 'management_routes', '/keys/*'). Leave empty to allow all routes.",
      ],
      [
        "设置多个独立的预算窗口（例如每小时 $10 且每月 $200）。每个窗口单独跟踪消费并按各自的时间表重置。",
        "Set multiple independent budget windows (e.g., hourly $10 AND monthly $200). Each window tracks spend separately and resets on its own schedule.",
      ],
      [
        "当模型超出其按模型预算时，请求会自动改道到回退模型，而不是失败",
        "When a model exceeds its per-model budget, requests automatically reroute to fallback models instead of failing",
      ],
      [
        "当该密钥超出最大预算时，将其 TPM/RPM 限流到全局配置的百分比，而不是完全阻止访问。需要在 litellm_settings 中配置 budget_exceeded_throttle_percentage，并为该密钥设置 TPM/RPM 上限。",
        "When this key exceeds its max budget, throttle its TPM/RPM to the globally configured percentage instead of blocking access entirely. Requires budget_exceeded_throttle_percentage in litellm_settings and a TPM/RPM limit on the key.",
      ],
      [
        "自动为使用该密钥的请求添加提示词缓存断点（cache_control 标记），降低重复提示词的输入成本。适用于 Anthropic 和 Bedrock Claude 模型；已自行设置 cache_control 标记的请求不受影响。",
        "Automatically add prompt caching breakpoints (cache_control markers) to requests made with this key, cutting input cost on repeated prompts. Applies to Anthropic and Bedrock Claude models; requests that already set their own cache_control markers are left untouched.",
      ],
      [
        "将速率限制限定到请求标签，使每个标签（例如一个 cell 或 group）拥有独立的 RPM 计数器。没有匹配标签的请求回退到密钥级限制。",
        "Scope rate limits to a request tag so each tag (e.g. a cell or group) gets its own RPM counter. Requests without a matching tag fall back to the key-level limit.",
      ],
      [
        "启用后，该密钥将绕过所有配置为对每个请求运行的 Guardrails（全局 Guardrails）",
        "When enabled, this key will bypass any guardrails configured to run on every request (global guardrails)",
      ],
      [
        "为该密钥应用策略，以控制 Guardrails 和其他设置",
        "Apply policies to this key to control guardrails and other settings",
      ],
      [
        "为该密钥分配访问组。访问组控制该密钥可以使用的模型、MCP 服务和 agents",
        "Assign access groups to this key. Access groups control which models, MCP servers, and agents this key can use",
      ],
      [
        "该密钥所属的组织。选择组织会筛选可用的团队。",
        "The organization this key belongs to. Selecting an organization filters the available teams.",
      ],
      [
        "已启用的技能对所有密钥可见。在此为该密钥授予已禁用的（私有）Claude Code 插件。",
        "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here.",
      ],
    ];

    for (const [zh, en] of hints) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(
      screen.getByTitle("按模型限制消费，每个模型有自己的重置窗口。对该密钥发出的每个请求都生效。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle(
        "Cap spend on individual models, each with its own reset window. Enforced across every request this key makes.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the premium placeholders and hints in Chinese and hides the English originals", async () => {
    renderEdit(false);

    await screen.findByText("密钥别名");
    expect(screen.getByPlaceholderText("高级功能 - 升级后可按密钥设置提示词")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Premium feature - Upgrade to set prompts by key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("高级功能 - 升级后可按密钥设置允许的直通路由")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Premium feature - Upgrade to set allowed pass through routes by key"),
    ).not.toBeInTheDocument();
    expectLocalized("按密钥设置提示词是高级功能", "Setting prompts by key is a premium feature");
    expectLocalized(
      "按密钥设置允许的直通路由是高级功能",
      "Setting allowed pass through routes by key is a premium feature",
    );
  });

  it("renders the project-locked descriptions in Chinese and hides the English originals", async () => {
    renderEdit(true, { project_id: "proj-1" });

    await screen.findByText("密钥别名");
    expectLocalized(
      "组织已锁定，因为该密钥属于某个项目",
      "Organization is locked because this key belongs to a project",
    );
    expectLocalized("团队已锁定，因为该密钥属于某个项目", "Team is locked because this key belongs to a project");
  });

  it("renders the disabled-models description in Chinese and hides the English original", async () => {
    renderEdit(true, { allowed_routes: ["management_routes"] });

    await screen.findByText("密钥别名");
    expectLocalized("该密钥类型的模型字段已禁用", "Models field is disabled for this key type");
  });

  it("renders the premium empty-value placeholders in Chinese and hides the English originals", async () => {
    renderEdit(true);

    await screen.findByText("密钥别名");
    expect(screen.getByPlaceholderText("选择或输入提示词")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter prompts")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入允许的直通路由")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter allowed pass through routes")).not.toBeInTheDocument();
  });

  it("renders the Chinese estimate tooltips and hides the English originals", async () => {
    renderEdit();

    await screen.findByText("密钥别名");
    expectLocalized(
      "当请求省略 max_tokens 时，为 TPM 限制预留的预计输出 Token 数。会覆盖此密钥的内置预估。",
      "Expected output tokens reserved for TPM limiting when a request omits max_tokens. Overrides the built-in estimate for this key.",
    );
    expectLocalized(
      "当请求省略 max_tokens 时，为 TPM 限制预留的按模型预计输出 Token 数。优先于此密钥级别的预估。",
      "Per-model expected output tokens reserved for TPM limiting when a request omits max_tokens. Takes precedence over the key-wide estimate.",
    );
  });

  it("renders the Chinese admin-only estimate tooltip for a non-admin and hides the English", async () => {
    renderWithProviders(
      <KeyEditView
        keyData={MOCK_KEY_DATA}
        onCancel={() => {}}
        onSubmit={async () => {}}
        accessToken="test-token"
        userID="test-user"
        userRole="user"
        premiumUser={true}
      />,
    );

    await screen.findByText("密钥别名");
    expectLocalized(
      "只有 Proxy 管理员可以修改此项。它设置当请求省略 max_tokens 时，速率限制器为该请求预留的输出 Token 数，该数量会计入团队和组织的 TPM 窗口。",
      "Only a proxy admin can change this. It sets how many output tokens the rate limiter reserves for a request that omits max_tokens, which is charged against the team and organization TPM windows.",
    );
  });

  it("renders the Chinese estimate validation message and hides the English", async () => {
    const user = userEvent.setup();
    renderEdit();

    await screen.findByText("密钥别名");
    fireEvent.change(screen.getByPlaceholderText('{"gpt-4": 4096}'), { target: { value: "not json" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText('输入由正整数组成的 JSON 对象，例如 {"gpt-4": 4096}')).toBeInTheDocument();
    expect(
      screen.queryByText('Enter a JSON object of positive integers, e.g. {"gpt-4": 4096}'),
    ).not.toBeInTheDocument();
  });
});
