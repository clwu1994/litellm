import type { TFunction } from "i18next";

type Metadata = Record<string, unknown> | null | undefined;

type FormValues = Record<string, unknown>;

const ESTIMATE_FIELD = "default_estimated_output_tokens";
const PER_MODEL_FIELD = "default_estimated_output_tokens_per_model";

const perModelEstimateToText = (value: unknown): string =>
  value != null && typeof value === "object" ? JSON.stringify(value) : "";

const isPositiveInteger = (value: unknown): boolean =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const parsePerModelEstimates = (value: string): Record<string, number> | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0 || !entries.every(([, v]) => isPositiveInteger(v))) return null;
  return Object.fromEntries(entries) as Record<string, number>;
};

export const estimateFields = (metadata: Metadata) => ({
  [ESTIMATE_FIELD]: metadata?.[ESTIMATE_FIELD],
  [PER_MODEL_FIELD]: perModelEstimateToText(metadata?.[PER_MODEL_FIELD]),
});

export const estimateTooltips = (t: TFunction<"common">, canEdit: boolean, entity: "key" | "team" = "key") => ({
  estimate: canEdit
    ? t(entity === "team" ? "estimatedOutputTokens.estimateTeam" : "estimatedOutputTokens.estimateKey")
    : t("estimatedOutputTokens.adminOnly"),
  perModel: canEdit
    ? t(entity === "team" ? "estimatedOutputTokens.perModelTeam" : "estimatedOutputTokens.perModelKey")
    : t("estimatedOutputTokens.adminOnly"),
});

export const estimateChecks = (t: TFunction<"common">) => ({
  perModel: {
    isValid: (value: unknown): boolean =>
      typeof value !== "string" || value.trim() === "" ? true : parsePerModelEstimates(value) !== null,
    message: t("estimatedOutputTokens.invalidPerModel"),
  },
  positive: {
    isValid: (value: unknown): boolean =>
      value === "" || value === null || value === undefined ? true : isPositiveInteger(Number(value)),
    message: t("estimatedOutputTokens.positiveInteger"),
  },
});

const asValidatorRule = ({ isValid, message }: { isValid: (value: unknown) => boolean; message: string }) => ({
  validator: (_: unknown, value: unknown) => (isValid(value) ? Promise.resolve() : Promise.reject(new Error(message))),
});

export const estimateRules = (t: TFunction<"common">) => {
  const checks = estimateChecks(t);
  return {
    perModel: asValidatorRule(checks.perModel),
    positive: asValidatorRule(checks.positive),
  };
};

export const withNormalizedEstimates = <T extends FormValues>(values: T): FormValues => {
  const { [ESTIMATE_FIELD]: estimate, [PER_MODEL_FIELD]: perModel, ...rest } = values;

  const normalizedEstimate = estimate === "" || estimate === null || estimate === undefined ? null : Number(estimate);
  const normalizedPerModel = typeof perModel === "string" ? parsePerModelEstimates(perModel) : null;

  return {
    ...rest,
    ...(normalizedEstimate === null ? {} : { [ESTIMATE_FIELD]: normalizedEstimate }),
    ...(normalizedPerModel === null ? {} : { [PER_MODEL_FIELD]: normalizedPerModel }),
  };
};
