export const ALL_PROXY_MODELS = "all-proxy-models";
export const NO_DEFAULT_MODELS = "no-default-models";

export interface TeamAccessGroupModelGrant {
  access_group_id: string;
  access_group_name: string;
  models: string[];
  mcp_server_ids?: string[];
  agent_ids?: string[];
}

export type TeamModelBadgeKind = "all-proxy" | "no-default" | "direct" | "access-group";

export type TeamModelBadgeLabelKey = "modelAccess.badge.allProxy" | "modelAccess.badge.noDefault";

export type TeamModelBadgeTooltipKey =
  | "modelAccess.tooltip.allProxyFromList"
  | "modelAccess.tooltip.allProxyEmptyList"
  | "modelAccess.tooltip.noDefault"
  | "modelAccess.tooltip.direct"
  | "modelAccess.tooltip.directAndGroup"
  | "modelAccess.tooltip.directAndGroups"
  | "modelAccess.tooltip.viaGroup"
  | "modelAccess.tooltip.viaGroups"
  | "modelAccess.tooltip.viaAnyGroup";

export type TeamModelBadge =
  | {
      readonly kind: "all-proxy" | "no-default";
      readonly labelKey: TeamModelBadgeLabelKey;
      readonly tooltipKey: TeamModelBadgeTooltipKey;
      readonly groupNames: readonly string[];
    }
  | {
      readonly kind: "direct" | "access-group";
      readonly label: string;
      readonly tooltipKey: TeamModelBadgeTooltipKey;
      readonly groupNames: readonly string[];
    };

export function normalizeTeamModelSelection(models: string[] | undefined): string[] {
  return models && models.length > 0 ? models : [NO_DEFAULT_MODELS];
}

export const describeGroups = (names: string[]): string =>
  names.length > 1 ? `access groups ${names.join(", ")}` : `access group ${names[0]}`;

const pickTooltipKey = <T extends string>(count: number, none: T, one: T, many: T): T => {
  if (count === 0) return none;
  if (count === 1) return one;
  return many;
};

export function computeTeamModelBadges(
  models: string[],
  accessGroupModels: string[],
  accessGroupDetails: TeamAccessGroupModelGrant[] | undefined,
): TeamModelBadge[] {
  const grants = accessGroupDetails ?? [];
  const groupNamesFor = (model: string): string[] =>
    grants.filter((g) => g.models.includes(model)).map((g) => g.access_group_name);

  const allProxy = models.length === 0 || models.includes(ALL_PROXY_MODELS);
  const directModels = allProxy ? [] : models.filter((m) => m !== NO_DEFAULT_MODELS);
  const groupModels = [...new Set(grants.length > 0 ? grants.flatMap((g) => g.models) : accessGroupModels)].filter(
    (m) => !directModels.includes(m),
  );

  const allProxyBadge: TeamModelBadge = {
    kind: "all-proxy",
    labelKey: "modelAccess.badge.allProxy",
    tooltipKey: models.includes(ALL_PROXY_MODELS)
      ? "modelAccess.tooltip.allProxyFromList"
      : "modelAccess.tooltip.allProxyEmptyList",
    groupNames: [],
  };
  const noDefaultBadge: TeamModelBadge = {
    kind: "no-default",
    labelKey: "modelAccess.badge.noDefault",
    tooltipKey: "modelAccess.tooltip.noDefault",
    groupNames: [],
  };
  const headBadge = (): TeamModelBadge[] => {
    if (allProxy) return [allProxyBadge];
    if (models.includes(NO_DEFAULT_MODELS)) return [noDefaultBadge];
    return [];
  };

  return [
    ...headBadge(),
    ...directModels.map((m): TeamModelBadge => {
      const names = groupNamesFor(m);
      return {
        kind: "direct",
        label: m,
        tooltipKey: pickTooltipKey(
          names.length,
          "modelAccess.tooltip.direct",
          "modelAccess.tooltip.directAndGroup",
          "modelAccess.tooltip.directAndGroups",
        ),
        groupNames: names,
      };
    }),
    ...groupModels.map((m): TeamModelBadge => {
      const names = groupNamesFor(m);
      return {
        kind: "access-group",
        label: m,
        tooltipKey: pickTooltipKey(
          names.length,
          "modelAccess.tooltip.viaAnyGroup",
          "modelAccess.tooltip.viaGroup",
          "modelAccess.tooltip.viaGroups",
        ),
        groupNames: names,
      };
    }),
  ];
}
