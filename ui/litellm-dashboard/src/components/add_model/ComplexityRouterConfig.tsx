import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { ChevronRight, Info, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";

import { AffinityControls } from "./AffinityControls";
import NonReasoningTierToggle from "./NonReasoningTierToggle";
import TierConfigIntro from "./TierConfigIntro";
import TierRowSelect from "./TierRowSelect";
import { ModalityRoutingControls } from "./ModalityRoutingControls";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
  type CustomTierSet,
  type TierRow,
  ALL_BUILT_IN_TIERS,
  TIER_ORDER,
  activeTierName,
  activeTierRows,
  getCustomTierRowsError,
  isBuiltInTierName,
  resolveComplexityDefaultModel,
} from "./tier_rows";
import { FallbackTierField, TierRowEditFields, TierRowHeader, TierSetToolbar } from "./ComplexityRouterConfigSections";
import React from "react";
import { ModelGroup } from "@/components/llm_calls/fetch_models";
import AdaptiveRoutingConfig from "./AdaptiveRoutingConfig";
import ClassificationMethodConfig from "./ClassificationMethodConfig";
import ContextWindowEscalationConfig from "./ContextWindowEscalationConfig";
import ResponseFormatControls from "./ResponseFormatControls";
import StallEscalationConfig from "./StallEscalationConfig";
import { Restricted, restrictedBy } from "./TierRestrictions";
import { type TierSetAction, applyTierSetAction, setFallbackTier } from "./tier_set_actions";
import {
  ReasoningEffort,
  TierModelParamsByTier,
  classifierEffortOptionsForModels,
  setTierModelReasoningEffort,
  tierEffortOptionsForModels,
  tierRowLabel,
} from "./complexity_router_tiers";
import TierModelEffortRows from "./TierModelEffortRows";
import EscalationKeywords from "./EscalationKeywords";
import KeywordTierRules, { KeywordTierRule } from "./KeywordTierRules";
import SemanticKeywordMatching from "./SemanticKeywordMatching";
import { type DimensionWeights, type TierBoundaries, type TokenThresholds } from "./heuristic_scoring_knobs";
import { TIER_DESCRIPTIONS } from "./complexity_router_metadata";

export {
  CLASSIFICATION_RUBRIC_DESCRIPTIONS,
  CLASSIFICATION_RUBRIC_KEYS,
  TIER_DESCRIPTIONS,
  TIER_KEYS,
  effectiveTierLabel,
} from "./complexity_router_metadata";
import { type CustomDimensionRow } from "./custom_dimensions";
import CompressionControls from "./CompressionControls";
import { type AutoRouterCompressionState, DEFAULT_AUTO_ROUTER_COMPRESSION } from "./buildAutoRouterCompression";

export type { DimensionWeights, TierBoundaries, TokenThresholds };
export type { CustomTierSet, TierRow } from "./tier_rows";

export const DEFAULT_CLASSIFIER_TIMEOUT_MS = 3000;
export const DEFAULT_TIER_DISTANCE_PENALTY = 0.5;
export const DEFAULT_CLASSIFIER_CONTEXT_WINDOW_SIZE = 3;
export const DEFAULT_CLASSIFIER_CONTEXT_BUDGET_CHARS = 8000;
export const MIN_QUOTED_CONTEXT_TURN_CHARS = 120;
export const DEFAULT_SESSION_AFFINITY = false;
export const DEFAULT_SESSION_AFFINITY_TTL_SECONDS = 3600;
export const DEFAULT_DEPLOYMENT_AFFINITY = true;

export type ClassificationMode = "every_request" | "user_turn";

export const DEFAULT_CLASSIFICATION_MODE: ClassificationMode = "every_request";

/**
 * One operator-facing choice over the two wire fields that share the router's tier-pin machinery:
 * session affinity pins every turn, user_turn pins every turn except a new human ask.
 */
export type ClassificationFrequency = ClassificationMode | "session";

/** NON_REASONING is optional: a router that never enabled it stores no such key. */
export type ComplexityTiers = {
  SIMPLE: string[];
  MEDIUM: string[];
  COMPLEX: string[];
  REASONING: string[];
  NON_REASONING?: string[];
};

export type ClassificationRubric = "legacy" | "agentic" | "chat" | "business";

