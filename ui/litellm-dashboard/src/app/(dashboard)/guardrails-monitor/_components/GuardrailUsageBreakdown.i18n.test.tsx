import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { GuardrailUsageBreakdown } from "./GuardrailUsageBreakdown";

const detail: GuardrailUsageDetail = {
  guardrail_id: "bedrock-pii-mask",
  guardrail_name: "bedrock-pii-mask",
  type: "pii",
  provider: "Bedrock",
  requestsEvaluated: 5,
  failRate: 0,
  avgScore: null,
  avgLatency: 120,
  status: "healthy",
  trend: "stable",
  description: null,
  time_series: [],
  usage_units: { contentPolicyUnits: 1000, sensitiveInformationPolicyUnits: 300, someFutureCounter: 7 },
  usage_units_daily: [],
  usage_units_by_team: {
    "team-a": { contentPolicyUnits: 900, sensitiveInformationPolicyUnits: 300 },
    "": { contentPolicyUnits: 100, someFutureCounter: 7 },
  },
  usage_units_by_key: {
    "hash-1": { contentPolicyUnits: 1000, sensitiveInformationPolicyUnits: 300 },
    "hash-2": { someFutureCounter: 7 },
  },
  cost: 0.18,
  cost_by_unit: { contentPolicyUnits: 0.15, sensitiveInformationPolicyUnits: 0.03, someFutureCounter: null },
  cost_by_team: { "team-a": 0.165, "": 0.015 },
  cost_by_key: { "hash-1": 0.18, "hash-2": null },
  untracked_usage_units: { someFutureCounter: 7 },
  untracked_usage_units_by_team: { "team-a": {}, "": { someFutureCounter: 7 } },
  untracked_usage_units_by_key: { "hash-1": {}, "hash-2": { someFutureCounter: 7 } },
};

const singleCounterDetail: GuardrailUsageDetail = {
  ...detail,
  usage_units: { contentPolicyUnits: 1000 },
  usage_units_by_team: { "team-a": { contentPolicyUnits: 1000 } },
  usage_units_by_key: { "hash-1": { contentPolicyUnits: 1000 } },
  cost_by_unit: { contentPolicyUnits: 0.15 },
  cost_by_team: { "team-a": 0.15 },
  cost_by_key: { "hash-1": 0.15 },
  untracked_usage_units: {},
  untracked_usage_units_by_team: { "team-a": {} },
  untracked_usage_units_by_key: { "hash-1": {} },
};

const renderBreakdown = (value: GuardrailUsageDetail = detail) =>
  renderWithProviders(<GuardrailUsageBreakdown detail={value} />);

const partiallyUnpricedDetail: GuardrailUsageDetail = {
  ...detail,
  usage_units: { wordPolicyUnits: 8, sensitiveInformationPolicyUnits: 4 },
  usage_units_by_team: {},
  usage_units_by_key: {},
  cost: 0.0009,
  cost_by_unit: { wordPolicyUnits: 0.0006, sensitiveInformationPolicyUnits: 0.0003 },
  cost_by_team: {},
  cost_by_key: {},
  untracked_usage_units: { wordPolicyUnits: 2, sensitiveInformationPolicyUnits: 1 },
  untracked_usage_units_by_team: {},
  untracked_usage_units_by_key: {},
};

const emptyUsageDetail: GuardrailUsageDetail = {
  ...detail,
  usage_units: {},
  usage_units_by_team: {},
  usage_units_by_key: {},
  cost: null,
  cost_by_unit: {},
  cost_by_team: {},
  cost_by_key: {},
  untracked_usage_units: {},
  untracked_usage_units_by_team: {},
  untracked_usage_units_by_key: {},
};

