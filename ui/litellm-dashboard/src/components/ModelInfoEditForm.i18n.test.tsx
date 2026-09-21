import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { findTooltipTrigger } from "@/../tests/i18nTooltip";

import ModelInfoEditForm from "./ModelInfoEditForm";

vi.mock("./networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./networking")>();
  return { ...actual, vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }) };
});

const localModelData = {
  model_name: "gpt-4",
  litellm_model_name: "openai/gpt-4",
  litellm_params: {
    api_base: "https://api.openai.com/v1",
    custom_llm_provider: "openai",
    tpm: 100,
    rpm: 50,
    max_retries: 2,
    timeout: 30,
    stream_timeout: 10,
    vector_store_ids: [],
    guardrails: [],
    tags: [],
    cache_control_injection_points: [{ location: "message", role: "user", index: 2 }],
  },
  model_info: {
    id: "123",
    team_id: "team-1",
    access_groups: [],
    ptu_count: 3,
    cost_per_ptu_per_hour: 2,
    ptu_effective_from: null,
    ptu_effective_to: null,
    input_cost_per_token: 0.000001,
    output_cost_per_token: 0.000002,
    cache_read_input_token_cost: 0.0000001,
    cache_creation_input_token_cost: 0.0000002,
    health_check_model: "gpt-4o",
  },
};

const withModelInfo = (modelInfo: Record<string, unknown>) => ({
  ...localModelData,
  model_info: { ...localModelData.model_info, ...modelInfo },
});

const PTU_OUT_OF_RANGE = {
  ptu_count: 1_000_001,
  cost_per_ptu_per_hour: 1_000_001,
  ptu_effective_from: "2024-02-01T00:00:00Z",
  ptu_effective_to: "2024-01-01T00:00:00Z",
};

const PTU_UNPAIRED = {
  ptu_count: 3,
  cost_per_ptu_per_hour: null,
  ptu_effective_from: null,
  ptu_effective_to: null,
};

const PTU_WITH_USAGE_COST = {
  ptu_count: 3,
  cost_per_ptu_per_hour: 2,
  ptu_effective_from: "2024-01-01T00:00:00Z",
  ptu_effective_to: "2024-02-01T00:00:00Z",
};

