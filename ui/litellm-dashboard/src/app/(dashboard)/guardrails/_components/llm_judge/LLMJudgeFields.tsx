"use client";

import { Plus, X } from "lucide-react";
import type { ParseKeys } from "i18next";
import React, { useMemo } from "react";
import { useController } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  asText,
  GuardrailField,
  labelWithHint,
  requiredRule,
  type GuardrailCriterion,
  type GuardrailFieldControlProps,
  type GuardrailFormControl,
} from "../GuardrailFormField";

interface LLMJudgeFieldsProps {
  availableModels: string[];
  control: GuardrailFormControl;
}

const DEFAULT_CRITERIA: GuardrailCriterion[] = [{ name: "", weight: 100, description: "" }];

const ON_FAILURE_ITEM_KEYS = [
  { labelKey: "llmJudge.onFailureBlock", value: "block" },
  { labelKey: "llmJudge.onFailureLog", value: "log" },
] as const satisfies ReadonlyArray<{ labelKey: ParseKeys<"guardrails">; value: string }>;

const clampToRange = (value: unknown, min: number, max: number): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.min(max, Math.max(min, value));
};

interface BoundedNumberInputProps {
  control: GuardrailFieldControlProps;
  min: number;
  max: number;
  suffix: string;
  placeholder?: string;
}

const BoundedNumberInput: React.FC<BoundedNumberInputProps> = ({ control, min, max, suffix, placeholder }) => {
  const { id, name, value, onChange, onBlur, ...aria } = control;

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        name={name}
        type="number"
        min={min}
        max={max}
        placeholder={placeholder}
        value={asText(value)}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        onBlur={() => {
          onChange(clampToRange(value, min, max));
          onBlur();
        }}
        {...aria}
      />
      <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>
    </InputGroup>
  );
};

const LLMJudgeFields: React.FC<LLMJudgeFieldsProps> = ({ availableModels, control }) => {
  const { t } = useTranslation("guardrails");
  const onFailureItems = useMemo(
    () => ON_FAILURE_ITEM_KEYS.map(({ labelKey, value }) => ({ label: t(labelKey), value })),
    [t],
  );
  const { field } = useController({ control, name: "criteria", defaultValue: DEFAULT_CRITERIA });
  const criteria: GuardrailCriterion[] = Array.isArray(field.value) ? field.value : [];
  const setCriteria = field.onChange;

  const weightTotal = criteria.reduce((sum, entry) => sum + (Number(entry?.weight) || 0), 0);
  const weightOk = weightTotal === 100;

  return (
    <FieldGroup>
      <div className="rounded-md border border-success/20 bg-success/10 px-3.5 py-2.5 text-[13px] text-success">
        <Trans ns="guardrails" i18nKey="llmJudge.intro" components={{ strong: <strong /> }} />
      </div>

      <GuardrailField
        control={control}
        name="judge_model"
        label={labelWithHint(t("llmJudge.judgeModel"), t("llmJudge.judgeModelHint"))}
        rules={requiredRule(t("llmJudge.selectJudgeModel"))}
      >
        {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
          <Combobox items={availableModels} value={asText(value) || null} onValueChange={onChange}>
            <ComboboxInput
              id={id}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              placeholder={t("llmJudge.selectModel")}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxEmpty>{t("llmJudge.noMatchingModels")}</ComboboxEmpty>
              <ComboboxList>
                {(model: string) => (
                  <ComboboxItem key={model} value={model} title={model}>
                    {model}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </GuardrailField>

      <GuardrailField
        control={control}
        name="overall_threshold"
        label={labelWithHint(t("llmJudge.minScore"), t("llmJudge.minScoreHint"))}
        defaultValue={80}
      >
        {(fieldControl) => <BoundedNumberInput control={fieldControl} min={0} max={100} suffix="/ 100" />}
      </GuardrailField>

      <GuardrailField
        control={control}
        name="on_failure"
        label={labelWithHint(t("llmJudge.onFailure"), t("llmJudge.onFailureHint"))}
        defaultValue="block"
      >
        {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
          <Select items={onFailureItems} value={asText(value) || null} onValueChange={onChange}>
            <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className="w-full">
              <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
              {onFailureItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </GuardrailField>

      <Field>
        <FieldLabel>{labelWithHint(t("llmJudge.criteria"), t("llmJudge.criteriaHint"))}</FieldLabel>

        {criteria.map((_, index) => (
          <div key={index} className="mb-2 rounded-md border border-border p-3">
            <div className="flex items-end gap-2">
              <GuardrailField
                control={control}
                name={`criteria.${index}.name`}
                rules={requiredRule(t("llmJudge.enterCriterionName"))}
                className="flex-2"
              >
                {({ ref, value, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    value={asText(value)}
                    placeholder={t("llmJudge.criterionNamePlaceholder")}
                  />
                )}
              </GuardrailField>
              <GuardrailField
                control={control}
                name={`criteria.${index}.weight`}
                label={labelWithHint(
                  <span className="text-xs text-muted-foreground">{t("llmJudge.weight")}</span>,
                  t("llmJudge.weightHint"),
                )}
                rules={requiredRule(t("llmJudge.enterWeight"))}
                className="flex-1"
              >
                {(fieldControl) => (
                  <BoundedNumberInput control={fieldControl} min={0} max={100} suffix="%" placeholder="e.g. 50" />
                )}
              </GuardrailField>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t("llmJudge.removeCriterion")}
                className="mb-1 text-destructive hover:text-destructive/80"
                onClick={() => setCriteria(criteria.filter((_, position) => position !== index))}
              >
                <X className="size-4" />
              </Button>
            </div>
            <GuardrailField
              control={control}
              name={`criteria.${index}.description`}
              rules={requiredRule(t("llmJudge.describeCheck"))}
              className="mt-2"
            >
              {({ ref, value, ...field }) => (
                <Input
                  {...field}
                  ref={ref}
                  value={asText(value)}
                  placeholder={t("llmJudge.criterionDescriptionPlaceholder")}
                />
              )}
            </GuardrailField>
          </div>
        ))}

        <Button
          variant="outline"
          className="mt-1 w-full border-dashed"
          onClick={() => setCriteria([...criteria, { name: "", weight: 0, description: "" }])}
        >
          <Plus className="size-4" />
          {t("llmJudge.addCriterion")}
        </Button>

        {criteria.length > 0 && (
          <div className={`mt-1.5 text-xs ${weightOk ? "text-success" : "text-warning"}`}>
            {t("llmJudge.weightsTotal", { value: weightTotal })}
            {weightOk ? " ✓" : t("llmJudge.weightsTotalInvalidSuffix")}
          </div>
        )}
      </Field>
    </FieldGroup>
  );
};

export default LLMJudgeFields;
