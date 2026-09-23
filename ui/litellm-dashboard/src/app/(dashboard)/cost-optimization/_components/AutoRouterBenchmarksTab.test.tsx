import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AutoRouterDeployment } from "@/app/(dashboard)/hooks/models/useModels";
import i18n from "@/i18n/bootstrapI18n";
import { ApiError } from "@/lib/http/client";

vi.mock("./useAutoRouterBenchmarks", () => ({ useAutoRouterBenchmarks: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({ useAutoRouters: vi.fn() }));
vi.mock("./ShadowEvalSection", () => ({ default: () => <div data-testid="shadow-eval-section" /> }));
vi.mock("@/components/shared/advanced_date_picker", () => ({
  __esModule: true,
  default: ({ onValueChange }: { onValueChange: (value: { from?: Date; to?: Date }) => void }) => (
    <button
      type="button"
      data-testid="date-picker"
      onClick={() => onValueChange({ from: new Date(2026, 7, 1), to: new Date(2026, 7, 5) })}
    />
  ),
}));

import { useAutoRouters } from "@/app/(dashboard)/hooks/models/useModels";

import AutoRouterBenchmarksTab, { AutoRouterUsageView } from "./AutoRouterBenchmarksTab";
import type {
  AutoRouterBenchmarkGroup,
  AutoRouterBenchmarksResponse,
  AutoRouterCacheStats,
} from "./autoRouterBenchmarks";
import { useAutoRouterBenchmarks } from "./useAutoRouterBenchmarks";

type HookResult = ReturnType<typeof useAutoRouterBenchmarks>;

const mockAutoRouters = (deployments: AutoRouterDeployment[] = []) => {
  vi.mocked(useAutoRouters).mockReturnValue({ data: deployments } as unknown as ReturnType<typeof useAutoRouters>);
};

const mockHook = (result: { data?: AutoRouterBenchmarksResponse; isPending?: boolean; error?: Error }) => {
  vi.mocked(useAutoRouterBenchmarks).mockReturnValue({
    data: result.data,
    isPending: result.isPending ?? false,
    error: result.error ?? null,
  } as unknown as HookResult);
};

const cache = (overrides: Partial<AutoRouterCacheStats> = {}): AutoRouterCacheStats => ({
  coverage_pct: 99.6,
  hit_rate_pct: 93.3,
  same_model: { turns: 400, hits: 391, hit_rate_pct: 97.7 },
  first_visit: { turns: 37, hits: 9, hit_rate_pct: 24.3 },
  return_to_tier: { turns: 381, hits: 311, hit_rate_pct: 81.6 },
  unordered_turns: 0,
  return_misses_expired: 19,
  return_misses_within_ttl: 51,
  return_misses_unknown: 0,
  ttl_5m_turns: 0,
  ttl_1h_turns: 818,
  ...overrides,
});

type Totals = AutoRouterBenchmarksResponse["totals"];

const totals = (overrides: Partial<Totals> = {}): Totals => ({
  sessions: 94,
  turns: 3073,
  avg_turns_per_session: 32.7,
  avg_session_seconds: 7560,
  avg_tokens_per_session: 5_300_000,
  spend: 359.86,
  classifier_cost: 6.146,
  saved_spend: 2174.59,
  baseline_spend: 2534.45,
  saved_pct: 85.8,
  saved_per_session: 23.13,
  cache: cache(),
  ...overrides,
});

const zeroBucket = { turns: 0, hits: 0, hit_rate_pct: 0 };

const zeroCache: AutoRouterCacheStats = {
  coverage_pct: 0,
  hit_rate_pct: 0,
  same_model: zeroBucket,
  first_visit: zeroBucket,
  return_to_tier: zeroBucket,
  unordered_turns: 0,
  return_misses_expired: 0,
  return_misses_within_ttl: 0,
  return_misses_unknown: 0,
  ttl_5m_turns: 0,
  ttl_1h_turns: 0,
};

const zeroTotals: Totals = {
  sessions: 0,
  turns: 0,
  avg_turns_per_session: 0,
  avg_session_seconds: 0,
  avg_tokens_per_session: 0,
  spend: 0,
  classifier_cost: 0,
  saved_spend: 0,
  baseline_spend: 0,
  saved_pct: 0,
  saved_per_session: 0,
  cache: zeroCache,
};

const group = (overrides: Partial<AutoRouterBenchmarkGroup> = {}): AutoRouterBenchmarkGroup => ({
  router_name: "claude-auto",
  router_type: "complexity",
  ...totals(),
  ...overrides,
});

const response = (groups: AutoRouterBenchmarkGroup[], shared: Totals = totals()): AutoRouterBenchmarksResponse => ({
  start_date: "2026-07-06",
  end_date: "2026-08-05",
  routers_in_scope: groups.length,
  totals: shared,
  groups,
});

const renderTab = () => {
  const dateValue = { from: new Date(2026, 6, 6), to: new Date(2026, 7, 5) };
  const onDateChange = vi.fn();
  const activity = {
    dateValue,
    onDateChange,
    results: [],
    loading: false,
    isFetchingMore: false,
    progress: { currentPage: 1, totalPages: 1 },
    cancelled: false,
    cancel: vi.fn(),
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    dateValue,
    onDateChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AutoRouterBenchmarksTab accessToken="sk-test" activity={activity} />
      </QueryClientProvider>,
    ),
  };
};

describe("AutoRouterBenchmarksTab", () => {
  beforeEach(() => {
    mockAutoRouters();
  });

  it("leads with total estimated savings, before the four session-shape metrics", () => {
    mockHook({ data: response([group(), group({ router_name: "gpt-auto" })]) });
    renderTab();

    const labels = screen
      .getAllByText(
        /Total estimated savings|Avg saved per session|Avg turns per session|Avg session length|Avg tokens per session/,
      )
      .map((node) => node.textContent);
    expect(labels).toEqual([
      "Total estimated savings",
      "Avg saved per session",
      "Avg turns per session",
      "Avg session length",
      "Avg tokens per session",
    ]);
  });

  it("renders the headline numbers the tiles exist for", () => {
    mockHook({ data: response([group(), group({ router_name: "gpt-auto" })]) });
    renderTab();

    expect(screen.getByText("$2,174.59")).toBeInTheDocument();
    expect(screen.getByText("-86%")).toBeInTheDocument();
    expect(screen.getByText("Actual auto-router spend")).toBeInTheDocument();
    expect(screen.getByText("$359.86")).toBeInTheDocument();
    expect(screen.getByText("Estimated spend at highest-tier model")).toBeInTheDocument();
    expect(screen.getByText("$2,534.45")).toBeInTheDocument();
    expect(screen.getByText("32.7")).toBeInTheDocument();
    expect(screen.getByText("2.1h")).toBeInTheDocument();
    expect(screen.getByText("5.3M")).toBeInTheDocument();
  });

  it.each([
    { spend: 20665.28, classifier_cost: 342.18, turns: 140815, llm: "$20,323.10", cost: "$342.18", rate: "$2.43" },
    { spend: 0, classifier_cost: 0, turns: 0, llm: "$0.00", cost: "$0.00", rate: "$0.00" },
    { spend: 0.002, classifier_cost: 0.0004, turns: 100, llm: "$0.0016", cost: "$0.0004", rate: "$0.0040" },
  ])("shows total classification cost and its rate across $turns turns", ({ llm, cost, rate, ...values }) => {
    const stats = totals({ ...values, saved_spend: 10126.28, baseline_spend: values.spend + 10126.28 });
    mockHook({ data: response([group(stats)], stats) });
    renderTab();

    expect(
      screen
        .getAllByRole("definition")
        .map((node) => node.textContent)
        .slice(1, 3),
    ).toEqual([llm, cost]);
    expect(screen.getByText(`(${rate} / 1K turns)`)).toBeInTheDocument();
    expect(screen.getAllByText("$10,126.28").length).toBeGreaterThan(0);
  });

  it.each([null, undefined])("keeps totals when the classification breakdown is %s", (classifier_cost) => {
    const stats = totals({ classifier_cost });
    mockHook({ data: response([group(stats)], stats) });
    renderTab();

    expect(screen.getAllByText("Unavailable")).toHaveLength(2);
    expect(screen.queryByText(/\/ 1K turns/)).not.toBeInTheDocument();
    expect(screen.getByText("$359.86")).toBeInTheDocument();
    expect(screen.getByText("$2,174.59")).toBeInTheDocument();
    expect(screen.getByText(/some usage predates classification-cost tracking/)).toBeInTheDocument();
  });

  it("pairs the savings with the session count it was earned over, in its own tile", () => {
    mockHook({ data: response([group(), group({ router_name: "gpt-auto" })]) });
    renderTab();

    const tile = screen.getByText("Avg saved per session").closest('[data-slot="card"]');
    if (!tile) throw new Error("expected avg saved per session to render as a metric tile");

    expect(within(tile).getByText("$23.13")).toBeInTheDocument();
    expect(within(tile).getByText("· 94 sessions")).toBeInTheDocument();
  });

  it("exposes each spend row as a term and its value, not as loose text", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    const terms = screen.getAllByRole("term").map((node) => node.textContent);
    const values = screen.getAllByRole("definition").map((node) => node.textContent);
    expect(terms).toEqual([
      "Actual auto-router spend",
      "LLM spend",
      "Classification cost($2.00 / 1K turns)",
      "Estimated spend at highest-tier model",
    ]);
    expect(values).toEqual(["$359.86", "$353.71", "$6.15", "$2,534.45"]);
  });

  it("lets both hero columns shrink below their content so a large total cannot clip", () => {
    const huge = totals({ saved_spend: 123_456_789_012.34 });
    mockHook({ data: response([group(huge)], huge) });
    renderTab();

    const figure = screen.getByText("$123,456,789,012.34");
    const grid = figure.closest('[data-slot="card"]')?.firstElementChild;
    expect(grid).toHaveClass("md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");
  });

  it("shows a cost increase as a positive delta rather than a saving", () => {
    const overBaseline = { spend: 120, baseline_spend: 100, saved_spend: -20, saved_pct: -20 };
    const dearer = totals(overBaseline);
    mockHook({ data: response([group(dearer)], dearer) });
    renderTab();

    expect(screen.getByText("+20%")).toBeInTheDocument();
  });

  it("renders all three cache buckets with their turn counts and hit rates", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    expect(screen.getByText("Same model")).toBeInTheDocument();
    expect(screen.getByText("previous turn → same tier")).toBeInTheDocument();
    expect(screen.getByText("First visit")).toBeInTheDocument();
    expect(screen.getByText("previous turn → a tier not used yet")).toBeInTheDocument();
    expect(screen.getByText("Return to tier")).toBeInTheDocument();
    expect(screen.getByText("previous turn → a tier used earlier")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("37")).toBeInTheDocument();
    expect(screen.getByText("381")).toBeInTheDocument();
    expect(screen.getByText("49%")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(screen.getByText("47%")).toBeInTheDocument();
    expect(screen.getByText("97.7%")).toBeInTheDocument();
    expect(screen.getByText("24.3%")).toBeInTheDocument();
    expect(screen.getByText("81.6%")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Share of turns by bucket" })).not.toHaveClass("bg-muted");
  });

  it("summarizes the cache column from the bucketed turns, not the session turns", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    expect(screen.getByText("93.3%")).toBeInTheDocument();
    expect(screen.getByText("818")).toBeInTheDocument();
    expect(screen.getByText(/turns measured/)).toBeInTheDocument();
  });

  it("computes the expired-miss share over every measured turn, not just return-to-tier misses", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    expect(screen.getByText("Expired-miss")).toBeInTheDocument();
    expect(screen.getByText("2.3%")).toBeInTheDocument();
  });

  it("exposes the whole expired-miss row as a focusable tooltip trigger", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    const trigger = screen.getByRole("button", { name: /Expired-miss/ });
    expect(trigger).toHaveTextContent("2.3%");
  });

  it("shows a zero expired-miss share, rather than hiding the row, when every return turn hit", () => {
    const allHits = totals({
      cache: cache({ return_to_tier: { turns: 381, hits: 381, hit_rate_pct: 100 }, return_misses_expired: 0 }),
    });
    mockHook({ data: response([group(allHits)], allHits) });
    renderTab();

    const trigger = screen.getByRole("button", { name: /Expired-miss/ });
    expect(trigger).toHaveTextContent("0.0%");
  });

  it("hides the expired-miss row only when no turns were measured at all", () => {
    const empty = { turns: 0, hits: 0, hit_rate_pct: 0 };
    const nothingMeasured = {
      same_model: empty,
      first_visit: empty,
      return_to_tier: empty,
      return_misses_expired: 0,
    };
    const noTurns = totals({ cache: cache(nothingMeasured) });
    mockHook({ data: response([group(noTurns)], noTurns) });
    renderTab();

    expect(screen.queryByText("Expired-miss")).not.toBeInTheDocument();
  });

  it("mentions out-of-order turns only when there are any", () => {
    const unordered = totals({ cache: cache({ unordered_turns: 12 }) });
    mockHook({ data: response([group(unordered)], unordered) });
    renderTab();

    expect(screen.getByText(/12 turns arrived out of order across pods and are not bucketed/)).toBeInTheDocument();
  });

  it("labels the default selection instead of leaking the __all__ sentinel", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    expect(screen.getByText("All auto-routers")).toBeInTheDocument();
    expect(screen.queryByText("__all__")).not.toBeInTheDocument();
  });

  it("says so while the benchmarks are loading", () => {
    mockHook({ isPending: true });
    renderTab();

    expect(screen.getByText("Loading auto-router usage...")).toBeInTheDocument();
  });

  it("names the admin requirement when the proxy answers 403", () => {
    mockHook({ error: new ApiError("forbidden", 403, {}) });
    renderTab();

    expect(screen.getByText("Auto-router usage is visible to proxy admin roles only")).toBeInTheDocument();
  });

  it("degrades to a message when the endpoint is unavailable", () => {
    mockHook({ error: new ApiError("boom", 500, {}) });
    renderTab();

    expect(screen.getByText("Auto-router usage is unavailable right now")).toBeInTheDocument();
  });

  it("renders the full dashboard with zeroed stats when the window has no sessions", () => {
    mockHook({ data: response([], zeroTotals) });
    renderTab();

    expect(screen.getByText("Total estimated savings")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00")).toHaveLength(6);
    expect(screen.getByText("· 0 sessions")).toBeInTheDocument();
    expect(screen.getByText("0s")).toBeInTheDocument();
    expect(screen.getByText(/turns measured/)).toBeInTheDocument();
    expect(screen.getAllByText("0.0%").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Share of turns by bucket" })).toHaveClass("bg-muted");
  });

  it("shows the savings delta as an unsigned zero when nothing was saved", () => {
    mockHook({ data: response([], zeroTotals) });
    renderTab();

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText("-0%")).not.toBeInTheDocument();
  });

  it("queries the shared picker's range and pushes picker changes back to the shared state", () => {
    mockHook({ data: response([group()]) });
    const { dateValue, onDateChange } = renderTab();

    expect(vi.mocked(useAutoRouterBenchmarks)).toHaveBeenCalledWith("sk-test", dateValue, undefined);
    expect(screen.getByText("Jul 6 – Aug 5 (UTC)")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("date-picker"));
    expect(onDateChange).toHaveBeenCalledWith({ from: new Date(2026, 7, 1), to: new Date(2026, 7, 5) });
  });

  it("scopes the query to one key when the usage view is mounted for a key", () => {
    mockHook({ data: response([group()]) });
    const dateValue = { from: new Date(2026, 6, 6), to: new Date(2026, 7, 5) };
    const activity = {
      dateValue,
      onDateChange: vi.fn(),
      results: [],
      loading: false,
      isFetchingMore: false,
      progress: { currentPage: 1, totalPages: 1 },
      cancelled: false,
      cancel: vi.fn(),
    };
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AutoRouterUsageView accessToken="sk-test" activity={activity} apiKey="key-hash-1" />
      </QueryClientProvider>,
    );

    expect(vi.mocked(useAutoRouterBenchmarks)).toHaveBeenCalledWith("sk-test", dateValue, "key-hash-1");
    expect(screen.getByText("Total estimated savings")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Shadow Evals" })).not.toBeInTheDocument();
  });

  it("shows usage by default and mounts shadow evals only when its sub-tab is selected", () => {
    mockHook({ data: response([group()]) });
    renderTab();

    expect(screen.getByRole("tab", { name: "Usage" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Total estimated savings")).toBeInTheDocument();
    expect(screen.queryByTestId("shadow-eval-section")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Shadow Evals" }));
    expect(screen.getByRole("tab", { name: "Shadow Evals" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("shadow-eval-section")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
    expect(screen.getByText("Total estimated savings")).toBeInTheDocument();
    expect(screen.getByTestId("shadow-eval-section")).toBeInTheDocument();
  });

  it("keeps the shadow evals sub-tab reachable while the usage body is in its error state", () => {
    mockHook({ error: new ApiError("boom", 500, {}) });
    renderTab();

    expect(screen.getByText("Auto-router usage is unavailable right now")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Shadow Evals" }));
    expect(screen.getByTestId("shadow-eval-section")).toBeInTheDocument();
  });

  it("keeps the range picker reachable while a window has no sessions", () => {
    mockHook({ data: response([], zeroTotals) });
    renderTab();

    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByText("All auto-routers")).toBeInTheDocument();
  });
});

describe("AutoRouterBenchmarksTab Chinese copy", () => {
  beforeEach(async () => {
    mockAutoRouters();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese usage chrome, metrics and cache buckets and hides the English ones", () => {
    mockHook({ data: response([group(), group({ router_name: "gpt-auto" })]) });
    renderTab();

    expect(screen.getByRole("heading", { name: "自动路由用量" })).toBeInTheDocument();
    expect(screen.getByText("7月6日 – 8月5日（UTC）")).toBeInTheDocument();
    expect(screen.getByText("全部自动路由")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "用量" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "影子评估" })).toBeInTheDocument();
    expect(screen.getByText("预计节省总额")).toBeInTheDocument();
    expect(screen.getByText("自动路由实际支出")).toBeInTheDocument();
    expect(screen.getByText("LLM 支出")).toBeInTheDocument();
    expect(screen.getByText("分类成本")).toBeInTheDocument();
    expect(screen.getByText("（$2.00 / 1K 轮次）")).toBeInTheDocument();
    expect(screen.getByText("按最高层级模型估算的支出")).toBeInTheDocument();
    expect(screen.getByText("每会话平均节省")).toBeInTheDocument();
    expect(screen.getByText("· 94 个会话")).toBeInTheDocument();
    expect(screen.getByText("每会话平均轮次")).toBeInTheDocument();
    expect(screen.getByText("平均会话时长")).toBeInTheDocument();
    expect(screen.getByText("2.1 小时")).toBeInTheDocument();
    expect(screen.getByText("每会话平均 Token 数")).toBeInTheDocument();
    expect(screen.getByText(/将你的实际路由支出与仅使用自动路由中配置的最贵模型/)).toBeInTheDocument();
    expect(screen.getByText("自动路由提示词缓存")).toBeInTheDocument();
    expect(screen.getByText("每个轮次都恰好归入一个桶，取决于路由器当时的处理方式")).toBeInTheDocument();
    expect(screen.getByText("缓存命中率")).toBeInTheDocument();
    expect(screen.getByText("过期未命中")).toBeInTheDocument();
    expect(screen.getByText("轮次占比")).toBeInTheDocument();
    expect(screen.getByText("桶")).toBeInTheDocument();
    expect(screen.getByText("轮次")).toBeInTheDocument();
    expect(screen.getByText("命中率")).toBeInTheDocument();
    expect(screen.getByText("同一模型")).toBeInTheDocument();
    expect(screen.getByText("上一轮次 → 同一层级")).toBeInTheDocument();
    expect(screen.getByText("首次访问")).toBeInTheDocument();
    expect(screen.getByText("上一轮次 → 尚未使用的层级")).toBeInTheDocument();
    expect(screen.getByText("返回层级")).toBeInTheDocument();
    expect(screen.getByText("上一轮次 → 之前用过的层级")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "各桶轮次占比" })).toBeInTheDocument();
    expect(screen.getByTitle("同一模型：400 轮次")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "已统计 818 轮次"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: "Auto-router usage" })).not.toBeInTheDocument();
    expect(screen.queryByText("Total estimated savings")).not.toBeInTheDocument();
    expect(screen.queryByText("Actual auto-router spend")).not.toBeInTheDocument();
    expect(screen.queryByText("LLM spend")).not.toBeInTheDocument();
    expect(screen.queryByText("Classification cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Same model")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Share of turns by bucket" })).not.toBeInTheDocument();
    expect(screen.queryByText("Bucket")).not.toBeInTheDocument();
    expect(screen.queryByText("Turns")).not.toBeInTheDocument();
    expect(screen.queryByText("Hit rate")).not.toBeInTheDocument();
  });

  it("renders the Chinese expired-miss tooltip and hides the English one", async () => {
    const user = userEvent.setup();
    mockHook({ data: response([group()]) });
    renderTab();

    await user.hover(screen.getByRole("button", { name: /过期未命中/ }));

    expect(
      await screen.findByText("在所有已统计轮次中，因回到较早层级时已超过其 TTL 而未能命中缓存的占比"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/share of all measured turns that missed cache/)).not.toBeInTheDocument();
  });

  it("renders the Chinese out-of-order note and hides the English one", () => {
    const unordered = totals({ cache: cache({ unordered_turns: 12 }) });
    mockHook({ data: response([group(unordered)], unordered) });
    renderTab();

    expect(screen.getByText("有 12 个轮次跨 Pod 乱序到达，未纳入分桶")).toBeInTheDocument();
    expect(screen.queryByText(/turns arrived out of order/)).not.toBeInTheDocument();
  });

  it("renders the Chinese loading, admin-only and unavailable messages", () => {
    mockHook({ isPending: true });
    renderTab();
    expect(screen.getByText("正在加载自动路由用量...")).toBeInTheDocument();
    expect(screen.queryByText("Loading auto-router usage...")).not.toBeInTheDocument();

    cleanup();
    mockHook({ error: new ApiError("forbidden", 403, {}) });
    renderTab();
    expect(screen.getByText("自动路由用量仅对代理管理员角色可见")).toBeInTheDocument();
    expect(screen.queryByText("Auto-router usage is visible to proxy admin roles only")).not.toBeInTheDocument();

    cleanup();
    mockHook({ error: new ApiError("boom", 500, {}) });
    renderTab();
    expect(screen.getByText("自动路由用量当前不可用")).toBeInTheDocument();
    expect(screen.queryByText("Auto-router usage is unavailable right now")).not.toBeInTheDocument();
  });

  it("renders the Chinese classification breakdown fallback and hides the English one", () => {
    const stats = totals({ classifier_cost: null });
    mockHook({ data: response([group(stats)], stats) });
    renderTab();

    expect(screen.getAllByText("不可用")).toHaveLength(2);
    expect(screen.getByText("明细不可用，因为部分用量早于分类成本统计功能。")).toBeInTheDocument();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    expect(screen.queryByText(/Breakdown unavailable because some usage predates/)).not.toBeInTheDocument();
  });

  it("renders the Chinese sub-cent classification rate and hides the English one", () => {
    const stats = totals({ classifier_cost: 0.00001, turns: 1000 });
    mockHook({ data: response([group(stats)], stats) });
    renderTab();

    expect(screen.getByText("（<$0.0001 / 1K 轮次）")).toBeInTheDocument();
    expect(screen.queryByText("(<$0.0001 / 1K turns)")).not.toBeInTheDocument();
  });

  it.each([
    [42, "42 秒"],
    [150, "2.5 分钟"],
    [7560, "2.1 小时"],
  ])("renders the Chinese session length for %s seconds as %s", (seconds, label) => {
    const stats = totals({ avg_session_seconds: seconds });
    mockHook({ data: response([group(stats)], stats) });
    renderTab();

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
