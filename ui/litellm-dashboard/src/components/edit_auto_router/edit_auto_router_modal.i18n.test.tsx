import userEvent from "@testing-library/user-event";
import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { findTooltipTrigger } from "@/../tests/i18nTooltip";
import { renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";

import EditAutoRouterModal from "./edit_auto_router_modal";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);

const {
  modelPatchUpdateCall,
  modelAvailableCall,
  getAutoRouterClassifierDefaultPromptCall,
  getAutoRouterAssembledPromptCall,
  validateAutoRouterConfig,
  fetchAvailableModels,
} = vi.hoisted(() => ({
  validateAutoRouterConfig: vi.fn().mockResolvedValue({ valid: true }),
  modelPatchUpdateCall: vi.fn().mockResolvedValue({}),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  getAutoRouterClassifierDefaultPromptCall: vi.fn().mockResolvedValue("Classify the request into exactly one tier."),
  getAutoRouterAssembledPromptCall: vi.fn().mockResolvedValue("Classify the request into exactly one tier."),
  fetchAvailableModels: vi.fn().mockResolvedValue([{ model_group: "gpt-4o-mini" }]),
}));

vi.mock("../networking", () => ({
  modelPatchUpdateCall,
  modelAvailableCall,
  getAutoRouterClassifierDefaultPromptCall,
  getAutoRouterAssembledPromptCall,
  validateAutoRouterConfig,
}));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => ({ accessToken: "sk-test" }) }));
vi.mock("@/components/llm_calls/fetch_models", () => ({ fetchAvailableModels }));
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
}));

const STORED_CONFIG = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o-mini"], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
  classifier_type: "heuristic",
  keyword_tier_rules: [{ keywords: ["invoice", "refund"], tier: "MEDIUM" }],
  semantic_keyword_matching: true,
  embedding_model: "voyage-4-large",
  match_threshold: 0.72,
};

const MODEL_DATA = {
  model_name: "tri-tier-router",
  litellm_params: {
    model: "auto_router/complexity_router",
    complexity_router_config: STORED_CONFIG,
  },
  model_info: { id: "auto-1", access_groups: [] },
};

const SEMANTIC_MODEL_DATA = {
  model_name: "semantic-router",
  litellm_params: {
    model: "auto_router/smart_routing",
    auto_router_config: { routes: [] },
    auto_router_default_model: "",
    auto_router_embedding_model: "",
  },
  model_info: { id: "auto-2", access_groups: [] },
};

const renderModal = (modelData: unknown = MODEL_DATA) =>
  renderWithProviders(
    <EditAutoRouterModal
      isVisible
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      modelData={modelData}
      accessToken="token"
      userRole="Admin"
    />,
  );

