import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import UsagePanel from "./UsagePanel";
import { userDailyActivityAggregatedCall } from "../networking";

vi.mock("../networking", () => ({
  userDailyActivityAggregatedCall: vi.fn(),
}));

const mockedUsageCall = vi.mocked(userDailyActivityAggregatedCall);

const metrics = (spend: number, requests: number) => ({
  spend,
  prompt_tokens: 10,
  completion_tokens: 5,
  total_tokens: 15,
  api_requests: requests,
  successful_requests: requests,
  failed_requests: 0,
});

const renderPanel = (token: string) => render(<UsagePanel accessToken={token} userId="user-1" />);

describe("UsagePanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state while hiding the English originals", async () => {
    mockedUsageCall.mockResolvedValue({
      results: [],
      metadata: {
        total_spend: 0,
        total_prompt_tokens: 0,
        total_completion_tokens: 0,
        total_tokens: 0,
        total_api_requests: 0,
        total_successful_requests: 0,
        total_failed_requests: 0,
      },
    });
    renderPanel("usage-empty");

    expect(await screen.findByText("你的用量")).toBeInTheDocument();
    expect(screen.queryByText("Your Usage")).not.toBeInTheDocument();
    expect(screen.getByText("消费和请求活动")).toBeInTheDocument();
    expect(screen.queryByText("Spend and request activity")).not.toBeInTheDocument();
    expect(await screen.findByText("此时间段没有用量数据")).toBeInTheDocument();
    expect(screen.queryByText("No usage data for this period")).not.toBeInTheDocument();
  });

  it("renders every Chinese stat card and chart heading while hiding the English originals", async () => {
    mockedUsageCall.mockResolvedValue({
      results: [
        { date: "2026-07-17", metrics: metrics(1, 2) },
        { date: "2026-07-18", metrics: metrics(2, 3) },
      ],
      metadata: {
        total_spend: 12.5,
        total_prompt_tokens: 1000,
        total_completion_tokens: 500,
        total_tokens: 1500,
        total_api_requests: 4,
        total_successful_requests: 3,
        total_failed_requests: 1,
      },
    });
    renderPanel("usage-full");

    expect(await screen.findByText("总消费")).toBeInTheDocument();
    expect(screen.queryByText("Total Spend")).not.toBeInTheDocument();
    expect(screen.getByText("API 请求数")).toBeInTheDocument();
    expect(screen.queryByText("API Requests")).not.toBeInTheDocument();
    expect(screen.getByText("已用 Token")).toBeInTheDocument();
    expect(screen.queryByText("Tokens Used")).not.toBeInTheDocument();
    expect(screen.getByText("成功率")).toBeInTheDocument();
    expect(screen.queryByText("Success Rate")).not.toBeInTheDocument();

    expect(screen.getByText("输入 1.0K / 输出 500")).toBeInTheDocument();
    expect(screen.queryByText("1.0K in / 500 out")).not.toBeInTheDocument();
    expect(screen.getByText("1 个失败")).toBeInTheDocument();
    expect(screen.queryByText("1 failed")).not.toBeInTheDocument();

    expect(screen.getByText("每日消费")).toBeInTheDocument();
    expect(screen.queryByText("Daily Spend")).not.toBeInTheDocument();
    expect(screen.getByText("每日请求数")).toBeInTheDocument();
    expect(screen.queryByText("Daily Requests")).not.toBeInTheDocument();
  });
});
