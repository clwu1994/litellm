import React, { useEffect, useId, useMemo, useState } from "react";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";

import { getMajorAirlines } from "@/components/networking";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { TagsInput } from "./TagsInput";
import { ThresholdInput } from "./ThresholdInput";

export interface MajorAirline {
  id: string;
  match: string;
  tags: string[];
}

export interface CompetitorIntentConfig {
  competitor_intent_type: "airline" | "generic";
  brand_self: string[];
  locations?: string[];
  competitors?: string[];
  policy?: {
    competitor_comparison?: "refuse" | "reframe";
    possible_competitor_comparison?: "refuse" | "reframe";
  };
  threshold_high?: number;
  threshold_medium?: number;
  threshold_low?: number;
}

interface CompetitorIntentConfigurationProps {
  enabled: boolean;
  config: CompetitorIntentConfig | null;
  onChange: (enabled: boolean, config: CompetitorIntentConfig | null) => void;
  accessToken?: string | null;
}

const DEFAULT_CONFIG: CompetitorIntentConfig = {
  competitor_intent_type: "airline",
  brand_self: [],
  locations: [],
  policy: {
    competitor_comparison: "refuse",
    possible_competitor_comparison: "reframe",
  },
  threshold_high: 0.7,
  threshold_medium: 0.45,
  threshold_low: 0.3,
};

const INTENT_TYPE_KEYS = [
  { value: "airline", labelKey: "contentFilter.competitorIntent.intentAirline" },
  { value: "generic", labelKey: "contentFilter.competitorIntent.intentGeneric" },
] as const satisfies ReadonlyArray<{ value: "airline" | "generic"; labelKey: ParseKeys<"guardrails"> }>;

const COMPETITOR_COMPARISON_POLICY_KEYS = [
  { value: "refuse", labelKey: "contentFilter.competitorIntent.policyRefuse" },
  { value: "reframe", labelKey: "contentFilter.competitorIntent.policyReframe" },
] as const satisfies ReadonlyArray<{ value: "refuse" | "reframe"; labelKey: ParseKeys<"guardrails"> }>;

const POSSIBLE_COMPETITOR_COMPARISON_POLICY_KEYS = [
  { value: "refuse", labelKey: "contentFilter.competitorIntent.policyRefuse" },
  { value: "reframe", labelKey: "contentFilter.competitorIntent.policyReframeBackend" },
] as const satisfies ReadonlyArray<{ value: "refuse" | "reframe"; labelKey: ParseKeys<"guardrails"> }>;

const THRESHOLDS = [
  {
    field: "threshold_high",
    labelKey: "contentFilter.competitorIntent.thresholdHigh",
    hint: "e.g. 0.7",
    fallback: 0.7,
  },
  {
    field: "threshold_medium",
    labelKey: "contentFilter.competitorIntent.thresholdMedium",
    hint: "e.g. 0.45",
    fallback: 0.45,
  },
  { field: "threshold_low", labelKey: "contentFilter.competitorIntent.thresholdLow", hint: "e.g. 0.3", fallback: 0.3 },
] as const satisfies ReadonlyArray<{
  field: "threshold_high" | "threshold_medium" | "threshold_low";
  labelKey: ParseKeys<"guardrails">;
  hint: string;
  fallback: number;
}>;

