import type { TFunction } from "i18next";
import { z } from "zod/v4";

const isBlank = (value: string): boolean => value.trim() === "";

const buildAmountOrEmpty = (t: TFunction<"users">) =>
  z
    .string()
    .refine(
      (value) => isBlank(value) || (Number.isFinite(Number(value)) && Number(value) >= 0),
      t("defaults.validation.nonNegative"),
    );

const buildDefaultTeamRowSchema = (t: TFunction<"users">) =>
  z.object({
    team_id: z
      .string()
      .nullable()
      .pipe(z.string({ error: t("defaults.validation.teamRequired") }).min(1, t("defaults.validation.teamRequired"))),
    max_budget_in_team: buildAmountOrEmpty(t),
    user_role: z.enum(["user", "admin"]),
  });

export type DefaultTeamRowValues = z.input<ReturnType<typeof buildDefaultTeamRowSchema>>;

export const EMPTY_TEAM_ROW: DefaultTeamRowValues = { team_id: null, max_budget_in_team: "", user_role: "user" };

export const buildDefaultUserSettingsSchema = (t: TFunction<"users">) => {
  const shape = {
    user_role: z.string(),
    max_budget: buildAmountOrEmpty(t),
    budget_duration: z.string(),
    models: z.array(z.string()),
    teams: z.array(buildDefaultTeamRowSchema(t)),
  };

  return z.object(shape).superRefine((values, ctx) => {
    const repeatedRows = values.teams.flatMap((team, index) =>
      team.team_id !== "" && values.teams.findIndex((other) => other.team_id === team.team_id) < index ? [index] : [],
    );

    repeatedRows.forEach((index) =>
      ctx.addIssue({
        code: "custom",
        message: t("defaults.validation.teamDuplicate"),
        path: ["teams", index, "team_id"],
      }),
    );
  });
};

export type DefaultUserSettingsFormValues = z.input<ReturnType<typeof buildDefaultUserSettingsSchema>>;
export type DefaultUserSettingsSubmitValues = z.output<ReturnType<typeof buildDefaultUserSettingsSchema>>;
