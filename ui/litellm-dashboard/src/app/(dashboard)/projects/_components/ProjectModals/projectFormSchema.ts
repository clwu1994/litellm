import type { TFunction } from "i18next";
import { z } from "zod/v4";

export const ALL_TEAM_MODELS = "all-team-models";

const repeatsEarlierValue = (values: readonly string[], index: number): boolean =>
  values[index] !== "" && values.indexOf(values[index]) !== index;

const modelLimitSchema = (t: TFunction<"projects">) =>
  z.object({
    model: z.string().min(1, t("validation.modelRequired")),
    tpm: z.number().optional(),
    rpm: z.number().optional(),
    itpm: z.number().optional(),
    otpm: z.number().optional(),
  });

export const projectFormSchema = (t: TFunction<"projects">) =>
  z
    .object({
      project_alias: z.string().min(1, t("validation.projectNameRequired")),
      team_id: z
        .string()
        .nullable()
        .pipe(z.string({ error: t("validation.teamRequired") }).min(1, t("validation.teamRequired"))),
      description: z.string().optional(),
      models: z.array(z.string()),
      max_budget: z.number().nullish(),
      isBlocked: z.boolean(),
      guardrails: z.array(z.string()).optional(),
      modelLimits: z.array(modelLimitSchema(t)).optional(),
      metadata: z
        .array(
          z.object({
            key: z.string().min(1, t("validation.metadataKeyRequired")),
            value: z.string().min(1, t("validation.metadataValueRequired")),
          }),
        )
        .optional(),
    })
    .superRefine((values, ctx) => {
      const models = (values.modelLimits ?? []).map((entry) => entry.model);
      models.forEach((_, index) => {
        if (repeatsEarlierValue(models, index)) {
          ctx.addIssue({
            code: "custom",
            message: t("validation.duplicateModel"),
            path: ["modelLimits", index, "model"],
          });
        }
      });

      const keys = (values.metadata ?? []).map((entry) => entry.key);
      keys.forEach((_, index) => {
        if (repeatsEarlierValue(keys, index)) {
          ctx.addIssue({ code: "custom", message: t("validation.duplicateKey"), path: ["metadata", index, "key"] });
        }
      });
    });

type ProjectFormSchema = ReturnType<typeof projectFormSchema>;

export type ProjectFormValues = z.input<ProjectFormSchema>;
export type ProjectSubmitValues = z.output<ProjectFormSchema>;

export const emptyProjectFormValues: ProjectFormValues = {
  project_alias: "",
  team_id: null,
  description: undefined,
  models: [],
  max_budget: undefined,
  isBlocked: false,
  guardrails: undefined,
  modelLimits: undefined,
  metadata: undefined,
};
