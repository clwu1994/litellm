/* eslint-disable testing-library/no-node-access -- the token pricing line has no role, so its container is reached from the rendered value it labels */
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MultiCostResults from "./multi_cost_results";
import type { CostEstimateResponse } from "../types";
import type { MultiModelResult } from "./types";

vi.mock("./multi_export_utils", () => ({
  exportMultiToPDF: vi.fn(),
  exportMultiToCSV: vi.fn(),
}));

vi.mock("@/utils/dataUtils", () => ({
  formatNumberWithCommas: vi.fn((v: number, d: number = 0) => (Number.isFinite(v) ? v.toFixed(d) : "-")),
}));

const TOTALS = {
  cost_per_request: 0.05,
  daily_cost: 5.0,
  monthly_cost: null,
  margin_per_request: 0,
  daily_margin: null,
  monthly_margin: null,
};

function makeCostResponse(overrides: Partial<CostEstimateResponse> = {}): CostEstimateResponse {
  return {
    model: "gpt-4",
    input_tokens: 1000,
    output_tokens: 500,
    num_requests_per_day: 100,
    num_requests_per_month: null,
    cost_per_request: 0.05,
    input_cost_per_request: 0.03,
    output_cost_per_request: 0.02,
    margin_cost_per_request: 0,
    daily_cost: 5.0,
    daily_input_cost: 3.0,
    daily_output_cost: 2.0,
    daily_margin_cost: 0,
    monthly_cost: null,
    monthly_input_cost: null,
    monthly_output_cost: null,
    monthly_margin_cost: null,
    input_cost_per_token: null,
    output_cost_per_token: null,
    provider: "openai",
    ...overrides,
  };
}

function makeMultiResult(
  result: CostEstimateResponse,
  totals: MultiModelResult["totals"] = TOTALS,
  loading = false,
): MultiModelResult {
  return {
    entries: [
      { entry: { id: "e1", model: "gpt-4", input_tokens: 1000, output_tokens: 500 }, result, loading, error: null },
    ],
    totals,
  };
}

const BREAKDOWN_OVERRIDES: Partial<CostEstimateResponse> = {
  margin_cost_per_request: 0.01,
  daily_margin_cost: 0.5,
  input_cost_per_token: 0.00003,
  output_cost_per_token: 0.00004,
};

const emptyResult = (): MultiModelResult => ({
  entries: [
    { entry: { id: "e1", model: "", input_tokens: 0, output_tokens: 0 }, result: null, loading: false, error: null },
  ],
  totals: TOTALS,
});

