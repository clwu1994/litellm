import type { ParseKeys } from "i18next";

import { formatNumberWithCommas } from "@/utils/dataUtils";

export interface SummaryTile {
  titleKey: ParseKeys<"usage">;
  value: string;
  className?: string;
  tooltipKey?: ParseKeys<"usage">;
  expandable?: boolean;
}

interface SpendSummaryMetadata {
  total_spend: number;
  total_flat_cost?: number;
  total_api_requests: number;
  total_successful_requests: number;
  total_failed_requests: number;
  total_tokens: number;
}

export const TOTAL_COST_TOOLTIP_KEY: ParseKeys<"usage"> = "entity.summary.tooltip.totalCost";

export const REQUEST_COST_TOOLTIP_KEY: ParseKeys<"usage"> = "entity.summary.tooltip.requestCost";

export const FLAT_COST_TOOLTIP_KEY: ParseKeys<"usage"> = "entity.summary.tooltip.flatCost";

export const hasFlatCost = (metadata: SpendSummaryMetadata): boolean => (metadata.total_flat_cost ?? 0) > 0;

export const buildSummaryTiles = (metadata: SpendSummaryMetadata, showFlatCost: boolean): SummaryTile[] => {
  const flatCost = metadata.total_flat_cost ?? 0;
  return [
    showFlatCost
      ? {
          titleKey: "entity.summary.totalCost",
          value: `$${formatNumberWithCommas(metadata.total_spend + flatCost, 2)}`,
          tooltipKey: TOTAL_COST_TOOLTIP_KEY,
          expandable: true,
        }
      : { titleKey: "entity.summary.totalSpend", value: `$${formatNumberWithCommas(metadata.total_spend, 2)}` },
    { titleKey: "entity.summary.totalRequests", value: metadata.total_api_requests.toLocaleString() },
    {
      titleKey: "entity.summary.successfulRequests",
      value: metadata.total_successful_requests.toLocaleString(),
      className: "text-success",
    },
    {
      titleKey: "entity.summary.failedRequests",
      value: metadata.total_failed_requests.toLocaleString(),
      className: "text-destructive",
    },
    { titleKey: "entity.summary.totalTokens", value: metadata.total_tokens.toLocaleString() },
  ];
};

export const buildCostBreakdownTiles = (metadata: SpendSummaryMetadata): SummaryTile[] => [
  {
    titleKey: "entity.summary.requestCost",
    value: `$${formatNumberWithCommas(metadata.total_spend, 2)}`,
    className: "text-info",
    tooltipKey: REQUEST_COST_TOOLTIP_KEY,
  },
  {
    titleKey: "entity.summary.flatCost",
    value: `$${formatNumberWithCommas(metadata.total_flat_cost ?? 0, 2)}`,
    className: "text-violet-600",
    tooltipKey: FLAT_COST_TOOLTIP_KEY,
  },
];
