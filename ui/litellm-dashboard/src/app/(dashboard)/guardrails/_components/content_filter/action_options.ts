import type { ParseKeys, TFunction } from "i18next";

export const ACTION_ITEMS = [
  { value: "BLOCK", labelKey: "contentFilter.action.block" },
  { value: "MASK", labelKey: "contentFilter.action.mask" },
] as const satisfies ReadonlyArray<{ value: "BLOCK" | "MASK"; labelKey: ParseKeys<"guardrails"> }>;

export const SEVERITY_ITEMS = [
  { value: "high", labelKey: "contentFilter.severity.high" },
  { value: "medium", labelKey: "contentFilter.severity.medium" },
  { value: "low", labelKey: "contentFilter.severity.low" },
] as const satisfies ReadonlyArray<{ value: "high" | "medium" | "low"; labelKey: ParseKeys<"guardrails"> }>;

export const actionItems = (t: TFunction<"guardrails">) =>
  ACTION_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) }));

export const severityItems = (t: TFunction<"guardrails">) =>
  SEVERITY_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) }));

export const actionLabel = (value: string, t: TFunction<"guardrails">): string => {
  const item = ACTION_ITEMS.find((entry) => entry.value === value);
  return item === undefined ? value : t(item.labelKey);
};

export const severityLabel = (value: string, t: TFunction<"guardrails">): string => {
  const item = SEVERITY_ITEMS.find((entry) => entry.value === value);
  return item === undefined ? value : t(item.labelKey);
};
