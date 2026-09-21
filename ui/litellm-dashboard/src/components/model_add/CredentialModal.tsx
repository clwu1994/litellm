import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ProviderSpecificFields from "../add_model/provider_specific_fields";
import { requiredRule } from "../common_components/formRules";
import { labelWithHint } from "@/components/shared/form/LabelWithHint";
import {
  MountedFormField,
  MountedFormProvider,
  projectMountedValues,
  useMountRegistry,
  type MountedFormValues,
} from "../common_components/MountedFormField";
import { CredentialItem } from "../networking";
import { Providers } from "../provider_info_helpers";
import { Logo } from "@/components/molecules/logo/Logo";
import { resetCredentialFormOnProviderChange } from "./credential_form_helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const providerOptions: SearchSelectOption[] = Object.entries(Providers).map(([providerEnum, providerDisplayName]) => ({
  label: providerDisplayName,
  value: providerEnum,
  icon: <Logo provider={providerEnum} label={providerDisplayName} className="w-5 h-5" />,
}));

interface CredentialModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  mode: "add" | "edit";
  existingCredential?: CredentialItem | null;
}

export default function CredentialModal({
  open,
  onCancel,
  onSubmit,
  mode,
  existingCredential = null,
}: CredentialModalProps) {
  const { t } = useTranslation("models");
  const isEdit = mode === "edit";
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    (existingCredential?.credential_info.custom_llm_provider as Providers) ?? Providers.OpenAI,
  );

  const initialValues = existingCredential
    ? {
        credential_name: existingCredential.credential_name,
        custom_llm_provider: existingCredential.credential_info.custom_llm_provider,
        ...Object.fromEntries(
          Object.entries(existingCredential.credential_values || {}).map(([key, value]) => [key, value ?? null]),
        ),
      }
    : undefined;

  const form = useForm<MountedFormValues>({ mode: "onChange", defaultValues: initialValues });
  const registry = useMountRegistry();

  const formAdapter = {
    getFieldValue: (field: string) => form.getValues(field),
    resetFields: () => form.reset(),
    setFieldValue: (field: string, value: unknown) => form.setValue(field, value),
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger(registry.mountedNames() as string[]);
    if (!isValid) {
      return;
    }
    const values = projectMountedValues(registry, form.getValues);
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    onSubmit(filteredValues);
    form.reset();
  };

  const closeAndReset = () => {
    onCancel();
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeAndReset()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("credentials.titleEdit") : t("credentials.titleAdd")}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <MountedFormProvider value={{ control: form.control, registry }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <MountedFormField
                label={t("credentials.form.nameLabel")}
                name="credential_name"
                required
                rules={{ validate: { required: requiredRule(t("credentials.validation.nameRequired")) } }}
                className="mb-4"
              >
                {(control) => (
                  <Input
                    id={control.id}
                    value={typeof control.value === "string" ? control.value : ""}
                    onChange={control.onChange}
                    onBlur={control.onBlur}
                    placeholder={t("credentials.form.namePlaceholder")}
                    disabled={isEdit}
                  />
                )}
              </MountedFormField>

              <MountedFormField
                label={labelWithHint(t("credentials.form.providerLabel"), t("credentials.form.providerHelp"))}
                name="custom_llm_provider"
                required
                rules={{ validate: { required: requiredRule(t("credentials.validation.required")) } }}
                className="mb-4"
              >
                {(control) => (
                  <SearchSelect
                    inputId={control.id}
                    placeholder={t("credentials.form.providerPlaceholder")}
                    options={providerOptions}
                    value={typeof control.value === "string" ? control.value : null}
                    onValueChange={(value) => {
                      control.onChange(value);
                      resetCredentialFormOnProviderChange(formAdapter, value, setSelectedProvider);
                    }}
                  />
                )}
              </MountedFormField>

              <ProviderSpecificFields selectedProvider={selectedProvider} />

              <div className="flex justify-between items-center">
                <SimpleTooltip content={t("credentials.getHelp")}>
                  <a href="https://github.com/BerriAI/litellm/issues" className="text-sm text-primary hover:underline">
                    {t("credentials.needHelp")}
                  </a>
                </SimpleTooltip>

                <div>
                  <Button variant="outline" className="mr-2.5" onClick={closeAndReset}>
                    {t("credentials.form.cancel")}
                  </Button>
                  <Button type="submit">{isEdit ? t("credentials.submitEdit") : t("credentials.submitAdd")}</Button>
                </div>
              </div>
            </form>
          </MountedFormProvider>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
