"use client";

import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";

const REDIS_DOCS_URL = "https://docs.litellm.ai/docs/proxy/redis_requirements";

interface NoRedisWarningBannerProps {
  accessToken: string | null;
}

export const NoRedisWarningBanner: React.FC<NoRedisWarningBannerProps> = ({ accessToken }) => {
  const { t } = useTranslation("networking");
  const { data: healthData } = useHealthReadinessDetails(accessToken);

  if (!healthData?.show_no_redis_warning) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{t("banners.noRedis.title")}</p>
        <p>
          <Trans
            ns="networking"
            i18nKey="banners.noRedis.body"
            components={{
              redisLink: <a className="underline" href={REDIS_DOCS_URL} target="_blank" rel="noreferrer" />,
              code: <code className="font-mono" />,
            }}
          />
        </p>
      </div>
    </div>
  );
};
