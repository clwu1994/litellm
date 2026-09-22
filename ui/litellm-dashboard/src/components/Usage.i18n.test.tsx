import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { ActivityMetrics } from "./activity_metrics";
import type { ModelActivityData } from "./UsagePage/types";
import PerUserUsage from "./per_user_usage";
import UserAgentActivity from "./user_agent_activity";

vi.mock("./networking", () => ({
  perUserAnalyticsCall: vi.fn(),
  userAgentSummaryCall: vi.fn(),
  tagDauCall: vi.fn(),
  tagWauCall: vi.fn(),
  tagMauCall: vi.fn(),
  tagDistinctCall: vi.fn(),
}));

import * as networking from "./networking";

const emptyResponse = { results: [] };

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never;
  }
});

const DAILY_METRICS = {
  prompt_tokens: 600,
  completion_tokens: 400,
  total_tokens: 1000,
  api_requests: 10,
  spend: 1.5,
  successful_requests: 9,
  failed_requests: 1,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
};

const modelData: ModelActivityData = {
  label: "gpt-4o",
  total_requests: 10,
  total_successful_requests: 9,
  total_failed_requests: 1,
  total_tokens: 1000,
  prompt_tokens: 600,
  completion_tokens: 400,
  total_spend: 1.5,
  total_cache_read_input_tokens: 0,
  total_cache_creation_input_tokens: 0,
  top_api_keys: [],
  top_models: [],
  daily_data: [{ date: "2025-01-01", metrics: DAILY_METRICS }],
};

const EMPTY_PER_USER_RESPONSE = {
  results: [],
  total_count: 0,
  page: 1,
  page_size: 50,
  total_pages: 0,
};

describe("Usage components Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.perUserAnalyticsCall).mockResolvedValue(EMPTY_PER_USER_RESPONSE);
    vi.mocked(networking.userAgentSummaryCall).mockResolvedValue(emptyResponse);
    vi.mocked(networking.tagDauCall).mockResolvedValue(emptyResponse);
    vi.mocked(networking.tagWauCall).mockResolvedValue(emptyResponse);
    vi.mocked(networking.tagMauCall).mockResolvedValue(emptyResponse);
    vi.mocked(networking.tagDistinctCall).mockResolvedValue(emptyResponse);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the per-user usage headings, tabs and columns in Chinese", async () => {
    renderWithProviders(
      <PerUserUsage accessToken="tok" selectedTags={[]} formatAbbreviatedNumber={(value) => String(value)} />,
    );

    expect(await screen.findByText("每用户用量")).toBeInTheDocument();
    expect(screen.queryByText("Per User Usage")).not.toBeInTheDocument();
    expect(screen.getByText("单个开发者的用量指标")).toBeInTheDocument();
    expect(screen.queryByText("Individual developer usage metrics")).not.toBeInTheDocument();
    expect(screen.getByText("用户详情")).toBeInTheDocument();
    expect(screen.queryByText("User Details")).not.toBeInTheDocument();
    expect(screen.getByText("用量分布")).toBeInTheDocument();
    expect(screen.queryByText("Usage Distribution")).not.toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.queryByText("User Email")).not.toBeInTheDocument();
    expect(screen.getByText("成功生成次数")).toBeInTheDocument();
    expect(screen.queryByText("Success Generations")).not.toBeInTheDocument();
    expect(screen.getByText("总成本")).toBeInTheDocument();
    expect(screen.queryByText("Total Cost")).not.toBeInTheDocument();
    expect(screen.getByText("没有每用户用量数据")).toBeInTheDocument();
    expect(screen.queryByText("No per-user usage data")).not.toBeInTheDocument();
  });

  it("renders the activity metrics headings in Chinese", () => {
    renderWithProviders(<ActivityMetrics modelMetrics={{ "gpt-4o": modelData }} />);

    expect(screen.getByText("总体用量")).toBeInTheDocument();
    expect(screen.queryByText("Overall Usage")).not.toBeInTheDocument();
    expect(screen.getAllByText("总请求数").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Requests")).not.toBeInTheDocument();
    expect(screen.getAllByText("总成功请求数").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Successful Requests")).not.toBeInTheDocument();
    expect(screen.getAllByText("总 Token 数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("总 Token 数").length).toBeGreaterThan(0);
    expect(screen.getAllByText("总消费").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Spend")).not.toBeInTheDocument();
    expect(screen.getByText("每日消费")).toBeInTheDocument();
    expect(screen.queryByText("Spend per day")).not.toBeInTheDocument();
    expect(screen.getByText("每日请求数")).toBeInTheDocument();
    expect(screen.queryByText("Requests per day")).not.toBeInTheDocument();
    expect(screen.getByText("成功与失败请求")).toBeInTheDocument();
    expect(screen.queryByText("Success vs Failed Requests")).not.toBeInTheDocument();
    expect(screen.getByText("提示缓存指标")).toBeInTheDocument();
    expect(screen.queryByText("Prompt Caching Metrics")).not.toBeInTheDocument();
    expect(screen.getByText("总 Token 数随时间变化")).toBeInTheDocument();
    expect(screen.queryByText("Total Tokens Over Time")).not.toBeInTheDocument();
    expect(screen.getByText("总请求数随时间变化")).toBeInTheDocument();
    expect(screen.queryByText("Total Requests Over Time")).not.toBeInTheDocument();
  });

  it("renders the user agent activity headings and filter in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UserAgentActivity
        accessToken="tok"
        userRole="Admin"
        dateValue={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        onDateChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("按 User Agent 汇总")).toBeInTheDocument();
    expect(screen.queryByText("Summary by User Agent")).not.toBeInTheDocument();
    expect(screen.getByText("不同 User Agent 的性能指标")).toBeInTheDocument();
    expect(screen.queryByText("Performance metrics for different user agents")).not.toBeInTheDocument();
    expect(screen.getByText("按 User Agent 筛选")).toBeInTheDocument();
    expect(screen.queryByText("Filter by User Agents")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("所有 User Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("All User Agents")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("所有 User Agent"));

    expect(await screen.findByText("未找到 User Agent")).toBeInTheDocument();
    expect(screen.queryByText("No user agents found")).not.toBeInTheDocument();
  });

  it("renders the user agent activity period headings in Chinese", async () => {
    renderWithProviders(
      <UserAgentActivity
        accessToken="tok"
        userRole="Admin"
        dateValue={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        onDateChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("每个 Agent 的 DAU、WAU 和 MAU")).toBeInTheDocument();
    expect(screen.queryByText("DAU, WAU & MAU per Agent")).not.toBeInTheDocument();
    expect(screen.getByText("不同时间段的活跃用户")).toBeInTheDocument();
    expect(screen.queryByText("Active users across different time periods")).not.toBeInTheDocument();
    expect(screen.getByText("日活跃用户 - 过去 7 天")).toBeInTheDocument();
    expect(screen.queryByText("Daily Active Users - Last 7 Days")).not.toBeInTheDocument();
    expect(screen.getByText("周活跃用户 - 过去 7 周")).toBeInTheDocument();
    expect(screen.queryByText("Weekly Active Users - Last 7 Weeks")).not.toBeInTheDocument();
    expect(screen.getByText("月活跃用户 - 过去 7 个月")).toBeInTheDocument();
    expect(screen.queryByText("Monthly Active Users - Last 7 Months")).not.toBeInTheDocument();
    expect(screen.getAllByText("暂无数据").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("No Data")).toHaveLength(0);
  });
});
