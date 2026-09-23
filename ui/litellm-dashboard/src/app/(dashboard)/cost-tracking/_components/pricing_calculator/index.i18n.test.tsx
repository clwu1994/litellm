import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import PricingCalculator from "./index";
import type { ModelEntry, MultiModelResult } from "./types";

vi.mock("./use_multi_cost_estimate", () => ({
  useMultiCostEstimate: vi.fn(() => ({
    debouncedFetchForEntry: vi.fn(),
    removeEntry: vi.fn(),
    getMultiModelResult: vi.fn(
      (entries: ModelEntry[]): MultiModelResult => ({
        entries: entries.map((e) => ({ entry: e, result: null, loading: false, error: null })),
        totals: {
          cost_per_request: 0,
          daily_cost: null,
          monthly_cost: null,
          margin_per_request: 0,
          daily_margin: null,
          monthly_margin: null,
        },
      }),
    ),
  })),
}));

const DEFAULT_PROPS = {
  accessToken: "test-token",
  models: ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"],
};

describe("PricingCalculator Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese period toggle, column headers, actions and placeholders", () => {
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

    expect(screen.getByText("每天")).toBeInTheDocument();
    expect(screen.getByText("每月")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "模型" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "输入 Token" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "输出 Token" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "请求数/月" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除第 1 行模型" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加另一个模型" })).toBeInTheDocument();

    expect(screen.queryByText("Per Day")).not.toBeInTheDocument();
    expect(screen.queryByText("Per Month")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Model" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Input Tokens" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Output Tokens" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Requests/Month" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove model row 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Another Model" })).not.toBeInTheDocument();
  });

  it("renders the Chinese daily requests header and row action after switching the period", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingCalculator {...DEFAULT_PROPS} />);

    await user.click(screen.getByText("每天"));

    expect(screen.getByRole("columnheader", { name: "请求数/天" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Requests/Day" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加另一个模型" }));

    expect(screen.getByRole("button", { name: "移除第 2 行模型" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove model row 2" })).not.toBeInTheDocument();
  });
});
