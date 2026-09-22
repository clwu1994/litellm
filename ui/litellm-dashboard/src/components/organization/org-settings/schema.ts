import type { TFunction } from "i18next";
import { z } from "zod/v4";

const isBlank = (value: string): boolean => value.trim() === "";

const isJsonObject = (value: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
};

export const buildOrgSettingsSchema = (t: TFunction<"organizations">) => {
  const wholeNumberOrEmpty = z
    .string()
    .refine((value) => isBlank(value) || /^\d+$/.test(value.trim()), t("validation.nonNegativeWholeNumber"));

  const amountOrEmpty = z
    .string()
    .refine(
      (value) => isBlank(value) || (Number.isFinite(Number(value)) && Number(value) >= 0),
      t("validation.nonNegativeNumber"),
    );

  const orgSettingsShape = {
    organization_alias: z.string().min(1, t("validation.organizationNameRequired")),
    models: z.array(z.string()),
    max_budget: amountOrEmpty,
    budget_duration: z.string(),
    tpm_limit: wholeNumberOrEmpty,
    rpm_limit: wholeNumberOrEmpty,
    vector_stores: z.array(z.string()),
    mcp: z.object({
      servers: z.array(z.string()),
      accessGroups: z.array(z.string()),
      toolsets: z.array(z.string()),
    }),
    metadata: z.string().refine((value) => isBlank(value) || isJsonObject(value), t("validation.metadataInvalid")),
  };

  return z.object(orgSettingsShape);
};

export type OrgSettingsFormValues = z.output<ReturnType<typeof buildOrgSettingsSchema>>;
