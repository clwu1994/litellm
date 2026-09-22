import React from "react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExportScope, EntityType } from "./types";

const ENTITY_LOWER_KEYS = {
  tag: "entity.typeLower.tag",
  team: "entity.typeLower.team",
  organization: "entity.typeLower.organization",
  customer: "entity.typeLower.customer",
  agent: "entity.typeLower.agent",
  user: "entity.typeLower.user",
} as const satisfies Record<EntityType, string>;

interface ExportTypeSelectorProps {
  value: ExportScope;
  onChange: (value: ExportScope) => void;
  entityType: EntityType;
}

const ExportTypeSelector: React.FC<ExportTypeSelectorProps> = ({ value, onChange, entityType }) => {
  const { t } = useTranslation("usage");
  const entity = t(ENTITY_LOWER_KEYS[entityType]);
  const scopes: { value: ExportScope; title: string; description: string }[] = [
    {
      value: "daily",
      title: t("entityUsage.scopeDailyTitle", { entity }),
      description: t("entityUsage.scopeDailyDescription", { entity }),
    },
    {
      value: "daily_with_keys",
      title: t("entityUsage.scopeDailyWithKeysTitle", { entity }),
      description: t("entityUsage.scopeDailyWithKeysDescription", { entity }),
    },
    {
      value: "daily_with_models",
      title: t("entityUsage.scopeDailyWithModelsTitle", { entity }),
      description: t("entityUsage.scopeDailyWithModelsDescription"),
    },
  ];

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{t("entityUsage.exportTypeLabel")}</label>
      <RadioGroup value={value} onValueChange={(next) => onChange(next as ExportScope)} className="gap-2">
        {scopes.map((scope) => (
          <label
            key={scope.value}
            className="flex items-start p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <RadioGroupItem value={scope.value} className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{scope.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{scope.description}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ExportTypeSelector;