describe("GuardrailUsageBreakdown Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese section heading, description and metric labels", () => {
    renderBreakdown();

    expect(screen.getByRole("region", { name: "用量与成本" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Usage and cost" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "用量与成本", level: 5 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Usage & Cost" })).not.toBeInTheDocument();
    expect(screen.getByText("提供商为此 Guardrail 上报的计费单位，以及 LiteLLM 为其定价的结果")).toBeInTheDocument();
    expect(
      screen.queryByText("Billable units the provider reported for this guardrail and what LiteLLM priced them at"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "成本" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Cost" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "用量单位" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Usage Units" })).not.toBeInTheDocument();
  });

  it("renders the Chinese table headings and column headers", () => {
    renderBreakdown();

    expect(screen.getByRole("heading", { name: "按计数器" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "By counter" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "按团队" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "By team" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "按密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "By key" })).not.toBeInTheDocument();

    const [counterTable, teamTable, keyTable] = screen.getAllByRole("table");
    expect(within(counterTable).getByRole("columnheader", { name: "计数器" })).toBeInTheDocument();
    expect(within(counterTable).queryByRole("columnheader", { name: "Counter" })).not.toBeInTheDocument();
    expect(within(teamTable).getByRole("columnheader", { name: "团队" })).toBeInTheDocument();
    expect(within(teamTable).queryByRole("columnheader", { name: "Team" })).not.toBeInTheDocument();
    expect(within(keyTable).getByRole("columnheader", { name: "密钥" })).toBeInTheDocument();
    expect(within(keyTable).queryByRole("columnheader", { name: "Key" })).not.toBeInTheDocument();

    for (const table of [counterTable, teamTable, keyTable]) {
      expect(within(table).getByRole("columnheader", { name: "单位" })).toBeInTheDocument();
      expect(within(table).queryByRole("columnheader", { name: "Units" })).not.toBeInTheDocument();
      expect(within(table).getByRole("columnheader", { name: "成本" })).toBeInTheDocument();
      expect(within(table).queryByRole("columnheader", { name: "Cost" })).not.toBeInTheDocument();
      expect(within(table).getByRole("columnheader", { name: "未定价单位" })).toBeInTheDocument();
      expect(within(table).queryByRole("columnheader", { name: "Unpriced Units" })).not.toBeInTheDocument();
    }

    expect(screen.getByRole("row", { name: /无团队/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /No team/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-key fallback", () => {
    renderBreakdown({ ...detail, usage_units_by_key: { "": { contentPolicyUnits: 1000 } } });

    expect(screen.getByRole("row", { name: /无密钥/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /No key/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese cost math popover", async () => {
    const user = userEvent.setup();
    renderBreakdown();

    await user.click(within(screen.getByRole("group", { name: "成本" })).getByRole("button", { name: "如何计算？" }));

    const dialog = await screen.findByRole("dialog", { name: "此成本如何计算" });
    expect(screen.queryByRole("dialog", { name: "How this cost is calculated" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("已定价单位 × 单价 = 成本（按计数器）")).toBeInTheDocument();
    expect(within(dialog).queryByText("priced units × price per unit = cost, per counter")).not.toBeInTheDocument();
    expect(within(dialog).getByText("单价来自 LiteLLM 自带的成本映射。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Per-unit prices come from the cost map LiteLLM ships with."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("没有已知价格，未计入")).toBeInTheDocument();
    expect(within(dialog).queryByText("no known price, left out")).not.toBeInTheDocument();
  });

  it("renders the Chinese usage units math popover", async () => {
    const user = userEvent.setup();
    renderBreakdown();

    await user.click(
      within(screen.getByRole("group", { name: "用量单位" })).getByRole("button", {
        name: "如何计算？",
      }),
    );

    const dialog = await screen.findByRole("dialog", { name: "用量单位如何累加" });
    expect(screen.queryByRole("dialog", { name: "How usage units add up" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("计数器 + 计数器 + … = 用量单位")).toBeInTheDocument();
    expect(within(dialog).queryByText("counter + counter + … = usage units")).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("用量单位是提供商为此 Guardrail 上报的计费计数器，在所有调用中累加得出。"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Units are the billable counters the provider reported for this guardrail, added up over every call.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese counter count for several counters", () => {
    renderBreakdown();

    expect(screen.getByText("3 个计数器")).toBeInTheDocument();
    expect(screen.queryByText("3 counters")).not.toBeInTheDocument();
  });

  it("renders the Chinese counter count for a single counter", () => {
    renderBreakdown(singleCounterDetail);

    expect(screen.getByText("1 个计数器")).toBeInTheDocument();
    expect(screen.queryByText("1 counter")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state when nothing was billable", () => {
    renderBreakdown(emptyUsageDetail);

    expect(screen.getByText("该时间段未记录任何计费用量单位。")).toBeInTheDocument();
    expect(screen.queryByText("No billable usage units were recorded in this period.")).not.toBeInTheDocument();
  });

  it("renders the Chinese per-counter unpriced notes for one and several units", async () => {
    const user = userEvent.setup();
    renderBreakdown(partiallyUnpricedDetail);

    await user.click(within(screen.getByRole("group", { name: "成本" })).getByRole("button", { name: "如何计算？" }));

    const dialog = await screen.findByRole("dialog", { name: "此成本如何计算" });
    expect(within(dialog).getByText("2 个单位未定价，未计入")).toBeInTheDocument();
    expect(within(dialog).queryByText("2 unpriced units left out")).not.toBeInTheDocument();
    expect(within(dialog).getByText("1 个单位未定价，未计入")).toBeInTheDocument();
    expect(within(dialog).queryByText("1 unpriced unit left out")).not.toBeInTheDocument();
  });

  it("renders the Chinese unpriced unit summary for several units", () => {
    renderBreakdown(partiallyUnpricedDetail);

    expect(screen.getByText("3 个单位未定价")).toBeInTheDocument();
    expect(screen.queryByText("3 units unpriced")).not.toBeInTheDocument();
  });

  it("renders the Chinese unpriced unit summary for a single unit", () => {
    renderBreakdown({ ...partiallyUnpricedDetail, untracked_usage_units: { wordPolicyUnits: 1 } });

    expect(screen.getByText("1 个单位未定价")).toBeInTheDocument();
    expect(screen.queryByText("1 unit unpriced")).not.toBeInTheDocument();
  });

  it("keeps the English counter count singular and plural literals under en", async () => {
    await i18n.changeLanguage("en");

    const { unmount } = renderBreakdown();
    expect(screen.getByText("3 counters")).toBeInTheDocument();
    unmount();

    renderBreakdown(singleCounterDetail);
    expect(screen.getByText("1 counter")).toBeInTheDocument();
  });
});
