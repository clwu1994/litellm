import React, { useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Trans, useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { translatedValidatorRules } from "../common_components/formRules";
import { MountedFormField, type MountedFormValues } from "../common_components/MountedFormField";
import { Providers } from "../provider_info_helpers";

interface ModelMapping {
  public_name: string;
  litellm_model: string;
}

const sameMappings = (left: readonly ModelMapping[], right: readonly ModelMapping[]): boolean =>
  left.length === right.length &&
  left.every(
    (mapping, index) =>
      mapping.public_name === right[index].public_name && mapping.litellm_model === right[index].litellm_model,
  );

const modelMappingsRule = {
  validator: async (_: unknown, value: unknown) => {
    if (!value || (value as ModelMapping[]).length === 0) {
      throw { key: "addModel.mappings.atLeastOne" };
    }
    const invalidMappings = (value as ModelMapping[]).filter(
      (mapping) => !mapping.public_name || mapping.public_name.trim() === "",
    );
    if (invalidMappings.length > 0) {
      throw { key: "addModel.mappings.validPublicNames" };
    }
  },
};

const tooltipCodeClassName = "rounded-sm bg-background/20 px-1 py-0.5 font-mono text-xs";

const ANTHROPIC_1M_HEADERS = JSON.stringify({ extra_headers: { "anthropic-beta": "context-1m-2025-08-07" } }, null, 2);

const PublicNameTooltipContent: React.FC = () => {
  const { t } = useTranslation("models");
  return (
    <div className="flex flex-col gap-2 text-left font-normal">
      <div>{t("addModel.mappings.tooltipIntro")}</div>
      <div>
        <Trans
          ns="models"
          i18nKey="addModel.mappings.tooltipExample"
          components={{ strong: <strong />, code: <code className={tooltipCodeClassName} /> }}
        />
      </div>
      <div>
        <Trans
          ns="models"
          i18nKey="addModel.mappings.tooltipUsage"
          components={{ strong: <strong />, code: <code className={tooltipCodeClassName} /> }}
        />
      </div>
      <div>
        <Trans
          ns="models"
          i18nKey="addModel.mappings.tooltipResult"
          components={{ strong: <strong />, code: <code className={tooltipCodeClassName} /> }}
        />
      </div>
    </div>
  );
};

const PublicNameInput: React.FC<{ readonly index: number; readonly value: string }> = ({ index, value }) => {
  const form = useFormContext<MountedFormValues>();
  const selectedProvider = useWatch({ control: form.control, name: "custom_llm_provider" });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value;
    const litellmParams = form.getValues("litellm_extra_params") as string | undefined;
    const wantsAnthropic1m =
      selectedProvider === Providers.Anthropic && typed.endsWith("-1m") && (litellmParams ?? "").trim() === "";

    if (wantsAnthropic1m) {
      form.setValue("litellm_extra_params", ANTHROPIC_1M_HEADERS);
    }

    const publicName = wantsAnthropic1m ? typed.slice(0, -"-1m".length) : typed;
    const current = (form.getValues("model_mappings") as ModelMapping[]) ?? [];
    form.setValue(
      "model_mappings",
      current.map((mapping, mappingIndex) =>
        mappingIndex === index ? { ...mapping, public_name: publicName } : mapping,
      ),
    );
  };

  return <Input value={value} onChange={handleChange} />;
};

const ConditionalPublicModelName: React.FC = () => {
  const { t } = useTranslation("models");
  const form = useFormContext<MountedFormValues>();

  const modelValue = useWatch({ control: form.control, name: "model" }) || [];
  const selectionKey = JSON.stringify(Array.isArray(modelValue) ? modelValue : [modelValue]);
  const selectedModels = useMemo(() => JSON.parse(selectionKey) as string[], [selectionKey]);
  const customModelName = useWatch({ control: form.control, name: "custom_model_name" }) as string | undefined;
  const showPublicModelName = !selectedModels.includes("all-wildcard");
  const selectedProvider = useWatch({ control: form.control, name: "custom_llm_provider" });

  const columns: ColumnDef<ModelMapping>[] = useMemo(
    () => [
      {
        id: "public_name",
        accessorKey: "public_name",
        header: () => (
          <span className="flex items-center">
            {t("addModel.mappings.publicModelName")}
            <SimpleTooltip content={<PublicNameTooltipContent />} width="500px" />
          </span>
        ),
        cell: ({ row }) => <PublicNameInput index={row.index} value={row.original.public_name} />,
      },
      {
        id: "litellm_model",
        accessorKey: "litellm_model",
        header: () => (
          <span className="flex items-center">
            {t("addModel.mappings.litellmModelName")}
            <SimpleTooltip content={<div>{t("addModel.modelName.hint")}</div>} width="360px" />
          </span>
        ),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (customModelName && selectedModels.includes("custom")) {
      const currentMappings = (form.getValues("model_mappings") as ModelMapping[]) || [];
      const updatedMappings = currentMappings.map((mapping) => {
        if (mapping.public_name === "custom" || mapping.litellm_model === "custom") {
          if (selectedProvider === Providers.Azure) {
            return {
              public_name: customModelName,
              litellm_model: `azure/${customModelName}`,
            };
          }
          return {
            public_name: customModelName,
            litellm_model: customModelName,
          };
        }
        return mapping;
      });
      if (!sameMappings(currentMappings, updatedMappings)) {
        form.setValue("model_mappings", updatedMappings);
      }
    }
  }, [customModelName, selectedModels, selectedProvider, form]);

  // Initial setup of model mappings when models are selected
  useEffect(() => {
    if (selectedModels.length > 0 && !selectedModels.includes("all-wildcard")) {
      // Check if we already have mappings that match the selected models
      const currentMappings = (form.getValues("model_mappings") as ModelMapping[]) || [];

      // Only update if the mappings don't exist or don't match the selected models
      const shouldUpdateMappings =
        currentMappings.length !== selectedModels.length ||
        !selectedModels.every((model) =>
          currentMappings.some((mapping) => {
            if (model === "custom") {
              return mapping.litellm_model === "custom" || mapping.litellm_model === customModelName;
            }
            if (selectedProvider === Providers.Azure) {
              return mapping.litellm_model === `azure/${model}`;
            }
            return mapping.litellm_model === model;
          }),
        );

      if (shouldUpdateMappings) {
        const mappings = selectedModels.map((model: string) => {
          if (model === "custom" && customModelName) {
            if (selectedProvider === Providers.Azure) {
              return {
                public_name: customModelName,
                litellm_model: `azure/${customModelName}`,
              };
            }
            return {
              public_name: customModelName,
              litellm_model: customModelName,
            };
          }
          if (selectedProvider === Providers.Azure) {
            return {
              public_name: model,
              litellm_model: `azure/${model}`,
            };
          }
          return {
            public_name: model,
            litellm_model: model,
          };
        });

        form.setValue("model_mappings", mappings);
      }
    }
  }, [selectedModels, customModelName, selectedProvider, form]);

  if (!showPublicModelName) return null;

  return (
    <MountedFormField
      name="model_mappings"
      label={
        <span className="flex items-center">
          {t("addModel.mappings.label")}
          <SimpleTooltip content={t("addModel.mappings.labelTooltip")} />
        </span>
      }
      required
      rules={{ validate: translatedValidatorRules(t, modelMappingsRule) }}
      className="mb-4"
    >
      {(control) => (
        <DataTable
          data={(control.value as ModelMapping[] | undefined) ?? []}
          columns={columns}
          getRowId={(row) => row.litellm_model}
          size="compact"
        />
      )}
    </MountedFormField>
  );
};

export default ConditionalPublicModelName;