describe("EditAutoRouterModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    modelPatchUpdateCall.mockResolvedValue({});
    modelAvailableCall.mockResolvedValue({ data: [] });
    fetchAvailableModels.mockResolvedValue([{ model_group: "gpt-4o-mini" }]);
    validateAutoRouterConfig.mockResolvedValue({ valid: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.restoreAllMocks();
  });

  it("renders the Chinese title, description and field labels", async () => {
    renderModal();

    expect(await screen.findByText("编辑自动路由配置")).toBeInTheDocument();
    expect(screen.queryByText("Edit Auto Router Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("编辑自动路由配置，包括路由逻辑、默认模型和访问设置。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Edit the auto router configuration including routing logic, default models, and access settings.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("自动路由名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Auto Router Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the Chinese semantic-router labels and placeholders", async () => {
    renderModal(SEMANTIC_MODEL_DATA);

    expect(await screen.findByText("嵌入模型")).toBeInTheDocument();
    expect(screen.queryByText("Embedding Model")).not.toBeInTheDocument();
    expect(screen.getByText("默认模型")).toBeInTheDocument();
    expect(screen.queryByText("Default Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择默认模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a default model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择嵌入模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an embedding model")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-model option inside the open default-model combobox", async () => {
    const user = userEvent.setup();
    renderModal(SEMANTIC_MODEL_DATA);

    await user.click(await screen.findByPlaceholderText("选择默认模型"));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("输入自定义模型名称")).toBeInTheDocument();
    expect(within(listbox).queryByText("Enter custom model name")).not.toBeInTheDocument();
  });

  it("renders the Chinese semantic-router required-model validation messages", async () => {
    const user = userEvent.setup();
    renderModal(SEMANTIC_MODEL_DATA);

    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("必须填写默认模型")).toBeInTheDocument();
    expect(screen.queryByText("Default model is required")).not.toBeInTheDocument();
    expect(screen.getByText("必须填写嵌入模型")).toBeInTheDocument();
    expect(screen.queryByText("Embedding model is required")).not.toBeInTheDocument();
  });

  it("reports the Chinese missing-route-model toast when a route has no model", async () => {
    const user = userEvent.setup();
    renderModal({
      ...SEMANTIC_MODEL_DATA,
      litellm_params: {
        ...SEMANTIC_MODEL_DATA.litellm_params,
        auto_router_default_model: "gpt-4o-mini",
        auto_router_embedding_model: "voyage-4-large",
      },
    });

    await user.click(await screen.findByRole("button", { name: "添加路由" }));
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请为每个路由选择模型"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select a model for every route");
  });

  it("renders the Chinese access groups help inside the open tooltip", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.hover(findTooltipTrigger(await screen.findByText("模型访问组")));

    expect(await screen.findByText("控制谁可以访问此自动路由")).toBeInTheDocument();
    expect(screen.queryByText("Control who can access this auto router")).not.toBeInTheDocument();
  });

  it("renders the Chinese name-required validation message and reports the Chinese save-failure toast", async () => {
    const user = userEvent.setup();
    renderModal();

    const name = await screen.findByLabelText("自动路由名称");
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => {
      expect(screen.getByText("必须填写自动路由名称")).toBeInTheDocument();
    });
    expect(screen.queryByText("Auto router name is required")).not.toBeInTheDocument();
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新自动路由配置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update auto router configuration");
  });

  it("renders the Chinese no-tier tooltip on the blocked save action", async () => {
    renderModal({
      ...MODEL_DATA,
      litellm_params: {
        model: "auto_router/complexity_router",
        complexity_router_config: { ...STORED_CONFIG, tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] } },
      },
    });

    const save = await screen.findByRole("button", { name: "保存更改" });
    fireEvent.pointerEnter(save);
    fireEvent.mouseEnter(save);

    expect(await screen.findByText("请为某个复杂度层级至少选择一个模型")).toBeInTheDocument();
    expect(screen.queryByText("Please select at least one model for a complexity tier")).not.toBeInTheDocument();
  });

  it("reports the Chinese no-default-model toast", async () => {
    const user = userEvent.setup();
    renderModal({
      ...MODEL_DATA,
      litellm_params: {
        model: "auto_router/complexity_router",
        complexity_router_config: {
          ...STORED_CONFIG,
          tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: ["gpt-4o-mini"], REASONING: ["gpt-4o-mini"] },
        },
      },
    });

    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith(
        "请为简单或中等层级添加模型，或固定一个默认模型，以便请求有处可路由。",
      ),
    );
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Add a model to the Simple or Medium tier, or pin a default model, so requests have somewhere to route.",
    );
  });

  it("reports the Chinese updated toast on a successful save", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("自动路由配置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Auto router configuration updated successfully");
  });

  it("logs the Chinese update failure when the patch rejects", async () => {
    const user = userEvent.setup();
    modelPatchUpdateCall.mockRejectedValue(new Error("boom"));
    renderModal();

    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("更新自动路由失败：", expect.anything()));
  });

  it("logs the Chinese fetch failures for access groups and model info", async () => {
    modelAvailableCall.mockRejectedValue(new Error("boom"));
    fetchAvailableModels.mockRejectedValue(new Error("boom"));
    renderModal();

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("获取模型访问组失败：", expect.anything()));
    await waitFor(() => expect(console.error).toHaveBeenCalledWith("获取模型信息失败：", expect.anything()));
  });

  it("logs the Chinese parse failure and reports the Chinese load-failure toast", async () => {
    renderModal({
      ...MODEL_DATA,
      litellm_params: { model: "auto_router/complexity_router", complexity_router_config: "{ not json" },
    });

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("解析自动路由配置失败：", expect.anything()));
    expect(toast.fromError).toHaveBeenCalledWith("加载自动路由配置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Error loading auto router configuration");
  });
});
