import React from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";

import { type ComplexityRouterConfigValue, heuristicScoringRole, usesLlmClassifier } from "./ComplexityRouterConfig";
import { restrictedBy } from "./TierRestrictions";

const tierConfigIntroKey = (value: ComplexityRouterConfigValue): ParseKeys<"models"> => {
  if (value.classifier_type === "heuristic_v2") return "autoRouterConfig.complexity.intro.heuristicV2";
  if (heuristicScoringRole(value) === "never") return "autoRouterConfig.complexity.intro.classifier";
  return "autoRouterConfig.complexity.intro.scoring";
};

const TierConfigIntro: React.FC<{ value: ComplexityRouterConfigValue }> = ({ value }) => {
  const { t } = useTranslation("models");
  const displayNamesReason = restrictedBy(value, "displayNames");
  return (
    <>
      <span className="block mb-6 text-muted-foreground">{t(tierConfigIntroKey(value))}</span>

      <span className="block mb-4 text-xs text-muted-foreground">
        {displayNamesReason ? t(displayNamesReason.reasonKey) : t("autoRouterConfig.complexity.intro.displayNames")}
        {!value.custom_tier_set &&
          usesLlmClassifier(value.classifier_type) &&
          t("autoRouterConfig.complexity.intro.classifierReads")}
      </span>
    </>
  );
};

export default TierConfigIntro;
