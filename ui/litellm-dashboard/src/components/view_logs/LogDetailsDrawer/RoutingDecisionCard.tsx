"use client";

import { Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

export interface RoutingDecisionTierBoundaries {
  simple_medium?: number;
  medium_complex?: number;
  complex_reasoning?: number;
}

export interface RoutingDecision {
  router_model_name?: string;
  router_type?: string;
  routed_model?: string;
  cause?: string;
  tier?: string;
  tier_label?: string;
  request_type?: string;
  score?: number;
  signals?: string[];
  matched_keyword?: string;
  escalation_keyword?: string;
  classifier_model?: string;
  escalated?: boolean;
  tier_boundaries?: RoutingDecisionTierBoundaries;
  reasoning_override_min_score?: number;
}

type RouterTypeKey =
  | "detail.routing.routerType.complexity"
  | "detail.routing.routerType.adaptive"
  | "detail.routing.routerType.quality";

const ROUTER_TYPE_LABEL_KEYS: Record<string, RouterTypeKey | undefined> = {
  complexity: "detail.routing.routerType.complexity",
  adaptive: "detail.routing.routerType.adaptive",
  quality: "detail.routing.routerType.quality",
};

/**
 * The tier the score alone would have produced, given the boundaries in effect when
 * the decision was made. Rendered as the bracket that explains a score, so it must
 * use the snapshot rather than today's config.
 */
function describeScoreAgainstBoundaries(
  score: number,
  boundaries: RoutingDecisionTierBoundaries | undefined,
  renamed: boolean | undefined,
  t: TFunction<"logs">,
): string | null {
  if (!boundaries) return null;
  const {
    simple_medium: simpleMedium,
    medium_complex: mediumComplex,
    complex_reasoning: complexReasoning,
  } = boundaries;
  if (simpleMedium === undefined || mediumComplex === undefined || complexReasoning === undefined) return null;

  const named = (range: string, tier: string): string =>
    renamed ? range : t("detail.routing.scoreBand.withTier", { range, tier });
  if (score < simpleMedium) return named(t("detail.routing.scoreBand.below", { boundary: simpleMedium }), "SIMPLE");
  if (score < mediumComplex) {
    return named(t("detail.routing.scoreBand.between", { low: simpleMedium, high: mediumComplex }), "MEDIUM");
  }
  if (score < complexReasoning) {
    return named(t("detail.routing.scoreBand.between", { low: mediumComplex, high: complexReasoning }), "COMPLEX");
  }
  return named(t("detail.routing.scoreBand.atOrAbove", { boundary: complexReasoning }), "REASONING");
}

function describePlanModeFloor(matchedKeyword: string | undefined, t: TFunction<"logs">): string {
  if (matchedKeyword === "exit_plan_mode") return t("detail.routing.planModeFloorTool", { tool: matchedKeyword });
  if (matchedKeyword) return t("detail.routing.planModeFloorKeyword", { keyword: matchedKeyword });
  return t("detail.routing.planModeFloor");
}

/**
 * The sentinel is the whole reason this row is worth reading: it is the string an operator
 * would add to housekeeping_patterns to cover another client, so naming it turns the row into
 * the instruction. Without it the drawer says only that the classifier was skipped.
 */
function describeHousekeeping(matchedKeyword: string | undefined, t: TFunction<"logs">): string {
  if (matchedKeyword) return t("detail.routing.housekeepingKeyword", { keyword: matchedKeyword });
  return t("detail.routing.housekeeping");
}

/** Rows logged before the floor was recorded name what it tracked back then instead of a number. */
function describeReasoningOverride(
  tierLabel: string | undefined,
  floor: number | undefined,
  t: TFunction<"logs">,
): string {
  const stated = floor === undefined ? t("detail.routing.reasoningOverrideBoundary") : String(floor);
  return t("detail.routing.reasoningOverride", { tier: tierLabel ?? "REASONING", floor: stated });
}

type RoutingCauseKey =
  | "detail.routing.cause.heuristicScorer"
  | "detail.routing.cause.heuristicV2"
  | "detail.routing.cause.heuristicFirstShortCircuit"
  | "detail.routing.cause.hybridShortCircuit"
  | "detail.routing.cause.classifierPlugin"
  | "detail.routing.cause.semanticKeywordMatch"
  | "detail.routing.cause.sessionAffinityPin"
  | "detail.routing.cause.sessionAffinityEscalation"
  | "detail.routing.cause.userTurnContinuation"
  | "detail.routing.cause.modalityEscalation"
  | "detail.routing.cause.modalityPinOverride"
  | "detail.routing.cause.qualityTier"
  | "detail.routing.cause.bandit"
  | "detail.routing.cause.defaultFallback"
  | "detail.routing.cause.classifierFallback"
  | "detail.routing.cause.defaultModelFallback";

const CONSTANT_CAUSE_LABEL_KEYS: Record<string, RoutingCauseKey | undefined> = {
  heuristic_scorer: "detail.routing.cause.heuristicScorer",
  heuristic_v2: "detail.routing.cause.heuristicV2",
  heuristic_first_short_circuit: "detail.routing.cause.heuristicFirstShortCircuit",
  hybrid_short_circuit: "detail.routing.cause.hybridShortCircuit",
  classifier_plugin: "detail.routing.cause.classifierPlugin",
  semantic_keyword_match: "detail.routing.cause.semanticKeywordMatch",
  session_affinity_pin: "detail.routing.cause.sessionAffinityPin",
  session_affinity_escalation: "detail.routing.cause.sessionAffinityEscalation",
  user_turn_continuation: "detail.routing.cause.userTurnContinuation",
  modality_escalation: "detail.routing.cause.modalityEscalation",
  modality_pin_override: "detail.routing.cause.modalityPinOverride",
  quality_tier: "detail.routing.cause.qualityTier",
  bandit: "detail.routing.cause.bandit",
  default_fallback: "detail.routing.cause.defaultFallback",
  classifier_fallback: "detail.routing.cause.classifierFallback",
  default_model_fallback: "detail.routing.cause.defaultModelFallback",
};

function describeCause(decision: RoutingDecision, t: TFunction<"logs">): string {
  const {
    cause,
    classifier_model: classifierModel,
    matched_keyword: matchedKeyword,
    tier_label: tierLabel,
    reasoning_override_min_score: overrideFloor,
  } = decision;

  const constant = cause ? CONSTANT_CAUSE_LABEL_KEYS[cause] : undefined;
  if (constant) return t(constant);

  switch (cause) {
    case "reasoning_override":
      return describeReasoningOverride(tierLabel, overrideFloor, t);
    case "llm_classifier":
      return classifierModel
        ? t("detail.routing.llmClassifierWithModel", { model: classifierModel })
        : t("detail.routing.llmClassifier");
    case "literal_keyword_match":
    case "keyword":
      return matchedKeyword
        ? t("detail.routing.keywordMatchWithKeyword", { keyword: matchedKeyword })
        : t("detail.routing.keywordMatch");
    case "plan_mode":
      return describePlanModeFloor(matchedKeyword, t);
    case "housekeeping":
      return describeHousekeeping(matchedKeyword, t);
    default:
      return cause ?? "Unknown";
  }
}

/**
 * A request can ask to escalate and get nowhere, when its tier is already the highest
 * one configured. That row still has to say the caller asked, otherwise it reads as an
 * ordinary route; it just must not claim a bump that did not happen. Only called when
 * the request escalated or asked to, so there is no "did not escalate" case.
 */
function describeEscalation(escalated: boolean, keyword: string | undefined, t: TFunction<"logs">): string {
  if (escalated) {
    return keyword ? t("detail.routing.escalatedWithKeyword", { keyword }) : t("detail.routing.escalated");
  }
  return keyword
    ? t("detail.routing.escalationRequestedWithKeyword", { keyword })
    : t("detail.routing.escalationRequested");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function RoutingDecisionCard({
  decision,
  className,
}: {
  decision?: RoutingDecision | null;
  className?: string;
}) {
  const { t } = useTranslation("logs");

  if (!decision || !decision.cause) return null;

  const {
    router_model_name: routerModelName,
    router_type: routerType,
    routed_model: routedModel,
    tier,
    tier_label: tierLabel,
    request_type: requestType,
    score,
    signals,
    escalated,
    escalation_keyword: escalationKeyword,
    tier_boundaries: tierBoundaries,
  } = decision;

  // On an override row the score did not decide the tier, so showing it against a
  // boundary would claim something untrue. Keyed off the cause rather than a marker
  // inside `signals`, which redaction can remove.
  const scoreExplanation =
    score !== undefined && decision.cause !== "reasoning_override" && decision.cause !== "plan_mode"
      ? describeScoreAgainstBoundaries(score, tierBoundaries, tierLabel !== undefined, t)
      : null;

  const routerTypeKey = routerType ? ROUTER_TYPE_LABEL_KEYS[routerType] : undefined;
  const routerTypeLabel = routerTypeKey ? t(routerTypeKey) : routerType;

  return (
    <div className={cn("mb-6 w-full max-w-full overflow-hidden rounded-lg bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-2.5 text-sm font-medium">{t("detail.routing.title")}</div>
      <div className="px-4 py-3">
        {routerModelName && (
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Waypoints size={14} aria-hidden />
            <span>{routerModelName}</span>
            {routerType && <span className="font-normal text-muted-foreground">({routerTypeLabel})</span>}
          </div>
        )}

        {tier && (
          <Row label={t("detail.routing.row.tier")}>
            <Badge variant="secondary" className="font-normal">
              {tierLabel ?? tier}
            </Badge>
          </Row>
        )}

        {requestType && <Row label={t("detail.routing.row.requestType")}>{requestType}</Row>}

        <Row label={t("detail.routing.row.decidedBy")}>{describeCause(decision, t)}</Row>

        {score !== undefined && (
          <Row label={t("detail.routing.row.score")}>
            <span className="tabular-nums">{score.toFixed(2)}</span>
            {scoreExplanation && <span className="ml-2 text-muted-foreground">({scoreExplanation})</span>}
          </Row>
        )}

        {routedModel && <Row label={t("detail.routing.row.routedTo")}>{routedModel}</Row>}

        {escalated !== undefined && (
          <Row label={t("detail.routing.row.escalated")}>{describeEscalation(escalated, escalationKeyword, t)}</Row>
        )}

        {signals && signals.length > 0 && (
          <Row label={t("detail.routing.row.signals")}>
            <span className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <Badge key={signal} variant="outline" className="font-normal">
                  {signal}
                </Badge>
              ))}
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}

export default RoutingDecisionCard;
