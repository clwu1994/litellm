import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ModelsAndEndpointsPage from "./page";

vi.mock("./panels/AllModelsPanel", () => ({ default: () => <div data-testid="panel-all-models" /> }));
vi.mock("./panels/AddModelPanel", () => ({ default: () => <div data-testid="panel-add" /> }));
vi.mock("./panels/AutoRoutersTabPanel", () => ({ default: () => <div data-testid="panel-auto-routers" /> }));
vi.mock("./panels/LlmCredentialsPanel", () => ({ default: () => <div data-testid="panel-credentials" /> }));
vi.mock("./panels/PassThroughPanel", () => ({ default: () => <div data-testid="panel-pass-through" /> }));
vi.mock("./panels/HealthStatusPanel", () => ({ default: () => <div data-testid="panel-health" /> }));
vi.mock("./panels/ModelRetrySettingsPanel", () => ({ default: () => <div data-testid="panel-retry" /> }));
vi.mock("./panels/ModelGroupAliasPanel", () => ({ default: () => <div data-testid="panel-alias" /> }));
vi.mock("./panels/PriceDataPanel", () => ({ default: () => <div data-testid="panel-price" /> }));
vi.mock("./panels/AccessGroupBudgetsPanel", () => ({ default: () => <div data-testid="panel-budgets" /> }));

vi.mock("./detailNavigation", () => ({
  useModelDetailRouting: () => ({ modelId: null, teamId: null, close: vi.fn(), openModel: vi.fn(), openTeam: vi.fn() }),
}));

vi.mock("@/components/molecules/cost_optimization_feedback_banner", () => ({ default: () => null }));
vi.mock("@/components/model_info_view", () => ({ default: () => null }));
vi.mock("@/components/team/TeamInfo", () => ({ default: () => null }));

const mockUseAuthorized = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => mockUseAuthorized() }));
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({ useTeams: () => ({ data: [] }) }));
vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: () => ({ data: { values: {} } }),
}));
vi.mock("./useModelDashboardData", () => ({
  useModelDashboardData: () => ({ availableModelAccessGroups: [], allModelsOnProxy: [], availableModelGroups: [] }),
}));

const ADMIN = { accessToken: "at", token: "t", userRole: "Admin", userId: "u1", premiumUser: false, isViewOnly: false };
const NON_ADMIN = {
  accessToken: "at",
  token: "t",
  userRole: "Internal User",
  userId: "u1",
  premiumUser: false,
  isViewOnly: false,
};

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModelsAndEndpointsPage />
    </QueryClientProvider>,
  );
};

describe("ModelsAndEndpointsPage Chinese copy", () => {
  beforeEach(async () => {
    mockUseAuthorized.mockReturnValue(ADMIN);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese tab label with the English original absent", () => {
    renderPage();

    for (const [zh, en] of [
      ["所有模型", "All Models"],
      ["添加模型", "Add Model"],
      ["LLM 凭证", "LLM Credentials"],
      ["透传 Endpoint", "Pass-Through Endpoints"],
      ["健康状态", "Health Status"],
      ["模型重试设置", "Model Retry Settings"],
      ["模型组别名", "Model Group Alias"],
      ["价格数据重载", "Price Data Reload"],
    ] as const) {
      expect(screen.getByRole("tab", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: en })).not.toBeInTheDocument();
    }

    expect(screen.getByRole("tab", { name: "自动路由 Beta" })).toBeInTheDocument();
    expect(within(screen.getByRole("tab", { name: "自动路由 Beta" })).getByText("自动路由")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Auto-Routers/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "模型访问组预算 Beta" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("tab", { name: "模型访问组预算 Beta" })).getByText("模型访问组预算"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Model Access Group Budgets/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese page heading and admin subtitle", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "模型管理" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Model Management" })).not.toBeInTheDocument();
    expect(screen.getByText("为代理添加和管理模型")).toBeInTheDocument();
    expect(screen.queryByText("Add and manage models for the proxy")).not.toBeInTheDocument();
  });

  it("renders the Chinese your-models tab and team-admin subtitle for a non-admin", () => {
    mockUseAuthorized.mockReturnValue(NON_ADMIN);
    renderPage();

    expect(screen.getByRole("tab", { name: "你的模型" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Your Models" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "所有模型" })).not.toBeInTheDocument();
    expect(screen.getByText("为你担任管理员的团队添加模型。")).toBeInTheDocument();
    expect(screen.queryByText("Add models for teams you are an admin for.")).not.toBeInTheDocument();
    expect(screen.queryByText("为代理添加和管理模型")).not.toBeInTheDocument();
  });

  it("renders the Chinese refresh aria label and last-refreshed line", async () => {
    const user = userEvent.setup();
    vi.spyOn(Date.prototype, "toLocaleTimeString").mockReturnValue("09:30");
    renderPage();

    expect(screen.getByLabelText("刷新模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Refresh models")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("刷新模型"));

    expect(await screen.findByText("上次刷新：09:30")).toBeInTheDocument();
    expect(screen.queryByText(/Last Refreshed/)).not.toBeInTheDocument();
  });
});
