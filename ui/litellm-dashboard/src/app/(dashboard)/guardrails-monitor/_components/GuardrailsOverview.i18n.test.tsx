import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import type {
  GuardrailUsageOverview,
  GuardrailUsageOverviewRow,
} from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { GuardrailsOverview } from "./GuardrailsOverview";

const useGuardrailsUsageOverviewMock = vi.fn();
vi.mock("@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage", () => ({
  useGuardrailsUsageOverview: (...args: unknown[]) => useGuardrailsUsageOverviewMock(...args),
}));

vi.mock("./ScoreChart", () => ({
  ScoreChart: () => <div data-testid="score-chart" />,
}));

vi.mock("./EvaluationSettingsModal", () => ({
  EvaluationSettingsModal: ({ open }: { open: boolean }) => (open ? <div data-testid="evaluation-modal" /> : null),
}));

const baseRow: GuardrailUsageOverviewRow = {
  id: "guardrail",
  name: "Guardrail",
  type: "content_filter",
  provider: "LiteLLM",
  requestsEvaluated: 0,
  failRate: 0,
  avgScore: null,
  avgLatency: null,
  status: "healthy",
  trend: "stable",
  usageUnits: {},
  cost: null,
  untrackedUsageUnits: {},
};

const overview: GuardrailUsageOverview = {
  rows: [
    {
      ...baseRow,
      id: "guardrail-high",
      name: "High Failure Guardrail",
      provider: "Bedrock",
      requestsEvaluated: 300,
      failRate: 18,
      status: "critical",
      trend: "up",
      usageUnits: { contentPolicyUnits: 1000, sensitiveInformationPolicyUnits: 250 },
      cost: 0.15,
      untrackedUsageUnits: { sensitiveInformationPolicyUnits: 250 },
    },
    {
      ...baseRow,
      id: "guardrail-warning",
      name: "Warning Guardrail",
      provider: "Custom",
      requestsEvaluated: 400,
      failRate: 9,
      status: "warning",
      trend: "stable",
    },
    {
      ...baseRow,
      id: "guardrail-low",
      name: "Low Failure Guardrail",
      requestsEvaluated: 1200,
      failRate: 2.5,
      avgLatency: 45,
      trend: "down",
    },
  ],
  chart: [],
  totalRequests: 1510,
  totalBlocked: 84,
  passRate: 94.4,
  totalUsageUnits: { contentPolicyUnits: 1040, sensitiveInformationPolicyUnits: 250 },
  totalCost: 0.15,
  totalUntrackedUsageUnits: { sensitiveInformationPolicyUnits: 250 },
};

const emptyOverview: GuardrailUsageOverview = {
  ...overview,
  rows: [],
  totalRequests: 0,
  totalBlocked: 0,
  totalCost: null,
  totalUntrackedUsageUnits: {},
};

const renderOverview = () =>
  renderWithProviders(
    <GuardrailsOverview
      accessToken="test-token"
      startDate="2026-08-01"
      endDate="2026-08-12"
      onSelectGuardrail={vi.fn()}
    />,
  );

const rowNamed = (name: string) => screen.getByRole("row", { name: new RegExp(name) });

