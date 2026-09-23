import React from "react";
import type { TFunction } from "i18next";
import { CircleAlert, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { cn } from "@/lib/cva.config";
import { useZodForm } from "@/lib/forms/useZodForm";

type OnboardingFormBodyProps = {
  variant: "signup" | "reset_password";
  userEmail: string;
  isPending: boolean;
  claimError: string | null;
  onSubmit: (values: { password: string }) => void;
};

const buildOnboardingSchema = (t: TFunction<"onboarding">) =>
  z.object({
    password: z.string().min(1, t("form.passwordRequired")),
  });

type OnboardingFormValues = z.infer<ReturnType<typeof buildOnboardingSchema>>;

export function OnboardingFormBody({ variant, userEmail, isPending, claimError, onSubmit }: OnboardingFormBodyProps) {
  const { t } = useTranslation("onboarding");
  const form = useZodForm(buildOnboardingSchema(t), { defaultValues: { password: "" } });
  const emailFieldId = React.useId();
  const isResetPassword = variant === "reset_password";
  const actionLabel = isResetPassword ? t("form.resetPassword") : t("form.signUp");

  const handleSubmit = (values: OnboardingFormValues) => onSubmit({ password: values.password });

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Card>
        <CardContent>
          <h5 className="text-center mb-5 text-base font-semibold text-foreground">🚅 LiteLLM</h5>
          <h3 className="text-2xl font-semibold text-foreground">{actionLabel}</h3>
          <p className="text-sm text-foreground">{isResetPassword ? t("form.resetIntro") : t("form.claimIntro")}</p>

          {variant === "signup" && (
            <Alert className="mt-4" variant="info">
              <Info />
              <AlertTitle>{t("form.ssoTitle")}</AlertTitle>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>{t("form.ssoEnterprise")}</span>
                  <a
                    className={cn(buttonVariants({ size: "sm" }))}
                    href="https://forms.gle/W3U4PZpJGFHWtHyA9"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("form.getFreeTrial")}
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form className="mt-10 mb-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={emailFieldId}>{t("form.emailAddress")}</FieldLabel>
                <Input id={emailFieldId} type="email" value={userEmail} readOnly disabled />
              </Field>

              <FormField
                control={form.control}
                name="password"
                label={t("form.password")}
                description={isResetPassword ? t("form.newPasswordHint") : t("form.createPasswordHint")}
              >
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} />}
              </FormField>
            </FieldGroup>

            {claimError && (
              <Alert variant="error" className="mt-6 mb-4">
                <CircleAlert />
                <AlertTitle>{claimError}</AlertTitle>
              </Alert>
            )}

            <div className="mt-10">
              <Button type="submit" variant="outline" disabled={isPending}>
                {isPending && <UiLoadingSpinner className="size-4" role="img" aria-label={t("form.loadingAria")} />}
                {actionLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
