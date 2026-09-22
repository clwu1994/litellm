"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { ParseKeys } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import {
  SearchIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SettingsIcon,
} from "lucide-react";
import {
  fetchMCPSubmissions,
  approveMCPServer,
  rejectMCPServer,
  getGeneralSettingsCall,
  updateConfigFieldSetting,
} from "@/components/networking";
import { MCPServer, MCPSubmissionsSummary } from "@/components/mcp_tools/types";
import { FIELD_GROUPS, MCP_REQUIRED_FIELD_DEFS, SETTINGS_KEY } from "./MCPStandardsSettings";
import { toast } from "@/lib/toast";

type MCPStatus = "active" | "pending_review" | "rejected";

const STATUS_CONFIG: Record<MCPStatus, { labelKey: ParseKeys<"mcpServers">; bg: string; text: string; dot: string }> = {
  active: {
    labelKey: "submissions.statusActive",
    bg: "bg-success/10",
    text: "text-success",
    dot: "bg-success",
  },
  pending_review: {
    labelKey: "submissions.statusPending",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  rejected: {
    labelKey: "submissions.statusRejected",
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

type ConfirmDialogProps = {
  action: "approve" | "reject";
  serverName: string;
  isCurrentlyActive?: boolean;
  onConfirm: (reviewNotes?: string) => void;
  onCancel: () => void;
};

function ConfirmDialog({ action, serverName, isCurrentlyActive, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation("mcpServers");
  const [reviewNotes, setReviewNotes] = useState("");
  const isApprove = action === "approve";
  const rejectQuestionKey: ParseKeys<"mcpServers"> = isCurrentlyActive
    ? "submissions.rejectQuestionLive"
    : "submissions.rejectQuestionPending";
  const questionKey: ParseKeys<"mcpServers"> = isApprove ? "submissions.approveQuestion" : rejectQuestionKey;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-overlay">
      <div className="bg-card rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
            isApprove ? "bg-success/15" : "bg-destructive/15"
          }`}
        >
          {isApprove ? (
            <CheckIcon className="h-5 w-5 text-success" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 text-destructive" />
          )}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {isApprove ? t("submissions.approveTitle") : t("submissions.rejectTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          <Trans
            ns="mcpServers"
            i18nKey={questionKey}
            values={{ serverName }}
            components={{ strong: <span className="font-medium text-foreground" /> }}
          />
        </p>
        {!isApprove && (
          <textarea
            placeholder={t("submissions.reasonPlaceholder")}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring mb-4 resize-none"
            rows={3}
          />
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-foreground hover:bg-accent text-sm font-medium py-2 rounded-md transition-colors"
          >
            {t("form.cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(isApprove ? undefined : reviewNotes || undefined)}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              isApprove
                ? "bg-success text-success-foreground hover:bg-success/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/80"
            }`}
          >
            {isApprove ? t("submissions.approve") : t("submissions.reject")}
          </button>
        </div>
      </div>
    </div>
  );
}

type SubmissionRulesPanelProps = {
  requiredFields: string[];
  onChange: (fields: string[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
};

function SubmissionRulesPanel({ requiredFields, onChange, onSave, isSaving }: SubmissionRulesPanelProps) {
  const { t } = useTranslation("mcpServers");
  const [expanded, setExpanded] = useState(false);
  const activeFields = MCP_REQUIRED_FIELD_DEFS.filter((f) => requiredFields.includes(f.key));

  const toggle = (key: string) => {
    onChange(requiredFields.includes(key) ? requiredFields.filter((k) => k !== key) : [...requiredFields, key]);
  };

  return (
    <div className="mb-5 border border-border rounded-lg bg-card overflow-hidden">
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{t("submissions.rulesTitle")}</span>
          {activeFields.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {activeFields.length === 1
                ? t("submissions.requiredFieldCountOne", { count: activeFields.length })
                : t("submissions.requiredFieldCount", { count: activeFields.length })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">{t("submissions.noRules")}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Active rule chips — collapsed view */}
          {!expanded && activeFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {activeFields.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 text-xs bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded-full"
                >
                  <CheckIcon className="h-3 w-3" />
                  {t(f.labelKey)}
                </span>
              ))}
            </div>
          )}
          {expanded ? (
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-border px-4 pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-4">{t("submissions.rulesHint")}</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {FIELD_GROUPS.map((group) => (
              <div key={group.labelKey}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t(group.labelKey)}
                </div>
                <div className="space-y-2">
                  {group.fields.map((field) => {
                    const active = requiredFields.includes(field.key);
                    return (
                      <label key={field.key} className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggle(field.key)}
                          className="mt-0.5 h-4 w-4 rounded-sm border-border text-info focus:ring-ring cursor-pointer"
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground group-hover:text-info transition-colors">
                            {t(field.labelKey)}
                          </div>
                          <div className="text-xs text-muted-foreground">{t(field.descriptionKey)}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                await onSave();
                setExpanded(false);
              }}
              className="px-4 py-1.5 text-sm font-medium text-info-foreground bg-info hover:bg-info/80 disabled:opacity-50 rounded-md transition-colors"
            >
              {isSaving ? t("submissions.saving") : t("submissions.saveRules")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
            >
              {t("form.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MCPServerCardProps = {
  server: MCPServer;
  onApprove: () => void;
  onReject: () => void;
  requiredFields: string[];
};

function MCPServerCard({ server, onApprove, onReject, requiredFields }: MCPServerCardProps) {
  const { t } = useTranslation("mcpServers");
  const approvalStatus = (server.approval_status ?? "active") as MCPStatus;
  const statusCfg = STATUS_CONFIG[approvalStatus] ?? STATUS_CONFIG["active"];

  const checks = MCP_REQUIRED_FIELD_DEFS.filter((f) => requiredFields.includes(f.key)).map((f) => ({
    key: f.key,
    labelKey: f.labelKey,
    passed: f.check(server),
  }));
  const passCount = checks.filter((c) => c.passed).length;
  const failCount = checks.length - passCount;
  const allPassed = checks.length > 0 && failCount === 0;
  const failedLabel =
    failCount === 1
      ? t("submissions.checksFailedOne", { count: failCount })
      : t("submissions.checksFailed", { count: failCount });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Server info */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {t(statusCfg.labelKey)}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {server.alias ?? server.server_name ?? server.server_id}
            </h3>
            {server.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{server.description}</p>
            )}
            {server.url && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <ServerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground font-mono truncate">{server.url}</code>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{t("submissions.transport", { transport: server.transport ?? "sse" })}</span>
              <span>·</span>
              <span>{t("submissions.submittedBy", { user: server.submitted_by ?? "—" })}</span>
              <span>·</span>
              <span>{formatDate(server.submitted_at)}</span>
            </div>
            {approvalStatus === "rejected" && server.review_notes && (
              <p className="text-xs text-destructive mt-1.5">
                {t("submissions.rejectionReason", { notes: server.review_notes })}
              </p>
            )}
          </div>
          {/* Approve/Reject when no checks panel (no rules configured) */}
          {checks.length === 0 && approvalStatus !== "rejected" && (
            <div className="flex items-center gap-2 shrink-0">
              {approvalStatus !== "active" && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="text-xs bg-success hover:bg-success/80 text-success-foreground px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {t("submissions.approve")}
                </button>
              )}
              <button
                type="button"
                onClick={onReject}
                className="text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors font-medium"
              >
                {t("submissions.reject")}
              </button>
            </div>
          )}
          {checks.length === 0 && approvalStatus === "rejected" && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onApprove}
                className="text-xs bg-success hover:bg-success/80 text-success-foreground px-3 py-1.5 rounded-md transition-colors font-medium"
              >
                {t("submissions.reapprove")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GitHub-style checks panel */}
      {checks.length > 0 && (
        <div className="border-t border-border">
          {/* Overall status header */}
          <div
            className={`flex items-center gap-3 px-4 py-3 ${
              allPassed
                ? "bg-success/10 border-b border-success/15"
                : "bg-destructive/10 border-b border-destructive/15"
            }`}
          >
            {/* Large status circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                allPassed ? "bg-success" : "bg-destructive"
              }`}
            >
              {allPassed ? (
                <CheckIcon className="h-4 w-4 text-success-foreground" />
              ) : (
                <XIcon className="h-4 w-4 text-destructive-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold leading-tight ${allPassed ? "text-success" : "text-destructive"}`}>
                {allPassed ? t("submissions.allChecksPassed") : failedLabel}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("submissions.checksSummary", { passing: passCount, failing: failCount })}
              </div>
            </div>
            {/* Approve / Reject in header */}
            <div className="flex items-center gap-2 shrink-0">
              {approvalStatus !== "active" && approvalStatus !== "rejected" && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="text-xs bg-success hover:bg-success/80 text-success-foreground px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {t("submissions.approve")}
                </button>
              )}
              {approvalStatus === "rejected" && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="text-xs bg-success hover:bg-success/80 text-success-foreground px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {t("submissions.reapprove")}
                </button>
              )}
              {approvalStatus !== "rejected" && (
                <button
                  type="button"
                  onClick={onReject}
                  className="text-xs border border-destructive/30 text-destructive hover:bg-destructive/10 bg-card px-3 py-1.5 rounded-md transition-colors font-medium"
                >
                  {t("submissions.reject")}
                </button>
              )}
            </div>
          </div>

          {/* Individual check rows */}
          <div className="divide-y divide-border">
            {checks.map((c) => (
              <div key={c.key} className="flex items-center gap-3 px-4 py-2.5">
                {/* Small circle icon */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    c.passed ? "bg-success/15" : "bg-destructive/15"
                  }`}
                >
                  {c.passed ? (
                    <CheckIcon className="h-3 w-3 text-success" />
                  ) : (
                    <XIcon className="h-3 w-3 text-destructive" />
                  )}
                </div>
                <span className={`text-sm flex-1 ${c.passed ? "text-foreground" : "text-foreground"}`}>
                  {t(c.labelKey)}
                </span>
                <span className={`text-xs ${c.passed ? "text-success" : "text-destructive"}`}>
                  {c.passed ? t("submissions.passes") : t("submissions.missing")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MCPSubmissionsTabProps {
  accessToken: string | null;
}

export function MCPSubmissionsTab({ accessToken }: MCPSubmissionsTabProps) {
  const { t } = useTranslation("mcpServers");
  const [summary, setSummary] = useState<MCPSubmissionsSummary>({
    total: 0,
    pending_review: 0,
    active: 0,
    rejected: 0,
    items: [],
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MCPStatus>("all");
  const [confirmAction, setConfirmAction] = useState<{
    serverId: string;
    serverName: string;
    action: "approve" | "reject";
    isCurrentlyActive?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [isSavingRules, setIsSavingRules] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [res, settings] = await Promise.all([
        fetchMCPSubmissions(accessToken),
        getGeneralSettingsCall(accessToken).catch((err) => {
          console.warn("MCPSubmissionsTab: failed to load general settings, compliance rules will be empty:", err);
          return null;
        }),
      ]);
      setSummary(res);
      if (settings?.data && Array.isArray(settings.data)) {
        const row = settings.data.find(
          (r: { field_name: string; field_value: unknown }) => r.field_name === SETTINGS_KEY,
        );
        if (row && Array.isArray(row.field_value)) {
          setRequiredFields(row.field_value as string[]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submissions.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRules = async () => {
    if (!accessToken) return;
    setIsSavingRules(true);
    try {
      await updateConfigFieldSetting(accessToken, SETTINGS_KEY, requiredFields);
      toast.success(t("submissions.rulesSaved"));
    } catch {
      toast.fromError(t("submissions.rulesSaveFailed"));
    } finally {
      setIsSavingRules(false);
    }
  };

  const filtered = summary.items.filter((s) => {
    if (statusFilter !== "all" && s.approval_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (s.alias ?? s.server_name ?? s.server_id ?? "").toLowerCase();
      const url = (s.url ?? "").toLowerCase();
      return name.includes(q) || url.includes(q);
    }
    return true;
  });

  async function handleApprove(serverId: string, serverName: string) {
    if (!accessToken) return;
    try {
      await approveMCPServer(accessToken, serverId);
      await fetchData();
      toast.success(t("submissions.approved", { name: serverName }));
    } catch {
      toast.fromError(t("submissions.approveFailed"));
    } finally {
      setConfirmAction(null);
    }
  }

  async function handleReject(serverId: string, serverName: string, reviewNotes?: string) {
    if (!accessToken) return;
    try {
      await rejectMCPServer(accessToken, serverId, reviewNotes);
      await fetchData();
      toast.success(t("submissions.rejected", { name: serverName }));
    } catch {
      toast.fromError(t("submissions.rejectFailed"));
    } finally {
      setConfirmAction(null);
    }
  }

  return (
    <div className="p-6">
      {/* Submission Rules panel */}
      <SubmissionRulesPanel
        requiredFields={requiredFields}
        onChange={setRequiredFields}
        onSave={handleSaveRules}
        isSaving={isSavingRules}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label={t("submissions.statTotal")} value={summary.total} color="text-foreground" />
        <StatCard label={t("submissions.statusPending")} value={summary.pending_review} color="text-warning" />
        <StatCard label={t("submissions.statusActive")} value={summary.active} color="text-success" />
        <StatCard label={t("submissions.statusRejected")} value={summary.rejected} color="text-destructive" />
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("submissions.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-info"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-info bg-card"
        >
          <option value="all">{t("submissions.filterAll")}</option>
          <option value="pending_review">{t("submissions.statusPending")}</option>
          <option value="active">{t("submissions.statusActive")}</option>
          <option value="rejected">{t("submissions.statusRejected")}</option>
        </select>
      </div>

      <div className="space-y-3">
        {isLoading && <div className="text-center py-12 text-muted-foreground text-sm">{t("submissions.loading")}</div>}
        {error && <div className="text-center py-12 text-destructive text-sm">{error}</div>}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">{t("submissions.noMatch")}</div>
        )}
        {!isLoading &&
          !error &&
          filtered.map((server) => (
            <MCPServerCard
              key={server.server_id}
              server={server}
              requiredFields={requiredFields}
              onApprove={() =>
                setConfirmAction({
                  serverId: server.server_id,
                  serverName: server.alias ?? server.server_name ?? server.server_id,
                  action: "approve",
                })
              }
              onReject={() =>
                setConfirmAction({
                  serverId: server.server_id,
                  serverName: server.alias ?? server.server_name ?? server.server_id,
                  action: "reject",
                  isCurrentlyActive: server.approval_status === "active",
                })
              }
            />
          ))}
      </div>

      {confirmAction && (
        <ConfirmDialog
          action={confirmAction.action}
          serverName={confirmAction.serverName}
          isCurrentlyActive={confirmAction.isCurrentlyActive}
          onConfirm={(reviewNotes) =>
            confirmAction.action === "approve"
              ? handleApprove(confirmAction.serverId, confirmAction.serverName)
              : handleReject(confirmAction.serverId, confirmAction.serverName, reviewNotes)
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
