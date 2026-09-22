import { act, cleanup, renderWithProviders, renderHook, screen, waitFor, within } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import i18n from "@/i18n/bootstrapI18n";
import type { Team } from "../key_team_helpers/key_list";
import type { CredentialItem } from "../networking";
import { Providers } from "../provider_info_helpers";
import { projectMountedValues, useMountRegistry, type MountedFormValues } from "../common_components/MountedFormField";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";
import AddModelForm from "./AddModelForm";

const mockUseAuthorized = vi.fn();
const mockUseProviderFields = vi.fn();

vi.mock("../molecules/models/ProviderLogo", () => ({
  ProviderLogo: ({ provider, className }: { provider: string; className?: string }) => (
    <div className={className} data-testid={`provider-logo-${provider}`}>
      {provider}
    </div>
  ),
}));

vi.mock("../networking", async () => {
  const actual = await vi.importActual<typeof import("../networking")>("../networking");
  return {
    ...actual,
    getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
    tagListCall: vi.fn().mockResolvedValue({}),
    modelAvailableCall: vi.fn().mockResolvedValue({ data: [{ id: "model-group-1" }] }),
    modelHubCall: vi.fn().mockResolvedValue({ data: [] }),
    testConnectionRequest: vi.fn().mockResolvedValue({ status: "success" }),
    vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }),
    getProviderCreateMetadata: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/app/(dashboard)/hooks/providers/useProviderFields", () => ({
  useProviderFields: () => mockUseProviderFields(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => mockUseAuthorized() }));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useInfiniteTeams: () => ({
    data: {
      pages: [
        {
          teams: [{ team_id: "team-1", team_alias: "Test Team", organization_id: "org-1" }],
          total: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
        },
      ],
    },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/guardrails/useGuardrails", () => ({
  useGuardrails: () => ({ data: { guardrails: [] }, isLoading: false, error: null }),
}));

vi.mock("@/app/(dashboard)/hooks/tags/useTags", () => ({
  useTags: () => ({ data: {}, isLoading: false, error: null }),
}));

const HEALTH_CHECK_HINT = "可选 - 对此模型进行健康检查时使用的 LiteLLM endpoint 了解更多";

const authorizedUser = (userRole: string, userId: string, premiumUser: boolean) => ({
  token: "test-token",
  accessToken: "test-access-token",
  userId,
  userEmail: "test@example.com",
  userRole,
  premiumUser,
  disabledPersonalKeyCreation: false,
  showSSOBanner: false,
});

const testTeam: Team = {
  team_id: "team-1",
  team_alias: "Test Team",
  models: ["gpt-4"],
  max_budget: 100,
  budget_duration: "monthly",
  tpm_limit: null,
  rpm_limit: null,
  organization_id: "org-1",
  created_at: "2024-01-01T00:00:00Z",
  keys: [],
  members_with_roles: [],
};

const createTestProps = (userRole = "proxy_admin", userId = "user-1", isTeamAdmin = false) => {
  const { result } = renderHook(() => {
    const form = useForm<MountedFormValues>({ mode: "onChange" });
    const registry = useMountRegistry();
    return { form, registry };
  });
  const { form, registry } = result.current;

  const credentials: CredentialItem[] = [
    {
      credential_name: "test-credential",
      credential_values: {},
      credential_info: { custom_llm_provider: "openai", description: "Test credential" },
    },
  ];

  return {
    form,
    registry,
    mountedValues: () => projectMountedValues(registry, form.getValues),
    handleOk: vi.fn().mockResolvedValue(true),
    setSelectedProvider: vi.fn(),
    setProviderModelsFn: vi.fn(),
    getPlaceholder: vi.fn((provider: string) => `Enter ${provider} model name`),
    setShowAdvancedSettings: vi.fn(),
    selectedProvider: Providers.OpenAI,
    providerModels: ["gpt-4", "gpt-3.5-turbo"],
    showAdvancedSettings: false,
    teams: [{ ...testTeam, members_with_roles: isTeamAdmin ? [{ user_id: userId, role: "admin" }] : [] }],
    credentials,
  };
};

