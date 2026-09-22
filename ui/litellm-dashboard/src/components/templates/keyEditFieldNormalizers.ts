import type { TFunction } from "i18next";

const WORD_FORM_BUDGET_DURATIONS: Record<string, string> = {
  hourly: "1h",
  daily: "24h",
  weekly: "7d",
  monthly: "30d",
};

// Normalize any legacy word-form budget duration to the canonical value the dropdown uses
export const canonicalBudgetDuration = (duration: string | null | undefined): string | null =>
  duration ? WORD_FORM_BUDGET_DURATIONS[duration] ?? duration : null;

// Determine the key_type display value from allowed_routes
export const keyTypeFromRoutes = (allowedRoutes: string[] | null | undefined): string => {
  if (!allowedRoutes || allowedRoutes.length === 0) return "default";
  if (allowedRoutes.includes("llm_api_routes")) return "llm_api";
  if (allowedRoutes.includes("management_routes")) return "management";
  if (allowedRoutes.includes("info_routes")) return "read_only";
  return "default";
};

export const parseAllowedRoutes = (value: unknown): string[] =>
  typeof value === "string" && value.trim() !== ""
    ? value
        .split(",")
        .map((route) => route.trim())
        .filter((route) => route.length > 0)
    : [];

export const modelSentinelOptions = (
  keyTeamId: string | null | undefined,
  teamLoaded: boolean,
  t: TFunction<"templates">,
): { value: string; label: string }[] => {
  if (keyTeamId == null) return [{ value: "all-proxy-models", label: t("editControls.allProxyModels") }];
  return teamLoaded ? [{ value: "all-team-models", label: t("editControls.allTeamModels") }] : [];
};

export const currentValuePlaceholder = (
  premiumUser: boolean,
  current: unknown,
  hints: { readonly premium: string; readonly empty: string },
  t: TFunction<"templates">,
): string => {
  if (!premiumUser) return hints.premium;
  return Array.isArray(current) && current.length > 0
    ? t("editControls.currentValue", { values: current.join(", ") })
    : hints.empty;
};
