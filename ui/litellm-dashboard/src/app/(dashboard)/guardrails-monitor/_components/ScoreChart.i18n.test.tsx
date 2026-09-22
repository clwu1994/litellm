import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ScoreChart } from "./ScoreChart";

describe("ScoreChart Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese chart title and empty state", () => {
    renderWithProviders(<ScoreChart />);

    expect(screen.getByText("请求结果随时间变化")).toBeInTheDocument();
    expect(screen.queryByText("Request Outcomes Over Time")).not.toBeInTheDocument();
    expect(screen.getByText("该时间段无图表数据")).toBeInTheDocument();
    expect(screen.queryByText("No chart data for this period")).not.toBeInTheDocument();
  });

  it("keeps the raw passed and blocked series names in English when the chart has data", () => {
    renderWithProviders(<ScoreChart data={[{ date: "2026-03-01", passed: 10, blocked: 2 }]} />);

    expect(screen.queryByText("该时间段无图表数据")).not.toBeInTheDocument();
    expect(screen.getByText("passed")).toBeInTheDocument();
    expect(screen.getByText("blocked")).toBeInTheDocument();
  });
});
