import { CircleCheck, CirclePlay, Code, Save, Undo2 } from "lucide-react";
import type { ParseKeys } from "i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import React, { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface GuardrailConfigProps {
  guardrailName: string;
  guardrailType: string;
  provider: string;
}

type ConfigKey = ParseKeys<"guardrailsMonitor">;

const versions = [
  {
    id: "v3",
    current: true,
    date: "2026-02-18",
    author: "admin@company.com",
    changesKey: "config.versionChanges.medical",
  },
  {
    id: "v2",
    current: false,
    date: "2026-02-10",
    author: "admin@company.com",
    changesKey: "config.versionChanges.categories",
  },
  {
    id: "v1",
    current: false,
    date: "2026-01-28",
    author: "admin@company.com",
    changesKey: "config.versionChanges.initial",
  },
] as const satisfies readonly {
  id: string;
  current: boolean;
  date: string;
  author: string;
  changesKey: ConfigKey;
}[];

const ACTION_ITEMS = [
  { value: "block", labelKey: "config.actions.block" },
  { value: "flag", labelKey: "config.actions.flag" },
  { value: "log", labelKey: "config.actions.log" },
  { value: "fallback", labelKey: "config.actions.fallback" },
] as const satisfies readonly { value: string; labelKey: ConfigKey }[];

const PROVIDER_ITEMS = [
  { value: "bedrock", labelKey: "config.providers.bedrock" },
  { value: "google", labelKey: "config.providers.google" },
  { value: "litellm", labelKey: "config.providers.litellm" },
  { value: "custom", labelKey: "config.providers.custom" },
] as const satisfies readonly { value: string; labelKey: ConfigKey }[];

const GUARDRAIL_TYPE_ITEMS = [
  { value: "Content Safety", labelKey: "config.types.contentSafety" },
  { value: "PII", labelKey: "config.types.pii" },
  { value: "Topic", labelKey: "config.types.topic" },
  { value: "prompt_injection", labelKey: "config.types.promptInjection" },
  { value: "custom", labelKey: "config.types.custom" },
] as const satisfies readonly { value: string; labelKey: ConfigKey }[];

export function GuardrailConfig({ guardrailName, guardrailType, provider }: GuardrailConfigProps) {
  const { t } = useTranslation("guardrailsMonitor");
  const [action, setAction] = useState("block");
  const [enabled, setEnabled] = useState(true);
  const [customCode, setCustomCode] = useState("");
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [rerunStatus, setRerunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [version, setVersion] = useState("v3");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const enabledToggleId = useId();

  const versionItems = useMemo(
    () =>
      versions.map((v) => ({
        value: v.id,
        label: v.current ? t("config.versionCurrent", { version: v.id }) : v.id,
      })),
    [t],
  );
  const actionItems = useMemo(() => ACTION_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) })), [t]);
  const providerItems = useMemo(
    () => PROVIDER_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) })),
    [t],
  );
  const guardrailTypeItems = useMemo(
    () => GUARDRAIL_TYPE_ITEMS.map((item) => ({ value: item.value, label: t(item.labelKey) })),
    [t],
  );

  const handleRerun = () => {
    setRerunStatus("running");
    setTimeout(() => {
      setRerunStatus("success");
      setTimeout(() => setRerunStatus("idle"), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Version Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">{t("config.versionLabel")}</span>
            <Select
              items={versionItems}
              value={version}
              onValueChange={(value: string | null) => value && setVersion(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versionItems.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="link" size="sm" onClick={() => setShowVersionHistory(!showVersionHistory)}>
              {showVersionHistory ? t("config.hideHistory") : t("config.viewHistory")}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Undo2 />
              {t("config.revert")}
            </Button>
            <Button>
              <Save />
              {t("config.saveAsVersion", { version: parseInt(version.replace("v", ""), 10) + 1 })}
            </Button>
          </div>
        </div>

        {showVersionHistory && (
          <div className="mt-4 border-t border-border pt-4 space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`flex items-center justify-between p-2.5 rounded-md text-sm ${
                  v.id === version ? "bg-info/10 border border-info/20" : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-medium ${v.id === version ? "text-info" : "text-muted-foreground"}`}
                  >
                    {v.id}
                  </span>
                  <span className="text-foreground">{t(v.changesKey)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{v.author}</span>
                  <span>{v.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parameters */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-1">{t("config.parameters")}</h3>
        <p className="text-xs text-muted-foreground mb-5">{t("config.behaviorDescription", { name: guardrailName })}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("config.actionOnFailure")}</label>
            <Select
              items={actionItems}
              value={action}
              onValueChange={(value: string | null) => value && setAction(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("common.provider")}</label>
            <Select items={providerItems} defaultValue={provider}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("config.guardrailType")}</label>
            <Select items={guardrailTypeItems} defaultValue={guardrailType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {guardrailTypeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1.5">{t("config.categories")}</label>
            <Input defaultValue="violence, hate_speech, sexual_content, self_harm, illegal_activity" />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <Switch id={enabledToggleId} checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor={enabledToggleId} className="font-normal text-foreground">
              {t("config.enabledInProduction")}
            </Label>
          </div>
        </div>
      </div>

      {/* Custom Code Override */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Code className="size-4 text-muted-foreground" />
              {t("config.customCodeOverride")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("config.customCodeOverrideDescription")}</p>
          </div>
          <Switch
            aria-label={t("config.customCodeOverride")}
            checked={useCustomCode}
            onCheckedChange={setUseCustomCode}
          />
        </div>

        {useCustomCode && (
          <Textarea
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder={`async def evaluate(input_text: str, context: dict) -> dict:
    # Return {"score": 0.0-1.0, "passed": bool, "reason": str}
    # Example:
    if "banned_word" in input_text.lower():
        return {"score": 0.1, "passed": False, "reason": "Banned word detected"}
    return {"score": 0.9, "passed": True, "reason": "No violations"}`}
            rows={10}
            className="font-mono text-sm"
          />
        )}
      </div>

      {/* Re-run on Failing Logs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground mb-1">{t("config.testConfiguration")}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t("config.rerunDescription")}</p>

        <div className="flex items-center gap-3">
          <Button disabled={rerunStatus === "running"} aria-busy={rerunStatus === "running"} onClick={handleRerun}>
            {rerunStatus === "running" ? null : <CirclePlay />}
            {rerunStatus === "running" ? t("config.rerunRunning") : t("config.rerunAction")}
          </Button>

          {rerunStatus === "success" && (
            <span className="text-sm text-success flex items-center gap-2">
              <CircleCheck className="size-4" /> {t("config.rerunSuccess")}
            </span>
          )}

          {rerunStatus === "error" && <span className="text-sm text-destructive">Error running tests</span>}
        </div>
      </div>
    </div>
  );
}
