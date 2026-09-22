import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import RouterSettingsSummary from "./RouterSettingsSummary";

describe("RouterSettingsSummary Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state and hides the English original", () => {
    renderWithProviders(<RouterSettingsSummary routerSettings={{ fallbacks: null, num_retries: null }} />);

    expect(screen.getByText("未配置路由设置")).toBeInTheDocument();
    expect(screen.queryByText("No router settings configured")).not.toBeInTheDocument();
  });

  it("renders the Chinese setting labels and hides the English originals", () => {
    renderWithProviders(
      <RouterSettingsSummary
        routerSettings={{
          routing_strategy: "least-busy",
          num_retries: 3,
          allowed_fails: 2,
          cooldown_time: 5,
          timeout: 30,
          retry_after: 1,
          enable_tag_filtering: true,
          fallbacks: [{ "gpt-4": ["gpt-4o"] }],
        }}
      />,
    );

    expect(screen.getByText("路由策略：")).toBeInTheDocument();
    expect(screen.getByText("重试次数：3")).toBeInTheDocument();
    expect(screen.getByText("允许失败次数：2")).toBeInTheDocument();
    expect(screen.getByText("冷却时间：5s")).toBeInTheDocument();
    expect(screen.getByText("超时时间：30s")).toBeInTheDocument();
    expect(screen.getByText("重试等待：1s")).toBeInTheDocument();
    expect(screen.getByText("标签筛选：已启用")).toBeInTheDocument();
    expect(screen.getByText("回退：")).toBeInTheDocument();

    expect(screen.queryByText("Routing Strategy: ")).not.toBeInTheDocument();
    expect(screen.queryByText("Number of Retries: 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Allowed Failures: 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Cooldown Time: 5s")).not.toBeInTheDocument();
    expect(screen.queryByText("Timeout: 30s")).not.toBeInTheDocument();
    expect(screen.queryByText("Retry After: 1s")).not.toBeInTheDocument();
    expect(screen.queryByText("Tag Filtering: Enabled")).not.toBeInTheDocument();
    expect(screen.queryByText("Fallbacks:")).not.toBeInTheDocument();
  });
});