/** What an unset preset means, matching the backend: the rubric as it shipped before calibration. */
export const DEFAULT_CLASSIFICATION_RUBRIC: ClassificationRubric = "legacy";

/**
 * Stamped on a classifier being switched on for the first time. There is no prior tier behaviour to
 * preserve at that moment, so a newly configured classifier gets the calibrated rubric while every
 * router already running an LLM classifier keeps the one it has.
 */
export const NEW_CLASSIFIER_CLASSIFICATION_RUBRIC: ClassificationRubric = "agentic";

export interface ClassifierLLMConfig {
  model: string;
  timeout_ms: number;
  circuit_breaker_enabled?: boolean;
  circuit_breaker_cooldown_seconds?: number;
  reasoning_effort?: ReasoningEffort;
  classification_rubric?: ClassificationRubric;
  system_prompt?: string;
}

export type ClassifierType = "heuristic" | "heuristic_v2" | "llm" | "heuristic_first" | "hybrid";

/**
 * Whether this router can call classifier_llm_config.model. Mirrors the backend's
 * ComplexityRouterConfig.uses_llm_classifier, and is the single gate for every classifier-only
 * control and payload key, so a new chaining type cannot strip knobs the operator set.
 */
export const usesLlmClassifier = (classifierType: ClassifierType): boolean =>
  classifierType === "llm" || classifierType === "heuristic_first" || classifierType === "hybrid";

export type ClassifierFallback = "heuristic" | "default_model";

export const DEFAULT_CLASSIFIER_FALLBACK: ClassifierFallback = "heuristic";

export interface AdaptiveRouterWeights {
  quality: number;
  cost: number;
}

export const DEFAULT_ADAPTIVE_WEIGHTS: AdaptiveRouterWeights = { quality: 0.3, cost: 0.7 };

export type HeuristicScoringRole = "decides" | "fallback_only" | "never";

/**
 * Whether the heuristic scorer runs on this router at all, which is what gates its knobs. An LLM
 * classifier still falls back to the scorer unless the fallback is the default model, so the gate cannot be
 * a plain classifier_type check. Under heuristic_first the scorer runs first on every request and
 * decides outright whenever it lands at or below the threshold.
 */
export const heuristicScoringRoleFor = (
  classifierType: ClassifierType,
  classifierFallback: ClassifierFallback | undefined,
): HeuristicScoringRole => {
  if (classifierType === "heuristic_v2") return "never";
  if (classifierType === "heuristic" || classifierType === "heuristic_first" || classifierType === "hybrid")
    return "decides";
  return (classifierFallback ?? DEFAULT_CLASSIFIER_FALLBACK) === "heuristic" ? "fallback_only" : "never";
};

export const heuristicScoringRole = (value: ComplexityRouterConfigValue): HeuristicScoringRole =>
  value.custom_tier_set ? "never" : heuristicScoringRoleFor(value.classifier_type, value.classifier_fallback);

// Derived, never written into the value, so undoing a tier edit reverts the form with nothing left behind.
export const effectiveClassifierType = (
  value: Pick<ComplexityRouterConfigValue, "custom_tier_set" | "classifier_type">,
): ClassifierType => (value.custom_tier_set ? "llm" : value.classifier_type);

const defaultModelPlaceholderFor = (
  derivedDefaultModel: string | undefined,
  isCustomSet: boolean,
): { key: ParseKeys<"models">; values?: { model: string } } => {
  if (derivedDefaultModel)
    return { key: "autoRouterConfig.complexity.defaultModel.derived", values: { model: derivedDefaultModel } };
  return {
    key: isCustomSet
      ? "autoRouterConfig.complexity.defaultModel.customSet"
      : "autoRouterConfig.complexity.defaultModel.builtIn",
  };
};

const builtInTierInfo = (
  rowId: string,
): { labelKey: ParseKeys<"models">; descriptionKey: ParseKeys<"models">; examples: string } | undefined => {
  const builtIn = ALL_BUILT_IN_TIERS.find((tier) => tier === rowId);
  return builtIn ? TIER_DESCRIPTIONS[builtIn] : undefined;
};

export type AdaptiveEligible = "all" | "classified_tier";

