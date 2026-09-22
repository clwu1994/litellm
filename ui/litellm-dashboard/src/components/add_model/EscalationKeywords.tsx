import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import React from "react";
import { useTranslation } from "react-i18next";

export const DEFAULT_ESCALATION_KEYWORDS = ["LITELLM ESCALATE"];

interface EscalationKeywordsProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

const EscalationKeywords: React.FC<EscalationKeywordsProps> = ({ keywords, onChange }) => {
  const { t } = useTranslation("models");
  return (
    <div className="w-full max-w-none">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="m-0 text-xl font-semibold text-foreground">
          {t("autoRouterConfig.matching.escalation.heading")}
        </h4>
        <SimpleTooltip content={t("autoRouterConfig.matching.escalation.tooltip")}>
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <span className="mb-2 block text-xs text-muted-foreground">{t("autoRouterConfig.matching.escalation.help")}</span>
      <MultiSelect
        options={keywords.map((keyword) => ({ label: keyword, value: keyword }))}
        value={keywords}
        onValueChange={onChange}
        placeholder="e.g., LITELLM ESCALATE"
        emptyText={t("autoRouterConfig.matching.escalation.empty")}
        allowCustomValues
        className="w-full"
      />
    </div>
  );
};

export default EscalationKeywords;
