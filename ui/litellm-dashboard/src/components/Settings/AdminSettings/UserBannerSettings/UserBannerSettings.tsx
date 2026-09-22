"use client";

import type { ParseKeys } from "i18next";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useUpdateUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner";
import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { toast } from "@/lib/toast";
import { UserBanner, UserBannerSeverity, UserBannerUpdate } from "@/components/networking";
import { Alert, AlertDescription } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITY_ICONS, UserBannerMarkdown } from "@/components/UserBanner";
import { Skeleton } from "@/components/ui/skeleton";

const SEVERITY_LABEL_KEYS: Record<UserBannerSeverity, ParseKeys<"settings">> = {
  info: "userBanner.severities.info",
  warning: "userBanner.severities.warning",
  error: "userBanner.severities.error",
};

const EMPTY_BANNER: UserBanner = { enabled: false, message: "", severity: "info", revision: "" };

export default function UserBannerSettings() {
  const { accessToken } = useAuthorized();
  const { data: banner, isLoading } = useUserBanner(accessToken);
  const { mutate: saveBanner, isPending } = useUpdateUserBanner(accessToken);
  const persisted = banner ?? EMPTY_BANNER;

  return (
    <UserBannerSettingsForm
      key={JSON.stringify(persisted)}
      persisted={persisted}
      isLoading={isLoading}
      isPending={isPending}
      saveBanner={saveBanner}
    />
  );
}

interface UserBannerSettingsFormProps {
  persisted: UserBanner;
  isLoading: boolean;
  isPending: boolean;
  saveBanner: ReturnType<typeof useUpdateUserBanner>["mutate"];
}

function UserBannerSettingsForm({ persisted, isLoading, isPending, saveBanner }: UserBannerSettingsFormProps) {
  const { t } = useTranslation("settings");
  const [draft, setDraft] = useState<UserBannerUpdate>({
    enabled: persisted.enabled,
    message: persisted.message,
    severity: persisted.severity,
  });

  const messageMissing = draft.enabled && draft.message.trim() === "";
  const severityItems = useMemo(
    () =>
      (Object.keys(SEVERITY_LABEL_KEYS) as UserBannerSeverity[]).map((severity) => ({
        value: severity,
        label: t(SEVERITY_LABEL_KEYS[severity]),
      })),
    [t],
  );

  const handleSave = () => {
    saveBanner(draft, {
      onSuccess: () => {
        toast.success(t("userBanner.updatedSuccess"));
      },
      onError: (error) => {
        toast.fromError(error);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("userBanner.title")}</CardTitle>
        <CardDescription>{t("userBanner.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked: boolean) => setDraft({ ...draft, enabled: checked })}
                aria-label={t("userBanner.publish")}
              />
              <Label>{t("userBanner.publish")}</Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="user-banner-message">{t("userBanner.message")}</Label>
              <Textarea
                id="user-banner-message"
                value={draft.message}
                maxLength={4000}
                rows={3}
                placeholder="**Scheduled maintenance** tonight at 10 PM UTC. See [status page](https://example.com)."
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDraft({ ...draft, message: event.target.value })
                }
              />
              {messageMissing && <p className="text-sm text-destructive">{t("userBanner.missingMessage")}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("userBanner.severity")}</Label>
              <Select
                items={severityItems}
                value={draft.severity}
                onValueChange={(value: string | null) =>
                  setDraft({ ...draft, severity: (value ?? "info") as UserBannerSeverity })
                }
              >
                <SelectTrigger className="w-48" aria-label={t("userBanner.severityAria")}>
                  <SelectValue placeholder={t("userBanner.severity")} />
                </SelectTrigger>
                <SelectContent>
                  {severityItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.message.trim() !== "" && (
              <div className="flex flex-col gap-2">
                <Label>{t("userBanner.preview")}</Label>
                <Alert variant={draft.severity}>
                  {SEVERITY_ICONS[draft.severity]}
                  <AlertDescription>
                    <UserBannerMarkdown message={draft.message} />
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div>
              <Button onClick={handleSave} disabled={isPending || messageMissing}>
                {isPending ? t("shared.saving") : t("userBanner.save")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
