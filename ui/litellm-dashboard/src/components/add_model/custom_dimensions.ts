import { z } from "zod";
import type { ParseKeys } from "i18next";

import type { ValidationMessage } from "../common_components/formRules";
import { DIMENSION_LABEL_KEYS } from "./heuristic_scoring_knobs";

const customDimensionShape = {
  name: z.string(),
  weight: z.number(),
  keywords: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  scoring_mode: z.enum(["binary", "match_count"]).optional(),
};
const customDimensionSchema = z.object(customDimensionShape);

export type CustomDimension = z.infer<typeof customDimensionSchema>;
export type CustomDimensionRow = CustomDimension & { id: string };

export const hydrateCustomDimensions = (raw: unknown): CustomDimensionRow[] | undefined => {
  if (raw === undefined) return undefined;
  const parsed = z.array(customDimensionSchema).safeParse(raw);
  return parsed.success ? parsed.data.map((row, index) => ({ ...row, id: `stored-${index}` })) : undefined;
};

export const serializeCustomDimensions = (rows: CustomDimensionRow[]): CustomDimension[] =>
  rows.map(({ id: _id, ...dimension }) => dimension);

const dimensionMessage = (key: ParseKeys<"models">, index: number): ValidationMessage => ({
  key,
  values: { index: index + 1 },
});

export const customDimensionsError = (
  rows: CustomDimensionRow[] | undefined,
  builtinNames: string[] = Object.keys(DIMENSION_LABEL_KEYS),
): ValidationMessage | null => {
  if (!rows) return null;
  if (rows.length > 16) return { key: "autoRouterConfig.setup.dimensionError.count" };
  const names = rows.map((row) => row.name.toLowerCase());
  for (const [index, row] of rows.entries()) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(row.name))
      return dimensionMessage("autoRouterConfig.setup.dimensionError.nameFormat", index);
    if (builtinNames.some((name) => name.toLowerCase() === row.name.toLowerCase()))
      return dimensionMessage("autoRouterConfig.setup.dimensionError.builtin", index);
    if (names.indexOf(row.name.toLowerCase()) !== index)
      return dimensionMessage("autoRouterConfig.setup.dimensionError.unique", index);
    if (!Number.isFinite(row.weight) || row.weight <= 0 || row.weight > 1)
      return dimensionMessage("autoRouterConfig.setup.dimensionError.weight", index);
    const matchers = [...(row.keywords ?? []), ...(row.patterns ?? [])];
    if (!matchers.length || matchers.some((matcher) => !matcher.trim()))
      return dimensionMessage("autoRouterConfig.setup.dimensionError.matchers", index);
    if (
      matchers.length > 32 ||
      matchers.some((matcher) => [...matcher].length > 256) ||
      matchers.reduce((total, matcher) => total + [...matcher].length, 0) > 4096
    )
      return dimensionMessage("autoRouterConfig.setup.dimensionError.matcherLimits", index);
  }
  return null;
};
