import React from "react";
import { useTranslation } from "react-i18next";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

export function OnboardingLoadingView() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="mx-auto w-full max-w-md mt-10 flex justify-center">
      <UiLoadingSpinner
        role="status"
        aria-label={t("loadingInvitationAria")}
        className="size-8 text-muted-foreground"
      />
    </div>
  );
}
