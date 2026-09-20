import React from "react";
import { Copy, Info } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionManagementProps {
  endpointType: string | null;
  responsesSessionId: string | null;
  useApiSessionManagement: boolean;
  onToggleSessionManagement: (useApi: boolean) => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  endpointType,
  responsesSessionId,
  useApiSessionManagement,
  onToggleSessionManagement,
}) => {
  const { t } = useTranslation("playground");

  if (endpointType !== EndpointType.RESPONSES) {
    return null;
  }

  const handleCopySessionId = async () => {
    if (responsesSessionId) {
      try {
        await navigator.clipboard.writeText(responsesSessionId);
        toast.success(t("sessions.copySuccess"));
      } catch {
        toast.error(t("sessions.copyFailed"));
      }
    }
  };

  const getSessionDisplay = (translate: TFunction<"playground">) => {
    if (!responsesSessionId) {
      return useApiSessionManagement ? translate("sessions.apiReady") : translate("sessions.uiReady");
    }

    const sessionPrefix = useApiSessionManagement ? translate("sessions.responseId") : translate("sessions.uiSession");
    const truncatedId = responsesSessionId.slice(0, 10);
    return `${sessionPrefix}: ${truncatedId}...`;
  };

  const getSessionDescription = (translate: TFunction<"playground">) => {
    if (!responsesSessionId) {
      return useApiSessionManagement ? translate("sessions.apiReadyHint") : translate("sessions.uiReadyHint");
    }

    return useApiSessionManagement ? translate("sessions.apiActiveHint") : translate("sessions.uiActiveHint");
  };

  return (
    <div className="mb-4">
      {/* Session Management Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t("sessions.title")}</span>
          <Tooltip>
            <TooltipTrigger aria-label={t("sessions.aboutAria")}>
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{t("sessions.aboutTooltip")}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">{t("sessions.ui")}</span>
          <Switch
            checked={useApiSessionManagement}
            onCheckedChange={onToggleSessionManagement}
            aria-label={t("sessions.useApiAria")}
            size="sm"
          />
          <span aria-hidden="true">{t("sessions.api")}</span>
        </div>
      </div>

      {/* Session Status Indicator */}
      <div
        className={`text-xs p-2 rounded-md ${
          responsesSessionId
            ? "bg-success/10 text-success border border-success/20"
            : "bg-info/10 text-info border border-info/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Info className="size-3" />
            {getSessionDisplay(t)}
          </div>
          {responsesSessionId && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopySessionId}
                    aria-label={t("sessions.copyResponseIdAria")}
                    className="ml-2 hover:bg-success/15"
                  />
                }
              >
                <Copy className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                <div className="text-xs">
                  <div className="mb-1">{t("sessions.copyHint")}</div>
                  <div className="bg-gray-800 text-gray-100 p-2 rounded-sm font-mono text-xs whitespace-pre-wrap">
                    {`curl -X POST "your-proxy-url/v1/responses" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "input": [{"role": "user", "content": "your message", "type": "message"}],
    "previous_response_id": "${responsesSessionId}",
    "stream": true
  }'`}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">{getSessionDescription(t)}</div>
      </div>
    </div>
  );
};

export default SessionManagement;
