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

const PER_USER_ROW = {
  user_id: "u1",
  user_email: null,
  user_agent: null,
  successful_requests: 5,
  failed_requests: 2,
  total_requests: 7,
  total_tokens: 100,
  spend: 1,
};

const modelData: ModelActivityData = {
  label: "",
  total_requests: 10,
  total_successful_requests: 9,
  total_failed_requests: 1,
  total_tokens: 1000,
  prompt_tokens: 600,
  completion_tokens: 400,
  total_spend: 1.5,
  total_cache_read_input_tokens: 0,
  total_cache_creation_input_tokens: 0,
  top_api_keys: [
    {
      api_key: "sk-abcdefghijklmnop",
      key_alias: "prod-key",
      team_id: "team-1",
      spend: 1.5,
      requests: 10,
      tokens: 1000,
    },
  ],
  top_models: [],
  daily_data: [{ date: "2025-01-01", metrics: DAILY_METRICS }],
};

const PER_USER_RESPONSE = {
  results: [PER_USER_ROW],
  total_count: 1,
  page: 1,
  page_size: 50,
  total_pages: 1,
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

  it("renders the per-user table headers, fallbacks and distribution categories in Chinese", async () => {
    vi.mocked(networking.perUserAnalyticsCall).mockResolvedValue(PER_USER_RESPONSE);
    renderWithProviders(
      <PerUserUsage accessToken="tok" selectedTags={[]} formatAbbreviatedNumber={(value) => String(value)} />,
    );

    expect(await screen.findByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.getByText("User Agent")).toBeInTheDocument();
    expect(screen.queryByText("用户代理")).not.toBeInTheDocument();
    expect(screen.getByText("总 Token 数")).toBeInTheDocument();
    expect(screen.getByText("失败请求数")).toBeInTheDocument();
    expect(screen.queryByText("Failed Requests")).not.toBeInTheDocument();
    expect(screen.getByText("无")).toBeInTheDocument();
    expect(screen.getAllByText("未知").length).toBeGreaterThan(0);
    expect(screen.getByText("用户用量分布")).toBeInTheDocument();
    expect(screen.getByText("按成功请求频率统计的用户数")).toBeInTheDocument();
    expect(screen.queryByText("Number of users by successful request frequency")).not.toBeInTheDocument();
    expect(screen.getByText("1-9 次请求")).toBeInTheDocument();
    expect(screen.getByText("10-99 次请求")).toBeInTheDocument();
    expect(screen.getByText("100-999 次请求")).toBeInTheDocument();
    expect(screen.getByText("1K-9.9K 次请求")).toBeInTheDocument();
    expect(screen.getByText("10K-99.9K 次请求")).toBeInTheDocument();
    expect(screen.getByText("100K+ 次请求")).toBeInTheDocument();
    expect(screen.queryByText("1-9 requests")).not.toBeInTheDocument();
  });

  it("renders the activity metrics headings in Chinese", () => {
    renderWithProviders(<ActivityMetrics modelMetrics={{ "": modelData }} />);

    expect(screen.getByText("总体用量")).toBeInTheDocument();
    expect(screen.queryByText("Overall Usage")).not.toBeInTheDocument();
    expect(screen.getAllByText("总请求数").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Requests")).not.toBeInTheDocument();
    expect(screen.getAllByText("总成功请求数").length).toBeGreaterThan(0);
    expect(screen.queryByText("Total Successful Requests")).not.toBeInTheDocument();
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
    expect(screen.getByText("按消费排序的 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByText("Top Virtual Keys by Spend")).not.toBeInTheDocument();
    expect(screen.getByText("团队：team-1")).toBeInTheDocument();
    expect(screen.queryByText("Team: team-1")).not.toBeInTheDocument();
    expect(screen.getByText("10 次请求 | 1,000 个 Token")).toBeInTheDocument();
    expect(screen.getByText("缓存读取：0 个 Token")).toBeInTheDocument();
    expect(screen.getByText("缓存创建：0 个 Token")).toBeInTheDocument();
    expect(screen.getAllByText("未知项目").length).toBeGreaterThan(0);
    expect(screen.queryByText("Unknown Item")).not.toBeInTheDocument();
    expect(screen.getByText("10 次请求")).toBeInTheDocument();
    expect(screen.getByText("每次成功请求平均 111")).toBeInTheDocument();
    expect(screen.queryByText(/avg per successful request/)).not.toBeInTheDocument();
    expect(screen.getByText("每次成功请求 $0.167")).toBeInTheDocument();
    expect(screen.queryByText(/per successful request/)).not.toBeInTheDocument();
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
    expect(screen.getByText("日/周/月活跃用户")).toBeInTheDocument();
    expect(screen.queryByText("DAU/WAU/MAU")).not.toBeInTheDocument();
    expect(screen.getByText("每用户用量（过去 30 天）")).toBeInTheDocument();
    expect(screen.queryByText("Per User Usage (Last 30 Days)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("所有 User Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("All User Agents")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("所有 User Agent"));

    expect(await screen.findByText("未找到 User Agent")).toBeInTheDocument();
    expect(screen.queryByText("No user agents found")).not.toBeInTheDocument();
  });

  it("renders the user agent activity clear-filter control in Chinese", async () => {
    vi.mocked(networking.tagDistinctCall).mockResolvedValue({
      results: [{ tag: "User-Agent: Chrome/1.0" }],
    });
    const user = userEvent.setup();
    renderWithProviders(
      <UserAgentActivity
        accessToken="tok"
        userRole="Admin"
        dateValue={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        onDateChange={vi.fn()}
      />,
    );

    await user.click(await screen.findByPlaceholderText("所有 User Agent"));
    await user.click(await screen.findByRole("option", { name: "Chrome/1.0" }));

    expect(await screen.findByRole("button", { name: "清除 User Agent 筛选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear user agent filter" })).not.toBeInTheDocument();
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
