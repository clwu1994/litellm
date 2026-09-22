"use client";

import type { ParseKeys, TFunction } from "i18next";
import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { toast } from "@/lib/toast";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Separator } from "@/components/ui/separator";
import { useZodForm } from "@/lib/forms/useZodForm";
import { SENSITIVE_FIELDS, FIELD_LABEL_KEYS } from "./constants";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VaultFieldGroup {
  titleKey: ParseKeys<"settings">;
  subtitleKey?: ParseKeys<"settings">;
  fields: string[];
}

const FIELD_GROUPS: VaultFieldGroup[] = [
  {
    titleKey: "vault.groups.connection",
    fields: ["vault_addr", "vault_namespace", "vault_mount_name", "vault_path_prefix"],
  },
  {
    titleKey: "vault.groups.tokenAuth",
    subtitleKey: "vault.groups.tokenAuthSubtitle",
    fields: ["vault_token"],
  },
  {
    titleKey: "vault.groups.approleAuth",
    subtitleKey: "vault.groups.approleAuthSubtitle",
    fields: ["approle_role_id", "approle_secret_id", "approle_mount_path"],
  },
  {
    titleKey: "vault.groups.tls",
    subtitleKey: "vault.groups.tlsSubtitle",
    fields: ["client_cert", "client_key", "vault_cert_role"],
  },
];

type VaultFormValues = Record<string, string>;

const buildSchema = (
  fields: readonly string[],
  t: TFunction<"settings">,
): z.ZodType<VaultFormValues, VaultFormValues> =>
  z.object(
    Object.fromEntries(
      fields.map((name) => [
        name,
        name === "vault_addr"
          ? z.string().refine((value) => value.length === 0 || /^https?:\/\/.+/.test(value), {
              message: t("shared.urlMustStart"),
            })
          : z.string(),
      ]),
    ),
  ) as unknown as z.ZodType<VaultFormValues, VaultFormValues>;

interface EditHashicorpVaultModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditHashicorpVaultModal: React.FC<EditHashicorpVaultModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t } = useTranslation("settings");
  const { accessToken } = useAuthorized();
  const { data } = useHashicorpVaultConfig();
  const { mutate, isPending } = useUpdateHashicorpVaultConfig(accessToken);

  const properties: Record<string, { description?: string }> = useMemo(
    () => data?.field_schema?.properties ?? {},
    [data],
  );
  const rawValues: Record<string, unknown> = useMemo(() => data?.values ?? {}, [data]);

  const visibleFields = useMemo(
    () => FIELD_GROUPS.flatMap((group) => group.fields).filter((name) => properties[name] !== undefined),
    [properties],
  );

  const seededValues = useMemo(
    () =>
      Object.fromEntries(
        visibleFields.map((name) => [name, SENSITIVE_FIELDS.has(name) ? "" : ((rawValues[name] ?? "") as string)]),
      ),
    [visibleFields, rawValues],
  );

  const schema = useMemo(() => buildSchema(visibleFields, t), [visibleFields, t]);
  const form = useZodForm(schema, { values: seededValues });

  const fieldLabel = (fieldName: string) => {
    const key = FIELD_LABEL_KEYS[fieldName];
    return key ? t(key) : fieldName;
  };

  const handleSubmit = (formValues: VaultFormValues) => {
    const config: Record<string, string> = Object.fromEntries(
      Object.entries(formValues).flatMap(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") return [[key, value]];
        if (!SENSITIVE_FIELDS.has(key)) return [[key, ""]];
        return [];
      }),
    );

    mutate(config, {
      onSuccess: () => {
        toast.success(t("vault.updatedSuccess"));
        onSuccess();
      },
      onError: (err) => {
        toast.fromError(err);
      },
    });
  };

  const handleCancel = () => {
    form.reset(seededValues);
    onCancel();
  };

  const renderField = (fieldName: string) => {
    const fieldSchema = properties[fieldName];
    if (!fieldSchema) return null;

    const isSensitive = SENSITIVE_FIELDS.has(fieldName);
    const existingValue = rawValues[fieldName];
    const hasExistingValue = isSensitive && existingValue != null && existingValue !== "";
    const placeholder = hasExistingValue
      ? t("shared.leaveBlankToKeep", { value: existingValue })
      : fieldSchema?.description;

    return (
      <FormField key={fieldName} control={form.control} name={fieldName} label={fieldLabel(fieldName)}>
        {({ ref, ...field }) =>
          isSensitive ? (
            <PasswordInput ref={ref} placeholder={placeholder} {...field} />
          ) : (
            <Input ref={ref} placeholder={fieldSchema?.description} {...field} />
          )
        }
      </FormField>
    );
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t("vault.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {FIELD_GROUPS.map((group, index) => (
            <div key={group.titleKey}>
              {index > 0 && <Separator className="my-6" />}
              <h5 className="mb-1 text-base font-semibold text-foreground">{t(group.titleKey)}</h5>
              {group.subtitleKey && <p className="mb-4 text-sm text-muted-foreground">{t(group.subtitleKey)}</p>}
              <FieldGroup>{group.fields.map(renderField)}</FieldGroup>
            </div>
          ))}
        </form>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              {t("shared.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={() => void form.handleSubmit(handleSubmit)()}>
              {isPending && <UiLoadingSpinner className="size-4 mr-1" />}
              {isPending ? t("shared.saving") : t("shared.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHashicorpVaultModal;
