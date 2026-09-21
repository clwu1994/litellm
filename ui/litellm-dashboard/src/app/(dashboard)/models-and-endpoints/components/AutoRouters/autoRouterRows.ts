import type { ParseKeys } from "i18next";

import { AutoRouterDeployment } from "@/app/(dashboard)/hooks/models/useModels";
import {
  AutoRouterKind,
  EditBlockedReason,
  autoRouterCapabilities,
  autoRouterStrategy,
} from "@/components/add_model/auto_router_strategies";
import { normalizeTierModels } from "@/components/add_model/complexity_router_tiers";
import { Team } from "@/components/networking";
import { type ModelActor, canModifyModel } from "@/utils/modelPermissions";

export type { AutoRouterKind };

/** Who is looking at the list; decides which rows offer write affordances. */
export type AutoRouterActor = ModelActor;

export interface AutoRouterRow {
  id: string;
  name: string;
  kind: AutoRouterKind;
  typeLabelKey: ParseKeys<"models">;
  /** Edit needs an API-created row AND a strategy the dashboard has a form for. */
  canEdit: boolean;
  /**
   * Resource capability ANDed with the caller's standing on this specific row. A team admin
   * sees rows they cannot delete (another team's, or one a teammate created), and the API
   * would 403 those, so the affordance has to be per row rather than per tab.
   */
  canDelete: boolean;
  editBlockedReason: EditBlockedReason | null;
  targets: string[];
  defaultModel: string | null;
  /** `undefined`, not `null`: the table's `sortUndefined` pin only matches `undefined` */
  createdAt: string | undefined;
  deployment: AutoRouterDeployment;
}

const safeParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asRecord = (value: unknown): Record<string, unknown> => {
  const parsed: unknown = typeof value === "string" ? safeParse(value) : value;
  return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const dedupe = (models: string[]): string[] => Array.from(new Set(models));

const COMPLEXITY_TYPE_LABEL_KEYS: Record<string, ParseKeys<"models">> = {
  llm: "autoRouters.type.llmClassifier",
  heuristic_first: "autoRouters.type.heuristicFirst",
  hybrid: "autoRouters.type.hybrid",
  custom: "autoRouters.type.customClassifier",
};

export const complexityTypeLabelKey = (config: Record<string, unknown>): ParseKeys<"models"> =>
  (typeof config.classifier_type === "string" && COMPLEXITY_TYPE_LABEL_KEYS[config.classifier_type]) ||
  "autoRouters.type.heuristic";

interface Presentation {
  typeLabelKey: ParseKeys<"models">;
  targets: string[];
}

// Adaptive and quality both declare a flat pool and have no editor here, so the row reports
// what is configured rather than interpreting it.
const configManaged = (labelKey: ParseKeys<"models">, config: Record<string, unknown>): Presentation => ({
  typeLabelKey: labelKey,
  targets: asStringArray(config.available_models),
});

/** How each strategy renders itself, given its own config object. */
const PRESENTERS: Record<AutoRouterKind, (config: Record<string, unknown>) => Presentation> = {
  complexity: (config) => ({
    typeLabelKey: complexityTypeLabelKey(config),
    targets: dedupe(Object.values(asRecord(config.tiers)).flatMap(normalizeTierModels)),
  }),
  semantic: (config) => {
    const routes = dedupe(
      (Array.isArray(config.routes) ? config.routes : [])
        .map((route) => asRecord(route).name)
        .filter((name): name is string => typeof name === "string" && name.length > 0),
    );
    return { typeLabelKey: "autoRouters.type.semantic", targets: routes };
  },
  adaptive: (config) => configManaged("autoRouters.type.adaptive", config),
  quality: (config) => configManaged("autoRouters.type.quality", config),
};

export const toAutoRouterRow = (
  deployment: AutoRouterDeployment,
  index: number,
  actor: AutoRouterActor,
  teams: Team[] | null,
): AutoRouterRow => {
  const params = deployment.litellm_params ?? {};
  const info = deployment.model_info ?? {};
  const name = deployment.model_name ?? "";
  const strategy = autoRouterStrategy(params);
  const { canEdit, canDelete, editBlockedReason } = autoRouterCapabilities(params, info);
  const mayActOnRow = canModifyModel(actor, teams, { teamId: info.team_id, isDbModel: info.db_model === true });

  return {
    id: info.id ?? `${name}-${index}`,
    name,
    kind: strategy.kind,
    canEdit: canEdit && mayActOnRow,
    canDelete: canDelete && mayActOnRow,
    editBlockedReason,
    createdAt: info.created_at ?? undefined,
    defaultModel: (params[strategy.defaultModelKey] as string | null | undefined) ?? null,
    deployment,
    ...PRESENTERS[strategy.kind](asRecord(params[strategy.configKey])),
  };
};

export const toAutoRouterRows = (
  deployments: AutoRouterDeployment[],
  actor: AutoRouterActor,
  teams: Team[] | null,
): AutoRouterRow[] => deployments.map((deployment, index) => toAutoRouterRow(deployment, index, actor, teams));
