import { useTranslation } from "react-i18next";
import CopyButton from "@/components/shared/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { JsonViewer } from "./JsonViewer";

interface ClassifierAuditViewProps {
  request: Record<string, unknown>;
  response: unknown;
}

export function ClassifierAuditView({ request, response }: ClassifierAuditViewProps) {
  const { t } = useTranslation("logs");

  return (
    <div className="mb-6 space-y-4">
      <AuditField title={t("detail.classifier.inputTitle")} value={request.classifier_input}>
        {t("detail.classifier.inputDescription")}
      </AuditField>
      <AuditField title={t("detail.classifier.originatingTitle")} value={request.originating_request_masked}>
        {t("detail.classifier.originatingDescription")}
      </AuditField>
      <AuditField title={t("detail.classifier.responseTitle")} value={response}>
        {t("detail.classifier.responseDescription")}
      </AuditField>
    </div>
  );
}

function AuditField({ title, value, children }: { title: string; value: unknown; children: ReactNode }) {
  const { t } = useTranslation("logs");
  const serialized = JSON.stringify(value);
  const truncated = serialized?.includes("litellm_truncated") ?? false;

  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {value != null && (
          <CopyButton value={JSON.stringify(value, null, 2)} label={t("detail.classifier.copyTitle", { title })} />
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{children}</p>
        {truncated && (
          <p role="status" className="mb-3 text-sm text-warning">
            {t("detail.classifier.truncated")}
          </p>
        )}
        {value == null ? (
          <p className="text-sm text-muted-foreground">{t("detail.classifier.notCaptured")}</p>
        ) : (
          <JsonViewer data={value} mode="formatted" />
        )}
      </CardContent>
    </Card>
  );
}
