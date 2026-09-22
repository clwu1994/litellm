import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NEVER_RESETS_BUDGET_DURATION = "none";

interface BudgetDurationDropdownProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showNeverResets?: boolean;
}

const BudgetDurationDropdown: React.FC<BudgetDurationDropdownProps> = ({
  id,
  value,
  onChange,
  className = "",
  style = {},
  placeholder,
  showNeverResets = false,
}) => {
  const { t } = useTranslation("common");
  const resolvedPlaceholder = placeholder ?? t("budgetDuration.placeholder");
  const durationLabels: Record<string, string> = {
    [NEVER_RESETS_BUDGET_DURATION]: t("budgetDuration.neverResets"),
    "1h": t("budgetDuration.hourly"),
    "24h": t("budgetDuration.daily"),
    "7d": t("budgetDuration.weekly"),
    "30d": t("budgetDuration.monthly"),
  };

  return (
    <Select items={durationLabels} value={value || null} onValueChange={onChange}>
      <SelectTrigger id={id} className={`w-full ${className}`} style={style}>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{resolvedPlaceholder}</SelectItem>
        {showNeverResets ? (
          <SelectItem value={NEVER_RESETS_BUDGET_DURATION}>{t("budgetDuration.neverResets")}</SelectItem>
        ) : null}
        <SelectItem value="1h">{t("budgetDuration.hourly")}</SelectItem>
        <SelectItem value="24h">{t("budgetDuration.daily")}</SelectItem>
        <SelectItem value="7d">{t("budgetDuration.weekly")}</SelectItem>
        <SelectItem value="30d">{t("budgetDuration.monthly")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const getBudgetDurationLabel = (value: string | null | undefined, t: TFunction<"common">): string => {
  if (!value) return t("budgetDuration.notSet");

  const budgetDurationMap: Record<string, string> = {
    "1h": t("budgetDuration.hourly"),
    "24h": t("budgetDuration.daily"),
    "7d": t("budgetDuration.weekly"),
    "30d": t("budgetDuration.monthly"),
  };

  return budgetDurationMap[value] ?? t("budgetDuration.raw", { value });
};

export default BudgetDurationDropdown;
