import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModelData } from "@/components/model_dashboard/types";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { AllModelsTable } from "./AllModelsTable";

const makeModel = (overrides: Partial<ModelData> = {}): ModelData =>
  ({
    model_name: "gpt-4-public",
    litellm_model_name: "openai/gpt-4",
    provider: "openai",
    input_cost: 30 as unknown as number,
    output_cost: 60 as unknown as number,
    max_tokens: 8192,
    max_input_tokens: 8192,
    litellm_params: { model: "openai/gpt-4" },
    cleanedLitellmParams: {},
    ...overrides,
    model_info: {
      id: "model-1",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-03-04T00:00:00Z",
      created_by: "alice",
      team_id: "team-1",
      db_model: true,
      access_groups: null,
      ...(overrides.model_info ?? {}),
    },
  }) as ModelData;

const baseProps = {
  data: [makeModel()],
  rowCount: 1,
  isLoading: false,
  isRefreshing: false,
  onRefresh: vi.fn(),
  sorting: [],
  onSortingChange: vi.fn(),
  pagination: { pageIndex: 0, pageSize: 50 },
  onPaginationChange: vi.fn(),
  columnFilters: [],
  onColumnFiltersChange: vi.fn(),
  onResetFilters: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  teamOptions: [
    { value: "personal", label: "Personal" },
    { value: "team-1", label: "Engineering" },
  ],
  selectedTeamValue: "personal",
  onTeamChange: vi.fn(),
  isLoadingTeams: false,
  viewMode: "current_team" as const,
  onViewModeChange: vi.fn(),
  onOpenModelSettings: vi.fn(),
  availableModelGroups: ["gpt-4", "gpt-3.5-turbo"],
  availableModelAccessGroups: ["sales-team"],
  userRole: "Admin",
  userID: "alice",
  isViewOnly: false,
  onModelIdClick: vi.fn(),
  onTeamIdClick: vi.fn(),
  onDeleteClick: vi.fn(),
  onTogglePauseClick: vi.fn(),
  pausingModelId: null,
};

const renderTable = (props: Partial<typeof baseProps> = {}) => render(<AllModelsTable {...baseProps} {...props} />);

const openFilterDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("datatable-filters-trigger"));
  await screen.findByTestId("filter-drawer-body");
  return screen.getByRole("dialog");
};

