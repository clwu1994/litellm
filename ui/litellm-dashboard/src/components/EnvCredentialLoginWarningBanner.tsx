"use client";

import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminRole } from "@/utils/roles";

const DISMISS_STORAGE_KEY = "litellm:envCredentialLoginWarningDismissed";

export const EnvCredentialLoginWarningBanner: React.FC<{ accessToken: string | null }> = ({ accessToken }) => {
  const { t } = useTranslation("networking");
  const { userRole } = useAuth();
  const { data: healthData } = useHealthReadinessDetails(accessToken);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_STORAGE_KEY) === "true",
  );

  if (dismissed || !isAdminRole(userRole) || !healthData?.show_env_credential_login_warning) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("banners.envCredential.title")}</p>
        <p>
          <Trans
            ns="networking"
            i18nKey="banners.envCredential.body"
            components={{ code: <code className="font-mono" /> }}
          />
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label={t("banners.envCredential.dismiss")}
        onClick={handleDismiss}
      >
        <X />
      </Button>
    </div>
  );
};
