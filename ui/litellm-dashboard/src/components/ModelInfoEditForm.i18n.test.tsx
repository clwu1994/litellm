import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ModelInfoEditForm from "./ModelInfoEditForm";

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

const renderForm = (overrides: Record<string, unknown> = {}) =>
  render(
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

describe("ModelInfoEditForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese PTU field labels", () => {
    renderForm();

    expect(screen.getByText("PTU 数量")).toBeInTheDocument();
    expect(screen.queryByText("PTU Count")).not.toBeInTheDocument();
    expect(screen.getByText("每 PTU 每小时成本（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Cost per PTU / Hour (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("PTU 生效开始时间（UTC）")).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective From (UTC)")).not.toBeInTheDocument();
    expect(screen.getByText("PTU 生效结束时间（UTC）")).toBeInTheDocument();
    expect(screen.queryByText("PTU Effective To (UTC)")).not.toBeInTheDocument();
  });

  it("renders the Chinese section headings and field labels", () => {
    renderForm();

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

  it("renders the Chinese empty-state labels", () => {
    renderForm();

    expect(screen.getByText("未分配组")).toBeInTheDocument();
    expect(screen.queryByText("No groups assigned")).not.toBeInTheDocument();
    expect(screen.getByText("未分配 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails assigned")).not.toBeInTheDocument();
    expect(screen.getByText("未附加知识库")).toBeInTheDocument();
    expect(screen.queryByText("No knowledge bases attached")).not.toBeInTheDocument();
    expect(screen.getByText("未分配标签")).toBeInTheDocument();
    expect(screen.queryByText("No tags assigned")).not.toBeInTheDocument();
  });

  it("renders the Chinese editable field labels and placeholders", () => {
    renderForm({ isEditing: true });

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

  it("renders the Chinese cache-control injection point copy", () => {
    renderForm({ showCacheControl: true });

    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
    expect(screen.getByText("位置：message，")).toBeInTheDocument();
    expect(screen.getByText("角色：user")).toBeInTheDocument();
    expect(screen.getByText("索引：2")).toBeInTheDocument();
  });

  it("renders the Chinese editable placeholders", () => {
    renderForm({ isEditing: true });

    expect(screen.getByPlaceholderText("输入输入成本")).toBeInTheDocument();
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
});
