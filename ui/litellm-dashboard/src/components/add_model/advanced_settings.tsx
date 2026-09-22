import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { Dayjs } from "dayjs";
import { ChevronDown, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Team } from "../key_team_helpers/key_list";
import { translatedValidatorRules } from "../common_components/formRules";
import { labelWithHint } from "@/components/shared/form/LabelWithHint";
import { MountedFormField } from "../common_components/MountedFormField";
import { UtcDateTimeInput } from "@/components/shared/form/UtcDateTimeInput";
import CacheControlInjectionPoints, { NEW_CACHE_CONTROL_POINT } from "./cache_control_settings";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { Tag } from "../tag_management/types";
import { formItemValidateJSON } from "../../utils/textUtils";
import {
  PTU_COUNT_FIELD,
  PTU_RATE_FIELD,
  PTU_START_FIELD,
  ptuCountRules,
  ptuNoUsageCostRule,
  ptuPairRule,
  ptuRateRules,
  ptuStartRequiredRule,
  ptuWindowOrderRule,
  PTU_END_FIELD,
} from "../../utils/ptuValidation";
import { usePtuCostAttributionEnabled } from "@/app/(dashboard)/hooks/uiSettings/usePtuCostAttributionEnabled";

interface AdvancedSettingsProps {
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (show: boolean) => void;
  teams?: Team[] | null;
  guardrailsList: string[];
  tagsList: Record<string, Tag>;
  accessToken: string;
}

const USAGE_COST_FIELDS = [
  "input_cost_per_token",
  "output_cost_per_token",
  "cache_read_input_token_cost",
  "cache_creation_input_token_cost",
  "input_cost_per_second",
];

const REVALIDATED_WHEN_PTU_COUNT_CHANGES = [PTU_RATE_FIELD, PTU_START_FIELD, ...USAGE_COST_FIELDS];

const PRICING_MODEL_ITEMS = [
  { value: "per_token", labelKey: "addModel.advanced.perMillionTokens" },
  { value: "per_second", labelKey: "addModel.advanced.perSecond" },
] as const;

const validateNumber = (_: unknown, value: unknown) => {
  if (!value) {
    return Promise.resolve();
  }
  if (isNaN(Number(value)) || Number(value) < 0) {
    return Promise.reject({ key: "addModel.advanced.invalidNumber" });
  }
  return Promise.resolve();
};

