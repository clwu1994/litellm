import React from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, CircleAlert, RefreshCw, Wrench, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

interface MCPConnectionStatusProps {
  formValues: Record<string, any>;
  tools: any[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolsErrorStatus?: number | null;
  toolsErrorStackTrace: string | null;
  canFetchTools: boolean;
  fetchTools: () => Promise<void>;
}

const MCPConnectionStatus: React.FC<MCPConnectionStatusProps> = ({
  formValues,
  tools,
  isLoadingTools,
  toolsError,
  toolsErrorStatus = null,
  toolsErrorStackTrace,
  canFetchTools,
  fetchTools,
}) => {
  const { t } = useTranslation("mcpServers");
  const isPreviewForbidden = toolsErrorStatus === 403;
  // Don't show anything if required fields aren't filled
  if (!canFetchTools && !formValues.url && !formValues.spec_path) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleCheck className="size-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">{t("connection.title")}</h3>
        </div>

        {!canFetchTools && (formValues.url || formValues.spec_path) && (
          <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground">
            <Wrench className="mx-auto mb-2 size-6" />
            <p className="text-sm">{t("connection.incomplete.title")}</p>
            <p className="text-sm">{t("connection.incomplete.description")}</p>
          </div>
        )}

        {canFetchTools && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isLoadingTools
                    ? t("connection.status.testing")
                    : tools.length > 0
                      ? t("connection.status.success")
                      : toolsError
                        ? isPreviewForbidden
                          ? t("connection.status.readyToSubmit")
                          : t("connection.status.failed")
                        : t("connection.status.readyToTest")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("connection.server", { target: formValues.url || formValues.spec_path })}
                </p>
              </div>

              {isLoadingTools && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UiLoadingSpinner className="size-4" />
                  <p className="text-sm">{t("connection.connecting")}</p>
                </div>
              )}

              {!isLoadingTools && !toolsError && tools.length > 0 && (
                <div className="flex items-center gap-1">
                  <CircleCheck className="size-4" />
                  <p className="text-sm font-medium">{t("connection.connected")}</p>
                </div>
              )}

              {toolsError && !isPreviewForbidden && (
                <div className="flex items-center gap-1 text-destructive">
                  <CircleAlert className="size-4" />
                  <p className="text-sm font-medium">{t("connection.failed")}</p>
                </div>
              )}
            </div>

            {isLoadingTools && (
              <div className="flex items-center justify-center gap-3 py-6">
                <UiLoadingSpinner className="size-6 text-muted-foreground" />
                <p className="text-sm">{t("connection.testingAndLoading")}</p>
              </div>
            )}

            {toolsError && isPreviewForbidden && (
              <Alert>
                <Info />
                <AlertTitle>{t("connection.previewUnavailable")}</AlertTitle>
                <AlertDescription>{toolsError}</AlertDescription>
              </Alert>
            )}

            {toolsError && !isPreviewForbidden && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{t("connection.failedTitle")}</AlertTitle>
                <AlertDescription>
                  <div>{toolsError}</div>
                  {toolsErrorStackTrace && (
                    <Collapsible className="mt-3">
                      <CollapsibleTrigger
                        render={
                          <Button variant="link" size="sm" className="h-auto p-0">
                            {t("connection.stackTrace")}
                          </Button>
                        }
                      />
                      <CollapsibleContent>
                        <pre className="mt-2 max-h-100 overflow-auto rounded-sm bg-muted p-2 font-mono text-xs break-words whitespace-pre-wrap">
                          {toolsErrorStackTrace}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </AlertDescription>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={fetchTools}>
                    <RefreshCw />
                    {t("connection.retry")}
                  </Button>
                </div>
              </Alert>
            )}

            {!isLoadingTools && tools.length === 0 && !toolsError && (
              <div className="rounded-lg border border-dashed py-6 text-center">
                <CircleCheck className="mx-auto mb-2 size-6" />
                <p className="text-sm font-medium">{t("connection.successTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("connection.noTools")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MCPConnectionStatus;
