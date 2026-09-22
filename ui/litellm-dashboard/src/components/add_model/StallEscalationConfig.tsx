import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ParseKeys } from "i18next";
import { type ComplexityRouterConfigValue, classificationFrequency } from "./ComplexityRouterConfig";

export const DEFAULT_STALL_ESCALATION_WINDOW = 6;
export const DEFAULT_STALL_ESCALATION_REPEAT_THRESHOLD = 3;

/**
 * Why the toggle is unavailable, or null when it can be turned on. Both blockers replay a held
 * routing decision instead of classifying most turns, so detection would never see the tool
 * calls it reads.
 */
export const stallEscalationBlockedReason = (value: ComplexityRouterConfigValue): ParseKeys<"models"> | null => {
  const frequency = classificationFrequency(value);
  if (frequency === "session") return "autoRouterConfig.matching.stall.blockedSession";
  if (frequency === "user_turn") return "autoRouterConfig.matching.stall.blockedUserTurn";
  return null;
};

const clampedInt = (raw: string, min: number, fallback: number): number => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.trunc(parsed));
};

const StallEscalationConfig: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation("models");
  const enabled = value.stall_escalation_enabled ?? false;
  const blockedReason = stallEscalationBlockedReason(value);
  const window = value.stall_escalation_window ?? DEFAULT_STALL_ESCALATION_WINDOW;
  const threshold = value.stall_escalation_repeat_threshold ?? DEFAULT_STALL_ESCALATION_REPEAT_THRESHOLD;
  // A threshold above the window can never be reached, and the backend rejects the pair, so the
  // window rises with the threshold rather than letting the form save something inert.
  const commitThreshold = (raw: string) => {
    const nextThreshold = clampedInt(raw, 2, DEFAULT_STALL_ESCALATION_REPEAT_THRESHOLD);
    onChange({
      ...value,
      stall_escalation_repeat_threshold: nextThreshold,
      stall_escalation_window: Math.max(window, nextThreshold),
    });
  };
  const commitWindow = (raw: string) => {
    const nextWindow = clampedInt(raw, 1, DEFAULT_STALL_ESCALATION_WINDOW);
    onChange({
      ...value,
      stall_escalation_window: Math.max(nextWindow, threshold),
    });
  };
  const toggle = (next: boolean) => {
    const enabledValue: ComplexityRouterConfigValue = {
      ...value,
      stall_escalation_enabled: next || undefined,
      stall_escalation_window: next ? window : undefined,
      stall_escalation_repeat_threshold: next ? threshold : undefined,
    };
    onChange(enabledValue);
  };
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={enabled}
          // Blocked only prevents turning it on: an already-on router that just became
          // blocked (e.g. session pinning turned on afterward) still needs a way to turn
          // this back off, since the backend rejects saving both together.
          disabled={blockedReason !== null && !enabled}
          onCheckedChange={toggle}
          aria-label={t("autoRouterConfig.matching.stall.label")}
        />
        <strong className="font-semibold">{t("autoRouterConfig.matching.stall.label")}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {t("autoRouterConfig.matching.stall.help")}
        {blockedReason !== null && ` ${t(blockedReason)}`}
      </span>
      {enabled && blockedReason === null && (
        <div className="flex flex-wrap gap-4">
          <div style={{ maxWidth: 240 }}>
            <label className="block text-sm font-medium mb-1" htmlFor="stall-escalation-repeat-threshold">
              {t("autoRouterConfig.matching.stall.repeatsLabel")}
            </label>
            <Input
              id="stall-escalation-repeat-threshold"
              inputMode="numeric"
              value={threshold}
              onChange={(event) => commitThreshold(event.target.value)}
            />
            <span className="block text-xs mt-1 text-muted-foreground">
              {t("autoRouterConfig.matching.stall.repeatsHelp")}
            </span>
          </div>
          <div style={{ maxWidth: 240 }}>
            <label className="block text-sm font-medium mb-1" htmlFor="stall-escalation-window">
              {t("autoRouterConfig.matching.stall.windowLabel")}
            </label>
            <Input
              id="stall-escalation-window"
              inputMode="numeric"
              value={window}
              onChange={(event) => commitWindow(event.target.value)}
            />
            <span className="block text-xs mt-1 text-muted-foreground">
              {t("autoRouterConfig.matching.stall.windowHelp")}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default StallEscalationConfig;
