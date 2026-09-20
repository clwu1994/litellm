import * as networking from "@/components/networking";
import { cleanup, fireEvent, render, waitFor, within, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import GuardrailInfoView from "./guardrail_info";

// Mock the networking module
vi.mock("@/components/networking", () => ({
  getGuardrailInfo: vi.fn(),
  getGuardrailUISettings: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn(),
  updateGuardrailCall: vi.fn(),
}));

// Mock ContentFilterManager
vi.mock("./content_filter/ContentFilterManager", () => ({
  __esModule: true,
  default: ({ onUnsavedChanges, onDataChange, isEditing }: any) => (
    <div data-testid="mock-content-filter-manager">
      {isEditing && (
        <button
          onClick={() => {
            onUnsavedChanges(true);
            onDataChange?.(["new_pattern"], ["new_word"], []);
          }}
        >
          Simulate Change
        </button>
      )}
    </div>
  ),
  formatContentFilterDataForAPI: (patterns: any[], blockedWords: any[], categories?: any[]) => ({
    patterns,
    blocked_words: blockedWords,
    categories: categories ?? [],
  }),
}));

describe("Guardrail Info", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render the guardrail info after loading", async () => {
    // Mock the network responses
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: {
        guardrail: "presidio",
        mode: "pre_call",
        default_on: true,
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: ["PERSON", "EMAIL"],
      supported_actions: ["MASK", "REDACT"],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    // Wait for the loading to complete and data to be rendered
    await waitFor(() => {
      // The guardrail name appears in multiple places (title and settings tab)
      const elements = screen.getAllByText("Test Guardrail");
      expect(elements.length).toBeGreaterThan(0);
    });

    // Verify other key elements are present
    expect(screen.getByText("Back to Guardrails")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should render a tag-based mode object rather than crashing the detail view", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: {
        guardrail: "bedrock",
        mode: { tags: { "Service-Type: internal-service": "post_call" }, default: ["pre_call", "post_call"] },
        default_on: true,
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: [],
      supported_actions: [],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    expect(await screen.findAllByText("pre_call, post_call (tag-based)")).not.toHaveLength(0);
  });

  it("should render the provider logo from the bundled guardrail logo map", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: {
        guardrail: "presidio",
        mode: "pre_call",
        default_on: true,
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: [],
      supported_actions: [],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    const logo = await screen.findByAltText("Presidio PII logo");
    expect(logo).toHaveAttribute("src", expect.stringContaining("microsoft_azure.svg"));
  });

  it("should not render the edit button for config guardrails", async () => {
    // Mock the network responses
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: {
        guardrail: "presidio",
        mode: "pre_call",
        default_on: true,
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "config",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: ["PERSON", "EMAIL"],
      supported_actions: ["MASK", "REDACT"],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    const { container } = render(
      <GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    // Click the Settings tab
    fireEvent.click(screen.getByText("Settings"));

    // Wait for the Settings panel to render
    await waitFor(() => {
      expect(screen.getByText("Guardrail Settings")).toBeInTheDocument();
    });

    await userEvent.hover(within(container).getByRole("img", { name: "Config guardrail details" }));

    expect(
      await screen.findByText("Guardrail is defined in the config file and cannot be edited."),
    ).toBeInTheDocument();
  });

  it("should render the guardrail info", async () => {
    // Mock the network responses
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: {
        guardrail: "presidio",
        mode: "pre_call",
        default_on: true,
        pii_entities_config: {
          PERSON: "MASK",
          EMAIL: "REDACT",
        },
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: ["PERSON", "EMAIL"],
      supported_actions: ["MASK", "REDACT"],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("PII Entity Configuration")).toBeInTheDocument();
    });
  });
  it("should handle content filter updates correctly", async () => {
    // Mock the network responses
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Content Filter Guardrail",
      litellm_params: {
        guardrail: "litellm_content_filter",
        mode: "pre_call",
        default_on: true,
        patterns: ["initial_pattern"],
        blocked_words: ["initial_word"],
      },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });

    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: [],
      supported_actions: [],
      pii_entity_categories: [],
      supported_modes: ["pre_call", "post_call"],
    });

    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});
    vi.mocked(networking.updateGuardrailCall).mockResolvedValue({ status: "success" });

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    // Go to Settings tab
    fireEvent.click(screen.getByText("Settings"));

    await waitFor(() => {
      expect(screen.getByText("Guardrail Settings")).toBeInTheDocument();
    });

    // Enter Edit Mode
    fireEvent.click(screen.getByText("Edit Settings"));

    // Modify Guardrail Name to force an update
    const nameInput = screen.getByLabelText("Guardrail Name");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    // Save with only name change
    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(networking.updateGuardrailCall).toHaveBeenCalled();
    });

    // Verify call did NOT include patterns or blocked_words (because no changes)
    // updateGuardrailCall(accessToken, guardrailId, updateData) -> index 2 is updateData
    const firstCallArgs: any = vi.mocked(networking.updateGuardrailCall).mock.calls[0][2];

    // Verify attributes that definitely changed
    expect(firstCallArgs.guardrail_name).toBe("Updated Name");

    // litellm_params might be undefined if empty, which is correct.
    // If it exists, ensure patterns/blocked_words are not in it.
    if (firstCallArgs.litellm_params) {
      expect(firstCallArgs.litellm_params.patterns).toBeUndefined();
      expect(firstCallArgs.litellm_params.blocked_words).toBeUndefined();
    }

    // Clear mocks to reset call count
    vi.clearAllMocks();

    // Enter Edit Mode again to make changes
    await waitFor(() => {
      expect(screen.getByText("Edit Settings")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Edit Settings"));

    // Now modify the values using the mock button
    const simulateChangeButton = screen.getByText("Simulate Change");
    fireEvent.click(simulateChangeButton);

    // Save again
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(networking.updateGuardrailCall).toHaveBeenCalled();
    });

    // Verify call INCLUDES patterns and blocked_words
    const secondCallArgs: any = vi.mocked(networking.updateGuardrailCall).mock.calls[0][2];
    expect(secondCallArgs.litellm_params).toBeDefined();
    expect(secondCallArgs.litellm_params.patterns).toEqual(["new_pattern"]);
    expect(secondCallArgs.litellm_params.blocked_words).toEqual(["new_word"]);
  });

  it("keeps the settings panel mounted while the overview tab is active", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue({
      guardrail_id: "123",
      guardrail_name: "Test Guardrail",
      litellm_params: { guardrail: "presidio", mode: "pre_call", default_on: true },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      guardrail_definition_location: "database",
    });
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: [],
      supported_actions: [],
      pii_entity_categories: [],
      supported_modes: ["pre_call"],
    });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});

    render(<GuardrailInfoView guardrailId="123" onClose={() => {}} accessToken="123" isAdmin={true} />);

    expect(await screen.findByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Guardrail Settings")).toBeInTheDocument();
  });
});

