import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { CredentialItem } from "../networking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReuseCredentialsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onAddCredential: (values: Record<string, unknown>) => void;
  existingCredential: CredentialItem | null;
  setIsCredentialModalOpen: (isVisible: boolean) => void;
}

const buildReuseCredentialsSchema = (t: TFunction<"models">) =>
  z.object({
    credential_name: z.string().min(1, t("credentials.validation.nameRequired")),
  });

type ReuseCredentialsFormValues = z.infer<ReturnType<typeof buildReuseCredentialsSchema>>;

const storedValuesOf = (existingCredential: CredentialItem | null): Record<string, unknown> => {
  const values: unknown = existingCredential?.credential_values;
  return typeof values === "object" && values !== null ? (values as Record<string, unknown>) : {};
};

const ReuseCredentialsModal: React.FC<ReuseCredentialsModalProps> = ({
  isVisible,
  onCancel,
  onAddCredential,
  existingCredential,
  setIsCredentialModalOpen,
}) => {
  const { t } = useTranslation("models");
  const fieldIdPrefix = React.useId();
  const storedValues = storedValuesOf(existingCredential);
  const form = useZodForm(buildReuseCredentialsSchema(t), {
    defaultValues: { credential_name: existingCredential?.credential_name ?? "" },
  });

  const handleSubmit = (values: ReuseCredentialsFormValues) => {
    onAddCredential({ ...storedValues, ...values });
    form.reset();
    setIsCredentialModalOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    form.reset();
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("credentials.reuse.title")}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
            <FieldGroup>
              <FormField control={form.control} name="credential_name" label={t("credentials.form.nameLabel")}>
                {({ ref, ...field }) => (
                  <Input {...field} ref={ref} placeholder={t("credentials.form.namePlaceholder")} />
                )}
              </FormField>

              {Object.entries(storedValues).map(([key, value]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-${key}`}>{key}</FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-${key}`}
                    value={String(value)}
                    placeholder={t("credentials.fieldPlaceholder", { field: key })}
                    disabled
                    readOnly
                  />
                </Field>
              ))}

              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <a
                        href="https://github.com/BerriAI/litellm/issues"
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {t("credentials.needHelp")}
                      </a>
                    }
                  />
                  <TooltipContent>{t("credentials.getHelp")}</TooltipContent>
                </Tooltip>

                <div className="flex gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t("credentials.form.cancel")}
                  </Button>
                  <Button type="submit">{t("credentials.reuse.title")}</Button>
                </div>
              </div>
            </FieldGroup>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default ReuseCredentialsModal;