describe("GuardrailsOverview Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useGuardrailsUsageOverviewMock.mockReturnValue({ data: overview, isLoading: false, error: null });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header, subtitle and export action", async () => {
    renderOverview();

    expect(await screen.findByRole("heading", { name: "Guardrails 监控", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Guardrails Monitor" })).not.toBeInTheDocument();
    expect(screen.getByText("监控所有请求的 Guardrail 表现")).toBeInTheDocument();
    expect(screen.queryByText("Monitor guardrail performance across all requests")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /导出数据/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export Data/ })).not.toBeInTheDocument();
    expect(screen.getByTitle("即将推出")).toBeInTheDocument();
    expect(screen.queryByTitle("Coming soon")).not.toBeInTheDocument();
  });

  it("renders the Chinese summary metric labels", async () => {
    renderOverview();

    expect(await screen.findByText("总评估数")).toBeInTheDocument();
    expect(screen.queryByText("Total Evaluations")).not.toBeInTheDocument();
    expect(screen.getByText("已拦截请求")).toBeInTheDocument();
    expect(screen.queryByText("Blocked Requests")).not.toBeInTheDocument();
    expect(screen.getByText("通过率")).toBeInTheDocument();
    expect(screen.queryByText("Pass Rate")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrail 成本")).toBeInTheDocument();
    expect(screen.queryByText("Guardrail Cost")).not.toBeInTheDocument();
    expect(screen.getByText("活跃 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("Active Guardrails")).not.toBeInTheDocument();
  });

  it("renders the Chinese column headers", async () => {
    renderOverview();

    expect(await screen.findByRole("columnheader", { name: "状态" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Guardrail" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "提供商" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Provider" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /请求数/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Requests/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /失败率/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Fail Rate/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /平均增加延迟/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Avg\. latency added/ })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "用量单位" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Usage Units" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /成本/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Cost/ })).not.toBeInTheDocument();
  });

  it("renders the aliased Chinese status labels while the raw wire values stay English", async () => {
    renderOverview();

    expect(await screen.findByText("严重")).toBeInTheDocument();
    expect(screen.getByText("警告")).toBeInTheDocument();
    expect(screen.getByText("健康")).toBeInTheDocument();
    expect(screen.queryByText("critical")).not.toBeInTheDocument();
    expect(screen.queryByText("warning")).not.toBeInTheDocument();
    expect(screen.queryByText("healthy")).not.toBeInTheDocument();
  });

  it("renders the Chinese table toolbar heading and hint", async () => {
    renderOverview();

    expect(await screen.findByRole("heading", { name: "Guardrail 性能", level: 5 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Guardrail Performance" })).not.toBeInTheDocument();
    expect(screen.getByText("点击 Guardrail 查看详情、日志和配置")).toBeInTheDocument();
    expect(screen.queryByText("Click a guardrail to view details, logs, and configuration")).not.toBeInTheDocument();
    expect(screen.getByTitle("评估设置")).toBeInTheDocument();
    expect(screen.queryByTitle("Evaluation settings")).not.toBeInTheDocument();
  });

  it("renders the Chinese unpriced tooltip with the raw unit summary", async () => {
    const user = userEvent.setup();
    renderOverview();

    await user.hover(within(rowNamed("High Failure Guardrail")).getByLabelText("250 units unpriced"));

    expect(await screen.findByText("250 units unpriced：这些单位没有已知价格，未计入成本")).toBeInTheDocument();
    expect(
      screen.queryByText("250 units unpriced: these units have no known price and are left out of the cost"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese cost math popover", async () => {
    const user = userEvent.setup();
    renderOverview();

    const card = await screen.findByRole("group", { name: "Guardrail 成本" });
    await user.click(within(card).getByRole("button", { name: /How is this calculated/ }));

    const dialog = await screen.findByRole("dialog", { name: "此成本如何计算" });
    expect(screen.queryByRole("dialog", { name: "How this cost is calculated" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("Guardrail + Guardrail + … = Guardrail 成本")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "每个 Guardrail 的成本等于各计数器单位数 × 成本映射中该计数器的单价。打开某个 Guardrail 可查看其按计数器的计算过程。",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Each guardrail's cost is its units per counter × that counter's per-unit price from the cost map. Open a guardrail for its per-counter math.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and loading label", async () => {
    useGuardrailsUsageOverviewMock.mockReturnValue({ data: emptyOverview, isLoading: false, error: null });
    const { unmount } = renderOverview();

    expect(await screen.findByText("该时间段无数据")).toBeInTheDocument();
    expect(screen.queryByText("No data for this period")).not.toBeInTheDocument();
    unmount();

    useGuardrailsUsageOverviewMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderOverview();

    expect(screen.getByRole("status", { name: "加载中" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders the Chinese failure message when the usage request rejects", async () => {
    useGuardrailsUsageOverviewMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("network down"),
    });
    renderOverview();

    expect(await screen.findByText("数据加载失败，请重试。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load data. Try again.")).not.toBeInTheDocument();
  });
});