const renderForm = async (overrides: Record<string, unknown> = {}) => {
  const result = render(
    <QueryClientProvider client={new QueryClient()}>
      <ModelInfoEditForm
        localModelData={localModelData}
        modelData={{ model_info: { team_id: "team-1" } }}
        accessToken="token"
        isEditing={false}
        isSaving={false}
        isWildcardModel
        ptuCostAttributionEnabled
        showCacheControl={false}
        setShowCacheControl={vi.fn()}
        onCancel={vi.fn()}
        onSubmit={vi.fn()}
        modelAccessGroups={[]}
        guardrailsList={[]}
        tagsList={{}}
        credentialsList={[]}
        healthCheckModelOptions={[]}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return result;
};

describe("ModelInfoEditForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese PTU field labels", async () => {
    await renderForm();

    expect(screen.getByText("PTU 数量")).toBeInTheDocument();
    expect(screen.queryByText("PTU Count")).not.toBeInTheDocument();
    expect(screen.getByText("每 PTU 每小时成本（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Cost per PTU / Hour (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("PTU 生效开始时间（UTC）")).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective From (UTC)")).not.toBeInTheDocument();
    expect(screen.getByText("PTU 生效结束时间（UTC）")).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective To (UTC)")).not.toBeInTheDocument();
  });

  it("renders the Chinese section headings and field labels", async () => {
    await renderForm();

    expect(screen.getByText("模型访问组")).toBeInTheDocument();
    expect(screen.queryByText("Model Access Groups")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("已附加的知识库（RAG）")).toBeInTheDocument();
    expect(screen.queryByText("Attached Knowledge Bases (RAG)")).not.toBeInTheDocument();
    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.getByText("现有凭证")).toBeInTheDocument();
    expect(screen.getByText("健康检查模型")).toBeInTheDocument();
    expect(screen.getByText("缓存控制")).toBeInTheDocument();
    expect(screen.getByText("模型信息")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 参数")).toBeInTheDocument();
    expect(screen.getByText("团队 ID")).toBeInTheDocument();
    expect(screen.queryByText("Team ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-state labels", async () => {
    await renderForm();

    expect(screen.getByText("未分配组")).toBeInTheDocument();
    expect(screen.queryByText("No groups assigned")).not.toBeInTheDocument();
    expect(screen.getByText("未分配 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails assigned")).not.toBeInTheDocument();
    expect(screen.getByText("未附加知识库")).toBeInTheDocument();
    expect(screen.queryByText("No knowledge bases attached")).not.toBeInTheDocument();
    expect(screen.getByText("未分配标签")).toBeInTheDocument();
    expect(screen.queryByText("No tags assigned")).not.toBeInTheDocument();
  });

  it("renders the Chinese editable field labels and placeholders", async () => {
    await renderForm({ isEditing: true });

    expect(screen.getByPlaceholderText("输入模型名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter model name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 LiteLLM 模型名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter LiteLLM model name")).not.toBeInTheDocument();
    expect(screen.getByText("输入成本（每 1M Token）")).toBeInTheDocument();
    expect(screen.queryByText("Input Cost (per 1M tokens)")).not.toBeInTheDocument();
    expect(screen.getByText("输出成本（每 1M Token）")).toBeInTheDocument();
    expect(screen.getByText("缓存读取成本（每 1M Token）")).toBeInTheDocument();
    expect(screen.queryByText("Cache Read Cost (per 1M tokens)")).not.toBeInTheDocument();
    expect(screen.getByText("缓存写入成本（每 1M Token）")).toBeInTheDocument();
    expect(screen.getByText("API Base")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 API Base")).toBeInTheDocument();
    expect(screen.getByText("自定义 LLM 提供商")).toBeInTheDocument();
    expect(screen.queryByText("Custom LLM Provider")).not.toBeInTheDocument();
    expect(screen.getByText("组织")).toBeInTheDocument();
    expect(screen.getByText("TPM（每分钟 Token 数）")).toBeInTheDocument();
    expect(screen.getByText("RPM（每分钟请求数）")).toBeInTheDocument();
    expect(screen.getByText("最大重试次数")).toBeInTheDocument();
    expect(screen.getByText("超时（秒）")).toBeInTheDocument();
    expect(screen.getByText("流式超时（秒）")).toBeInTheDocument();
    expect(screen.queryByText("Stream Timeout (seconds)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese cache-control injection point copy", async () => {
    await renderForm({ showCacheControl: true });

    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
    expect(screen.getByText("位置：message，")).toBeInTheDocument();
    expect(screen.getByText("角色：user")).toBeInTheDocument();
    expect(screen.getByText("索引：2")).toBeInTheDocument();
  });

  it("renders the Chinese editable placeholders", async () => {
    await renderForm({ isEditing: true });

    expect(screen.getByPlaceholderText("请输入成本")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入输出成本")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 TPM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 RPM")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入最大重试次数")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入超时时间")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入流式超时时间")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入自定义 LLM 提供商")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入组织")).toBeInTheDocument();
    expect(screen.getByText("缓存控制注入点")).toBeInTheDocument();
    expect(screen.queryByText("Cache Control Injection Points")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit-mode chip and select placeholders", async () => {
    await renderForm({ isEditing: true, localModelData: withModelInfo({ health_check_model: null }) });

    expect(screen.getByPlaceholderText("选择现有组，或输入以创建新组")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select existing groups or type to create new ones")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择现有 Guardrails，或输入以创建新的")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择现有标签，或输入以创建新标签")).toBeInTheDocument();
    expect(await screen.findByPlaceholderText("选择知识库（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select knowledge bases (optional)")).not.toBeInTheDocument();
    expect(screen.getByText("选择或搜索现有凭证")).toBeInTheDocument();
    expect(screen.queryByText("Select or search for existing credentials")).not.toBeInTheDocument();
    expect(screen.getByText("选择现有的健康检查模型")).toBeInTheDocument();
    expect(screen.queryByText("Select existing health check model")).not.toBeInTheDocument();
  });

  it("renders the Chinese none option in the open credentials listbox", async () => {
    const user = userEvent.setup();
    await renderForm({ isEditing: true, localModelData: withModelInfo({ health_check_model: null }) });

    await user.click(screen.getByText("选择或搜索现有凭证"));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("无")).toBeInTheDocument();
    expect(within(listbox).queryByText("None")).not.toBeInTheDocument();
  });

  it("renders the Chinese disabled cache-control label", async () => {
    await renderForm({
      localModelData: {
        ...localModelData,
        litellm_params: { ...localModelData.litellm_params, cache_control_injection_points: undefined },
      },
    });

    expect(screen.getByText("已禁用")).toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
  });

  it("renders the Chinese cache cost descriptions and defaults hint", async () => {
    await renderForm({ isEditing: true });

    expect(screen.getByText("保存时若留空，则默认为输入成本。")).toBeInTheDocument();
    expect(screen.queryByText("If left blank on save, defaults to Input Cost.")).not.toBeInTheDocument();
    expect(screen.getByText("保存时若留空，则默认为输入成本（后端回退到 input_cost_per_token）。")).toBeInTheDocument();
    expect(
      screen.queryByText("If left blank on save, defaults to Input Cost (backend falls back to input_cost_per_token)."),
    ).not.toBeInTheDocument();

    const cacheReadField = screen
      .getAllByRole("group")
      .find((group) => within(group).queryByText("保存时若留空，则默认为输入成本。") !== null);
    expect(cacheReadField).toBeDefined();
    expect(within(cacheReadField as HTMLElement).getByPlaceholderText("留空时默认为输入成本")).toBeInTheDocument();
    expect(
      within(cacheReadField as HTMLElement).queryByPlaceholderText("Defaults to Input Cost if blank"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese edit-mode hints inside their open tooltips", async () => {
    const user = userEvent.setup();
    await renderForm({ isEditing: true });

    await user.hover(findTooltipTrigger(screen.getByText("Guardrails")));
    expect(await screen.findByText("对此模型应用安全 Guardrails，以过滤内容或执行策略")).toBeInTheDocument();
    expect(
      screen.queryByText("Apply safety guardrails to this model to filter content or enforce policies"),
    ).not.toBeInTheDocument();

    await user.hover(findTooltipTrigger(screen.getByText("已附加的知识库（RAG）")));
    expect(
      await screen.findByText("用于 RAG 的向量存储。对此模型的每次请求都会自动从这些知识库中检索上下文。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Vector stores used for RAG. Every request to this model will automatically retrieve context from these knowledge bases.",
      ),
    ).not.toBeInTheDocument();

    await user.hover(findTooltipTrigger(screen.getByText("LiteLLM 参数")));
    expect(
      await screen.findByText("用于发起 litellm.completion() 调用的可选 litellm 参数。部分参数由 LiteLLM 自动添加。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Optional litellm params used for making a litellm.completion() call. Some params are automatically added by LiteLLM.",
      ),
    ).not.toBeInTheDocument();

    await user.hover(findTooltipTrigger(screen.getByText("缓存控制注入点")));
    expect(
      await screen.findByText(
        "告诉 litellm 在哪里注入缓存控制检查点。你可以按角色（应用于该角色的所有消息）或按具体消息索引指定。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Tell litellm where to inject cache control checkpoints. You can specify either by role (to apply to all messages of that role) or by specific message index.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese PTU count, rate and order validation messages", async () => {
    const user = userEvent.setup();
    await renderForm({
      isEditing: true,
      localModelData: withModelInfo(PTU_OUT_OF_RANGE),
    });

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("PTU 数量必须是介于 1 和 1,000,000 之间的整数")).toBeInTheDocument();
    expect(screen.queryByText("PTU Count must be a whole number between 1 and 1,000,000")).not.toBeInTheDocument();
    expect(screen.getByText("每 PTU 每小时成本必须介于 0 和 1,000,000 之间")).toBeInTheDocument();
    expect(screen.queryByText("Cost per PTU / Hour must be between 0 and 1,000,000")).not.toBeInTheDocument();
    expect(screen.getAllByText("PTU 生效结束时间必须晚于生效开始时间")[0]).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective To must be after PTU Effective From")).not.toBeInTheDocument();
  });

  it("renders the Chinese PTU together and effective-from validation messages", async () => {
    const user = userEvent.setup();
    await renderForm({
      isEditing: true,
      localModelData: withModelInfo(PTU_UNPAIRED),
    });

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("设置 PTU 数量时必须填写 PTU 生效开始时间")).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective From is required when PTU Count is set")).not.toBeInTheDocument();
    expect(screen.getAllByText("PTU 数量和每 PTU 每小时成本必须同时设置")[0]).toBeInTheDocument();
    expect(screen.queryByText("PTU Count and Cost per PTU / Hour must be set together")).not.toBeInTheDocument();
  });

  it("renders the Chinese PTU reserved-capacity cost validation message", async () => {
    const user = userEvent.setup();
    await renderForm({
      isEditing: true,
      localModelData: withModelInfo(PTU_WITH_USAGE_COST),
    });

    fireEvent.change(screen.getByPlaceholderText("请输入成本"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("PTU 部署按预留容量计费，因此该成本必须为 0 或留空")).toBeInTheDocument();
    expect(
      screen.queryByText("A PTU deployment bills by reserved capacity, so this cost must be 0 or blank"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-JSON validation message", async () => {
    const user = userEvent.setup();
    await renderForm({ isEditing: true });

    fireEvent.change(screen.getByPlaceholderText(/rpm/), { target: { value: "{ not json" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("请输入有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Please enter valid JSON")).not.toBeInTheDocument();
  });
});
