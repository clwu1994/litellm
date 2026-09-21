import userEvent from "@testing-library/user-event";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { renderWithProviders, screen, waitFor } from "@/../tests/test-utils";

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
} = vi.hoisted(() => ({
  validateAutoRouterConfig: vi.fn().mockResolvedValue({ valid: true }),
  modelPatchUpdateCall: vi.fn().mockResolvedValue({}),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  getAutoRouterClassifierDefaultPromptCall: vi.fn().mockResolvedValue("Classify the request into exactly one tier."),
  getAutoRouterAssembledPromptCall: vi.fn().mockResolvedValue("Classify the request into exactly one tier."),
}));

vi.mock("../networking", () => ({
  modelPatchUpdateCall,
  modelAvailableCall,
  getAutoRouterClassifierDefaultPromptCall,
  getAutoRouterAssembledPromptCall,
  validateAutoRouterConfig,
}));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => ({ accessToken: "sk-test" }) }));
vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([{ model_group: "gpt-4o-mini" }]),
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

const renderModal = () =>
  renderWithProviders(
    <EditAutoRouterModal
      isVisible
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      modelData={MODEL_DATA}
      accessToken="token"
      userRole="Admin"
    />,
  );

describe("EditAutoRouterModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
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

  it("renders the Chinese name-required validation message", async () => {
    const user = userEvent.setup();
    renderModal();

    const name = await screen.findByLabelText("自动路由名称");
    await user.clear(name);
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => {
      expect(screen.getByText("必须填写自动路由名称")).toBeInTheDocument();
    });
    expect(screen.queryByText("Auto router name is required")).not.toBeInTheDocument();
  });
});
