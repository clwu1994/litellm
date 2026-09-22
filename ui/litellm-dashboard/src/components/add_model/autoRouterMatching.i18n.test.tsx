import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return { ...actual, testModelGroupConnection: vi.fn(), testAutoRouterRouting: vi.fn() };
});

vi.mock("@/app/(dashboard)/hooks/guardrails/useGuardrails", () => ({
  useGuardrails: () => ({ data: { guardrails: [] } }),
}));

import SemanticKeywordMatching from "./SemanticKeywordMatching";
import AdaptiveRoutingConfig from "./AdaptiveRoutingConfig";
import { AffinityControls } from "./AffinityControls";
import EscalationKeywords from "./EscalationKeywords";
import KeywordTierRules from "./KeywordTierRules";
import StallEscalationConfig from "./StallEscalationConfig";
import CompressionControls from "./CompressionControls";
import AutoRouterConnectionTest from "./auto_router_connection_test";
import AutoRouterRoutingTest from "./AutoRouterRoutingTest";
import { DEFAULT_AUTO_ROUTER_COMPRESSION } from "./buildAutoRouterCompression";
import type { ComplexityRouterConfigPayload } from "./build_complexity_router_config";
import type { AutoRouterTestTarget } from "./build_auto_router_test_targets";

const value: ComplexityRouterConfigValue = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: ["o3"], REASONING: ["o3"] },
  classifier_type: "heuristic",
  adaptive: true,
};

const expectChinese = (zh: string, en: string) => {
  expect(screen.getAllByText(zh, { exact: false }).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en, { exact: false })).toHaveLength(0);
};

const expectChinesePlaceholder = (zh: string, en: string) => {
  expect(screen.getAllByPlaceholderText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByPlaceholderText(en)).toHaveLength(0);
};

