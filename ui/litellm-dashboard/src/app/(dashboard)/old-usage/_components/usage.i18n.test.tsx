import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import UsagePage from "./usage";

const networking = vi.hoisted(() => ({
  adminSpendLogsCall: vi.fn(),
  adminTopKeysCall: vi.fn(),
  adminTopModelsCall: vi.fn(),
  adminTopEndUsersCall: vi.fn(),
  teamSpendLogsCall: vi.fn(),
  tagsSpendLogsCall: vi.fn(),
  allTagNamesCall: vi.fn(),
  adminspendByProvider: vi.fn(),
  adminGlobalActivity: vi.fn(),
  adminGlobalActivityPerModel: vi.fn(),
  getProxyUISettings: vi.fn(),
  modelAvailableCall: vi.fn(),
  keyInfoV1Call: vi.fn(),
}));

vi.mock("@/components/networking", () => networking);

vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("July");

const renderUsage = (overrides: Partial<ComponentProps<typeof UsagePage>> = {}) =>
  renderWithProviders(
    <UsagePage
      accessToken="sk-test"
      token="tok"
      userRole="Admin"
      userID="u1"
      keys={null}
      premiumUser={true}
      {...overrides}
    />,
  );

const LAST_DAY_OF_MONTH = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

const PROJECT_SPEND_EN = `Project Spend July 1 - ${LAST_DAY_OF_MONTH}`;
const PROJECT_SPEND_ZH = `项目支出 July 1 - ${LAST_DAY_OF_MONTH}`;

beforeEach(() => {
  vi.clearAllMocks();
  networking.getProxyUISettings.mockResolvedValue({ DISABLE_EXPENSIVE_DB_QUERIES: false, NUM_SPEND_LOGS_ROWS: 10 });
  networking.adminSpendLogsCall.mockResolvedValue([{ date: "2026-07-01", spend: 12.5 }]);
  networking.adminTopKeysCall.mockResolvedValue([
    { api_key: "sk-abcdefghijk", key_alias: "prod-key", total_spend: 9.5 },
  ]);
  networking.adminTopModelsCall.mockResolvedValue([{ model: "gpt-5.1", total_spend: 7.25 }]);
  networking.adminTopEndUsersCall.mockResolvedValue([
    { end_user: "customer-alpha", total_spend: 3.5, total_count: 42 },
  ]);
  networking.teamSpendLogsCall.mockResolvedValue({
    daily_spend: [{ date: "2026-07-01", "team-a": 5 }],
    teams: ["team-a"],
    total_spend_per_team: [{ team_id: "team-a", total_spend: 5 }],
  });
  networking.tagsSpendLogsCall.mockResolvedValue({ spend_per_tag: [{ name: "prod", spend: 4 }] });
  networking.allTagNamesCall.mockResolvedValue({ tag_names: ["prod", "staging"] });
  networking.adminspendByProvider.mockResolvedValue([{ provider: "openai", spend: 6.75 }]);
  networking.adminGlobalActivity.mockResolvedValue({
    sum_api_requests: 120,
    sum_total_tokens: 4500,
    daily_data: [{ date: "2026-07-01", api_requests: 120, total_tokens: 4500 }],
  });
  networking.adminGlobalActivityPerModel.mockResolvedValue([]);
  networking.modelAvailableCall.mockResolvedValue({ data: [] });
  networking.keyInfoV1Call.mockResolvedValue({ info: {} });
});

