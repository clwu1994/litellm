import type { TFunction } from "i18next";

import { describeGroups, TeamAccessGroupModelGrant } from "../team/teamModelAccess";

export interface InheritedGrant {
  id: string;
  accessGroupNames: string[];
}

export function computeInheritedGrants(
  ids: string[] | undefined,
  grants: TeamAccessGroupModelGrant[] | undefined,
  idsOf: (grant: TeamAccessGroupModelGrant) => string[] | undefined,
): InheritedGrant[] {
  const known = grants ?? [];
  const allIds = [...new Set([...(ids ?? []), ...known.flatMap((grant) => idsOf(grant) ?? [])])];
  return allIds.map((id) => ({
    id,
    accessGroupNames: known
      .filter((grant) => (idsOf(grant) ?? []).includes(id))
      .map((grant) => grant.access_group_name),
  }));
}

export const inheritedGrantTooltip = (grant: InheritedGrant, t: TFunction<"teams">): string => {
  const source =
    grant.accessGroupNames.length > 0 ? describeGroups(grant.accessGroupNames, t) : t("permissions.anAccessGroup");
  return t("permissions.grantedVia", { source, id: grant.id });
};
