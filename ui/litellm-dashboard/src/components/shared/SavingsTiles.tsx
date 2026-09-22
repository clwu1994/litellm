"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import SummaryCard from "@/components/shared/SummaryCard";
import {
  autorouterOf,
  cachingOf,
  compressionOf,
  gatewayAttributedCachingOf,
  SAVINGS_DRIVERS,
  savedTokensOf,
  sumOverDays,
  usd,
} from "@/app/(dashboard)/cost-optimization/_components/costOptimizationUtils";
import { DailyData } from "@/components/UsagePage/types";
import { formatNumberWithCommas } from "@/utils/dataUtils";

// The total sums SAVINGS_DRIVERS, so it is by construction the sum of what the
// charts plot; the donut and timelines derive from the same list in costOptimizationUtils.
const useSavingsTotals = (results: DailyData[]) =>
  useMemo(
    () => ({
      compression: sumOverDays(results, compressionOf),
      caching: sumOverDays(results, cachingOf),
      autorouter: sumOverDays(results, autorouterOf),
      gatewayAttributedCaching: sumOverDays(results, gatewayAttributedCachingOf),
      savedTokens: sumOverDays(results, savedTokensOf),
      total: SAVINGS_DRIVERS.reduce((sum, { of }) => sum + sumOverDays(results, of), 0),
    }),
    [results],
  );

const SavingsTiles = ({ results, isLoading }: { results: DailyData[]; isLoading: boolean }) => {
  const { t } = useTranslation("common");
  const totals = useSavingsTotals(results);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        id="total-saved"
        label={t("savingsTiles.totalSaved")}
        value={usd(totals.total)}
        hint={isLoading ? t("loading") : t("savingsTiles.totalSavedHint")}
        info={t("savingsTiles.totalSavedInfo")}
      />
      <SummaryCard
        id="compression-savings"
        label={t("savingsTiles.compressionSavings")}
        value={usd(totals.compression)}
        hint={t("savingsTiles.compressionHint", { tokens: formatNumberWithCommas(totals.savedTokens) })}
        info={t("savingsTiles.compressionInfo")}
      />
      <SummaryCard
        id="prompt-caching-savings"
        label={t("savingsTiles.promptCachingSavings")}
        value={usd(totals.gatewayAttributedCaching)}
        hint={t("savingsTiles.promptCachingHint")}
        secondary={{ label: t("savingsTiles.total"), value: usd(totals.caching) }}
        info={t("savingsTiles.promptCachingInfo")}
      />
      <SummaryCard
        id="auto-router-savings"
        label={t("savingsTiles.autoRouterSavings")}
        value={usd(totals.autorouter)}
        hint={t("savingsTiles.autoRouterHint")}
        info={t("savingsTiles.autoRouterInfo")}
      />
    </div>
  );
};

export default SavingsTiles;