const validateJson = (_: unknown, value: string) =>
  formItemValidateJSON(_, value).catch(() => Promise.reject({ key: "addModel.advanced.invalidJson" }));

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  showAdvancedSettings,
  setShowAdvancedSettings,
  teams,
  guardrailsList,
  tagsList,
  accessToken,
}) => {
  const { t } = useTranslation("models");
  const [customPricing, setCustomPricing] = React.useState(false);
  const [pricingModel, setPricingModel] = React.useState<"per_token" | "per_second">("per_token");
  const [showCacheControl, setShowCacheControl] = React.useState(false);
  const ptuCostAttributionEnabled = usePtuCostAttributionEnabled();

  const usageCostRules = React.useMemo(
    () => ({
      deps: [PTU_COUNT_FIELD],
      validate: translatedValidatorRules(t, { validator: validateNumber }, ptuNoUsageCostRule(PTU_COUNT_FIELD)),
    }),
    [t],
  );

  const pricingModelItems = React.useMemo(
    () => PRICING_MODEL_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) })),
    [t],
  );

  const handlePricingModelChange =
    (onChange: (value: string) => void) =>
    (value: "per_token" | "per_second" | null): void => {
      if (value === null) return;
      onChange(value);
      setPricingModel(value);
    };

  return (
    <>
      <Collapsible className="mt-2 mb-4 overflow-hidden rounded-lg border">
        <CollapsibleTrigger className="group/section flex w-full items-center justify-between px-4 py-3 text-left">
          <b>{t("addModel.advanced.heading")}</b>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-3">
          <div className="rounded-lg">
            <MountedFormField name="custom_pricing" label={t("addModel.advanced.customPricing")} className="mb-4">
              {(control) => (
                <Switch
                  id={control.id}
                  checked={control.value === true}
                  onCheckedChange={(checked) => {
                    control.onChange(checked);
                    setCustomPricing(checked);
                  }}
                />
              )}
            </MountedFormField>

            <MountedFormField
              name="vector_store_ids"
              label={
                <span>
                  {t("addModel.advanced.knowledgeBases")}{" "}
                  <SimpleTooltip content={t("addModel.advanced.knowledgeBasesTooltip")}>
                    <a
                      href="https://docs.litellm.ai/docs/completion/knowledgebase"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Info className="ml-1 inline size-3.5 align-text-bottom" />
                    </a>
                  </SimpleTooltip>
                </span>
              }
              className="mt-4"
              help={t("addModel.advanced.knowledgeBasesHelp")}
            >
              {(control) => (
                <VectorStoreSelector
                  onChange={control.onChange}
                  value={control.value as string[] | undefined}
                  accessToken={accessToken}
                  placeholder={t("addModel.advanced.knowledgeBasesPlaceholder")}
                />
              )}
            </MountedFormField>

            <MountedFormField
              name="guardrails"
              label={
                <span>
                  {t("addModel.advanced.guardrails")}{" "}
                  <SimpleTooltip content={t("addModel.advanced.guardrailsTooltip")}>
                    <a
                      href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                    >
                      <Info className="ml-1 inline size-3.5 align-text-bottom" />
                    </a>
                  </SimpleTooltip>
                </span>
              }
              className="mt-4"
              help={t("addModel.advanced.guardrailsHelp")}
            >
              {(control) => (
                <MultiSelect
                  id={control.id}
                  placeholder={t("addModel.advanced.guardrailsPlaceholder")}
                  emptyText={t("addModel.advanced.guardrailsEmpty")}
                  value={(control.value as string[] | undefined) ?? []}
                  onValueChange={control.onChange}
                  options={guardrailsList.map((name) => ({ value: name, label: name }))}
                  allowCustomValues
                />
              )}
            </MountedFormField>

            <MountedFormField name="tags" label={t("addModel.advanced.tags")} className="mb-4">
              {(control) => (
                <MultiSelect
                  id={control.id}
                  placeholder={t("addModel.advanced.tagsPlaceholder")}
                  emptyText={t("addModel.advanced.tagsEmpty")}
                  value={(control.value as string[] | undefined) ?? []}
                  onValueChange={control.onChange}
                  options={Object.values(tagsList).map((tag) => ({
                    value: tag.name,
                    label: tag.name,
                    description: tag.description || undefined,
                  }))}
                  allowCustomValues
                />
              )}
            </MountedFormField>

            {ptuCostAttributionEnabled && (
              <>
                <MountedFormField
                  name={PTU_COUNT_FIELD}
                  label={labelWithHint(t("addModel.advanced.ptuCount"), t("addModel.advanced.ptuCountHint"))}
                  rules={{
                    deps: REVALIDATED_WHEN_PTU_COUNT_CHANGES,
                    validate: translatedValidatorRules(
                      t,
                      { validator: validateNumber },
                      ...ptuCountRules,
                      ptuPairRule(PTU_RATE_FIELD),
                    ),
                  }}
                  className="mb-4"
                >
                  {(control) => (
                    <Input
                      id={control.id}
                      value={(control.value as string | undefined) ?? ""}
                      onChange={control.onChange}
                      onBlur={control.onBlur}
                      placeholder="e.g. 15"
                    />
                  )}
                </MountedFormField>

                <MountedFormField
                  name={PTU_RATE_FIELD}
                  label={labelWithHint(t("addModel.advanced.ptuRate"), t("addModel.advanced.ptuRateHint"))}
                  rules={{
                    deps: [PTU_COUNT_FIELD],
                    validate: translatedValidatorRules(
                      t,
                      { validator: validateNumber },
                      ...ptuRateRules,
                      ptuPairRule(PTU_COUNT_FIELD),
                    ),
                  }}
                  className="mb-4"
                >
                  {(control) => (
                    <Input
                      id={control.id}
                      value={(control.value as string | undefined) ?? ""}
                      onChange={control.onChange}
                      onBlur={control.onBlur}
                      placeholder="e.g. 2.00"
                    />
                  )}
                </MountedFormField>

                <MountedFormField
                  name={PTU_START_FIELD}
                  label={labelWithHint(t("addModel.advanced.ptuFrom"), t("addModel.advanced.ptuFromHint"))}
                  rules={{
                    deps: [PTU_END_FIELD],
                    validate: translatedValidatorRules(
                      t,
                      ptuStartRequiredRule(PTU_COUNT_FIELD),
                      ptuWindowOrderRule(PTU_END_FIELD, "start"),
                    ),
                  }}
                  className="mb-4"
                >
                  {(control) => (
                    <UtcDateTimeInput
                      id={control.id}
                      value={control.value as Dayjs | null}
                      onChange={control.onChange}
                      onBlur={control.onBlur}
                    />
                  )}
                </MountedFormField>

                <MountedFormField
                  name={PTU_END_FIELD}
                  label={labelWithHint(t("addModel.advanced.ptuTo"), t("addModel.advanced.ptuToHint"))}
                  rules={{
                    deps: [PTU_START_FIELD],
                    validate: translatedValidatorRules(t, ptuWindowOrderRule(PTU_START_FIELD, "end")),
                  }}
                  className="mb-4"
                >
                  {(control) => (
                    <UtcDateTimeInput
                      id={control.id}
                      value={control.value as Dayjs | null}
                      onChange={control.onChange}
                      onBlur={control.onBlur}
                    />
                  )}
                </MountedFormField>
              </>
            )}

            {customPricing && (
              <div className="ml-6 pl-4 border-l-2 border-border">
                <MountedFormField name="pricing_model" label={t("addModel.advanced.pricingModel")} className="mb-4">
                  {(control) => (
                    <Select
                      items={pricingModelItems}
                      value={(control.value as "per_token" | "per_second" | undefined) ?? "per_token"}
                      onValueChange={handlePricingModelChange(control.onChange)}
                    >
                      <SelectTrigger id={control.id} onBlur={control.onBlur} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingModelItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </MountedFormField>

                {pricingModel === "per_token" ? (
                  <>
                    <MountedFormField
                      name="input_cost_per_token"
                      label={t("addModel.advanced.inputCost")}
                      rules={usageCostRules}
                      className="mb-4"
                    >
                      {(control) => (
                        <Input
                          id={control.id}
                          value={(control.value as string | undefined) ?? ""}
                          onChange={control.onChange}
                          onBlur={control.onBlur}
                        />
                      )}
                    </MountedFormField>
                    <MountedFormField
                      name="output_cost_per_token"
                      label={t("addModel.advanced.outputCost")}
                      rules={usageCostRules}
                      className="mb-4"
                    >
                      {(control) => (
                        <Input
                          id={control.id}
                          value={(control.value as string | undefined) ?? ""}
                          onChange={control.onChange}
                          onBlur={control.onBlur}
                        />
                      )}
                    </MountedFormField>
                    <MountedFormField
                      name="cache_read_input_token_cost"
                      label={labelWithHint(
                        t("addModel.advanced.cacheReadCost"),
                        t("addModel.advanced.cacheReadCostHint"),
                      )}
                      rules={usageCostRules}
                      className="mb-4"
                    >
                      {(control) => (
                        <Input
                          id={control.id}
                          value={(control.value as string | undefined) ?? ""}
                          onChange={control.onChange}
                          onBlur={control.onBlur}
                          placeholder={t("addModel.advanced.defaultsToInputCost")}
                        />
                      )}
                    </MountedFormField>
                    <MountedFormField
                      name="cache_creation_input_token_cost"
                      label={labelWithHint(
                        t("addModel.advanced.cacheWriteCost"),
                        t("addModel.advanced.cacheWriteCostHint"),
                      )}
                      rules={usageCostRules}
                      className="mb-4"
                    >
                      {(control) => (
                        <Input
                          id={control.id}
                          value={(control.value as string | undefined) ?? ""}
                          onChange={control.onChange}
                          onBlur={control.onBlur}
                          placeholder={t("addModel.advanced.defaultsToInputCost")}
                        />
                      )}
                    </MountedFormField>
                  </>
                ) : (
                  <MountedFormField
                    name="input_cost_per_second"
                    label={t("addModel.advanced.costPerSecond")}
                    rules={usageCostRules}
                    className="mb-4"
                  >
                    {(control) => (
                      <Input
                        id={control.id}
                        value={(control.value as string | undefined) ?? ""}
                        onChange={control.onChange}
                        onBlur={control.onBlur}
                      />
                    )}
                  </MountedFormField>
                )}
              </div>
            )}

            <MountedFormField
              name="use_in_pass_through"
              label={labelWithHint(
                t("addModel.advanced.useInPassThrough"),
                <Trans
                  ns="models"
                  i18nKey="addModel.advanced.useInPassThroughHint"
                  components={{
                    learnMore: (
                      <a
                        href="https://docs.litellm.ai/docs/pass_through/vertex_ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      />
                    ),
                  }}
                />,
              )}
              className="mb-4 mt-4"
            >
              {(control) => (
                <Switch id={control.id} checked={control.value === true} onCheckedChange={control.onChange} />
              )}
            </MountedFormField>

            <MountedFormField
              name="cache_control"
              label={labelWithHint(
                t("addModel.advanced.cacheControlLabel"),
                t("addModel.advanced.cacheControlTooltip"),
              )}
              className="mb-4"
            >
              {(control) => (
                <Switch
                  id={control.id}
                  checked={control.value === true}
                  onCheckedChange={(checked) => {
                    control.onChange(checked);
                    setShowCacheControl(checked);
                  }}
                />
              )}
            </MountedFormField>

            {showCacheControl && (
              <MountedFormField name="cache_control_injection_points" defaultValue={[NEW_CACHE_CONTROL_POINT]} bare>
                {(control) => (
                  <CacheControlInjectionPoints
                    value={control.value as React.ComponentProps<typeof CacheControlInjectionPoints>["value"]}
                    onChange={control.onChange}
                  />
                )}
              </MountedFormField>
            )}
            <MountedFormField
              name="litellm_extra_params"
              label={labelWithHint(t("addModel.advanced.litellmParams"), t("addModel.advanced.litellmParamsHint"))}
              className="mb-4 mt-4"
              rules={{ validate: translatedValidatorRules(t, { validator: validateJson }) }}
            >
              {(control) => (
                <Textarea
                  id={control.id}
                  value={(control.value as string | undefined) ?? ""}
                  onChange={control.onChange}
                  onBlur={control.onBlur}
                  rows={4}
                  placeholder='{
                  "rpm": 100,
                  "timeout": 0,
                  "stream_timeout": 0
                }'
                />
              )}
            </MountedFormField>
            <div className="grid grid-cols-24 mb-4">
              <p className="col-start-11 col-span-10 text-muted-foreground text-sm">
                <Trans
                  ns="models"
                  i18nKey="addModel.advanced.passJsonIntro"
                  components={{
                    completionCall: (
                      <a
                        href="https://docs.litellm.ai/docs/completion/input"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      />
                    ),
                  }}
                />
              </p>
            </div>
            <MountedFormField
              name="model_info_params"
              label={labelWithHint(t("addModel.advanced.modelInfo"), t("addModel.advanced.modelInfoHint"))}
              className="mb-0"
              rules={{ validate: translatedValidatorRules(t, { validator: validateJson }) }}
            >
              {(control) => (
                <Textarea
                  id={control.id}
                  value={(control.value as string | undefined) ?? ""}
                  onChange={control.onChange}
                  onBlur={control.onBlur}
                  rows={4}
                  placeholder='{
                  "mode": "chat"
                }'
                />
              )}
            </MountedFormField>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};

export default AdvancedSettings;
