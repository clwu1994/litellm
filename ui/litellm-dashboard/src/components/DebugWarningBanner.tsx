"use client";

import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

interface DebugWarningBannerProps {
  accessToken: string | null;
}

export const DebugWarningBanner: React.FC<DebugWarningBannerProps> = ({ accessToken }) => {
  const { t } = useTranslation("networking");
  const { data: healthData } = useHealthReadinessDetails(accessToken);

  // Only show banner if detailed debug mode is explicitly enabled
  if (!healthData?.is_detailed_debug) {
    return null;
  }

  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
      <TriangleAlert className="size-4" aria-hidden />
      <AlertTitle>{t("banners.debug.title")}</AlertTitle>
      <AlertDescription>
        <Trans ns="networking" i18nKey="banners.debug.body" components={{ code: <code /> }} />
      </AlertDescription>
    </Alert>
  );
};
