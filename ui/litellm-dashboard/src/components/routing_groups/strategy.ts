import type { TFunction } from "i18next";

const STRATEGY_LABEL_KEYS = {
  "simple-shuffle": "routingGroups.strategies.simpleShuffle",
  "least-busy": "routingGroups.strategies.leastBusy",
  "usage-based-routing": "routingGroups.strategies.usageBased",
  "latency-based-routing": "routingGroups.strategies.latencyBased",
} as const;

export const formatStrategyLabel = (strategy: string, t: TFunction<"routerSettings">): string => {
  const key = STRATEGY_LABEL_KEYS[strategy as keyof typeof STRATEGY_LABEL_KEYS];
  return key === undefined ? strategy : t(key);
};