export type ComplexityTierLabels = Partial<Record<keyof ComplexityTiers, string>>;

export interface ComplexityRouterConfigValue {
  tiers: ComplexityTiers;
  /** Opt into the NON_REASONING tier below SIMPLE; off keeps the four-tier ladder. */
  enable_non_reasoning_tier?: boolean;
  custom_tier_set?: CustomTierSet;
  tier_labels?: ComplexityTierLabels;
  /** An explicit pin. Unset means the default tracks the tiers - see resolveComplexityDefaultModel. */
  default_model?: string;
  classifier_type: ClassifierType;
  classifier_llm_config?: ClassifierLLMConfig;
  classifier_context_window_size?: number;
  classifier_context_budget_chars?: number;
  classifier_context_per_turn_chars?: number;
  classifier_context_include_assistant_turns?: boolean;
  classifier_fallback?: ClassifierFallback;
  /** Classification instructions only; the router appends derived tier bullets after them. */
  classification_prompt?: string;
  /** Calibration examples only; the router places them after the derived tier bullets. */
  classification_examples?: string;
  /** Highest tier the scorer may decide alone under heuristic_first. Required by that type, rejected by the others. */
  heuristic_first_max_tier?: string;
  /** How near a tier boundary a score may land before hybrid defers to the classifier. Required by that type, rejected by the others. */
  hybrid_boundary_margin?: number;
  classification_mode?: ClassificationMode;
  session_affinity?: boolean;
  session_affinity_ttl_seconds?: number;
  modality_routing?: boolean;
  modality_pin_override?: boolean;
  deployment_affinity?: boolean;
  /** Plan-mode floor as a tier ROW ID, unset meaning off. The wire carries the row's name. */
  plan_mode_min_tier?: string;
  /**
   * Mid-task stall escalation. Undefined means off, which keeps all three keys out of the payload:
   * the backend rejects them alongside session pinning, user-turn classification and a custom tier
   * set, so an off router must stay silent about them rather than send an explicit false.
   */
  stall_escalation_enabled?: boolean;
  stall_escalation_window?: number;
  stall_escalation_repeat_threshold?: number;
  adaptive?: boolean;
  adaptive_weights?: AdaptiveRouterWeights;
  tier_distance_penalty?: number;
  adaptive_eligible?: AdaptiveEligible;
  return_raw_model_name?: boolean;
  /**
   * Context-window escalation gate. Undefined means untouched, which keeps both keys out of the
   * payload so the router tracks the backend defaults (enabled, 0.95 buffer); an explicit false
   * is a real opt-out and must survive the edit round-trip.
   */
  enable_context_window_escalation?: boolean;
  context_window_escalation_buffer?: number;
  /**
   * Heuristic scorer knobs. Undefined means the operator never touched them, which keeps the key out of the
   * payload so the router tracks the backend defaults rather than freezing today's numbers.
   */
  tier_boundaries?: TierBoundaries;
  token_thresholds?: TokenThresholds;
  dimension_weights?: DimensionWeights;
  /**
   * Operator-added scoring dimensions, each carrying its own inline weight. Undefined means the router has
   * none and keeps the key out of the payload; an empty array is a real "the last row was removed" state.
   */
  custom_dimensions?: CustomDimensionRow[];
  /**
   * Score floor the reasoning-marker override must clear. Undefined keeps the key out of the payload, so the
   * floor tracks tier_boundaries.simple_medium; an explicit 0 is a real floor that promotes on the markers alone.
   */
  reasoning_override_min_score?: number;
  /**
   * Per-(tier, model) litellm_params, serialized to the sibling tier_model_configs key. The full
   * params object is held, not just reasoning_effort, so keys authored in config.yaml survive an
   * edit round-trip.
   */
  tier_model_params?: TierModelParamsByTier;
}

/** Session affinity wins where a hand-authored config sets both, matching the backend's own `or`. */
export const classificationFrequency = (value: ComplexityRouterConfigValue): ClassificationFrequency => {
  if (!value.custom_tier_set && (value.session_affinity ?? DEFAULT_SESSION_AFFINITY)) return "session";
  return value.classification_mode === "user_turn" ? "user_turn" : "every_request";
};

