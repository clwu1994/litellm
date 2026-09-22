import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useTeams from "@/app/(dashboard)/hooks/useTeams";
import { KeyResponse } from "../key_team_helpers/key_list";
import { getPolicyInfoWithGuardrails, keyDeleteCall, keyUpdateCall, regenerateKeyCall } from "../networking";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { toast } from "@/lib/toast";
import KeyInfoView from "./key_info_view";

const editViewMocks = vi.hoisted(() => ({
  onSubmit: undefined as ((v: Record<string, unknown>) => Promise<void>) | undefined,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: () => ({ data: [] }),
}));

vi.mock("./key_edit_view", () => ({
  KeyEditView: ({ onSubmit }: { onSubmit: (v: Record<string, unknown>) => Promise<void> }) => {
    editViewMocks.onSubmit = onSubmit;
    return <div data-testid="key-edit-view-stub" />;
  },
}));

import type { ActivityDateRange } from "@/app/(dashboard)/cost-optimization/_components/useDailyActivityRange";

const AnalyticsDateControl = ({ activity, keyToken }: { activity: ActivityDateRange; keyToken: string }) => (
  <div>
    <span data-testid="key-auto-router-usage">{keyToken}</span>
    <output aria-label="Selected dates">{activity.dateValue.from?.toISOString()}</output>
    {[1, 10].map((day) => (
      <button
        key={day}
        onClick={() => activity.onDateChange({ from: new Date(Date.UTC(2026, 7, day)), to: new Date(2026, 7, 20) })}
      >
        Select August {day}
      </button>
    ))}
  </div>
);

vi.mock("./KeyAutoRouterUsageTab", () => ({
  default: (props: React.ComponentProps<typeof AnalyticsDateControl>) => <AnalyticsDateControl {...props} />,
}));
vi.mock("./KeySavingsTab", () => ({
  default: (props: React.ComponentProps<typeof AnalyticsDateControl>) => <AnalyticsDateControl {...props} />,
}));

vi.mock("@/app/(dashboard)/hooks/useTeams", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/projects/useProjects", () => ({
  useProjects: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

const MCP_CATALOG = [
  { server_id: "srv-1", server_name: "deploy_tracker", alias: "deploy" },
  { server_id: "srv-2", server_name: "incident_log", alias: "incidents", mcp_access_groups: ["ops_readonly"] },
];

const MCP_TOOLSETS = [
  { toolset_id: "ts-1", toolset_name: "incidents", tools: [{ server_id: "srv-2", tool_name: "write" }] },
];

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: vi.fn(() => ({ data: MCP_CATALOG })),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({
  useMCPToolsets: vi.fn(() => ({ data: MCP_TOOLSETS })),
}));

vi.mock("../networking", () => ({
  serverRootPath: "",
  keyDeleteCall: vi.fn().mockResolvedValue({}),
  keyUpdateCall: vi.fn().mockResolvedValue({}),
  regenerateKeyCall: vi.fn().mockResolvedValue({ key: "sk-new", token: "new-token" }),
  getPolicyInfoWithGuardrails: vi.fn().mockResolvedValue({
    resolved_guardrails: ["guardrail-1", "guardrail-2"],
  }),
}));

const mockResetKeySpendMutate = vi.fn();
vi.mock("@/app/(dashboard)/hooks/keys/useResetKeySpend", () => ({
  useResetKeySpend: vi.fn(() => ({
    mutate: mockResetKeySpendMutate,
    isPending: false,
  })),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: React.ReactElement }) => <>{render}</>,
  TooltipContent: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockSetKeyBlockedState = vi.fn();
vi.mock("@/app/(dashboard)/hooks/keys/useSetKeyBlockedState", () => ({
  useSetKeyBlockedState: vi.fn(() => ({ mutate: mockSetKeyBlockedState, isPending: false })),
}));

vi.mock("@/utils/dataUtils", () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
  formatNumberWithCommas: vi.fn((value: number, decimals?: number) => {
    return value.toFixed(decimals ?? 2);
  }),
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
  project_id: null,
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

const baseUseAuthorizedMock = {
  accessToken: "test-token",
  userId: "test-user",
  userRole: "Admin",
  premiumUser: true,
  token: "test-token",
  userEmail: null,
  disabledPersonalKeyCreation: null,
  showSSOBanner: false,
};

const renderInfo = (overrides: Partial<KeyResponse> = {}) =>
  renderWithProviders(
    <KeyInfoView keyData={{ ...MOCK_KEY_DATA, ...overrides }} onClose={() => {}} keyId="test-key-id" teams={[]} />,
  );

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en), `English "${en}" still present for zh "${zh}"`).toHaveLength(0);
};

