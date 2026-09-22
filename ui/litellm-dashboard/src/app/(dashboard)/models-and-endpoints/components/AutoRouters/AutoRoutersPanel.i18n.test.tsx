import userEvent from "@testing-library/user-event";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, testQueryClient, waitFor, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { AutoRoutersPanel } from "./AutoRoutersPanel";

const { modelInfoCall, modelDeleteCall } = vi.hoisted(() => ({
  modelInfoCall: vi.fn(),
  modelDeleteCall: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/components/networking", () => ({
  modelInfoCall,
  modelDeleteCall,
  modelHubCall: vi.fn(),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/app/(dashboard)/models-and-endpoints/detailNavigation", () => ({
  useModelDetailRouting: () => ({ openModel: vi.fn(), modelId: null, teamId: null, openTeam: vi.fn(), close: vi.fn() }),
}));

vi.mock("@/components/add_model/add_auto_router_tab", () => ({
  __esModule: true,
  default: ({ handleOk }: { handleOk: () => void }) => (
    <button type="button" onClick={handleOk}>
      submit-router-form
    </button>
  ),
}));

const complexity = (id: string, classifierType: string) => ({
  model_name: `${id}-router`,
  litellm_params: {
    model: "auto_router/complexity_router",
    complexity_router_config: { tiers: {}, classifier_type: classifierType },
  },
  model_info: { id, db_model: true },
});

const TYPE_DEPLOYMENTS = [
  complexity("llm", "llm"),
  complexity("heuristic-first", "heuristic_first"),
  complexity("hybrid", "hybrid"),
  complexity("custom", "custom"),
  complexity("fallback", "heuristic"),
  {
    model_name: "semantic-router",
    litellm_params: {
      model: "auto_router/support",
      auto_router_config: JSON.stringify({ routes: [{ name: "gpt-4o-mini" }] }),
    },
    model_info: { id: "semantic", db_model: true },
  },
  {
    model_name: "adaptive-router",
    litellm_params: {
      model: "auto_router/adaptive_router",
      adaptive_router_config: { available_models: ["gpt-4o"] },
    },
    model_info: { id: "adaptive", db_model: true },
  },
  {
    model_name: "quality-router",
    litellm_params: {
      model: "auto_router/quality_router",
      quality_router_config: { available_models: ["gpt-4o"] },
    },
    model_info: { id: "quality", db_model: true },
  },
];

const pageOf = (data: unknown[]) => ({
  data,
  total_count: data.length,
  current_page: 1,
  total_pages: 1,
  size: 1000,
});

const renderPanel = (canModify = true) =>
  renderWithProviders(
    <AutoRoutersPanel
      accessToken="token"
      userRole="Admin"
      userID="u-admin"
      isViewOnly={false}
      teams={null}
      createScope={canModify ? "unscoped-ok" : "forbidden"}
    />,
  );

