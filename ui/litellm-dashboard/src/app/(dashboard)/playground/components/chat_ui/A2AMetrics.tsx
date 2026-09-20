import React, { useState } from "react";
import type { ParseKeys, TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  FileText,
  Link,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface A2ATaskMetadata {
  taskId?: string;
  contextId?: string;
  status?: {
    state?: string;
    timestamp?: string;
    message?: string;
  };
  metadata?: Record<string, unknown>;
}

interface A2AMetricsProps {
  a2aMetadata?: A2ATaskMetadata;
  timeToFirstToken?: number;
  totalLatency?: number;
}

const A2A_STATUS_KEYS = {
  completed: "metrics.status.completed",
  working: "metrics.status.working",
  submitted: "metrics.status.submitted",
  failed: "metrics.status.failed",
  canceled: "metrics.status.canceled",
} as const satisfies Record<string, ParseKeys<"playground">>;

const statusLabel = (state: string, t: TFunction<"playground">): string =>
  state in A2A_STATUS_KEYS ? t(A2A_STATUS_KEYS[state as keyof typeof A2A_STATUS_KEYS]) : state;

const getStatusIcon = (state?: string) => {
  switch (state) {
    case "completed":
      return <CheckCircle className="size-3 text-success" />;
    case "working":
    case "submitted":
      return <LoaderCircle className="size-3 animate-spin text-info" />;
    case "failed":
    case "canceled":
      return <CircleAlert className="size-3 text-destructive" />;
    default:
      return <Clock className="size-3 text-muted-foreground" />;
  }
};

const getStatusColor = (state?: string) => {
  switch (state) {
    case "completed":
      return "bg-success/15 text-success";
    case "working":
    case "submitted":
      return "bg-info/15 text-info";
    case "failed":
    case "canceled":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-foreground";
  }
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timestamp;
  }
};

const truncateId = (id?: string, length = 8) => {
  if (!id) return null;
  return id.length > length ? `${id.substring(0, length)}…` : id;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const A2AMetrics: React.FC<A2AMetricsProps> = ({ a2aMetadata, timeToFirstToken, totalLatency }) => {
  const { t } = useTranslation("playground");
  const [showDetails, setShowDetails] = useState(false);

  if (!a2aMetadata && !timeToFirstToken && !totalLatency) return null;

  const { taskId, contextId, status, metadata } = a2aMetadata || {};
  const formattedTime = formatTimestamp(status?.timestamp);

  return (
    <div className="a2a-metrics mt-3 pt-2 border-t border-border text-xs">
      {/* A2A Metadata Header */}
      <div className="flex items-center mb-2 text-muted-foreground">
        <Bot className="mr-1.5 size-4 text-info" />
        <span className="font-medium text-foreground">{t("metrics.a2aTitle")}</span>
      </div>

      {/* Main metrics row */}
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground ml-4">
        {/* Status badge */}
        {status?.state && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.state)}`}
          >
            {getStatusIcon(status.state)}
            <span className="ml-1 capitalize">{statusLabel(status.state, t)}</span>
          </span>
        )}

        {/* Timestamp */}
        {formattedTime && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center" />}>
              <Clock className="mr-1 size-3" />
              {formattedTime}
            </TooltipTrigger>
            <TooltipContent>{status?.timestamp}</TooltipContent>
          </Tooltip>
        )}

        {/* Latency */}
        {totalLatency !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-info" />}>
              <Clock className="mr-1 size-3" />
              {(totalLatency / 1000).toFixed(2)}s
            </TooltipTrigger>
            <TooltipContent>{t("metrics.totalLatency")}</TooltipContent>
          </Tooltip>
        )}

        {/* Time to first token */}
        {timeToFirstToken !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-success" />}>
              {t("metrics.ttft", { value: (timeToFirstToken / 1000).toFixed(2) })}
            </TooltipTrigger>
            <TooltipContent>{t("metrics.timeToFirstToken")}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* IDs row */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground ml-4 mt-1.5">
        {/* Task ID */}
        {taskId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={t("metrics.copyTaskIdAria", { id: taskId })}
                />
              }
            >
              <FileText className="size-3" />
              {t("metrics.task", { id: truncateId(taskId) })}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{t("metrics.clickToCopy", { id: taskId })}</TooltipContent>
          </Tooltip>
        )}

        {/* Context/Session ID */}
        {contextId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={t("metrics.copySessionIdAria", { id: contextId })}
                />
              }
            >
              <Link className="size-3" />
              {t("metrics.session", { id: truncateId(contextId) })}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{t("metrics.clickToCopy", { id: contextId })}</TooltipContent>
          </Tooltip>
        )}

        {/* Details toggle */}
        {(metadata || status?.message) && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 text-xs text-info hover:bg-transparent hover:text-info/80"
                />
              }
            >
              {showDetails ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              {t("metrics.details")}
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>

      {/* Expandable details panel */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleContent>
          <div className="mt-2 ml-4 p-3 bg-muted rounded-md text-muted-foreground border border-border">
            {/* Status message */}
            {status?.message && (
              <div className="mb-2">
                <span className="font-medium text-foreground">{t("metrics.statusMessage")}</span>
                <span className="ml-2">{status.message}</span>
              </div>
            )}

            {/* Full IDs */}
            {taskId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">{t("metrics.taskId")}</span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {taskId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={t("metrics.copyTaskIdAria", { id: taskId })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {contextId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">{t("metrics.sessionId")}</span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {contextId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={t("metrics.copySessionIdAria", { id: contextId })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {/* Metadata fields */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-foreground">{t("metrics.customMetadata")}</span>
                <pre className="mt-1.5 p-2 bg-card border border-border rounded-sm text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default A2AMetrics;
