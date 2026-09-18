import { describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import {
  computeTeamModelBadges,
  normalizeTeamModelSelection,
  TeamAccessGroupModelGrant,
  TeamModelBadge,
} from "./teamModelAccess";

const GRANTS: TeamAccessGroupModelGrant[] = [
  { access_group_id: "ag-1", access_group_name: "shared", models: ["haiku", "gpt-4o-mini"] },
  { access_group_id: "ag-2", access_group_name: "extra", models: ["haiku", "sonnet"] },
];

const en = i18n.getFixedT("en", "teams");

const labelOf = (badge: TeamModelBadge): string => ("label" in badge ? badge.label : en(badge.labelKey));

const tooltipOf = (badge: TeamModelBadge): string => en(badge.tooltipKey, { names: badge.groupNames.join(", ") });

describe("normalizeTeamModelSelection", () => {
  it("substitutes the no-default-models sentinel for an empty selection", () => {
    expect(normalizeTeamModelSelection([])).toEqual(["no-default-models"]);
    expect(normalizeTeamModelSelection(undefined)).toEqual(["no-default-models"]);
  });

  it("passes a non-empty selection through untouched", () => {
    expect(normalizeTeamModelSelection(["gpt-4o-mini"])).toEqual(["gpt-4o-mini"]);
    expect(normalizeTeamModelSelection(["all-proxy-models"])).toEqual(["all-proxy-models"]);
  });
});

describe("computeTeamModelBadges", () => {
  it("attributes group-only models to the groups granting them", () => {
    const badges = computeTeamModelBadges(["sonnet-direct"], [], GRANTS);
    expect(badges).toEqual([
      {
        kind: "direct",
        label: "sonnet-direct",
        tooltipKey: "modelAccess.tooltip.direct",
        groupNames: [],
      },
      {
        kind: "access-group",
        label: "haiku",
        tooltipKey: "modelAccess.tooltip.viaGroups",
        groupNames: ["shared", "extra"],
      },
      {
        kind: "access-group",
        label: "gpt-4o-mini",
        tooltipKey: "modelAccess.tooltip.viaGroup",
        groupNames: ["shared"],
      },
      {
        kind: "access-group",
        label: "sonnet",
        tooltipKey: "modelAccess.tooltip.viaGroup",
        groupNames: ["extra"],
      },
    ]);
    expect(badges.map(tooltipOf)).toEqual([
      "Granted directly in the team's model list",
      "Granted via access groups shared, extra",
      "Granted via access group shared",
      "Granted via access group extra",
    ]);
  });

  it("marks a model both direct and group-granted on the direct badge, without a duplicate badge", () => {
    const badges = computeTeamModelBadges(["haiku"], [], GRANTS);
    expect(badges).toEqual([
      {
        kind: "direct",
        label: "haiku",
        tooltipKey: "modelAccess.tooltip.directAndGroups",
        groupNames: ["shared", "extra"],
      },
      {
        kind: "access-group",
        label: "gpt-4o-mini",
        tooltipKey: "modelAccess.tooltip.viaGroup",
        groupNames: ["shared"],
      },
      {
        kind: "access-group",
        label: "sonnet",
        tooltipKey: "modelAccess.tooltip.viaGroup",
        groupNames: ["extra"],
      },
    ]);
    expect(tooltipOf(badges[0])).toBe(
      "Granted directly in the team's model list, and also via access groups shared, extra",
    );
  });

  it("shows the no-default-models sentinel as its own badge and keeps group badges visible", () => {
    const badges = computeTeamModelBadges(["no-default-models"], [], [GRANTS[0]]);
    expect(badges.map((b) => [labelOf(b), b.kind])).toEqual([
      ["No default models", "no-default"],
      ["haiku", "access-group"],
      ["gpt-4o-mini", "access-group"],
    ]);
  });

  it("still shows group badges when the empty model list grants everything", () => {
    const badges = computeTeamModelBadges([], [], [GRANTS[0]]);
    const expectedAllProxy: TeamModelBadge = {
      kind: "all-proxy",
      labelKey: "modelAccess.badge.allProxy",
      tooltipKey: "modelAccess.tooltip.allProxyEmptyList",
      groupNames: [],
    };
    expect(badges[0]).toEqual(expectedAllProxy);
    expect(tooltipOf(badges[0])).toBe("The team's model list is empty, so it can access every model on the proxy");
    expect(badges.slice(1).map(labelOf)).toEqual(["haiku", "gpt-4o-mini"]);
  });

  it("distinguishes the all-proxy-models sentinel from an empty list in the tooltip", () => {
    const badges = computeTeamModelBadges(["all-proxy-models"], [], []);
    expect(badges).toEqual([
      {
        kind: "all-proxy",
        labelKey: "modelAccess.badge.allProxy",
        tooltipKey: "modelAccess.tooltip.allProxyFromList",
        groupNames: [],
      },
    ]);
    expect(tooltipOf(badges[0])).toBe("Granted by the All Proxy Models entry in the team's model list");
  });

  it("falls back to the flat access_group_models list when per-group details are absent", () => {
    const badges = computeTeamModelBadges(["direct-model"], ["haiku"], undefined);
    expect(badges).toEqual([
      {
        kind: "direct",
        label: "direct-model",
        tooltipKey: "modelAccess.tooltip.direct",
        groupNames: [],
      },
      {
        kind: "access-group",
        label: "haiku",
        tooltipKey: "modelAccess.tooltip.viaAnyGroup",
        groupNames: [],
      },
    ]);
    expect(tooltipOf(badges[1])).toBe("Granted via an access group");
  });
});