const CompetitorIntentConfiguration: React.FC<CompetitorIntentConfigurationProps> = ({
  enabled,
  config,
  onChange,
  accessToken,
}) => {
  const { t } = useTranslation("guardrails");
  const intentTypes = useMemo(
    () => INTENT_TYPE_KEYS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t],
  );
  const comparisonPolicies = useMemo(
    () => COMPETITOR_COMPARISON_POLICY_KEYS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t],
  );
  const possibleComparisonPolicies = useMemo(
    () =>
      POSSIBLE_COMPETITOR_COMPARISON_POLICY_KEYS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t],
  );
  const effectiveConfig = config ?? DEFAULT_CONFIG;
  const [airlineOptions, setAirlineOptions] = useState<MajorAirline[]>([]);
  const [loadingAirlines, setLoadingAirlines] = useState(false);
  const fieldId = useId();

  useEffect(() => {
    if (effectiveConfig.competitor_intent_type === "airline" && accessToken && airlineOptions.length === 0) {
      setLoadingAirlines(true);
      getMajorAirlines(accessToken)
        .then((res) => setAirlineOptions(res.airlines ?? []))
        .catch(() => setAirlineOptions([]))
        .finally(() => setLoadingAirlines(false));
    }
  }, [effectiveConfig.competitor_intent_type, accessToken, airlineOptions.length]);

  const handleEnabledChange = (checked: boolean) => {
    onChange(checked, checked ? { ...DEFAULT_CONFIG } : null);
  };

  const handleConfigChange = (field: string, value: unknown) => {
    onChange(enabled, { ...effectiveConfig, [field]: value });
  };

  const handlePolicyChange = (key: string, value: string) => {
    onChange(enabled, {
      ...effectiveConfig,
      policy: { ...effectiveConfig.policy, [key]: value },
    });
  };

  const handleNestedArrayChange = (field: "brand_self" | "locations" | "competitors", values: string[]) => {
    onChange(enabled, { ...effectiveConfig, [field]: values.filter(Boolean) });
  };

  const handleBrandSelfChange = (values: string[]) => {
    const filtered = values.filter(Boolean);
    const expanded: string[] = [];
    const seen = new Set<string>();
    for (const v of filtered) {
      const airline = airlineOptions.find((a) => {
        const primary = a.match.split("|")[0]?.trim().toLowerCase();
        return primary === v.toLowerCase();
      });
      if (airline) {
        for (const variant of airline.match
          .split("|")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)) {
          if (!seen.has(variant)) {
            seen.add(variant);
            expanded.push(variant);
          }
        }
      } else if (!seen.has(v.toLowerCase())) {
        seen.add(v.toLowerCase());
        expanded.push(v);
      }
    }
    onChange(enabled, { ...effectiveConfig, brand_self: expanded });
  };

  const header = (
    <CardHeader className="gap-0">
      <CardTitle className="text-base">{t("contentFilter.competitorIntent.title")}</CardTitle>
      <CardAction>
        <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
      </CardAction>
    </CardHeader>
  );

  if (!enabled) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("contentFilter.competitorIntent.offDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  const airlineTags =
    effectiveConfig.competitor_intent_type === "airline" && airlineOptions.length > 0
      ? airlineOptions.map((a) => {
          const primary = a.match.split("|")[0]?.trim() ?? a.id;
          const variants = a.match
            .split("|")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          return {
            value: primary.toLowerCase(),
            label: `${primary}${variants.length > 1 ? ` (${variants.slice(1).join(", ")})` : ""}`,
          };
        })
      : [];

  return (
    <Card>
      {header}
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{t("contentFilter.competitorIntent.onDescription")}</p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-type`}>{t("contentFilter.competitorIntent.type")}</FieldLabel>
            <Select
              items={intentTypes}
              value={effectiveConfig.competitor_intent_type}
              onValueChange={(v: string | null) => v !== null && handleConfigChange("competitor_intent_type", v)}
            >
              <SelectTrigger id={`${fieldId}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} title={type.label}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-brand-self`}>{t("contentFilter.competitorIntent.brandSelf")}</FieldLabel>
            <TagsInput
              id={`${fieldId}-brand-self`}
              value={effectiveConfig.brand_self}
              onValueChange={(v) =>
                effectiveConfig.competitor_intent_type === "airline" && airlineOptions.length > 0
                  ? handleBrandSelfChange(v)
                  : handleNestedArrayChange("brand_self", v)
              }
              options={airlineTags}
              tokenSeparators={[","]}
              loading={loadingAirlines}
              placeholder={
                effectiveConfig.competitor_intent_type === "airline"
                  ? t("contentFilter.competitorIntent.brandSelfAirlinePlaceholder")
                  : t("contentFilter.competitorIntent.typeToAdd")
              }
            />
            <FieldDescription>
              {effectiveConfig.competitor_intent_type === "airline"
                ? t("contentFilter.competitorIntent.brandSelfAirlineHint")
                : t("contentFilter.competitorIntent.brandSelfGenericHint")}
            </FieldDescription>
          </Field>

          {effectiveConfig.competitor_intent_type === "airline" && (
            <Field>
              <FieldLabel htmlFor={`${fieldId}-locations`}>{t("contentFilter.competitorIntent.locations")}</FieldLabel>
              <TagsInput
                id={`${fieldId}-locations`}
                value={effectiveConfig.locations ?? []}
                onValueChange={(v) => handleNestedArrayChange("locations", v)}
                tokenSeparators={[","]}
                placeholder={t("contentFilter.competitorIntent.typeToAdd")}
              />
              <FieldDescription>{t("contentFilter.competitorIntent.locationsHint")}</FieldDescription>
            </Field>
          )}

          {effectiveConfig.competitor_intent_type === "generic" && (
            <Field>
              <FieldLabel htmlFor={`${fieldId}-competitors`}>
                {t("contentFilter.competitorIntent.competitors")}
              </FieldLabel>
              <TagsInput
                id={`${fieldId}-competitors`}
                value={effectiveConfig.competitors ?? []}
                onValueChange={(v) => handleNestedArrayChange("competitors", v)}
                tokenSeparators={[","]}
                placeholder={t("contentFilter.competitorIntent.typeToAdd")}
              />
              <FieldDescription>{t("contentFilter.competitorIntent.competitorsHint")}</FieldDescription>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor={`${fieldId}-competitor-comparison`}>
              {t("contentFilter.competitorIntent.policyComparison")}
            </FieldLabel>
            <Select
              items={comparisonPolicies}
              value={effectiveConfig.policy?.competitor_comparison ?? "refuse"}
              onValueChange={(v: string | null) => v !== null && handlePolicyChange("competitor_comparison", v)}
            >
              <SelectTrigger id={`${fieldId}-competitor-comparison`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {comparisonPolicies.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value} title={policy.label}>
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor={`${fieldId}-possible-competitor-comparison`}>
              {t("contentFilter.competitorIntent.policyPossible")}
            </FieldLabel>
            <Select
              items={possibleComparisonPolicies}
              value={effectiveConfig.policy?.possible_competitor_comparison ?? "reframe"}
              onValueChange={(v: string | null) =>
                v !== null && handlePolicyChange("possible_competitor_comparison", v)
              }
            >
              <SelectTrigger id={`${fieldId}-possible-competitor-comparison`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {possibleComparisonPolicies.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value} title={policy.label}>
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{t("contentFilter.competitorIntent.thresholds")}</FieldLabel>
            <div className="flex flex-wrap gap-4">
              {THRESHOLDS.map((threshold) => (
                <Field key={threshold.field} className="w-20">
                  <FieldLabel htmlFor={`${fieldId}-${threshold.field}`}>{t(threshold.labelKey)}</FieldLabel>
                  <ThresholdInput
                    id={`${fieldId}-${threshold.field}`}
                    value={effectiveConfig[threshold.field] ?? threshold.fallback}
                    onValueChange={(v) => handleConfigChange(threshold.field, v ?? threshold.fallback)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                  <FieldDescription>{threshold.hint}</FieldDescription>
                </Field>
              ))}
            </div>
            <FieldDescription>
              {t("contentFilter.competitorIntent.thresholdsIntro")}
              <ul className="mt-1 mb-0 list-disc pl-5">
                <li>
                  <strong>{t("contentFilter.competitorIntent.highLabel")}</strong>
                  {t("contentFilter.competitorIntent.highHint")}
                </li>
                <li>
                  <strong>{t("contentFilter.competitorIntent.mediumLabel")}</strong>
                  {t("contentFilter.competitorIntent.mediumHint")}
                </li>
                <li>
                  <strong>{t("contentFilter.competitorIntent.lowLabel")}</strong>
                  {t("contentFilter.competitorIntent.lowHint")}
                </li>
              </ul>
              {t("contentFilter.competitorIntent.thresholdsFooter")}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default CompetitorIntentConfiguration;
