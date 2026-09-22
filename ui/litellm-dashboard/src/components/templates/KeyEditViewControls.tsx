import React from "react";
import { useTranslation } from "react-i18next";
import { Control } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { FormField } from "@/components/shared/form/FormField";
import AgentSelector from "../agent_management/AgentSelector";
import NumericalInput from "../shared/numerical_input";
import SkillSelector from "../skills/SkillSelector";
import { AgentsAndGroups, KeyEditFormValues } from "./keyEditFormValues";

export const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  </>
);

const KEY_TYPE_OPTIONS = [
  {
    value: "default",
    labelKey: "editControls.keyTypeFullAccess",
    hintKey: "editControls.keyTypeFullAccessHint",
  },
  { value: "llm_api", labelKey: "editControls.keyTypeAiApis", hintKey: "editControls.keyTypeAiApisHint" },
  {
    value: "management",
    labelKey: "editControls.keyTypeManagement",
    hintKey: "editControls.keyTypeManagementHint",
  },
] as const;

export const KeyTypeSelect = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation("templates");
  const options = KEY_TYPE_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
    hint: t(option.hintKey),
  }));

  return (
    <Select
      items={Object.fromEntries(options.map((option) => [option.value, option.label]))}
      value={value}
      onValueChange={(next: string | null) => next != null && onChange(next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={t("editControls.selectKeyType")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="py-1">
              <div className="font-medium">{option.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const KeyAgentAndSkillFields = ({
  control,
  accessToken,
}: {
  control: Control<KeyEditFormValues>;
  accessToken: string;
}) => {
  const { t } = useTranslation("templates");

  return (
    <>
      <FormField control={control} name="agents_and_groups" label={t("editControls.agentsAndGroups")}>
        {({ value, onChange }) => (
          <AgentSelector
            onChange={onChange}
            value={value as AgentsAndGroups | undefined}
            accessToken={accessToken}
            placeholder={t("editControls.selectAgents")}
          />
        )}
      </FormField>

      <FormField
        control={control}
        name="skills"
        label={labelWithHint(t("editControls.skills"), t("editControls.skillsHint"))}
      >
        {({ value, onChange }) => (
          <SkillSelector onChange={onChange} value={value as string[] | undefined} accessToken={accessToken} />
        )}
      </FormField>
    </>
  );
};

export const KeyBudgetNumberField = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<KeyEditFormValues>;
  name: "max_budget" | "soft_budget";
  label: string;
  placeholder: string;
}) => (
  <FormField control={control} name={name} label={label}>
    {({ ref: _ref, ...field }) => (
      <NumericalInput
        {...field}
        value={field.value ?? ""}
        step={0.01}
        style={{ width: "100%" }}
        placeholder={placeholder}
      />
    )}
  </FormField>
);
