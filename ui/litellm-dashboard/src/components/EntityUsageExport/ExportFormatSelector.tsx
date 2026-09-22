import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ExportFormat } from "./types";

interface ExportFormatSelectorProps {
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
}

const FORMAT_LABEL_KEYS = {
  csv: "entityUsage.formatCsv",
  json: "entityUsage.formatJson",
} as const satisfies Record<ExportFormat, string>;

const formatLabel = (format: ExportFormat, t: TFunction<"usage">): string => t(FORMAT_LABEL_KEYS[format]);

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation("usage");
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{t("entityUsage.formatLabel")}</label>
      <Select value={value} onValueChange={(next: ExportFormat | null) => next && onChange(next)}>
        <SelectTrigger className="w-full">
          <SelectValue>{formatLabel(value, t)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(FORMAT_LABEL_KEYS) as ExportFormat[]).map((format) => (
            <SelectItem key={format} value={format}>
              {formatLabel(format, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ExportFormatSelector;