describe("old usage Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese top-level and cost tabs and hides the English originals", async () => {
    renderUsage();

    expect(await screen.findByRole("tab", { name: "总览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按团队用量" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "客户用量" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按标签用量" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "All Up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Team Based Usage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Customer Usage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Tag Based Usage" })).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "成本" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "活动" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cost" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Activity" })).not.toBeInTheDocument();
  });

  it("renders the Chinese cost panel copy and hides the English originals", async () => {
    renderUsage();

    expect(await screen.findByText(PROJECT_SPEND_ZH)).toBeInTheDocument();
    expect(screen.queryByText(PROJECT_SPEND_EN)).not.toBeInTheDocument();

    expect(screen.getByText("每月支出")).toBeInTheDocument();
    expect(screen.queryByText("Monthly Spend")).not.toBeInTheDocument();

    expect(screen.getByText("Top Virtual Keys")).toBeInTheDocument();

    expect(screen.getByText("Top 模型")).toBeInTheDocument();
    expect(screen.queryByText("Top Models")).not.toBeInTheDocument();

    expect(screen.getByText("按提供商统计支出")).toBeInTheDocument();
    expect(screen.queryByText("Spend by Provider")).not.toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: "提供商" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Provider" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "支出" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Spend" })).not.toBeInTheDocument();
  });

  it("renders the Chinese activity panel copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderUsage();

    await user.click(await screen.findByRole("tab", { name: "活动" }));

    expect(screen.getByText("总览", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.queryByText("All Up", { selector: '[data-slot="card-title"]' })).not.toBeInTheDocument();

    expect(screen.getByText("API 请求 120")).toBeInTheDocument();
    expect(screen.queryByText("API Requests 120")).not.toBeInTheDocument();

    expect(screen.getByText("Token 数 5K")).toBeInTheDocument();
    expect(screen.queryByText("Tokens 5K")).not.toBeInTheDocument();
  });

  it("renders the Chinese team spend copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderUsage();

    await user.click(await screen.findByRole("tab", { name: "按团队用量" }));

    expect(screen.getByText("团队总支出")).toBeInTheDocument();
    expect(screen.queryByText("Total Spend Per Team")).not.toBeInTheDocument();

    expect(screen.getByText("团队每日支出")).toBeInTheDocument();
    expect(screen.queryByText("Daily Spend Per Team")).not.toBeInTheDocument();
  });

  it("renders the Chinese customer panel copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderUsage();

    await user.click(await screen.findByRole("tab", { name: "客户用量" }));

    expect(
      screen.getByText("你的 LLM API 调用的客户。当你的 LLM 调用中传入 `user` 参数时会被跟踪"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Customers of your LLM API calls. Tracked when a `user` param is passed in your LLM calls"),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "查看文档" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "docs here" })).not.toBeInTheDocument();

    expect(screen.getByText("选择密钥")).toBeInTheDocument();
    expect(screen.queryByText("Select Key")).not.toBeInTheDocument();

    expect(screen.getByText("所有密钥")).toBeInTheDocument();
    expect(screen.queryByText("All Keys")).not.toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: "客户" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Customer" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "支出" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Spend" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "总事件数" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Total Events" })).not.toBeInTheDocument();
  });

  it("renders the Chinese tag spend copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderUsage();

    await user.click(await screen.findByRole("tab", { name: "按标签用量" }));

    expect(screen.getByText("按标签支出")).toBeInTheDocument();
    expect(screen.queryByText("Spend Per Tag")).not.toBeInTheDocument();

    expect(screen.getByText("开始按标签跟踪成本")).toBeInTheDocument();
    expect(screen.queryByText("Get Started by Tracking cost per tag")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "此处" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();

    expect(screen.getByText("所有标签")).toBeInTheDocument();
    expect(screen.queryByText("All Tags")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("选择标签")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select tags")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty tag list once the filter excludes every option", async () => {
    const user = userEvent.setup();
    renderUsage();

    await user.click(await screen.findByRole("tab", { name: "按标签用量" }));
    const input = screen.getByPlaceholderText("选择标签");
    await user.click(input);
    await user.type(input, "zzz");

    expect(await screen.findByText("未找到标签")).toBeInTheDocument();
    expect(screen.queryByText("No tags found")).not.toBeInTheDocument();
  });

  it("renders the Chinese enterprise-only tag label and hides the English original", async () => {
    const user = userEvent.setup();
    renderUsage({ premiumUser: false });

    await user.click(await screen.findByRole("tab", { name: "按标签用量" }));
    await user.click(screen.getByPlaceholderText("选择标签"));

    expect(await screen.findByText("✨ prod（仅企业版功能）")).toBeInTheDocument();
    expect(screen.queryByText("✨ prod (Enterprise only Feature)")).not.toBeInTheDocument();
  });

  it("renders the Chinese admin-only notice and hides the English original", async () => {
    renderUsage({ userRole: "Internal User" });

    expect(
      await screen.findByText("代理范围的用量仅对管理员用户开放。你自己的用量可在「用量」页面查看。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Proxy-wide usage is only available to admin users. Your own usage is on the Usage page."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("用量", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.queryByText("Usage", { selector: '[data-slot="card-title"]' })).not.toBeInTheDocument();
  });

  it("renders the Chinese database query limit notice and hides the English originals", async () => {
    networking.getProxyUISettings.mockResolvedValue({
      DISABLE_EXPENSIVE_DB_QUERIES: true,
      NUM_SPEND_LOGS_ROWS: 2500000,
    });
    renderUsage();

    expect(await screen.findByText("已达到数据库查询上限")).toBeInTheDocument();
    expect(screen.queryByText("Database Query Limit Reached")).not.toBeInTheDocument();

    const notice = screen.getByText(/数据库中的 SpendLogs/);
    expect(notice).toHaveTextContent("数据库中的 SpendLogs 有 2500000 行。");
    expect(notice).toHaveTextContent("当 SpendLogs 超过 100 万行时，请按照我们的指南查看用量。");
    expect(notice).not.toHaveTextContent("SpendLogs in DB has 2500000 rows.");
    expect(notice).not.toHaveTextContent("Please follow our guide to view usage when SpendLogs has more than 1M rows.");

    expect(screen.getByRole("link", { name: "查看用量指南" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View Usage Guide" })).not.toBeInTheDocument();
  });
});

describe("old usage English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const user = userEvent.setup();
    renderUsage();

    expect(await screen.findByRole("tab", { name: "All Up" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Team Based Usage" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Customer Usage" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tag Based Usage" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Cost" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Activity" })).toBeInTheDocument();

    expect(screen.getByText(PROJECT_SPEND_EN)).toBeInTheDocument();
    expect(screen.getByText("Monthly Spend")).toBeInTheDocument();
    expect(screen.getByText("Top Virtual Keys")).toBeInTheDocument();
    expect(screen.getByText("Top Models")).toBeInTheDocument();
    expect(screen.getByText("Spend by Provider")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Provider" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Spend" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("All Up", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
    expect(screen.getByText("API Requests 120")).toBeInTheDocument();
    expect(screen.getByText("Tokens 5K")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Team Based Usage" }));
    expect(screen.getByText("Total Spend Per Team")).toBeInTheDocument();
    expect(screen.getByText("Daily Spend Per Team")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Customer Usage" }));
    expect(
      screen.getByText("Customers of your LLM API calls. Tracked when a `user` param is passed in your LLM calls"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "docs here" })).toBeInTheDocument();
    expect(screen.getByText("Select Key")).toBeInTheDocument();
    expect(screen.getByText("All Keys")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Customer" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total Events" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Tag Based Usage" }));
    expect(screen.getByText("Spend Per Tag")).toBeInTheDocument();
    expect(screen.getByText("Get Started by Tracking cost per tag")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "here" })).toBeInTheDocument();
    expect(screen.getByText("All Tags")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select tags")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Select tags");
    await user.click(input);
    await user.type(input, "zzz");
    expect(await screen.findByText("No tags found")).toBeInTheDocument();
  });

  it("keeps the original English database query limit notice byte-identical", async () => {
    networking.getProxyUISettings.mockResolvedValue({
      DISABLE_EXPENSIVE_DB_QUERIES: true,
      NUM_SPEND_LOGS_ROWS: 2500000,
    });
    renderUsage();

    expect(await screen.findByText("Database Query Limit Reached")).toBeInTheDocument();
    const notice = screen.getByText(/SpendLogs in DB has/);
    expect(notice).toHaveTextContent("SpendLogs in DB has 2500000 rows.");
    expect(notice).toHaveTextContent("Please follow our guide to view usage when SpendLogs has more than 1M rows.");
    expect(screen.getByRole("link", { name: "View Usage Guide" })).toBeInTheDocument();
  });

  it("keeps the original English admin-only notice byte-identical", async () => {
    renderUsage({ userRole: "Internal User" });

    expect(
      await screen.findByText(
        "Proxy-wide usage is only available to admin users. Your own usage is on the Usage page.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Usage", { selector: '[data-slot="card-title"]' })).toBeInTheDocument();
  });
});
