import type { ParseKeys, TFunction } from "i18next";

import type { ClassificationRubric, ComplexityTierLabels, ComplexityTiers } from "./ComplexityRouterConfig";

export const CLASSIFICATION_RUBRIC_DESCRIPTIONS: Record<
  ClassificationRubric,
  { labelKey: ParseKeys<"models">; descriptionKey: ParseKeys<"models"> }
> = {
  legacy: {
    labelKey: "autoRouterConfig.complexity.rubric.legacy.label",
    descriptionKey: "autoRouterConfig.complexity.rubric.legacy.description",
  },
  agentic: {
    labelKey: "autoRouterConfig.complexity.rubric.agentic.label",
    descriptionKey: "autoRouterConfig.complexity.rubric.agentic.description",
  },
  chat: {
    labelKey: "autoRouterConfig.complexity.rubric.chat.label",
    descriptionKey: "autoRouterConfig.complexity.rubric.chat.description",
  },
  business: {
    labelKey: "autoRouterConfig.complexity.rubric.business.label",
    descriptionKey: "autoRouterConfig.complexity.rubric.business.description",
  },
};

export const CLASSIFICATION_RUBRIC_KEYS = Object.keys(CLASSIFICATION_RUBRIC_DESCRIPTIONS) as ClassificationRubric[];

export const TIER_DESCRIPTIONS: Record<
  keyof ComplexityTiers,
  { labelKey: ParseKeys<"models">; descriptionKey: ParseKeys<"models">; examples: string }
> = {
  NON_REASONING: {
    labelKey: "autoRouterConfig.complexity.tier.NON_REASONING.label",
    descriptionKey: "autoRouterConfig.complexity.tier.NON_REASONING.description",
    examples: '"Reformat this tool output", "Acknowledge the write succeeded"',
  },
  SIMPLE: {
    labelKey: "autoRouterConfig.complexity.tier.SIMPLE.label",
    descriptionKey: "autoRouterConfig.complexity.tier.SIMPLE.description",
    examples: '"Hello!", "What is Python?", "Thanks!"',
  },
  MEDIUM: {
    labelKey: "autoRouterConfig.complexity.tier.MEDIUM.label",
    descriptionKey: "autoRouterConfig.complexity.tier.MEDIUM.description",
    examples: '"Explain how REST APIs work", "Debug this error"',
  },
  COMPLEX: {
    labelKey: "autoRouterConfig.complexity.tier.COMPLEX.label",
    descriptionKey: "autoRouterConfig.complexity.tier.COMPLEX.description",
    examples: '"Design a microservices architecture", "Implement a rate limiter"',
  },
  REASONING: {
    labelKey: "autoRouterConfig.complexity.tier.REASONING.label",
    descriptionKey: "autoRouterConfig.complexity.tier.REASONING.description",
    examples: '"Think step by step...", "Analyze the pros and cons..."',
  },
};

export const TIER_KEYS = Object.keys(TIER_DESCRIPTIONS) as Array<keyof ComplexityTiers>;

export const effectiveTierLabel = (
  tier: keyof ComplexityTiers,
  tierLabels: ComplexityTierLabels | undefined,
  t: TFunction<"models">,
): string => tierLabels?.[tier]?.trim() || t(TIER_DESCRIPTIONS[tier].labelKey);
