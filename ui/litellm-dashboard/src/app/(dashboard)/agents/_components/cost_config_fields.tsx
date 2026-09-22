import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { AGENT_FORM_CONFIG, fieldLabel, fieldPlaceholder, fieldTooltip } from "./agent_config";
import { AgentFormField, labelWithHint } from "./AgentFormKit";

export const COST_FIELD_NAMES: readonly string[] = AGENT_FORM_CONFIG.cost.fields.map((field) => field.name);

const CostConfigFields: React.FC = () => {
  const { t } = useTranslation("agents");

  return (
    <>
      {AGENT_FORM_CONFIG.cost.fields.map((field) => {
        const label = fieldLabel(field, t);
        const tooltip = fieldTooltip(field, t);
        return (
          <AgentFormField key={field.name} name={field.name} label={tooltip ? labelWithHint(label, tooltip) : label}>
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                type="number"
                step="0.000001"
                placeholder={fieldPlaceholder(field, t)}
                value={typeof value === "string" || typeof value === "number" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
        );
      })}
    </>
  );
};

export default CostConfigFields;
