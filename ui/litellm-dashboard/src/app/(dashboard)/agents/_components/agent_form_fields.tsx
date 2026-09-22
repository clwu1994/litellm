import React from "react";
import { useTranslation } from "react-i18next";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import {
  AGENT_FORM_CONFIG,
  SKILL_FIELD_CONFIG,
  fieldHelpText,
  fieldLabel,
  fieldPlaceholder,
  fieldTooltip,
  sectionTitle,
} from "./agent_config";
import CostConfigFields, { COST_FIELD_NAMES } from "./cost_config_fields";
import {
  AgentFormField,
  AgentFormPanel,
  AgentFormValues,
  AgentTagsInput,
  CollapsiblePanelsState,
  labelWithHint,
} from "./AgentFormKit";

const AUTH_HEADERS_PANEL_KEY = "auth_headers";

const namesOf = (fields: readonly { name: string }[]): readonly string[] => fields.map((field) => field.name);

export const A2A_PANEL_FIELD_NAMES: Readonly<Record<string, readonly string[]>> = {
  [AGENT_FORM_CONFIG.basic.key]: namesOf(AGENT_FORM_CONFIG.basic.fields),
  [AGENT_FORM_CONFIG.skills.key]: ["skills"],
  [AGENT_FORM_CONFIG.capabilities.key]: namesOf(AGENT_FORM_CONFIG.capabilities.fields),
  [AGENT_FORM_CONFIG.optional.key]: namesOf(AGENT_FORM_CONFIG.optional.fields),
  [AGENT_FORM_CONFIG.cost.key]: COST_FIELD_NAMES,
  [AGENT_FORM_CONFIG.litellm.key]: namesOf(AGENT_FORM_CONFIG.litellm.fields),
  [AUTH_HEADERS_PANEL_KEY]: ["static_headers", "extra_headers"],
};

export const unmountedA2AFieldNames = (mountedPanels: readonly string[]): readonly string[] =>
  Object.entries(A2A_PANEL_FIELD_NAMES)
    .filter(([panelKey]) => !mountedPanels.includes(panelKey))
    .flatMap(([, fieldNames]) => fieldNames);

interface AgentFormFieldsProps {
  panels: CollapsiblePanelsState;
  showAgentName?: boolean;
  visiblePanels?: string[];
}