describe("auto-router matching Chinese copy", () => {
  beforeEach(async () => {
    const networking = await import("../networking");
    vi.mocked(networking.testModelGroupConnection).mockResolvedValue({ status: "success" });
    vi.mocked(networking.testAutoRouterRouting).mockResolvedValue({ status: "error", error: "boom" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the semantic matching section in Chinese", () => {
    renderWithProviders(
      <SemanticKeywordMatching
        enabled
        onEnabledChange={vi.fn()}
        embeddingModel="voyage-3-5"
        onEmbeddingModelChange={vi.fn()}
        matchThreshold={0.5}
        onMatchThresholdChange={vi.fn()}
        modelInfo={[{ model_group: "voyage-3-5", mode: "embedding" }] as never[]}
      />,
    );

    expectChinese("语义关键词匹配", "Semantic keyword matching");
    expectChinese(
      "使用与上方相同的关键词-层级对，并覆盖直接关键词匹配。会因嵌入模型的网络请求而增加延迟。",
      "Uses same keyword-tier pairs as above and overrides direct keyword matching. Adds latency based on embedding model network request.",
    );
    expectChinese("嵌入模型", "Embedding model");
    expectChinese("最低匹配得分", "Minimum match score");
    expectChinese("仅在相似度得分达到或超过此值时才匹配。", "Match only at or above this similarity score.");
    expectChinesePlaceholder("选择嵌入模型", "Select an embedding model");
  });

  it("renders the adaptive routing section in Chinese", () => {
    renderWithProviders(<AdaptiveRoutingConfig value={value} onChange={vi.fn()} />);

    expectChinese("启用自适应 bandit 选择", "Enable adaptive bandit selection");
    expectChinese(
      "禁用时，每个请求始终使用其被分类层级所分配的模型。",
      "When disabled, each request always uses the model assigned to its classified tier.",
    );
    expectChinese("自适应路由如何工作", "How Adaptive Routing Works");
    expectChinese("可用模型池", "Eligible Model Pool");
    expectChinese("所有层级（软下限）", "All tiers (soft floor)");
    expectChinese("仅已分类层级", "Classified tier only");
    expectChinese("层级距离惩罚", "Tier Distance Penalty");
    expectChinese(
      "每偏离已分类层级一个层级步所扣的得分。",
      "Score penalty applied per tier-step away from the classified tier.",
    );
    expectChinese("质量与成本", "Quality vs. Cost");
  });

  it("renders the affinity controls in Chinese", () => {
    renderWithProviders(<AffinityControls value={value} onChange={vi.fn()} />);

    expectChinese("将会话固定到每个模型组的一个部署", "Pin a session to one deployment per model group");
    expectChinese("固定可空闲存活多久（秒）", "How long a pin survives idle (seconds)");
    expectChinese(
      "每次复用固定的请求后都会刷新。留空则跟随后端默认值 3600 秒。",
      "Refreshes after every request that reuses a pin. Empty tracks the backend default of 3600 seconds.",
    );
  });

  it("renders the escalation keywords section in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EscalationKeywords keywords={[]} onChange={vi.fn()} />);

    expectChinese("升级关键词", "Escalation Keywords");

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("输入以添加短语")).toBeInTheDocument();
    expect(screen.queryByText("Type to add a phrase")).not.toBeInTheDocument();
  });

  it("renders the keyword tier rules section in Chinese", () => {
    renderWithProviders(
      <KeywordTierRules
        rules={[{ id: "r1", keywords: [], tier: "MEDIUM" }]}
        onChange={vi.fn()}
        tierLabels={undefined}
      />,
    );

    expectChinese("关键词层级覆盖", "Keyword Tier Overrides");
    expectChinese("添加关键词规则", "Add keyword rule");
    expectChinese("关键词 1", "Keywords 1");
    expectChinese("至少需要一个关键词", "At least one keyword is required");
    expectChinese("路由到层级", "Route to tier");
  });

  it("renders the keyword tier rules empty state in Chinese", () => {
    renderWithProviders(<KeywordTierRules rules={[]} onChange={vi.fn()} />);
    expectChinese("尚未配置任何关键词层级覆盖", "No keyword tier overrides configured");
  });

  it("renders the stall escalation section in Chinese", () => {
    renderWithProviders(
      <StallEscalationConfig value={{ ...value, stall_escalation_enabled: true }} onChange={vi.fn()} />,
    );

    expectChinese("将停滞的任务升级到更强的模型", "Escalate a stalled task to a stronger model");
    expectChinese("升级前的重复次数", "Repeats before escalating");
    expectChinese("检查的最近调用数", "Recent calls examined");
    expectChinese(
      "向前回溯多远（以工具调用计）。永远不会低于重复次数，因为那样将永远无法达到。",
      "How far back to look, in tool calls. Never below the repeat count, since that could never be reached.",
    );
  });

  it("renders the compression controls in Chinese", () => {
    renderWithProviders(<CompressionControls value={DEFAULT_AUTO_ROUTER_COMPRESSION} onChange={vi.fn()} />);

    expectChinese("路由决策", "Routing decision");
    expectChinesePlaceholder("继承请求自身的压缩 guardrail", "Inherit from the request's own compression guardrails");
  });

  it("renders the connection test empty state and help in Chinese", () => {
    renderWithProviders(<AutoRouterConnectionTest accessToken="sk-test" targets={[]} />);
    expectChinese(
      "尚未配置任何复杂度层级，因此没有可测试的内容。",
      "No complexity tiers are configured yet, so there is nothing to test.",
    );
  });

  it("renders the connection test help and target labels in Chinese", () => {
    const targets: AutoRouterTestTarget[] = [
      { labels: ["SIMPLE"], modelGroup: "gpt-4o-mini", mode: "chat" },
      { labels: ["Embedding"], modelGroup: "voyage-3-5", mode: "embedding" },
      { labels: ["Classifier"], modelGroup: "gpt-5-mini", mode: "chat" },
    ];
    renderWithProviders(<AutoRouterConnectionTest accessToken="sk-test" targets={targets} />);

    expectChinese(
      "“测试连接”会向每个已配置的层级、分类器、默认模型和嵌入模型发送一个最小请求。分类器探测会包含其推理强度覆盖设置。",
      "Test Connection sends a minimal request to every configured tier, classifier, default, and embedding model. The classifier probe includes its reasoning effort override.",
    );
    expectChinese("嵌入", "Embedding");
    expectChinese("分类器", "Classifier");
    expectChinese("（嵌入）", " (embedding)");
  });

  it("renders the routing test copy in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AutoRouterRoutingTest
        accessToken="token"
        config={{ tiers: value.tiers, classifier_type: "heuristic" } as unknown as ComplexityRouterConfigPayload}
        defaultModel="gpt-4o"
        routerName="my-router"
        teamId={undefined}
      />,
    );

    expectChinese("发送测试提示词", "Send Test Prompt");
    expectChinesePlaceholder("粘贴终端用户可能发送的提示词", "Paste a prompt an end user would send");

    fireEvent.change(screen.getByTestId("auto-router-routing-test-prompt"), { target: { value: "hello" } });
    await user.click(screen.getByTestId("auto-router-routing-test-send"));
    expect(await screen.findByText("无法路由此提示词")).toBeInTheDocument();
    expect(screen.queryByText("Could not route this prompt")).not.toBeInTheDocument();
  });
});
