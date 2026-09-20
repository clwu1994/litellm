import type { ParseKeys, TFunction } from "i18next";

import type { components } from "@/lib/http/schema";

export type AutoRouterBenchmarksResponse = components["schemas"]["AutoRouterBenchmarksResponse"];
export type AutoRouterBenchmarkTotals = components["schemas"]["AutoRouterBenchmarkTotals"];
export type AutoRouterBenchmarkGroup = components["schemas"]["AutoRouterBenchmarkGroup"];
export type AutoRouterCacheStats = components["schemas"]["AutoRouterCacheStats"];

export const ALL_ROUTERS = "__all__";

export const ALL_ROUTERS_LABEL_KEY: ParseKeys<"costTracking"> = "benchmarks.allRouters";

export interface BenchmarkView {
  label: string;
  labelKey?: ParseKeys<"costTracking">;
  stats: AutoRouterBenchmarkTotals | AutoRouterBenchmarkGroup;
}

export const viewLabel = (view: BenchmarkView, t: TFunction<"costTracking">): string =>
  view.labelKey ? t(view.labelKey) : view.label;

export const viewGroup = (view: BenchmarkView): AutoRouterBenchmarkGroup | null =>
  "router_name" in view.stats ? view.stats : null;

export const groupKey = (group: AutoRouterBenchmarkGroup): string => `${group.router_name} ${group.router_type}`;

export const groupLabel = (group: AutoRouterBenchmarkGroup, groups: readonly AutoRouterBenchmarkGroup[]): string => {
  const duplicated = groups.some((g) => g !== group && g.router_name === group.router_name);
  return duplicated ? `${group.router_name} (${group.router_type})` : group.router_name;
};

export const viewFor = (data: AutoRouterBenchmarksResponse, selectedKey: string): BenchmarkView => {
  const group = data.groups.find((g) => groupKey(g) === selectedKey);
  if (selectedKey === ALL_ROUTERS || !group) {
    return { label: "", labelKey: ALL_ROUTERS_LABEL_KEY, stats: data.totals };
  }
  return { label: groupLabel(group, data.groups), stats: group };
};

export interface BucketRow {
  key: "same_model" | "first_visit" | "return_to_tier";
  labelKey: ParseKeys<"costTracking">;
  sublabelKey: ParseKeys<"costTracking">;
  turns: number;
  sharePct: number;
  hitRatePct: number;
  fill: string;
}

export const bucketTurnsTotal = (cache: AutoRouterCacheStats): number =>
  cache.same_model.turns + cache.first_visit.turns + cache.return_to_tier.turns;

const sharePctOf = (turns: number, total: number): number => (total > 0 ? Math.round((100 * turns) / total) : 0);

export const bucketRows = (cache: AutoRouterCacheStats): BucketRow[] => {
  const total = bucketTurnsTotal(cache);
  return [
    {
      key: "same_model",
      labelKey: "benchmarks.buckets.sameModel",
      sublabelKey: "benchmarks.buckets.sameModelHint",
      turns: cache.same_model.turns,
      sharePct: sharePctOf(cache.same_model.turns, total),
      hitRatePct: cache.same_model.hit_rate_pct,
      fill: "bg-foreground",
    },
    {
      key: "first_visit",
      labelKey: "benchmarks.buckets.firstVisit",
      sublabelKey: "benchmarks.buckets.firstVisitHint",
      turns: cache.first_visit.turns,
      sharePct: sharePctOf(cache.first_visit.turns, total),
      hitRatePct: cache.first_visit.hit_rate_pct,
      fill: "bg-foreground/30",
    },
    {
      key: "return_to_tier",
      labelKey: "benchmarks.buckets.returnToTier",
      sublabelKey: "benchmarks.buckets.returnToTierHint",
      turns: cache.return_to_tier.turns,
      sharePct: sharePctOf(cache.return_to_tier.turns, total),
      hitRatePct: cache.return_to_tier.hit_rate_pct,
      fill: "bg-foreground/60",
    },
  ];
};

export const expiredMissShare = (cache: AutoRouterCacheStats): number | null => {
  const total = bucketTurnsTotal(cache);
  if (total <= 0) return null;
  return (100 * cache.return_misses_expired) / total;
};

export const pctLabel = (value: number, digits: number = 1): string => `${value.toFixed(digits)}%`;

export interface DurationLabel {
  unitKey: ParseKeys<"costTracking">;
  value: string;
}

export const durationParts = (seconds: number): DurationLabel => {
  if (seconds < 60) return { unitKey: "benchmarks.duration.seconds", value: String(Math.round(seconds)) };
  if (seconds < 3600) return { unitKey: "benchmarks.duration.minutes", value: (seconds / 60).toFixed(1) };
  return { unitKey: "benchmarks.duration.hours", value: (seconds / 3600).toFixed(1) };
};