export const withClassificationFrequency = (
  value: ComplexityRouterConfigValue,
  frequency: ClassificationFrequency,
): ComplexityRouterConfigValue => ({
  ...value,
  classification_mode: frequency === "user_turn" ? "user_turn" : "every_request",
  session_affinity: frequency === "session",
});

interface ComplexityRouterConfigProps {
  modelInfo: ModelGroup[];
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  /** Parent-owned: this component unmounts when its section collapses. */
  editingTiers?: boolean;
  onEditingTiersChange?: (editing: boolean) => void;
  customTechnicalKeywords?: string[];
  onCustomTechnicalKeywordsChange?: (keywords: string[]) => void;
  // Optional: the edit-auto-router modal doesn't yet support editing keyword tier
  // rules or semantic matching, so it renders this component without them.
  keywordTierRules?: KeywordTierRule[];
  onKeywordTierRulesChange?: (rules: KeywordTierRule[]) => void;
  /** getKeywordTierRulesError's verdict, owned by the caller: importing it here would be an import cycle. */
  keywordRulesError?: string | null;
  semanticMatchingEnabled?: boolean;
  onSemanticMatchingEnabledChange?: (enabled: boolean) => void;
  embeddingModel?: string;
  onEmbeddingModelChange?: (model: string) => void;
  matchThreshold?: number;
  onMatchThresholdChange?: (threshold: number) => void;
  escalationKeywords?: string[];
  onEscalationKeywordsChange?: (keywords: string[]) => void;
  // Optional: not part of complexity_router_config, since it applies to every
  // pre-routing strategy, not just the complexity router.
  autoRouterCompression?: AutoRouterCompressionState;
  onAutoRouterCompressionChange?: (state: AutoRouterCompressionState) => void;
  showValidationErrors?: boolean;
}

export const DEFAULT_HEURISTIC_FIRST_MAX_TIER = "SIMPLE";

/** What the Hybrid radio starts at. Required by that type, so the form always has a value to send. */
export const DEFAULT_HYBRID_BOUNDARY_MARGIN = 0.03;

/**
 * Tiers the heuristic_first threshold may name. The top tier is excluded because it would short
 * circuit every request and leave the classifier unreachable, which the backend rejects.
 */
export const HEURISTIC_FIRST_MAX_TIER_KEYS = TIER_ORDER.slice(0, -1);

const PlanModeOverrideControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  planModeTierOptions: { value: string; label: string }[];
}> = ({ value, onChange, planModeTierOptions }) => {
  const { t } = useTranslation("models");
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.plan_mode_min_tier !== undefined}
          disabled={planModeTierOptions.length === 0}
          onCheckedChange={(enabled) =>
            onChange({
              ...value,
              plan_mode_min_tier: enabled ? planModeTierOptions.at(-1)?.value : undefined,
            })
          }
          aria-label={t("autoRouterConfig.complexity.planMode.label")}
        />
        <strong className="font-semibold">{t("autoRouterConfig.complexity.planMode.label")}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {t("autoRouterConfig.complexity.planMode.help")}
        {planModeTierOptions.length === 0 && t("autoRouterConfig.complexity.planMode.helpEmpty")}
      </span>
      {value.plan_mode_min_tier !== undefined && (
        <div style={{ maxWidth: 320 }}>
          <TierRowSelect
            label={t("autoRouterConfig.complexity.planMode.selectLabel")}
            options={planModeTierOptions}
            value={value.plan_mode_min_tier ?? null}
            onValueChange={(tier) => onChange({ ...value, plan_mode_min_tier: tier })}
          />
        </div>
      )}
    </>
  );
};

