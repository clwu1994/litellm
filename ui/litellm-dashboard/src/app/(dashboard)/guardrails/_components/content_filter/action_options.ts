import type { ParseKeys, TFunction } from "i18next";

export const ACTION_ITEMS = [
  { value: "BLOCK", labelKey: "contentFilter.action.block", badgeKey: "contentFilter.actionBadge.block" },
  { value: "MASK", labelKey: "contentFilter.action.mask", badgeKey: "contentFilter.actionBadge.mask" },
] as const satisfies ReadonlyArray<{
  value: "BLOCK" | "MASK";
  labelKey: ParseKeys<"guardrails">;
  badgeKey: ParseKeys<"guardrails">;
}>;

export const SEVERITY_ITEMS = [
  { value: "high", labelKey: "contentFilter.severity.high", badgeKey: "contentFilter.severityBadge.high" },
  { value: "medium", labelKey: "contentFilter.severity.medium", badgeKey: "contentFilter.severityBadge.medium" },
  { value: "low", labelKey: "contentFilter.severity.low", badgeKey: "contentFilter.severityBadge.low" },
] as const satisfies ReadonlyArray<{
  value: "high" | "medium" | "low";
  labelKey: ParseKeys<"guardrails">;
  badgeKey: ParseKeys<"guardrails">;
}>;

export const actionItems = (t: TFunction<"guardrails">) =>
  ACTION_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) }));

export const severityItems = (t: TFunction<"guardrails">) =>
  SEVERITY_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) }));

export const actionBadgeLabel = (value: string, t: TFunction<"guardrails">): string => {
  const item = ACTION_ITEMS.find((entry) => entry.value === value);
  return item === undefined ? value : t(item.badgeKey);
};

export const severityBadgeLabel = (value: string, t: TFunction<"guardrails">): string => {
  const item = SEVERITY_ITEMS.find((entry) => entry.value === value);
  return item === undefined ? value : t(item.badgeKey);
};
