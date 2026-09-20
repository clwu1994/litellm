import { describe, expect, it } from "vitest";

import { resources } from "@/i18n/resources";

import {
  buildCostBreakdownTiles,
  buildSummaryTiles,
  FLAT_COST_TOOLTIP_KEY,
  hasFlatCost,
  REQUEST_COST_TOOLTIP_KEY,
  TOTAL_COST_TOOLTIP_KEY,
} from "./entityUsageSummary";

const metadata = {
  total_spend: 100,
  total_flat_cost: 40,
  total_api_requests: 12,
  total_successful_requests: 10,
  total_failed_requests: 2,
  total_tokens: 3456,
};

describe("hasFlatCost", () => {
  it("is false when there is no flat cost to report", () => {
    expect(hasFlatCost({ ...metadata, total_flat_cost: 0 })).toBe(false);
    const { total_flat_cost, ...noFlat } = metadata;
    expect(hasFlatCost(noFlat)).toBe(false);
  });

  it("is true once a flat cost has accrued", () => {
    expect(hasFlatCost(metadata)).toBe(true);
  });
});

describe("buildSummaryTiles", () => {
  it("keeps the row at five tiles either way so adding flat cost never narrows the cards", () => {
    expect(buildSummaryTiles(metadata, false)).toHaveLength(5);
    expect(buildSummaryTiles(metadata, true)).toHaveLength(5);
  });

  it("shows request-only spend under the original title when there is no flat cost", () => {
    const [first] = buildSummaryTiles(metadata, false);
    expect(first.titleKey).toBe("entity.summary.totalSpend");
    expect(first.value).toBe("$100.00");
    expect(first.expandable).toBeUndefined();
  });

  it("rolls flat cost into a single expandable Total Cost tile", () => {
    const [first] = buildSummaryTiles(metadata, true);
    expect(first.titleKey).toBe("entity.summary.totalCost");
    expect(first.value).toBe("$140.00");
    expect(first.expandable).toBe(true);
    expect(first.tooltipKey).toBe(TOTAL_COST_TOOLTIP_KEY);
  });

  it("never renders the breakdown titles in the top row", () => {
    const titleKeys = buildSummaryTiles(metadata, true).map((t) => t.titleKey);
    expect(titleKeys).not.toContain("entity.summary.flatCost");
    expect(titleKeys).not.toContain("entity.summary.requestCost");
  });

  it("treats a missing flat cost as zero", () => {
    const { total_flat_cost, ...noFlat } = metadata;
    expect(buildSummaryTiles(noFlat, true)[0].value).toBe("$100.00");
  });
});

describe("buildCostBreakdownTiles", () => {
  it("splits the total into request cost and flat cost", () => {
    const byTitleKey = Object.fromEntries(buildCostBreakdownTiles(metadata).map((t) => [t.titleKey, t.value]));
    expect(byTitleKey["entity.summary.requestCost"]).toBe("$100.00");
    expect(byTitleKey["entity.summary.flatCost"]).toBe("$40.00");
  });

  it("adds up to the Total Cost tile so the expanded view reconciles", () => {
    const parse = (v: string) => Number(v.replace(/[$,]/g, ""));
    const parts = buildCostBreakdownTiles(metadata).map((t) => parse(t.value));
    expect(parts[0] + parts[1]).toBe(parse(buildSummaryTiles(metadata, true)[0].value));
  });

  it("explains each part, including that flat cost is outside budgets", () => {
    const [requestCost, flatCost] = buildCostBreakdownTiles(metadata);
    expect(requestCost.tooltipKey).toBe(REQUEST_COST_TOOLTIP_KEY);
    expect(flatCost.tooltipKey).toBe(FLAT_COST_TOOLTIP_KEY);
    expect(resources.en.usage.entity.summary.tooltip.flatCost).toContain("budget");
  });

  it("treats a missing flat cost as zero", () => {
    const { total_flat_cost, ...noFlat } = metadata;
    const byTitleKey = Object.fromEntries(buildCostBreakdownTiles(noFlat).map((t) => [t.titleKey, t.value]));
    expect(byTitleKey["entity.summary.flatCost"]).toBe("$0.00");
  });
});
