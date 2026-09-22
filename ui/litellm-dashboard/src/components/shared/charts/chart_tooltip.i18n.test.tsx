import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { CustomTooltip, type ChartTooltipProps } from "./chart_tooltip";

const payload = (dataKey: string): NonNullable<ChartTooltipProps["payload"]>[number] =>
  ({
    dataKey,
    value: 1000,
    color: "#3b82f6",
    payload: { date: "2026-01-15", metrics: { total_tokens: 1000 } },
  }) as NonNullable<ChartTooltipProps["payload"]>[number];

describe("CustomTooltip Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese not-available marker and hides the English original", () => {
    renderWithProviders(<CustomTooltip active={true} payload={[payload("metrics.nonexistent")]} label="2026-01-15" />);

    expect(screen.getByText("不适用")).toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });
});