describe("MultiCostResults Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese prompt to select models", () => {
    renderWithProviders(<MultiCostResults multiResult={emptyResult()} timePeriod="month" />);

    expect(screen.getByText("在上方选择模型以查看成本估算")).toBeInTheDocument();
    expect(screen.queryByText("Select models above to see cost estimates")).not.toBeInTheDocument();
  });

  it("renders the Chinese calculating prompt while loading with no results", () => {
    const loading: MultiModelResult = {
      entries: [
        {
          entry: { id: "e1", model: "gpt-4", input_tokens: 0, output_tokens: 0 },
          result: null,
          loading: true,
          error: null,
        },
      ],
      totals: TOTALS,
    };
    renderWithProviders(<MultiCostResults multiResult={loading} timePeriod="month" />);

    expect(screen.getByText("正在计算成本...")).toBeInTheDocument();
    expect(screen.queryByText("Calculating costs...")).not.toBeInTheDocument();
  });

  it("renders the Chinese error-only heading with the unknown model placeholder", () => {
    const errored: MultiModelResult = {
      entries: [
        {
          entry: { id: "e1", model: "", input_tokens: 0, output_tokens: 0 },
          result: null,
          loading: false,
          error: "boom",
        },
      ],
      totals: TOTALS,
    };
    renderWithProviders(<MultiCostResults multiResult={errored} timePeriod="month" />);

    expect(screen.getByText("成本估算")).toBeInTheDocument();
    expect(screen.getByText(/未知模型/)).toBeInTheDocument();
    expect(screen.queryByText("Cost Estimates")).not.toBeInTheDocument();
    expect(screen.queryByText(/Unknown model/)).not.toBeInTheDocument();
  });

  it("renders the Chinese summary card with the daily period and margin copy", () => {
    const withMargin = makeMultiResult(makeCostResponse(), {
      ...TOTALS,
      margin_per_request: 0.01,
      daily_margin: 0.5,
    });
    renderWithProviders(<MultiCostResults multiResult={withMargin} timePeriod="day" />);

    expect(screen.getByText("成本估算")).toBeInTheDocument();
    expect(screen.getByText("每请求总计")).toBeInTheDocument();
    expect(screen.getByText("每日总计")).toBeInTheDocument();
    expect(screen.getByText("每请求加价费用")).toBeInTheDocument();
    expect(screen.getByText("每日加价费用")).toBeInTheDocument();
    expect(screen.queryByText("Cost Estimates")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Per Request")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Daily")).not.toBeInTheDocument();
    expect(screen.queryByText("Margin Fee/Request")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Margin Fee")).not.toBeInTheDocument();
  });

  it("renders the Chinese table headers and the expand action", () => {
    renderWithProviders(<MultiCostResults multiResult={makeMultiResult(makeCostResponse())} timePeriod="month" />);

    expect(screen.getByRole("columnheader", { name: "模型" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "每请求" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "加价费用" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "每月" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "成本明细" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "显示 gpt-4 的成本明细" })).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: "Model" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Per Request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Margin Fee" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Monthly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Cost breakdown" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show cost breakdown for gpt-4" })).not.toBeInTheDocument();
  });

  it("renders the Chinese breakdown copy and swaps the expand action when opened", async () => {
    const user = userEvent.setup();
    const result = makeCostResponse(BREAKDOWN_OVERRIDES);
    renderWithProviders(<MultiCostResults multiResult={makeMultiResult(result)} timePeriod="day" />);

    await user.click(screen.getByRole("button", { name: "显示 gpt-4 的成本明细" }));

    expect(screen.getByRole("button", { name: "隐藏 gpt-4 的成本明细" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide cost breakdown for gpt-4" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "每日" })).toBeInTheDocument();
    expect(screen.getByText("每请求合计")).toBeInTheDocument();
    expect(screen.getByText("输入成本")).toBeInTheDocument();
    expect(screen.getByText("输出成本")).toBeInTheDocument();
    expect(screen.getByText("每日总计（100 请求）")).toBeInTheDocument();
    expect(screen.getByText("每日输入")).toBeInTheDocument();
    expect(screen.getByText("每日输出")).toBeInTheDocument();
    expect(screen.getByText("每日加价费用")).toBeInTheDocument();
    const tokenPricingLine = screen.getByText("输入 $30.00/1M").closest("div");
    expect(tokenPricingLine).toHaveTextContent("Token 定价：");
    expect(tokenPricingLine).not.toHaveTextContent("Token Pricing:");
    expect(screen.getByText("输入 $30.00/1M")).toBeInTheDocument();
    expect(screen.getByText("输出 $40.00/1M")).toBeInTheDocument();

    expect(screen.queryByText("Total/Request")).not.toBeInTheDocument();
    expect(screen.queryByText("Input Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Output Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Total (100 req)")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Input")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Output")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Margin Fee")).not.toBeInTheDocument();
    expect(screen.queryByText("Token Pricing:")).not.toBeInTheDocument();
    expect(screen.queryByText("Input $30.00/1M")).not.toBeInTheDocument();
    expect(screen.queryByText("Output $40.00/1M")).not.toBeInTheDocument();
  });

  it("renders the Chinese updating label inside an open breakdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MultiCostResults multiResult={makeMultiResult(makeCostResponse(), TOTALS, true)} timePeriod="day" />,
    );

    await user.click(screen.getByRole("button", { name: "显示 gpt-4 的成本明细" }));

    expect(screen.getByText("正在更新...")).toBeInTheDocument();
    expect(screen.queryByText("Updating...")).not.toBeInTheDocument();
  });

  it("renders the Chinese warning when a model has no pricing data", () => {
    renderWithProviders(
      <MultiCostResults multiResult={makeMultiResult(makeCostResponse({ cost_per_request: 0 }))} timePeriod="month" />,
    );

    expect(screen.getByText("⚠️ 未找到该模型的定价数据。请在配置中设置 base_model。")).toBeInTheDocument();
    expect(
      screen.queryByText("⚠️ No pricing data found for this model. Set base_model in config."),
    ).not.toBeInTheDocument();
  });
});