const ComplexityRouterConfig: React.FC<ComplexityRouterConfigProps> = ({
  modelInfo,
  value,
  onChange,
  editingTiers = false,
  onEditingTiersChange,
  customTechnicalKeywords,
  onCustomTechnicalKeywordsChange,
  keywordTierRules = [],
  onKeywordTierRulesChange,
  keywordRulesError,
  semanticMatchingEnabled = false,
  onSemanticMatchingEnabledChange,
  embeddingModel,
  onEmbeddingModelChange = () => {},
  matchThreshold = 0.5,
  onMatchThresholdChange = () => {},
  escalationKeywords = [],
  onEscalationKeywordsChange,
  autoRouterCompression = DEFAULT_AUTO_ROUTER_COMPRESSION,
  onAutoRouterCompressionChange,
  showValidationErrors = false,
}) => {
  const { t } = useTranslation("models");
  const customTierSet = value.custom_tier_set;
  const tierRows = activeTierRows(value);
  const tierRowsError = customTierSet ? getCustomTierRowsError(customTierSet) : null;

  const planModeRows = tierRows.filter((row) => row.models.length > 0);
  const planModeTierOptions = planModeRows.map((row) => ({
    value: row.id,
    label: tierRowLabel(row, value.tier_labels, t),
  }));
  const derivedDefaultModel = resolveComplexityDefaultModel(value);
  const defaultModelPlaceholder = defaultModelPlaceholderFor(derivedDefaultModel, Boolean(customTierSet));
  const defaultModel = resolveComplexityDefaultModel(value, value.default_model);

  const dispatch = (action: TierSetAction) => {
    const next = applyTierSetAction(value, keywordTierRules, action);
    if (next.keywordTierRules !== keywordTierRules) onKeywordTierRulesChange?.([...next.keywordTierRules]);
    onChange(next.value);
  };

  const setRowModels = (row: TierRow, models: string[]) => dispatch({ kind: "models", id: row.id, models });
  const updateTierRow = (id: string, patch: Partial<Omit<TierRow, "id">>) => dispatch({ kind: "patch", id, patch });
  const addCustomTier = () => dispatch({ kind: "add" });
  const removeTierRow = (id: string) => dispatch({ kind: "remove", id });
  const exitToBuiltInTiers = () => dispatch({ kind: "restore" });

  const tierEffortOptionsByModel = tierEffortOptionsForModels(modelInfo);
  const classifierEffortOptionsByModel = classifierEffortOptionsForModels(modelInfo);

  // Embedding models can't serve a chat-completion role, so they're excluded here.
  const modelOptions = modelInfo
    .filter((model) => model.mode !== "embedding")
    .map((model) => ({
      value: model.model_group,
      label: model.model_group,
    }));

  const handleTierModelEffortChange = (tier: string, model: string, effort: ReasoningEffort | undefined) => {
    onChange({
      ...value,
      tier_model_params: setTierModelReasoningEffort(value.tier_model_params, tier, model, effort),
    });
  };

  // Clearing the select drops the key entirely rather than storing "", so an emptied pin reads as
  // "track the tiers" everywhere downstream instead of as a blank model name.
  const handleDefaultModelChange = (model: string | null | undefined) => {
    onChange({ ...value, default_model: model || undefined });
  };

  const handleTierLabelChange = (tier: keyof ComplexityTiers, label: string) => {
    onChange({
      ...value,
      tier_labels: { ...value.tier_labels, [tier]: label },
    });
  };

  return (
    <div className="w-full max-w-none">
      <div className="inline-flex items-center gap-2 mb-4">
        <h4 className="m-0 text-xl font-semibold text-foreground">{t("autoRouterConfig.complexity.heading")}</h4>
        <SimpleTooltip content={t("autoRouterConfig.complexity.headingTooltip")}>
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>

      <TierConfigIntro value={value} />

      <Card>
        <CardContent>
          {!customTierSet && (
            <NonReasoningTierToggle value={value} onChange={onChange} available={value.classifier_type === "llm"} />
          )}

          {tierRows.map((row, index) => {
            const tierInfo = builtInTierInfo(row.id);
            const label = tierRowLabel(row, value.tier_labels, t);
            const tierMissing = showValidationErrors && row.models.length === 0;
            const needsDefinition = Boolean(customTierSet) && !row.definition.trim() && !isBuiltInTierName(row.name);
            const definitionMissing = showValidationErrors && needsDefinition;
            const showsDisplayName = !customTierSet && !editingTiers;
            return (
              <div key={row.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="mb-4">
                  <TierRowHeader
                    row={row}
                    index={index}
                    rowCount={tierRows.length}
                    label={label}
                    description={tierInfo ? t(tierInfo.descriptionKey) : undefined}
                    editing={editingTiers}
                    isCustomSet={Boolean(customTierSet)}
                    onRemove={() => removeTierRow(row.id)}
                  />
                  {tierInfo && !customTierSet && (
                    <span className="block mb-2 text-xs text-muted-foreground">
                      {t("autoRouterConfig.complexity.examplesLabel")} {tierInfo.examples}
                    </span>
                  )}
                  {editingTiers && (
                    <TierRowEditFields
                      row={row}
                      index={index}
                      definitionMissing={definitionMissing}
                      onPatch={(patch) => updateTierRow(row.id, patch)}
                    />
                  )}
                  {showsDisplayName && tierInfo && (
                    <InputGroup className="mb-2">
                      <InputGroupInput
                        value={value.tier_labels?.[row.id as keyof ComplexityTiers] ?? ""}
                        onChange={(event) => handleTierLabelChange(row.id as keyof ComplexityTiers, event.target.value)}
                        placeholder={t("autoRouterConfig.complexity.displayName.placeholder", {
                          label: t(tierInfo.labelKey),
                        })}
                        aria-label={t("autoRouterConfig.complexity.displayName.aria", { label: t(tierInfo.labelKey) })}
                      />
                      {value.tier_labels?.[row.id as keyof ComplexityTiers] && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            aria-label={t("autoRouterConfig.complexity.displayName.clearAria", {
                              label: t(tierInfo.labelKey),
                            })}
                            onClick={() => handleTierLabelChange(row.id as keyof ComplexityTiers, "")}
                          >
                            <X />
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  )}
                  <MultiSelect
                    options={modelOptions}
                    value={row.models}
                    onValueChange={(models: string[]) => setRowModels(row, models)}
                    placeholder={t("autoRouterConfig.complexity.tierRow.modelPlaceholder", {
                      label: label.toLowerCase(),
                    })}
                    emptyText={t("autoRouterConfig.complexity.tierRow.noModelsFound")}
                    className={tierMissing ? "w-full border-destructive" : "w-full"}
                  />
                  <TierModelEffortRows
                    tierLabel={label}
                    models={row.models}
                    effortOptionsByModel={tierEffortOptionsByModel}
                    paramsByModel={row.params}
                    onEffortChange={(model, effort) => handleTierModelEffortChange(row.id, model, effort)}
                  />
                  {row.models.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {t("autoRouterConfig.complexity.tierRow.multipleModels")}
                    </span>
                  )}
                  {tierMissing && (
                    <span className="text-xs text-destructive">
                      {t("autoRouterConfig.complexity.tierRow.required", { label })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <TierSetToolbar
            editing={editingTiers}
            isCustomSet={Boolean(customTierSet)}
            rowCount={tierRows.length}
            rowsError={tierRowsError}
            keywordRulesError={keywordRulesError}
            onEditingChange={onEditingTiersChange}
            onAdd={addCustomTier}
            onRestore={exitToBuiltInTiers}
          />

          {customTierSet && (
            <FallbackTierField
              rows={tierRows}
              fallbackTierId={customTierSet.fallback_tier_id}
              onValueChange={(fallbackTierId) => onChange(setFallbackTier(value, fallbackTierId))}
            />
          )}

          <Separator className="my-4" />

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <strong className="text-base font-semibold">{t("autoRouterConfig.complexity.defaultModel.label")}</strong>
              <SimpleTooltip content={t("autoRouterConfig.complexity.defaultModel.tooltip")}>
                <Info className="size-4 text-muted-foreground" />
              </SimpleTooltip>
            </div>
            <SearchSelect
              options={modelOptions}
              value={value.default_model ?? ""}
              onValueChange={handleDefaultModelChange}
              placeholder={t(defaultModelPlaceholder.key, defaultModelPlaceholder.values)}
              emptyText={t("autoRouterConfig.complexity.tierRow.noModelsFound")}
              aria-label={t("autoRouterConfig.complexity.defaultModel.aria")}
            />
            <span className="block mt-1 text-xs text-muted-foreground">
              {t("autoRouterConfig.complexity.defaultModel.help")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <div className="rounded-lg border border-border bg-muted">
        {[
          {
            key: "classifier",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.classifier")}
              </strong>
            ),
            children: (
              <ClassificationMethodConfig
                value={value}
                onChange={onChange}
                modelOptions={modelOptions}
                effortOptionsByModel={classifierEffortOptionsByModel}
                customTechnicalKeywords={customTechnicalKeywords}
                onCustomTechnicalKeywordsChange={onCustomTechnicalKeywordsChange}
                showValidationErrors={showValidationErrors}
                defaultModel={defaultModel}
              />
            ),
          },
          {
            key: "adaptive",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.adaptive")}
              </strong>
            ),
            children: (
              <Restricted by={restrictedBy(value, "adaptive")}>
                <AdaptiveRoutingConfig value={value} onChange={onChange} />
              </Restricted>
            ),
          },
          {
            key: "affinity",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.affinity")}
              </strong>
            ),
            children: <AffinityControls value={value} onChange={onChange} />,
          },
          {
            key: "modality",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.modality")}
              </strong>
            ),
            children: <ModalityRoutingControls value={value} onChange={onChange} />,
          },
          {
            key: "plan-mode",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.planMode")}
              </strong>
            ),
            children: (
              <PlanModeOverrideControls value={value} onChange={onChange} planModeTierOptions={planModeTierOptions} />
            ),
          },
          {
            key: "context-window",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.contextWindow")}
              </strong>
            ),
            children: <ContextWindowEscalationConfig value={value} onChange={onChange} />,
          },
          {
            key: "stall-escalation",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.stallEscalation")}
              </strong>
            ),
            children: (
              <Restricted by={restrictedBy(value, "stallEscalation")}>
                <StallEscalationConfig value={value} onChange={onChange} />
              </Restricted>
            ),
          },
          {
            key: "response",
            label: (
              <strong className="text-foreground font-semibold">
                {t("autoRouterConfig.complexity.advanced.response")}
              </strong>
            ),
            children: <ResponseFormatControls value={value} onChange={onChange} />,
          },
          ...(onEscalationKeywordsChange
            ? [
                {
                  key: "escalation",
                  label: (
                    <strong className="text-foreground font-semibold">
                      {t("autoRouterConfig.complexity.advanced.escalation")}
                    </strong>
                  ),
                  children: (
                    <Restricted by={restrictedBy(value, "escalation")}>
                      <EscalationKeywords keywords={escalationKeywords} onChange={onEscalationKeywordsChange} />
                    </Restricted>
                  ),
                },
              ]
            : []),
          ...(onAutoRouterCompressionChange
            ? [
                {
                  key: "compression",
                  label: (
                    <strong className="text-foreground font-semibold">
                      {t("autoRouterConfig.complexity.advanced.compression")}
                    </strong>
                  ),
                  children: (
                    <CompressionControls value={autoRouterCompression} onChange={onAutoRouterCompressionChange} />
                  ),
                },
              ]
            : []),
          ...(onKeywordTierRulesChange || onSemanticMatchingEnabledChange
            ? [
                {
                  key: "keyword-semantic",
                  label: (
                    <strong className="text-foreground font-semibold">
                      {t("autoRouterConfig.complexity.advanced.keywordSemantic")}
                    </strong>
                  ),
                  children: (
                    <>
                      {onKeywordTierRulesChange && (
                        <KeywordTierRules
                          rules={keywordTierRules}
                          onChange={onKeywordTierRulesChange}
                          tierLabels={value.tier_labels}
                          tierNames={customTierSet && tierRows.map(activeTierName).filter(Boolean)}
                        />
                      )}
                      {onKeywordTierRulesChange && onSemanticMatchingEnabledChange && <Separator className="my-4" />}
                      {onSemanticMatchingEnabledChange && (
                        <SemanticKeywordMatching
                          enabled={semanticMatchingEnabled}
                          onEnabledChange={onSemanticMatchingEnabledChange}
                          embeddingModel={embeddingModel}
                          onEmbeddingModelChange={onEmbeddingModelChange}
                          matchThreshold={matchThreshold}
                          onMatchThresholdChange={onMatchThresholdChange}
                          modelInfo={modelInfo}
                          showValidationErrors={showValidationErrors}
                        />
                      )}
                    </>
                  ),
                },
              ]
            : []),
        ].map(({ key, label, children }) => (
          <Collapsible key={key} className="border-b border-border last:border-b-0">
            <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left">
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
              {label}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default ComplexityRouterConfig;