describe("KeyInfoView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(useTeams).mockReturnValue({ teams: [], setTeams: vi.fn() });
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock });
    mockResetKeySpendMutate.mockReset();
    mockSetKeyBlockedState.mockReset();
    vi.mocked(keyUpdateCall).mockResolvedValue({});
    vi.mocked(keyDeleteCall).mockResolvedValue({});
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the tabs and overview cards in Chinese and hides the English originals", async () => {
    renderInfo();

    await screen.findByText("密钥设置");
    expectLocalized("概览", "Overview");
    expectLocalized("节省", "Savings");
    expectLocalized("设置", "Settings");
    expectLocalized("自动路由用量", "Auto-router usage");
    expect(screen.getAllByText("消费").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Spend")).toHaveLength(0);
    expectLocalized("占 $0.00", "of $0.00");
    expect(screen.getByText(/重置时间：/)).toBeInTheDocument();
    expect(screen.queryByText(/Resets /)).not.toBeInTheDocument();
    expect(screen.getAllByText("速率限制").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Rate Limits")).toHaveLength(0);
    expect(screen.getAllByText("TPM：10").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("TPM: 10")).toHaveLength(0);
    expect(screen.getAllByText("RPM：10").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("RPM: 10")).toHaveLength(0);
    expect(screen.getAllByText("模型").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Models")).toHaveLength(0);
    expect(screen.getAllByText("未指定模型").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("No models specified")).toHaveLength(0);
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expectLocalized("未配置 Guardrails", "No guardrails configured");
    expectLocalized("策略", "Policies");
    expectLocalized("未配置策略", "No policies configured");
  });

  it("renders the settings panel in Chinese and hides the English originals", async () => {
    renderInfo();

    await screen.findByText("密钥设置");
    expectLocalized("密钥设置", "Key Settings");
    expectLocalized("编辑设置", "Edit Settings");
    expect(screen.getAllByText("密钥 ID").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Key ID")).toHaveLength(0);
    expectLocalized("密钥别名", "Key Alias");
    expect(screen.getAllByText("Secret Key").length).toBeGreaterThan(0);
    expectLocalized("团队 ID", "Team ID");
    expectLocalized("组织", "Organization");
    expectLocalized("创建时间", "Created");
    expectLocalized("过期时间", "Expires");
    expect(screen.getAllByText("未设置").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Not Set")).toHaveLength(0);
    expect(screen.getByText("$0.0000 USD")).toBeInTheDocument();
    expectLocalized("预算", "Budget");
    expectLocalized("预算重置", "Budget Reset");
    expect(screen.getByText(/每 30d，下次 /)).toBeInTheDocument();
    expect(screen.queryByText(/Every 30d, next /)).not.toBeInTheDocument();
    expectLocalized("标签", "Tags");
    expectLocalized("提示词", "Prompts");
    expectLocalized("未指定提示词", "No prompts specified");
    expectLocalized("允许的路由", "Allowed Routes");
    expectLocalized("允许所有路由", "All routes allowed");
    expectLocalized("允许的直通路由", "Allowed Pass Through Routes");
    expectLocalized("未指定直通路由", "No pass through routes specified");
    expectLocalized("禁用全局 Guardrails", "Disable Global Guardrails");
    expectLocalized("已禁用 - 全局 Guardrails 生效中", "Disabled - Global guardrails active");
    expectLocalized("最大并行请求数：10", "Max Parallel Requests: 10");
    expectLocalized("模型 TPM 上限：不限", "Model TPM Limits: Unlimited");
    expectLocalized("模型 RPM 上限：不限", "Model RPM Limits: Unlimited");
    expectLocalized("标签 RPM 上限：不限", "Tag RPM Limits: Unlimited");
    expectLocalized("预计输出 Token 数：默认", "Estimated Output Tokens: Default");
    expectLocalized("按模型预计输出 Token 数：默认", "Estimated Output Tokens Per Model: Default");
    expectLocalized("元数据", "Metadata");
  });

  it("renders the reset spend dialog in Chinese in the open state", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, userRole: "proxy_admin" });
    renderInfo();

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "重置消费" }));

    expect(await screen.findByText("重置密钥消费")).toBeInTheDocument();
    expect(screen.queryByText("Reset Key Spend")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) => element?.tagName === "P" && element.textContent === "将 asdasdas 的消费重置为 $0？",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Reset spend for/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "P" && (element.textContent ?? "").startsWith("当前消费：$0.0000。"),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Current spend:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });

  it("renders the block dialog in Chinese in the open state", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, userRole: "proxy_admin" });
    renderInfo();

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "封锁密钥" }));

    expect(await screen.findByText("封锁密钥")).toBeInTheDocument();
    expect(screen.queryByText("Block Key")).not.toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => element?.tagName === "P" && element.textContent === "封锁 asdasdas？"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("使用此密钥的请求将被拒绝并返回 401 错误，直到解封。密钥不会被删除，可随时解封。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Requests using this key will be rejected with a 401 error until it is unblocked. The key is not deleted and can be unblocked at any time.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the delete modal in Chinese in the open state", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, userRole: "proxy_admin" });
    renderInfo();

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "删除密钥" }));

    expect(await screen.findByText("此操作不可撤销，将立即吊销所有使用该密钥的应用的访问权限。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "This action is irreversible and will immediately revoke access for any applications using this key.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此 Virtual Key 吗？")).toBeInTheDocument();
    expect(screen.queryByText("Are you sure you want to delete this Virtual Key?")).not.toBeInTheDocument();
    expect(screen.getByText("密钥信息")).toBeInTheDocument();
    expect(screen.queryByText("Key Information")).not.toBeInTheDocument();
    expect(screen.getAllByText("团队 ID").length).toBeGreaterThan(0);
  });

  it("renders the enterprise regenerate tooltip in Chinese and hides the English original", async () => {
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, premiumUser: false });
    renderInfo();

    expect(await screen.findByText("这是 LiteLLM 企业版功能，需要有效密钥才能使用。")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a LiteLLM Enterprise feature, and requires a valid key to use."),
    ).not.toBeInTheDocument();
  });

  it("renders the update, reset, block and delete toasts in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, userRole: "proxy_admin" });
    mockResetKeySpendMutate.mockImplementation((_token: string, options: { onSuccess: () => void }) =>
      options.onSuccess(),
    );
    mockSetKeyBlockedState.mockImplementation(
      (_payload: unknown, options: { onSuccess: (r: { blocked: boolean }) => void }) =>
        options.onSuccess({ blocked: true }),
    );
    renderInfo();

    await screen.findByText("密钥设置");
    await user.click(screen.getByRole("tab", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "编辑设置" }));
    await editViewMocks.onSubmit?.({ token: "test-token-123", metadata: "{}" });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("密钥更新成功");

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "重置消费" }));
    await user.click(await screen.findByRole("button", { name: "重置" }));
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("密钥消费已重置为 $0");

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "封锁密钥" }));
    await user.click(await screen.findByRole("button", { name: "封锁" }));
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith("密钥已封锁");

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "删除密钥" }));
    const confirmInput = await screen.findByPlaceholderText("asdasdas");
    await user.type(confirmInput, "asdasdas");
    await user.click(screen.getByRole("button", { name: "删除" }));
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("密钥删除成功");
    });
  });

  it("renders the validation toasts in Chinese", async () => {
    renderInfo();

    const user = userEvent.setup();
    await screen.findByText("密钥设置");
    await user.click(screen.getByRole("tab", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "编辑设置" }));
    await editViewMocks.onSubmit?.({ token: "test-token-123", metadata: "{}", soft_budget: "abc" });
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith("软预算必须是有限数字");

    await editViewMocks.onSubmit?.({ token: "test-token-123", metadata: "not json" });
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith("元数据 JSON 无效");
  });

  it("renders the key-not-found copy in Chinese and hides the English original", () => {
    renderWithProviders(<KeyInfoView keyData={undefined} onClose={() => {}} keyId="missing" teams={[]} />);

    expect(screen.getByText("未找到密钥")).toBeInTheDocument();
    expect(screen.queryByText("Key not found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回密钥列表" })).toBeInTheDocument();
  });

  it("renders the throttling and guardrail metadata in Chinese and hides the English originals", () => {
    renderInfo({
      metadata: {
        logging: [],
        tags: ["test-tag"],
        throttle_on_budget_exceeded: true,
        disable_global_guardrails: true,
        guardrails: ["guardrail-1"],
        enable_prompt_caching: true,
      },
    });

    expectLocalized("超出预算时限流：是", "Throttle on budget exceeded: Yes");
    expectLocalized("全局 Guardrails 已禁用", "Global Guardrails Disabled");
    expectLocalized("已启用 - 已绕过全局 Guardrails", "Enabled - Global guardrails bypassed");
    expectLocalized("提示词缓存", "Prompt Caching");
    expectLocalized(
      "已启用（自动为 Anthropic 和 Bedrock Claude 请求注入 cache_control 标记）",
      "Enabled (auto-injects cache_control markers on Anthropic and Bedrock Claude requests)",
    );
  });

  it("renders the empty tags copy in Chinese and hides the English original", () => {
    renderInfo({ metadata: { logging: [] } });

    expectLocalized("未指定标签", "No tags specified");
  });

  it("renders the resolved guardrails copy in Chinese and hides the English original", async () => {
    renderInfo({ metadata: { logging: [], policies: ["policy-1"] } });

    expect(await screen.findByText("已解析的 Guardrails：")).toBeInTheDocument();
    expect(screen.queryByText("Resolved Guardrails:")).not.toBeInTheDocument();
  });

  it("renders the loading guardrails copy in Chinese and hides the English original", async () => {
    vi.mocked(getPolicyInfoWithGuardrails).mockReturnValue(new Promise(() => {}));
    renderInfo({ metadata: { logging: [], policies: ["policy-1"] } });

    expect(await screen.findByText("正在加载 Guardrails...")).toBeInTheDocument();
    expect(screen.queryByText("Loading guardrails...")).not.toBeInTheDocument();
  });

  it("renders the unblock dialog and toast in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthorized).mockReturnValue({ ...baseUseAuthorizedMock, userRole: "proxy_admin" });
    mockSetKeyBlockedState.mockImplementation(
      (_payload: unknown, options: { onSuccess: (r: { blocked: boolean }) => void }) =>
        options.onSuccess({ blocked: false }),
    );
    renderInfo({ blocked: true });

    await user.click(await screen.findByRole("button", { name: "更多密钥操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "解封密钥" }));

    expect(await screen.findByText("解封密钥")).toBeInTheDocument();
    expect(screen.queryByText("Unblock Key")).not.toBeInTheDocument();
    expect(screen.getByText("使用此密钥的请求将重新被接受。")).toBeInTheDocument();
    expect(screen.queryByText("Requests using this key will be accepted again.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "解封" }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("密钥已解封");
    });
  });

  it("renders the last-regenerated copy in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderInfo();

    await user.click(await screen.findByRole("button", { name: "重新生成密钥" }));
    await user.click(await screen.findByRole("button", { name: "重新生成" }));

    expect(await screen.findByText("上次重新生成")).toBeInTheDocument();
    expect(screen.queryByText("Last Regenerated")).not.toBeInTheDocument();
    expect(screen.getByText("最近")).toBeInTheDocument();
    expect(screen.queryByText("Recent")).not.toBeInTheDocument();
    expect(vi.mocked(regenerateKeyCall)).toHaveBeenCalled();
  });

  it("renders the unresolvable MCP catalog toast in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(useMCPServers).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useMCPServers>);
    renderInfo();

    await screen.findByText("密钥设置");
    await user.click(screen.getByRole("tab", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "编辑设置" }));
    const unresolvableMcpSelection = {
      token: "test-token-123",
      metadata: "{}",
      mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: ["ts-missing"] },
      mcp_tool_permissions: { "srv-1": ["tool"] },
    };
    await editViewMocks.onSubmit?.(unresolvableMcpSelection);

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "MCP 服务或工具集列表不可用，因此暂时无法保存 MCP 权限。请重试。",
      );
    });
    expect(vi.mocked(toast.error)).not.toHaveBeenCalledWith(
      "MCP server or toolset list is unavailable, so MCP permissions cannot be saved yet. Retry.",
    );
  });
});
