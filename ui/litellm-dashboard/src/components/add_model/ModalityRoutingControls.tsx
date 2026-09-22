import React from "react";
import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

export const ModalityRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation("models");
  const modalityRouting = value.modality_routing ?? false;
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={modalityRouting}
          onCheckedChange={(nextModalityRouting) => onChange({ ...value, modality_routing: nextModalityRouting })}
          aria-label={t("autoRouterConfig.complexity.modality.routingLabel")}
        />
        <strong className="font-semibold">{t("autoRouterConfig.complexity.modality.routingLabel")}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {t("autoRouterConfig.complexity.modality.routingHelp")}
      </span>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.modality_pin_override ?? false}
          onCheckedChange={(modalityPinOverride) => onChange({ ...value, modality_pin_override: modalityPinOverride })}
          disabled={!modalityRouting}
          aria-label={t("autoRouterConfig.complexity.modality.overrideLabel")}
        />
        <strong className="font-semibold">{t("autoRouterConfig.complexity.modality.overrideLabel")}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        {t("autoRouterConfig.complexity.modality.overrideHelp")}
      </span>
    </>
  );
};