describe("Guardrail Info when the guardrail cannot be loaded", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should keep Back to Guardrails reachable so a stale ?guardrail= link is not a dead end", async () => {
    vi.mocked(networking.getGuardrailInfo).mockRejectedValue(new Error("Guardrail stale-id not found"));
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      supported_entities: [],
      supported_actions: [],
      pii_entity_categories: [],
      supported_modes: [],
    });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});
    const onClose = vi.fn();

    render(<GuardrailInfoView guardrailId="stale-id" onClose={onClose} accessToken="123" isAdmin={true} />);

    expect(await screen.findByText("Guardrail not found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back to guardrails/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

const zhGuardrail = (litellmParams: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  guardrail_id: "gr-zh",
  guardrail_name: "Test Guardrail",
  litellm_params: { guardrail: "presidio", mode: "pre_call", default_on: true, ...litellmParams },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  guardrail_definition_location: "database",
  ...extra,
});

const zhUiSettings = {
  supported_entities: ["PERSON", "EMAIL"],
  supported_actions: ["MASK", "REDACT"],
  pii_entity_categories: [],
  supported_modes: ["pre_call", "post_call"],
};

const renderZhInfo = () =>
  render(<GuardrailInfoView guardrailId="gr-zh" onClose={() => {}} accessToken="123" isAdmin />);

const openZhSettings = async () => {
  fireEvent.click(await screen.findByRole("tab", { name: "设置" }));
  await screen.findByText("Guardrail 设置");
};

/* eslint-disable testing-library/no-node-access -- The hint trigger is an icon with no accessible name, so reaching its portal needs the DOM */
const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const fieldLabel = screen.getByText(label);
  const trigger = fieldLabel.closest("label")?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("Guardrail Info Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue(zhUiSettings);
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({});
    vi.mocked(networking.updateGuardrailCall).mockResolvedValue({ status: "success" });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese overview chrome and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(
      zhGuardrail({ pii_entities_config: { PERSON: "MASK", EMAIL: "REDACT", PHONE: "BLOCK" } }),
    );

    renderZhInfo();

    expect(await screen.findByText("PII 实体配置")).toBeInTheDocument();
    expect(screen.getByText("返回 Guardrails")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.getAllByText("提供商").length).toBeGreaterThan(0);
    expect(screen.getAllByText("模式").length).toBeGreaterThan(0);
    expect(screen.getAllByText("创建时间").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PII 保护").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已配置 3 个 PII 实体").length).toBeGreaterThan(0);
    expect(screen.getByText("实体类型")).toBeInTheDocument();
    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getAllByText("默认开启").length).toBeGreaterThan(0);
    expect(screen.getByText(/最后更新：/)).toBeInTheDocument();

    expect(screen.getByText("屏蔽")).toBeInTheDocument();
    expect(screen.getByText("脱敏")).toBeInTheDocument();
    expect(screen.getByText("阻止")).toBeInTheDocument();
    expect(screen.queryByText("MASK")).not.toBeInTheDocument();
    expect(screen.queryByText("REDACT")).not.toBeInTheDocument();
    expect(screen.queryByText("BLOCK")).not.toBeInTheDocument();

    expect(screen.queryByText("Back to Guardrails")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("PII Entity Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Entity Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Default On")).not.toBeInTheDocument();
    expect(screen.queryByText(/Last Updated:/)).not.toBeInTheDocument();
  });

  it("renders the Chinese read-only settings chrome and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(
      zhGuardrail({ pii_entities_config: { PERSON: "MASK", EMAIL: "REDACT" } }),
    );

    renderZhInfo();
    await screen.findByText("PII 实体配置");
    await openZhSettings();

    expect(screen.getByText("编辑设置")).toBeInTheDocument();
    expect(screen.getByText("Guardrail ID")).toBeInTheDocument();
    expect(screen.getAllByText("Guardrail 名称").length).toBeGreaterThan(0);
    expect(screen.getAllByText("提供商").length).toBeGreaterThan(0);
    expect(screen.getAllByText("模式").length).toBeGreaterThan(0);
    expect(screen.getAllByText("默认开启").length).toBeGreaterThan(0);
    expect(screen.getByText("最后更新")).toBeInTheDocument();
    expect(screen.getAllByText("是").length).toBeGreaterThan(0);

    expect(screen.queryByText("Guardrail Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Last Updated")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Name")).not.toBeInTheDocument();
  });

  it("renders the Chinese No and Default Off labels for a guardrail that is not default on and hides the English ones", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({ default_on: false }));

    renderZhInfo();
    await openZhSettings();

    expect(screen.getByText("默认关闭")).toBeInTheDocument();
    expect(screen.getAllByText("否").length).toBeGreaterThan(0);
    expect(screen.queryByText("Default Off")).not.toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit form labels, placeholders and tooltips and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({
      bedrock: { guardrailIdentifier: { description: "The guardrail id on Bedrock", required: true, type: null } },
    });
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(
      zhGuardrail({ guardrail: "bedrock", guardrailIdentifier: "gr-1" }),
    );

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));

    expect(await screen.findByLabelText("Guardrail 名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 Guardrail 名称")).toBeInTheDocument();
    expect(screen.getAllByText("默认开启").length).toBeGreaterThan(0);
    expect(screen.getByText("在 Guardrail 中跳过 system 消息")).toBeInTheDocument();
    expect(screen.getByText("在 Guardrail 中跳过 tool 消息")).toBeInTheDocument();
    expect(screen.getByText("提供商设置")).toBeInTheDocument();
    expect(screen.getByText("高级设置")).toBeInTheDocument();
    expect(screen.getByText("Guardrail 信息")).toBeInTheDocument();
    expect(screen.getByText("保存更改")).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();

    await hoverHint(user, "在 Guardrail 中跳过 system 消息");
    expect(
      await screen.findByText(
        "统一 Guardrail：从 Guardrail 输入中省略 role: system（LLM 仍会收到完整消息）。使用全局默认值将遵循 litellm_settings.skip_system_message_in_guardrail。",
      ),
    ).toBeInTheDocument();
    await hoverHint(user, "在 Guardrail 中跳过 tool 消息");
    expect(
      await screen.findByText(
        "统一 Guardrail：从 Guardrail 输入中省略 role: tool（LLM 仍会收到完整消息）。使用全局默认值将遵循 litellm_settings.skip_tool_message_in_guardrail。",
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText("Provider Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Information")).not.toBeInTheDocument();
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter guardrail name")).not.toBeInTheDocument();
  });

  it("renders the Chinese select placeholder when the value is unset and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({ default_on: undefined }));

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));

    expect((await screen.findAllByText("请选择")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Select an option")).not.toBeInTheDocument();
  });

  it("renders the Chinese config guardrail tooltip and aria label and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(
      zhGuardrail({}, { guardrail_definition_location: "config" }),
    );

    renderZhInfo();
    await openZhSettings();

    await user.hover(screen.getByRole("img", { name: "配置项 Guardrail 详情" }));
    expect(await screen.findByText("Guardrail 在配置文件中定义，无法编辑。")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Config guardrail details" })).not.toBeInTheDocument();
  });

  it("renders the Chinese custom code chrome and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(
      zhGuardrail({ guardrail: "custom_code", custom_code: "print('hi')" }),
    );

    renderZhInfo();

    expect(await screen.findByText("自定义代码")).toBeInTheDocument();
    expect(screen.getAllByText("编辑代码").length).toBeGreaterThan(0);
    expect(screen.queryByText("Custom Code")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit Code")).not.toBeInTheDocument();
  });

  it("renders the Chinese unnamed-guardrail fallback and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({}, { guardrail_name: "" }));

    renderZhInfo();

    expect(await screen.findByRole("heading", { name: "未命名 Guardrail" })).toBeInTheDocument();
    expect(screen.queryByText("Unnamed Guardrail")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading state and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockReturnValue(new Promise(() => {}));

    renderZhInfo();

    expect(await screen.findByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found state and load-failure toast and hides the English ones", async () => {
    vi.mocked(networking.getGuardrailInfo).mockRejectedValue(new Error("nope"));

    renderZhInfo();

    expect(await screen.findByText("未找到 Guardrail")).toBeInTheDocument();
    expect(toast.fromError).toHaveBeenCalledWith("加载 Guardrail 信息失败");
    expect(screen.queryByText("Guardrail not found")).not.toBeInTheDocument();
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load guardrail information");
  });

  it("renders the Chinese no-changes toast and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({}));

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));
    await screen.findByLabelText("Guardrail 名称");
    fireEvent.click(screen.getByText("保存更改"));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("未检测到更改"));
    expect(toast.info).not.toHaveBeenCalledWith("No changes detected");
  });

  it("renders the Chinese updated toast and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({}));

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));
    fireEvent.change(await screen.findByLabelText("Guardrail 名称"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByText("保存更改"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardrail 更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Guardrail updated successfully");
  });

  it("renders the Chinese update-failure toast and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({}));
    vi.mocked(networking.updateGuardrailCall).mockRejectedValue(new Error("boom"));

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));
    fireEvent.change(await screen.findByLabelText("Guardrail 名称"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByText("保存更改"));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新 Guardrail 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update guardrail");
  });

  it("renders the Chinese name-required validation message and hides the English one", async () => {
    vi.mocked(networking.getGuardrailInfo).mockResolvedValue(zhGuardrail({}));

    renderZhInfo();
    await openZhSettings();
    fireEvent.click(await screen.findByText("编辑设置"));
    fireEvent.change(await screen.findByLabelText("Guardrail 名称"), { target: { value: "" } });
    fireEvent.click(screen.getByText("保存更改"));

    expect(await screen.findByText("请输入 Guardrail 名称")).toBeInTheDocument();
    expect(screen.queryByText("Please input a guardrail name")).not.toBeInTheDocument();
  });
});
