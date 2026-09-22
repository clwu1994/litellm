import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { BarChart } from "./bar_chart";
import { ValueTooltip, type ChartTooltipProps } from "./chart_tooltip";

const RAW_SERIES = "Cache hit";
const ZH_SERIES = "缓存命中请求";

const chartData = [{ date: "2026-03-01", [RAW_SERIES]: 5 }];

const tooltipPayload = (item: { dataKey: string; name?: string }): NonNullable<ChartTooltipProps["payload"]>[number] =>
  ({
    ...item,
    value: 5,
    color: "#14b8a6",
    payload: chartData[0],
  }) as NonNullable<ChartTooltipProps["payload"]>[number];

describe("BarChart Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state and hides the English original", () => {
    renderWithProviders(<BarChart data={[]} index="date" categories={["passed"]} />);

    expect(screen.getByText("无数据")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });

  it("renders the translated legend label instead of the raw category when categoryLabels is given", () => {
    renderWithProviders(
      <BarChart data={chartData} index="date" categories={[RAW_SERIES]} categoryLabels={{ [RAW_SERIES]: ZH_SERIES }} />,
    );

    expect(screen.getByText(ZH_SERIES)).toBeInTheDocument();
    expect(screen.queryByText(RAW_SERIES)).not.toBeInTheDocument();
  });

  it("keeps the raw category as the legend label when categoryLabels is omitted", () => {
    renderWithProviders(<BarChart data={chartData} index="date" categories={[RAW_SERIES]} />);

    expect(screen.getByText(RAW_SERIES)).toBeInTheDocument();
  });

  it("renders the translated series label in the default tooltip", () => {
    renderWithProviders(
      <ValueTooltip
        active
        payload={[tooltipPayload({ dataKey: RAW_SERIES, name: RAW_SERIES })]}
        label="2026-03-01"
        categoryLabels={{ [RAW_SERIES]: ZH_SERIES }}
      />,
    );

    expect(screen.getByText(ZH_SERIES)).toBeInTheDocument();
    expect(screen.queryByText(RAW_SERIES)).not.toBeInTheDocument();
  });

  it("maps the tooltip series label through dataKey when the payload carries no name", () => {
    renderWithProviders(
      <ValueTooltip
        active
        payload={[tooltipPayload({ dataKey: RAW_SERIES })]}
        label="2026-03-01"
        categoryLabels={{ [RAW_SERIES]: ZH_SERIES }}
      />,
    );

    expect(screen.getByText(ZH_SERIES)).toBeInTheDocument();
    expect(screen.queryByText(RAW_SERIES)).not.toBeInTheDocument();
  });
});
