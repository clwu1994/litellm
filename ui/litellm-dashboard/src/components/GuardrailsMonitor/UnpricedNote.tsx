import React from "react";
import { useTranslation } from "react-i18next";
import { pricingIssueUrl, totalUnits, type UsageUnits } from "./usageUnits";

export function UnpricedNote({ unpriced, provider }: { unpriced: UsageUnits; provider?: string }) {
  const { t } = useTranslation("guardrailsMonitor");
  const total = totalUnits(unpriced);
  if (total === 0) return null;
  return (
    <p className="text-xs text-warning">
      {t(total === 1 ? "math.unpricedNoteOne" : "math.unpricedNoteOther", { total: total.toLocaleString() })}
      <a
        href={pricingIssueUrl(unpriced, provider)}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {t("math.requestPricing")}
      </a>
    </p>
  );
}