describe("AutoRoutersPanel Chinese copy", () => {
  beforeEach(async () => {
    testQueryClient.clear();
    vi.clearAllMocks();
    modelInfoCall.mockResolvedValue(pageOf(TYPE_DEPLOYMENTS));
    modelDeleteCall.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese panel heading, description and create button", async () => {
    renderPanel();

    expect(await screen.findByRole("heading", { name: "自动路由" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Auto routers" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "自动路由位于部署之上，为每个请求挑选模型。它们像其他模型一样被调用，因此客户端始终使用同一个模型名称。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Auto routers sit above your deployments and pick a model per request. They are called like any other model, so clients keep using a single model name.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加自动路由" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Auto Router" })).not.toBeInTheDocument();
  });

  it("renders the Chinese create dialog title and description", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "添加自动路由" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "添加自动路由" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "Add Auto Router" })).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "通过判断请求的复杂度将其路由到相应模型。它像其他模型一样被调用，因此客户端始终使用同一个模型名称。",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Routes each request to a model by classifying its complexity. Called like any other model, so clients keep using a single model name.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese table column headers with the English originals absent", async () => {
    renderPanel();

    for (const [zh, en] of [
      ["名称", "Name"],
      ["类型", "Type"],
      ["路由至", "Routes to"],
      ["默认模型", "Default model"],
      ["创建时间", "Created"],
    ] as const) {
      expect(await screen.findByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese loading message while the deployments are in flight", () => {
    modelInfoCall.mockReturnValue(new Promise(() => {}));
    renderPanel();

    expect(screen.getByText("正在加载自动路由…")).toBeInTheDocument();
    expect(screen.queryByText("Loading auto routers…")).not.toBeInTheDocument();
  });

  it("renders every Chinese router type label with its English original absent", async () => {
    renderPanel();

    for (const [zh, en] of [
      ["LLM 分类器", "LLM Classifier"],
      ["启发式优先", "Heuristic first"],
      ["混合", "Hybrid"],
      ["自定义分类器", "Custom classifier"],
      ["启发式", "Heuristic"],
      ["语义", "Semantic"],
      ["自适应", "Adaptive"],
      ["质量", "Quality"],
    ] as const) {
      expect(await screen.findByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty state and its create hint when the caller may modify", async () => {
    modelInfoCall.mockResolvedValue(pageOf([{ model_name: "gpt-4o", litellm_params: { model: "openai/gpt-4o" } }]));
    renderPanel();

    expect(await screen.findByText("暂无自动路由")).toBeInTheDocument();
    expect(screen.queryByText("No auto routers yet")).not.toBeInTheDocument();
    expect(screen.getByText("创建自动路由，为每个请求挑选合适的模型，而不是固定使用一个模型。")).toBeInTheDocument();
    expect(
      screen.queryByText("Create an auto router to pick the right model per request instead of pinning one."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese read-only empty-state hint for a caller who may not modify", async () => {
    modelInfoCall.mockResolvedValue(pageOf([{ model_name: "gpt-4o", litellm_params: { model: "openai/gpt-4o" } }]));
    renderPanel(false);

    expect(await screen.findByText("暂无自动路由")).toBeInTheDocument();
    expect(screen.getByText("自动路由为每个请求挑选合适的模型，而不是固定使用一个模型。")).toBeInTheDocument();
    expect(
      screen.queryByText("An auto router picks the right model per request instead of pinning one."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions and delete dialog chrome", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("llm-router");

    expect(screen.getByLabelText("打开 llm-router 的操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open actions for llm-router")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("auto-router-actions-llm"));
    expect(await screen.findByRole("menuitem", { name: "删除自动路由" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete auto router" })).not.toBeInTheDocument();

    await user.click(screen.getByTestId("auto-router-action-delete"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "删除自动路由" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "Delete Auto Router" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("自动路由")).toBeInTheDocument();
    expect(screen.queryByText("Auto router")).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("确定要删除“llm-router”吗？任何仍在调用此模型名称的客户端都将开始失败。"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        'Are you sure you want to delete "llm-router"? Any client still calling this model name will start failing.',
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("名称")).toBeInTheDocument();
    expect(within(dialog).getByText("类型")).toBeInTheDocument();
    expect(within(dialog).getByText("ID")).toBeInTheDocument();
  });

  it("reports the delete success in Chinese", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("llm-router");
    await user.click(screen.getByTestId("auto-router-actions-llm"));
    await user.click(await screen.findByTestId("auto-router-action-delete"));
    await user.click(await screen.findByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已删除自动路由：llm-router"));
    expect(toast.success).not.toHaveBeenCalledWith("Deleted auto router: llm-router");
  });

  it("reports the delete failure in Chinese", async () => {
    const user = userEvent.setup();
    modelDeleteCall.mockRejectedValue(new Error("boom"));
    renderPanel();

    await screen.findByText("llm-router");
    await user.click(screen.getByTestId("auto-router-actions-llm"));
    await user.click(await screen.findByTestId("auto-router-action-delete"));
    await user.click(await screen.findByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除自动路由失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete auto router: Error: boom");
  });
});