describe("AllModelsTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderTable();

    for (const [zh, en] of [
      ["模型 ID", "Model ID"],
      ["模型信息", "Model Information"],
      ["凭证", "Credentials"],
      ["创建者", "Created By"],
      ["更新时间", "Updated At"],
      ["费用", "Costs"],
      ["团队 ID", "Team ID"],
      ["模型访问组", "Model Access Group"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese Source column and status badges once the column is enabled", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.queryByRole("columnheader", { name: "来源" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "列" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "来源" }));

    expect(await screen.findByRole("columnheader", { name: "来源" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Source" })).not.toBeInTheDocument();
    expect(await screen.findByText("DB 模型")).toBeInTheDocument();
    expect(screen.queryByText("DB Model")).not.toBeInTheDocument();
  });

  it("renders the Chinese config-model badge for a config model", async () => {
    const user = userEvent.setup();
    renderTable({ data: [makeModel({ model_info: { db_model: false } as ModelData["model_info"] })] });

    await user.click(screen.getByRole("button", { name: "列" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "来源" }));

    expect(await screen.findByText("配置模型")).toBeInTheDocument();
    expect(screen.queryByText("Config Model")).not.toBeInTheDocument();
  });

  it("renders the Chinese toolbar labels and placeholders", () => {
    renderTable();

    expect(screen.getByPlaceholderText("搜索模型名称…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search model names…")).not.toBeInTheDocument();
    expect(screen.getByLabelText("当前团队")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current team")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("models-team-select")).getByText("团队")).toBeInTheDocument();
    expect(within(screen.getByTestId("models-team-select")).queryByText("Team")).not.toBeInTheDocument();
    expect(screen.getByLabelText("视图")).toBeInTheDocument();
    expect(screen.queryByLabelText("View")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("models-view-select")).getByText("视图")).toBeInTheDocument();
    expect(within(screen.getByTestId("models-view-select")).queryByText("View")).not.toBeInTheDocument();
    expect(screen.getByTestId("models-view-select")).toHaveTextContent("当前团队模型");
    expect(screen.queryByText("Current Team Models")).not.toBeInTheDocument();
    expect(screen.getByLabelText("模型设置")).toBeInTheDocument();
    expect(screen.getByTitle("模型设置")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model Settings")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Model Settings")).not.toBeInTheDocument();
  });

  it("renders the Chinese all-available-models view option", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByTestId("models-view-select"));

    expect(await screen.findByRole("option", { name: "所有可用模型" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All Available Models" })).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the table is loading", () => {
    renderTable({ isLoading: true });

    expect(screen.getByText("正在加载模型…")).toBeInTheDocument();
    expect(screen.queryByText("Loading models…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state with the English original absent", () => {
    renderTable({ data: [], rowCount: 0 });

    expect(screen.getByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
    expect(screen.getByText("没有模型符合你的搜索或筛选条件。请尝试重置。")).toBeInTheDocument();
    expect(screen.queryByText("No models match your search or filters. Try resetting them.")).not.toBeInTheDocument();
  });

  it("renders the Chinese filter drawer chrome and field placeholders", async () => {
    const user = userEvent.setup();
    renderTable();
    const drawer = await openFilterDrawer(user);

    expect(within(drawer).getByText("筛选")).toBeInTheDocument();
    expect(within(drawer).queryByText("Filters")).not.toBeInTheDocument();
    expect(within(drawer).getByText("缩小模型和 Endpoint 范围")).toBeInTheDocument();
    expect(within(drawer).queryByText("Narrow down models + endpoints")).not.toBeInTheDocument();
    expect(within(drawer).getByText("重置筛选")).toBeInTheDocument();
    expect(within(drawer).queryByText("Reset Filters")).not.toBeInTheDocument();
    expect(within(drawer).getByText("公开模型名称")).toBeInTheDocument();
    expect(within(drawer).queryByText("Public Model Name")).not.toBeInTheDocument();
    expect(within(drawer).getByText("模型访问组")).toBeInTheDocument();
    expect(within(drawer).queryByText("Model Access Group")).not.toBeInTheDocument();
    expect(within(drawer).getByPlaceholderText("按公开模型名称筛选")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Filter by Public Model Name")).not.toBeInTheDocument();
    expect(within(drawer).getByPlaceholderText("按模型访问组筛选")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Filter by Model Access Group")).not.toBeInTheDocument();
  });

  it("renders the Chinese model group filter options", async () => {
    const user = userEvent.setup();
    renderTable();
    await openFilterDrawer(user);

    await user.click(await screen.findByPlaceholderText("按公开模型名称筛选"));

    expect(await screen.findByRole("option", { name: "所有模型" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All Models" })).not.toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "通配符模型 (*)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Wildcard Models (*)" })).not.toBeInTheDocument();
  });

  it("renders the Chinese access group filter option and empty state", async () => {
    const user = userEvent.setup();
    renderTable();
    await openFilterDrawer(user);

    const input = await screen.findByPlaceholderText("按模型访问组筛选");
    await user.click(input);

    expect(await screen.findByRole("option", { name: "所有模型访问组" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All Model Access Groups" })).not.toBeInTheDocument();

    await user.type(input, "zzz");
    expect(await screen.findByText("未找到模型访问组")).toBeInTheDocument();
    expect(screen.queryByText("No model access groups found")).not.toBeInTheDocument();
  });

  it("renders the Chinese model information hover card and copy toast", async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderTable();

    await user.hover(screen.getByTestId("model-information-model-1"));

    expect(await screen.findByText("公开模型名称")).toBeInTheDocument();
    expect(screen.queryByText("Public Model Name")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 模型名称")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Model Name")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("复制 LiteLLM 模型名称"));
    expect(toast.success).toHaveBeenCalledWith("已复制 LiteLLM 模型名称");
    expect(screen.queryByLabelText("Copy LiteLLM model name")).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown-provider label inside the model information card", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable({ data: [makeModel({ provider: "" })] });

    await user.hover(screen.getByTestId("model-information-model-1"));

    expect(await screen.findByText("未知提供方")).toBeInTheDocument();
    expect(screen.queryByText("Unknown provider")).not.toBeInTheDocument();
  });

  it("renders the Chinese credential types hover card", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable();

    expect(screen.getByRole("button", { name: "关于凭证类型" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "About credential types" })).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("credentials-header-info"));

    expect(await screen.findByText("凭证类型")).toBeInTheDocument();
    expect(screen.queryByText("Credential types")).not.toBeInTheDocument();
    expect(screen.getByText("可复用")).toBeInTheDocument();
    expect(screen.queryByText("Reusable")).not.toBeInTheDocument();
    expect(screen.getByText("保存在 LiteLLM 中、可重复添加到模型的凭证。")).toBeInTheDocument();
    expect(
      screen.queryByText("Credentials saved in LiteLLM that can be added to models repeatedly."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("在创建模型时直接添加或在配置文件中定义的凭证。")).toBeInTheDocument();
    expect(
      screen.queryByText("Credentials added directly during model creation or defined in the config file."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese manual credential badge", () => {
    renderTable();

    expect(screen.getByText("手动")).toBeInTheDocument();
    expect(screen.queryByText("Manual")).not.toBeInTheDocument();
  });

  it("renders the Chinese defined-in-config and unknown creator values", () => {
    const { rerender } = renderTable({
      data: [makeModel({ model_info: { db_model: false } as ModelData["model_info"] })],
    });
    expect(screen.getByText("配置中定义")).toBeInTheDocument();
    expect(screen.queryByText("Defined in config")).not.toBeInTheDocument();

    rerender(
      <AllModelsTable
        {...baseProps}
        data={[makeModel({ model_info: { created_by: "", created_at: null } as unknown as ModelData["model_info"] })]}
      />,
    );
    expect(screen.getByText("未知")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
    expect(screen.getByText("未知日期")).toBeInTheDocument();
    expect(screen.queryByText("Unknown date")).not.toBeInTheDocument();
  });

  it("renders the Chinese cost labels and cost tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable();

    expect(screen.getByText("输入")).toBeInTheDocument();
    expect(screen.queryByText("IN")).not.toBeInTheDocument();
    expect(screen.getByText("输出")).toBeInTheDocument();
    expect(screen.queryByText("OUT")).not.toBeInTheDocument();

    await user.hover(screen.getByText("$30"));
    expect(await screen.findByText("每 100 万 Token 的费用")).toBeInTheDocument();
    expect(screen.queryByText("Cost per 1M tokens")).not.toBeInTheDocument();
  });

  it("renders the Chinese overflow access-group badge", () => {
    renderTable({
      data: [
        makeModel({
          model_info: { access_groups: ["sales-team", "eng-team", "growth"] } as ModelData["model_info"],
        }),
      ],
    });

    expect(screen.getByText("+2 个")).toBeInTheDocument();
    expect(screen.queryByText("+2 more")).not.toBeInTheDocument();
  });

  it("renders the Chinese pause tooltip for an active DB model", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable();

    expect(screen.getByLabelText("暂停模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pause model")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("model-pause-toggle-model-1"));
    expect(await screen.findByText("暂停模型，在恢复前停止路由请求。")).toBeInTheDocument();
    expect(screen.queryByText("Pause model — stop routing requests until resumed.")).not.toBeInTheDocument();
  });

  it("renders the Chinese resume tooltip and aria label for a blocked model", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable({ data: [makeModel({ model_info: { blocked: true } as ModelData["model_info"] })] });

    expect(screen.getByLabelText("恢复模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Resume model")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("model-pause-toggle-model-1"));
    expect(await screen.findByText("恢复模型，恢复正常路由。")).toBeInTheDocument();
    expect(screen.queryByText("Resume model — restore normal routing.")).not.toBeInTheDocument();
  });

  it("renders the Chinese admin-only pause tooltip for a non-admin", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable({ userRole: "Internal User" });

    await user.hover(screen.getByTestId("model-pause-toggle-model-1"));
    expect(await screen.findByText("只有代理管理员可以暂停或恢复模型。")).toBeInTheDocument();
    expect(screen.queryByText("Only proxy admins can pause or resume a model.")).not.toBeInTheDocument();
  });

  it("renders the Chinese config pause tooltip for a config model", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable({ data: [makeModel({ model_info: { db_model: false } as ModelData["model_info"] })] });

    await user.hover(screen.getByTestId("model-pause-toggle-model-1"));
    expect(await screen.findByText("配置模型无法从仪表板暂停。暂停状态由数据库维护。")).toBeInTheDocument();
    expect(
      screen.queryByText("Config models cannot be paused from the dashboard. Pause is DB-backed."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese delete tooltips and aria label", async () => {
    const user = userEvent.setup({ delay: null });
    const { rerender } = renderTable();

    expect(screen.getByLabelText("删除模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete model")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("model-delete-model-1"));
    expect(await screen.findByText("删除模型")).toBeInTheDocument();
    expect(screen.queryByText("Delete model")).not.toBeInTheDocument();

    rerender(
      <AllModelsTable
        {...baseProps}
        data={[makeModel({ model_info: { db_model: false } as ModelData["model_info"] })]}
      />,
    );

    await user.hover(screen.getByTestId("model-delete-model-1"));
    expect(await screen.findByText("配置模型无法在仪表板中删除。请从配置文件中删除。")).toBeInTheDocument();
    expect(
      screen.queryByText("Config model cannot be deleted on the dashboard. Please delete it from the config file."),
    ).not.toBeInTheDocument();
  });
});