const SkillsFieldArray = () => {
  const { t } = useTranslation("agents");
  const { control } = useFormContext<AgentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "skills" });

  return (
    <>
      {fields.map((item, index) => (
        <div key={item.id} className="rounded-md border border-border p-4">
          <FieldGroup>
            <AgentFormField
              name={`skills.${index}.id`}
              label={fieldLabel(SKILL_FIELD_CONFIG.id, t)}
              rules={SKILL_FIELD_CONFIG.id.required ? { required: t("form.validation.required") } : undefined}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  placeholder={fieldPlaceholder(SKILL_FIELD_CONFIG.id, t)}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.name`}
              label={fieldLabel(SKILL_FIELD_CONFIG.name, t)}
              rules={SKILL_FIELD_CONFIG.name.required ? { required: t("form.validation.required") } : undefined}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  placeholder={fieldPlaceholder(SKILL_FIELD_CONFIG.name, t)}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.description`}
              label={fieldLabel(SKILL_FIELD_CONFIG.description, t)}
              rules={SKILL_FIELD_CONFIG.description.required ? { required: t("form.validation.required") } : undefined}
            >
              {({ value, onChange, ref, ...control }) => (
                <Textarea
                  {...control}
                  ref={ref}
                  rows={SKILL_FIELD_CONFIG.description.rows}
                  placeholder={fieldPlaceholder(SKILL_FIELD_CONFIG.description, t)}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.tags`}
              label={fieldLabel(SKILL_FIELD_CONFIG.tags, t)}
              rules={SKILL_FIELD_CONFIG.tags.required ? { required: t("form.validation.required") } : undefined}
            >
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={fieldPlaceholder(SKILL_FIELD_CONFIG.tags, t)}
                />
              )}
            </AgentFormField>

            <AgentFormField name={`skills.${index}.examples`} label={fieldLabel(SKILL_FIELD_CONFIG.examples, t)}>
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={fieldPlaceholder(SKILL_FIELD_CONFIG.examples, t)}
                />
              )}
            </AgentFormField>
          </FieldGroup>

          <Button
            type="button"
            variant="ghost"
            className="mt-4 text-destructive hover:text-destructive/80"
            onClick={() => remove(index)}
          >
            <Trash2 />
            {t("form.skills.remove")}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {t("form.skills.add")}
      </Button>
    </>
  );
};

const StaticHeadersFieldArray = () => {
  const { t } = useTranslation("agents");
  const { control } = useFormContext<AgentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "static_headers" });

  return (
    <>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <AgentFormField
            name={`static_headers.${index}.header`}
            rules={{ required: t("form.authHeaders.headerRequired") }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-55"
                placeholder={t("form.authHeaders.headerPlaceholder")}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <AgentFormField
            name={`static_headers.${index}.value`}
            rules={{ required: t("form.authHeaders.valueRequired") }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-65"
                placeholder={t("form.authHeaders.valuePlaceholder")}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("form.authHeaders.remove")}
            className="text-destructive hover:text-destructive/80"
            onClick={() => remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {t("form.authHeaders.add")}
      </Button>
    </>
  );
};

const AgentFormFields: React.FC<AgentFormFieldsProps> = ({ panels, showAgentName = true, visiblePanels }) => {
  const { t } = useTranslation("agents");
  const shouldShow = (key: string) => !visiblePanels || visiblePanels.includes(key);

  return (
    <>
      {showAgentName && (
        <FieldGroup className="mb-4">
          <AgentFormField
            name="agent_name"
            label={labelWithHint(t("info.fields.agentName"), t("form.agentNameHint"))}
            rules={{ required: t("form.validation.uniqueAgentName") }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                placeholder={t("form.agentNamePlaceholder")}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
        </FieldGroup>
      )}

      <div className="mb-4 rounded-md border border-border px-4">
        {shouldShow(AGENT_FORM_CONFIG.basic.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.basic.key}
            title={sectionTitle(AGENT_FORM_CONFIG.basic, t)}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.basic.fields.map((field) => {
              const label = fieldLabel(field, t);
              const tooltip = fieldTooltip(field, t);
              const helpText = fieldHelpText(field, t);
              return (
                <AgentFormField
                  key={field.name}
                  name={field.name}
                  label={tooltip ? labelWithHint(label, tooltip) : label}
                  description={helpText}
                  rules={
                    field.required
                      ? { required: t("form.validation.enterField", { field: label.toLowerCase() }) }
                      : undefined
                  }
                >
                  {({ value, onChange, ref, ...control }) => {
                    const text = typeof value === "string" ? value : "";
                    if (field.type === "textarea") {
                      return (
                        <Textarea
                          {...control}
                          ref={ref}
                          rows={field.rows}
                          placeholder={fieldPlaceholder(field, t)}
                          value={text}
                          onChange={onChange}
                        />
                      );
                    }
                    if (field.type === "select") {
                      return (
                        <Select value={text || null} onValueChange={onChange}>
                          <SelectTrigger {...control} className="w-full">
                            <SelectValue placeholder={fieldPlaceholder(field, t)} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options ?? []).map((option) => (
                              <SelectItem key={option} value={option} title={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }
                    return (
                      <Input
                        {...control}
                        ref={ref}
                        placeholder={fieldPlaceholder(field, t)}
                        value={text}
                        onChange={onChange}
                      />
                    );
                  }}
                </AgentFormField>
              );
            })}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.skills.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.skills.key}
            title={sectionTitle(AGENT_FORM_CONFIG.skills, t)}
            panels={panels}
          >
            <SkillsFieldArray />
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.capabilities.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.capabilities.key}
            title={sectionTitle(AGENT_FORM_CONFIG.capabilities, t)}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.capabilities.fields.map((field) => (
              <AgentFormField key={field.name} name={field.name} label={fieldLabel(field, t)}>
                {({ value, onChange, ref, ...control }) => (
                  <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                )}
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.optional.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.optional.key}
            title={sectionTitle(AGENT_FORM_CONFIG.optional, t)}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.optional.fields.map((field) => (
              <AgentFormField key={field.name} name={field.name} label={fieldLabel(field, t)}>
                {({ value, onChange, ref, ...control }) =>
                  field.type === "switch" ? (
                    <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                  ) : (
                    <Input
                      {...control}
                      ref={ref}
                      placeholder={fieldPlaceholder(field, t)}
                      value={typeof value === "string" ? value : ""}
                      onChange={onChange}
                    />
                  )
                }
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.cost.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.cost.key}
            title={sectionTitle(AGENT_FORM_CONFIG.cost, t)}
            panels={panels}
          >
            <CostConfigFields />
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.litellm.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.litellm.key}
            title={sectionTitle(AGENT_FORM_CONFIG.litellm, t)}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.litellm.fields.map((field) => (
              <AgentFormField key={field.name} name={field.name} label={fieldLabel(field, t)}>
                {({ value, onChange, ref, ...control }) =>
                  field.type === "switch" ? (
                    <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                  ) : (
                    <Input
                      {...control}
                      ref={ref}
                      placeholder={fieldPlaceholder(field, t)}
                      value={typeof value === "string" ? value : ""}
                      onChange={onChange}
                    />
                  )
                }
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AUTH_HEADERS_PANEL_KEY) && (
          <AgentFormPanel panelKey={AUTH_HEADERS_PANEL_KEY} title={t("form.panels.authHeaders")} panels={panels}>
            <Field>
              <FieldTitle>
                {labelWithHint(t("form.authHeaders.staticHeaders"), t("form.authHeaders.staticHeadersHint"))}
              </FieldTitle>
              <div className="flex flex-col gap-2">
                <StaticHeadersFieldArray />
              </div>
            </Field>

            <AgentFormField
              name="extra_headers"
              label={labelWithHint(
                t("form.authHeaders.forwardClientHeaders"),
                t("form.authHeaders.forwardClientHeadersHint"),
              )}
            >
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={t("form.authHeaders.forwardPlaceholder")}
                />
              )}
            </AgentFormField>
          </AgentFormPanel>
        )}
      </div>
    </>
  );
};

export default AgentFormFields;
