import { describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { currentValuePlaceholder, modelSentinelOptions } from "./keyEditFieldNormalizers";

describe("keyEditFieldNormalizers Chinese copy", () => {
  const zh = i18n.getFixedT("zh", "templates");
  const en = i18n.getFixedT("en", "templates");

  it("returns the Chinese sentinel model labels and hides the English originals", () => {
    expect(modelSentinelOptions(null, false, zh)).toEqual([{ value: "all-proxy-models", label: "所有 Proxy 模型" }]);
    expect(modelSentinelOptions("team-1", true, zh)).toEqual([{ value: "all-team-models", label: "所有团队模型" }]);
    expect(modelSentinelOptions("team-1", false, zh)).toEqual([]);
  });

  it("keeps the English sentinel model labels byte-identical", () => {
    expect(modelSentinelOptions(null, false, en)).toEqual([{ value: "all-proxy-models", label: "All Proxy Models" }]);
    expect(modelSentinelOptions("team-1", true, en)).toEqual([{ value: "all-team-models", label: "All Team Models" }]);
  });

  it("returns the Chinese current-value placeholder and hides the English original", () => {
    const result = currentValuePlaceholder(true, ["gpt-4", "claude-3"], { premium: "premium", empty: "empty" }, zh);

    expect(result).toBe("当前：gpt-4, claude-3");
    expect(result).not.toContain("Current:");
  });

  it("returns the caller-supplied hints untouched", () => {
    expect(currentValuePlaceholder(false, ["gpt-4"], { premium: "premium", empty: "empty" }, zh)).toBe("premium");
    expect(currentValuePlaceholder(true, [], { premium: "premium", empty: "empty" }, zh)).toBe("empty");
  });
});
