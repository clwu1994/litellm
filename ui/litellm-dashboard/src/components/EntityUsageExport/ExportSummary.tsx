import React from "react";
import { useTranslation } from "react-i18next";
import type { DateRangePickerValue } from "@/components/shared/date_picker_types";

interface ExportSummaryProps {
  dateRange: DateRangePickerValue;
  selectedFilters: string[];
}

const ExportSummary: React.FC<ExportSummaryProps> = ({ dateRange, selectedFilters }) => {
  const { t } = useTranslation("usage");
  return (
    <div className="text-sm text-muted-foreground">
      {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
      {selectedFilters.length > 0 &&
        ` · ${
          selectedFilters.length > 1
            ? t("entityUsage.filterCountPlural", { filters: selectedFilters.length })
            : t("entityUsage.filterCountSingular", { filters: selectedFilters.length })
        }`}
    </div>
  );
};

export default ExportSummary;