const renderForm = (userRole = "proxy_admin", userId = "user-1", isTeamAdmin = false, premiumUser = true) => {
  mockUseAuthorized.mockReturnValue(authorizedUser(userRole, userId, premiumUser));
  mockUseProviderFields.mockReturnValue({
    data: [
      {
        provider: "OpenAI",
        provider_display_name: "OpenAI",
        litellm_provider: "openai",
        default_model_placeholder: "gpt-3.5-turbo",
        credential_fields: [],
      },
    ],
    isLoading: false,
    error: null,
  });
  const props = createTestProps(userRole, userId, isTeamAdmin);
  renderWithProviders(<AddModelForm {...props} />);
  return props;
};

describe("AddModelForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese heading, provider label, mode label and credential chrome", async () => {
    renderForm();

    expect(await screen.findByRole("heading", { name: "添加模型" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add Model" })).not.toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("模式")).toBeInTheDocument();
    expect(screen.queryByText("Mode")).not.toBeInTheDocument();
    expect(screen.getByText("选择现有凭证，或在下方输入新的提供商凭证")).toBeInTheDocument();
    expect(
      screen.queryByText("Either select existing credentials OR enter new provider credentials below"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("现有凭证")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或搜索现有凭证")).toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(screen.getByText("其他模型信息设置")).toBeInTheDocument();
    expect(screen.getByText("需要帮助？")).toBeInTheDocument();
    expect(screen.queryByText("Need Help?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加模型" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Connect" })).not.toBeInTheDocument();
  });

  it("renders the Chinese health-check hint line", async () => {
    renderForm();

    expect(
      await screen.findByText((_, element) => element?.tagName === "P" && element.textContent === HEALTH_CHECK_HINT),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "Optional - LiteLLM endpoint to use when health checking this model Learn more",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese team hint inside its open tooltip for a team admin", async () => {
    const user = userEvent.setup();
    renderForm("team_member", "user-1", true);

    const teamLabel = await screen.findByText("选择团队");
    await user.hover(findTooltipTriggerBeside(teamLabel));

    expect(await screen.findByText("选择要为其添加此模型的团队")).toBeInTheDocument();
    expect(screen.queryByText("Select the team for which you want to add this model")).not.toBeInTheDocument();
  });

  it("renders the Chinese provider hint inside its open tooltip", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.hover(findTooltipTriggerBeside(await screen.findByText("提供商")));

    expect(await screen.findByText("例如 OpenAI、Azure OpenAI、Anthropic、Bedrock 等。")).toBeInTheDocument();
    expect(screen.queryByText("E.g. OpenAI, Azure OpenAI, Anthropic, Bedrock, etc.")).not.toBeInTheDocument();
  });

  it("renders the Chinese team selection alert for a team admin", async () => {
    renderForm("team_member", "user-1", true);

    expect(await screen.findByText("需要选择团队")).toBeInTheDocument();
    expect(screen.queryByText("Team Selection Required")).not.toBeInTheDocument();
    expect(screen.getByText("作为团队管理员，你需要先选择团队，然后才能添加模型。")).toBeInTheDocument();
    expect(
      screen.queryByText("As a team admin, you need to select your team first before adding models."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese Team-BYOK label, hint and enterprise tooltip", async () => {
    const user = userEvent.setup();
    renderForm("proxy_admin", "user-1", false, false);

    const label = await screen.findByText("团队 BYOK 模型");
    expect(screen.queryByText("Team-BYOK Model")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(label));
    expect(
      await screen.findByText("仅将此模型与凭证组合用于该团队。适用于团队希望接入自己的 OpenAI 密钥的场景。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Only use this model + credential combination for this team. Useful when teams want to onboard their own OpenAI keys.",
      ),
    ).not.toBeInTheDocument();

    const switchEl = screen.getByRole("switch", { name: "团队 BYOK 模型" });
    await user.hover(switchEl);
    expect(
      await screen.findByText("这是企业版专属功能。升级到高级版即可将模型与凭证组合限制到特定团队。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "This is an enterprise-only feature. Upgrade to premium to restrict model+credential combinations to a specific team.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese team-scope hint and model access group chrome for an admin", async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByText("提供商");
    await user.click(screen.getByRole("switch", { name: "团队 BYOK 模型" }));

    const teamLabel = (await screen.findAllByText("选择团队"))[0];
    await user.hover(findTooltipTriggerBeside(teamLabel));
    expect(await screen.findByText("只有该团队的密钥才能调用此模型。")).toBeInTheDocument();
    expect(screen.queryByText("Only keys for this team will be able to call this model.")).not.toBeInTheDocument();

    const groupLabel = screen.getByText("模型访问组");
    expect(screen.queryByText("Model Access Group")).not.toBeInTheDocument();
    await user.hover(findTooltipTriggerBeside(groupLabel));
    expect(
      await screen.findByText("使用模型访问组让用户可以访问所选模型，并可随时间向组中添加新模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Use model access groups to give users access to select models, and add new ones to the group over time.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese help tooltip and the Chinese connection test dialog", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.hover(await screen.findByText("需要帮助？"));
    expect(await screen.findByText("在我们的 github 上获取帮助")).toBeInTheDocument();
    expect(screen.queryByText("Get help on our github")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("test-connect-btn"));

    expect(await screen.findByText("连接测试结果")).toBeInTheDocument();
    expect(screen.queryByText("Connection Test Results")).not.toBeInTheDocument();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });

  it("renders every Chinese test-mode option inside the open listbox", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByRole("combobox", { name: "模式" }));
    const listbox = await screen.findByRole("listbox");

    const modes = [
      "对话 - /chat/completions",
      "补全 - /completions",
      "嵌入 - /embeddings",
      "语音合成 - /audio/speech",
      "语音转写 - /audio/transcriptions",
      "图像生成 - /images/generations",
      "图像编辑 - /images/edits",
      "视频生成 - /videos",
      "重排序 - /rerank",
      "实时 - /realtime",
      "批处理 - /batch",
      "OCR - /ocr",
    ];
    for (const mode of modes) {
      expect(within(listbox).getByText(mode)).toBeInTheDocument();
    }
    expect(within(listbox).queryByText("Chat - /chat/completions")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Completion - /completions")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Embedding - /embeddings")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Audio Speech - /audio/speech")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Audio Transcription - /audio/transcriptions")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Image Generation - /images/generations")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Image Edit - /images/edits")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Video Generation - /videos")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Rerank - /rerank")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Realtime - /realtime")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Batch - /batch")).not.toBeInTheDocument();
  });

  it("renders the Chinese none option in the open credentials listbox", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByPlaceholderText("选择或搜索现有凭证"));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).getByText("无")).toBeInTheDocument();
    expect(within(listbox).queryByText("None")).not.toBeInTheDocument();
  });

  it("renders the Chinese required validation messages", async () => {
    const { form } = renderForm();

    await act(async () => {
      await form.trigger("custom_llm_provider");
    });
    expect(await screen.findByText("必填")).toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("renders the Chinese team-required validation message for a team admin", async () => {
    const { form } = renderForm("team_member", "user-1", true);

    await act(async () => {
      await form.trigger("team_id");
    });

    expect(await screen.findByText("请选择一个团队以继续")).toBeInTheDocument();
    expect(screen.queryByText("Please select a team to continue")).not.toBeInTheDocument();
  });

  it("renders the Chinese provider placeholder and loading placeholder", async () => {
    renderForm();
    expect(await screen.findByPlaceholderText("选择提供商")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a provider")).not.toBeInTheDocument();

    cleanup();
    mockUseProviderFields.mockReturnValue({ data: null, isLoading: true, error: null });
    renderWithProviders(<AddModelForm {...createTestProps()} />);
    expect(await screen.findByPlaceholderText("正在加载提供商...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading providers...")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-providers empty state inside the open listbox", async () => {
    const user = userEvent.setup();
    mockUseAuthorized.mockReturnValue(authorizedUser("proxy_admin", "user-1", true));
    mockUseProviderFields.mockReturnValue({ data: [], isLoading: false, error: null });
    renderWithProviders(<AddModelForm {...createTestProps()} />);

    await user.click(await screen.findByPlaceholderText("选择提供商"));

    expect(await screen.findByText("未找到提供商")).toBeInTheDocument();
    expect(screen.queryByText("No providers found")).not.toBeInTheDocument();
  });

  it("keeps the English provider label out of the Chinese form", async () => {
    renderForm();
    await screen.findByText("提供商");
    await waitFor(() => expect(screen.queryByText("Provider")).not.toBeInTheDocument());
  });
});
