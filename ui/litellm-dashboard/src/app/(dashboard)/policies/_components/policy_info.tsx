import React, { useState, useEffect, useCallback } from "react";
import type { ParseKeys, TFunction } from "i18next";
import { ArrowLeft, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Policy } from "@/components/policies/types";
import { PipelineInfoDisplay } from "./pipeline_flow_builder";
import { getResolvedGuardrails } from "@/components/networking";

interface PolicyInfoViewProps {
  policyId: string;
  onClose: () => void;
  onEdit: (policy: Policy) => void;
  accessToken: string | null;
  isAdmin: boolean;
  getPolicy: (accessToken: string, policyId: string) => Promise<any>;
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

const DetailRow = ({ label, children }: DetailRowProps) => (
  <div className="grid grid-cols-1 border-b border-border last:border-b-0 sm:grid-cols-[200px_minmax(0,1fr)]">
    <dt className="bg-muted/50 px-4 py-3 text-sm font-medium">{label}</dt>
    <dd className="px-4 py-3 text-sm">{children}</dd>
  </div>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm font-semibold">{children}</span>
    <Separator className="flex-1" />
  </div>
);

const Muted = ({ children }: { children: React.ReactNode }) => (
  <span className="text-muted-foreground">{children}</span>
);

const PIPELINE_MODE_KEYS: Record<string, ParseKeys<"policies"> | undefined> = {
  pre_call: "info.pipelineMode.pre_call",
  post_call: "info.pipelineMode.post_call",
};

const resolvePipelineMode = (mode: string, t: TFunction<"policies">): string => {
  const key = PIPELINE_MODE_KEYS[mode];
  return key === undefined ? mode : t(key);
};

const PolicyInfoView: React.FC<PolicyInfoViewProps> = ({
  policyId,
  onClose,
  onEdit,
  accessToken,
  isAdmin,
  getPolicy,
}) => {
  const { t } = useTranslation("policies");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedGuardrails, setResolvedGuardrails] = useState<string[]>([]);

  const fetchPolicy = useCallback(async () => {
    if (!accessToken || !policyId) return;

    setIsLoading(true);
    try {
      const data = await getPolicy(accessToken, policyId);
      setPolicy(data);

      // Also fetch resolved guardrails
      try {
        const resolvedData = await getResolvedGuardrails(accessToken, policyId);
        setResolvedGuardrails(resolvedData.resolved_guardrails || []);
      } catch (error) {
        console.error("Error fetching resolved guardrails:", error);
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
    } finally {
      setIsLoading(false);
    }
  }, [policyId, accessToken, getPolicy]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 p-12">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    );
  }

  if (!policy) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive">{t("info.notFound")}</p>
          <Button variant="secondary" onClick={onClose} className="mt-4">
            {t("info.goBack")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={onClose}>
              <ArrowLeft />
              {t("info.backToPolicies")}
            </Button>
            {isAdmin && (
              <Button onClick={() => onEdit(policy)}>
                <Pencil />
                {t("info.editPolicy")}
              </Button>
            )}
          </div>

          <h4 className="text-lg font-semibold">{policy.policy_name}</h4>

          <dl className="rounded-md border border-border">
            <DetailRow label={t("info.policyId")}>
              <code className="rounded-sm bg-muted px-2 py-1 text-xs">{policy.policy_id}</code>
            </DetailRow>
            <DetailRow label={t("info.description")}>
              {policy.description || <Muted>{t("info.noDescription")}</Muted>}
            </DetailRow>
            <DetailRow label={t("info.inheritsFrom")}>
              {policy.inherit ? <Badge variant="secondary">{policy.inherit}</Badge> : <Muted>{t("info.none")}</Muted>}
            </DetailRow>
            <DetailRow label={t("info.createdAt")}>
              {policy.created_at ? new Date(policy.created_at).toLocaleString() : "-"}
            </DetailRow>
            <DetailRow label={t("info.updatedAt")}>
              {policy.updated_at ? new Date(policy.updated_at).toLocaleString() : "-"}
            </DetailRow>
          </dl>

          {policy.pipeline && (
            <>
              <SectionHeading>{t("info.pipelineFlow")}</SectionHeading>
              <Alert className="mb-4">
                <Info />
                <AlertTitle>
                  {t(policy.pipeline.steps.length === 1 ? "info.pipelineTitleSingular" : "info.pipelineTitle", {
                    mode: resolvePipelineMode(policy.pipeline.mode, t),
                    stepCount: policy.pipeline.steps.length,
                  })}
                </AlertTitle>
              </Alert>
              <PipelineInfoDisplay pipeline={policy.pipeline} />
            </>
          )}

          <SectionHeading>{t("info.guardrailsConfig")}</SectionHeading>

          {resolvedGuardrails.length > 0 && (
            <Alert className="mb-4">
              <Info />
              <AlertTitle>{t("info.resolvedGuardrails")}</AlertTitle>
              <AlertDescription>
                <span className="mb-2 block">{t("info.resolvedGuardrailsHint")}</span>
                <div className="flex flex-wrap gap-1">
                  {resolvedGuardrails.map((g) => (
                    <Badge key={g} variant="secondary">
                      {g}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <dl className="rounded-md border border-border">
            <DetailRow label={t("info.guardrailsToAdd")}>
              <div className="flex flex-wrap gap-1">
                {policy.guardrails_add && policy.guardrails_add.length > 0 ? (
                  policy.guardrails_add.map((g) => (
                    <Badge key={g} variant="secondary">
                      {g}
                    </Badge>
                  ))
                ) : (
                  <Muted>{t("info.none")}</Muted>
                )}
              </div>
            </DetailRow>
            <DetailRow label={t("info.guardrailsToRemove")}>
              <div className="flex flex-wrap gap-1">
                {policy.guardrails_remove && policy.guardrails_remove.length > 0 ? (
                  policy.guardrails_remove.map((g) => (
                    <Badge key={g} variant="destructive">
                      {g}
                    </Badge>
                  ))
                ) : (
                  <Muted>{t("info.none")}</Muted>
                )}
              </div>
            </DetailRow>
          </dl>

          <SectionHeading>{t("info.conditions")}</SectionHeading>

          <dl className="rounded-md border border-border">
            <DetailRow label={t("info.modelCondition")}>
              {policy.condition?.model ? (
                <Badge variant="secondary">
                  {typeof policy.condition.model === "string"
                    ? policy.condition.model
                    : JSON.stringify(policy.condition.model)}
                </Badge>
              ) : (
                <Muted>{t("info.noModelCondition")}</Muted>
              )}
            </DetailRow>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
};

export default PolicyInfoView;
