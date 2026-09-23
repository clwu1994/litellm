import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import type { ModelActivityData } from "../types";
import KeyActivityPanel from "./KeyActivityPanel";

vi.mock("@/components/activity_metrics", () => ({
  ActivityMetrics: ({ modelMetrics }: { modelMetrics: Record<string, ModelActivityData> }) => (
    <ul data-testid="rendered-keys">
      {Object.keys(modelMetrics).map((hash) => (
        <li key={hash}>{hash}</li>
      ))}
    </ul>
  ),
}));

function activity(label: string, user_email: string | null, user_id: string | null): ModelActivityData {
  return {
    label,
    key_metadata: { key_alias: label, team_id: "team-1", user_id, user_email },
    total_requests: 1,
    total_successful_requests: 1,
    total_failed_requests: 0,
    total_cache_read_input_tokens: 0,
    total_cache_creation_input_tokens: 0,
    total_tokens: 10,
    prompt_tokens: 5,
    completion_tokens: 5,
    total_spend: 0.01,
    top_api_keys: [],
    top_models: [],
    daily_data: [],
  };
}

const keyMetrics: Record<string, ModelActivityData> = {
  "hash-alice": activity("alice-key", "alice@example.com", "user-alice"),
  "hash-bob": activity("bob-key", "bob@example.com", "user-bob"),
};

describe("KeyActivityPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese search controls and key count", () => {
    renderWithProviders(<KeyActivityPanel keyMetrics={keyMetrics} />);

    expect(screen.getByLabelText("搜索密钥")).toHaveAttribute(
      "placeholder",
      "按密钥别名、密钥哈希、用户 ID 或邮箱搜索",
    );
    expect(screen.queryByLabelText("Search keys")).not.toBeInTheDocument();
    expect(screen.getByText("显示 2 个密钥中的 2 个")).toBeInTheDocument();
    expect(screen.queryByText("Showing 2 of 2 keys")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("搜索密钥"), { target: { value: "alice" } });
    expect(screen.getByLabelText("清除密钥搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear key search")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state with the searched query", () => {
    renderWithProviders(<KeyActivityPanel keyMetrics={keyMetrics} />);

    fireEvent.change(screen.getByLabelText("搜索密钥"), { target: { value: "carol" } });

    expect(screen.getByText('此日期范围内没有匹配 "carol" 的密钥')).toBeInTheDocument();
    expect(screen.queryByText('No keys match "carol" in this date range')).not.toBeInTheDocument();
  });
});
