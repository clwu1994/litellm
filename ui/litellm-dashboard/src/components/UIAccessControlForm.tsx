import { CircleHelp } from "lucide-react";
import type { TFunction } from "i18next";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWatch } from "react-hook-form";
import { z } from "zod/v4";

import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";

import { toast } from "@/lib/toast";
import { getSSOSettings, updateSSOSettings } from "./networking";

interface UIAccessControlFormProps {
  accessToken: string | null;
  onSuccess: () => void;
}

const uiAccessControlSchema = (groupRequiredMessage: string) =>
  z
    .object({
      ui_access_mode_type: z.string().optional(),
      restricted_sso_group: z.string().optional(),
      sso_group_jwt_field: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (values.ui_access_mode_type !== "restricted_sso_group" || values.restricted_sso_group) {
        return;
      }
      ctx.addIssue({
        code: "custom",
        path: ["restricted_sso_group"],
        message: groupRequiredMessage,
      });
    });

type UIAccessControlFormValues = z.output<ReturnType<typeof uiAccessControlSchema>>;

const uiAccessModeOptions = (t: TFunction<"adminPanel">) =>
  [
    { value: "all_authenticated_users", label: t("uiAccessControlForm.allAuthenticatedUsers") },
    { value: "restricted_sso_group", label: t("uiAccessControlForm.restrictedSsoGroup") },
  ] as const;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const asString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

const toFormValues = (ssoData: unknown): UIAccessControlFormValues | null => {
  const values = asRecord(asRecord(ssoData)?.values);
  if (!values) {
    return null;
  }

  const nestedAccessMode = asRecord(values.ui_access_mode);
  if (nestedAccessMode) {
    return {
      ui_access_mode_type: asString(nestedAccessMode.type),
      restricted_sso_group: asString(nestedAccessMode.restricted_sso_group),
      sso_group_jwt_field: asString(nestedAccessMode.sso_group_jwt_field),
    };
  }

  const legacyAccessMode = asString(values.ui_access_mode);
  if (legacyAccessMode !== undefined) {
    return {
      ui_access_mode_type: legacyAccessMode,
      restricted_sso_group: asString(values.restricted_sso_group),
      sso_group_jwt_field: asString(values.team_ids_jwt_field) || asString(values.sso_group_jwt_field),
    };
  }

  return null;
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const UIAccessControlForm: React.FC<UIAccessControlFormProps> = ({ accessToken, onSuccess }) => {
  const { t } = useTranslation("adminPanel");
  const form = useZodForm(uiAccessControlSchema(t("uiAccessControlForm.groupRequired")), { defaultValues: {} });
  const [loading, setLoading] = useState(false);
  const uiAccessModeType = useWatch({ control: form.control, name: "ui_access_mode_type" });
  const accessModeOptions = uiAccessModeOptions(t);

  useEffect(() => {
    const loadUIAccessSettings = async () => {
      if (accessToken) {
        try {
          const formValues = toFormValues(await getSSOSettings(accessToken));
          if (formValues) {
            form.setValue("ui_access_mode_type", formValues.ui_access_mode_type);
            form.setValue("restricted_sso_group", formValues.restricted_sso_group);
            form.setValue("sso_group_jwt_field", formValues.sso_group_jwt_field);
          }
        } catch (error) {
          console.error("Failed to load UI access settings:", error);
        }
      }
    };

    loadUIAccessSettings();
  }, [accessToken, form]);

  const handleUIAccessSubmit = async (formValues: UIAccessControlFormValues) => {
    if (!accessToken) {
      toast.fromError(t("uiAccessControlForm.noAccessToken"));
      return;
    }

    setLoading(true);
    try {
      const apiPayload =
        formValues.ui_access_mode_type === "all_authenticated_users"
          ? { ui_access_mode: "none" }
          : {
              ui_access_mode: {
                type: formValues.ui_access_mode_type,
                restricted_sso_group: formValues.restricted_sso_group,
                sso_group_jwt_field: formValues.sso_group_jwt_field,
              },
            };

      await updateSSOSettings(accessToken, apiPayload);
      onSuccess();
    } catch (error) {
      console.error("Failed to save UI access settings:", error);
      toast.fromError(t("uiAccessControlForm.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const submitMountedValues = (formValues: UIAccessControlFormValues) =>
    handleUIAccessSubmit(
      formValues.ui_access_mode_type === "restricted_sso_group"
        ? formValues
        : { ...formValues, restricted_sso_group: undefined },
    );

  return (
    <TooltipProvider>
      <div className="p-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{t("uiAccessControlForm.description")}</p>
        </div>

        <form onSubmit={form.handleSubmit(submitMountedValues)} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="ui_access_mode_type"
              label={labelWithHint(t("uiAccessControlForm.accessModeLabel"), t("uiAccessControlForm.accessModeHint"))}
            >
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Select
                  items={accessModeOptions}
                  value={value ?? null}
                  onValueChange={(selected) => onChange(selected ?? undefined)}
                >
                  <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                  >
                    <SelectValue placeholder={t("uiAccessControlForm.accessModePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {accessModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {uiAccessModeType === "restricted_sso_group" && (
              <FormField
                control={form.control}
                name="restricted_sso_group"
                label={t("uiAccessControlForm.restrictedSsoGroup")}
              >
                {({ ref, value, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    value={value ?? ""}
                    placeholder={t("uiAccessControlForm.restrictedGroupPlaceholder")}
                  />
                )}
              </FormField>
            )}

            <FormField
              control={form.control}
              name="sso_group_jwt_field"
              label={labelWithHint(t("uiAccessControlForm.jwtFieldLabel"), t("uiAccessControlForm.jwtFieldHint"))}
            >
              {({ ref, value, ...field }) => (
                <Input
                  {...field}
                  ref={ref}
                  value={value ?? ""}
                  placeholder={t("uiAccessControlForm.jwtFieldPlaceholder")}
                />
              )}
            </FormField>
          </FieldGroup>

          <div className="mt-4 text-right">
            <Button type="submit" disabled={loading}>
              {loading && <UiLoadingSpinner className="size-4" />}
              {t("uiAccessControlForm.submit")}
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
};

export default UIAccessControlForm;
