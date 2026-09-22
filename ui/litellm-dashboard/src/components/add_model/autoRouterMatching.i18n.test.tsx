import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";
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

const expectChineseLabel = (zh: string, en: string) => {
  expect(screen.getAllByLabelText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByLabelText(en)).toHaveLength(0);
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

  it("renders the semantic tooltip, empty embedding state and required-model message in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SemanticKeywordMatching
        enabled
        onEnabledChange={vi.fn()}
        embeddingModel={undefined}
        onEmbeddingModelChange={vi.fn()}
        matchThreshold={0.5}
        onMatchThresholdChange={vi.fn()}
        modelInfo={[]}
        showValidationErrors
      />,
    );

    await user.hover(findTooltipTriggerBeside(screen.getByText("语义关键词匹配")));
    expect(
      await screen.findByText("通过比较嵌入而非纯文本，识别超出精确关键词匹配的相关措辞。会覆盖直接关键词匹配"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Recognize related phrasing beyond exact keyword matches by comparing embeddings instead of plain text. Overrides direct keyword matching",
      ),
    ).not.toBeInTheDocument();

    expectChinese("必须选择嵌入模型", "An embedding model is required");

    await user.click(screen.getByPlaceholderText("选择嵌入模型"));
    expect(await screen.findByText("未找到嵌入模型")).toBeInTheDocument();
    expect(screen.queryByText("No embedding models found")).not.toBeInTheDocument();
  });

  it("renders the adaptive routing help copy in Chinese", () => {
    renderWithProviders(<AdaptiveRoutingConfig value={value} onChange={vi.fn()} />);

    expectChinese(
      "它会从每段对话的实际进展中学习：用户是否需要重新表述或纠正模型、模型是否陷入重复、是否用完工具调用、用户是否看起来满意。结合成本，这种实时反馈会将未来的路由转向实际表现良好的模型，并随着更多对话的到来而改进。在获得足够反馈之前，它会默认使用已分类层级的模型。",
      "It learns from how each conversation actually goes: does the user have to rephrase or correct the model, does it get stuck repeating itself, does it run out of tool calls, does the user seem satisfied. Combined with cost, this live feedback shifts future routing toward the models that are actually working well, and improves as more conversations come in. Until there's enough feedback, it defaults to the classified tier's model.",
    );
    expectChinese("质量与成本（30% 质量 / 70% 成本）", "Quality vs. Cost (30% quality / 70% cost)");
    expectChinese(
      "质量权重越高，越偏向能力更强（更贵）的模型；当 bandit 有反馈可依据时，成本权重越高，越偏向更便宜的模型。推荐：30% 质量 / 70% 成本。",
      "Higher quality weight favors more capable (pricier) models; higher cost weight favors cheaper models when the bandit has feedback to act on. Recommended: 30% quality / 70% cost split.",
    );
    expectChinese(
      "—— 路由器可以跨层级选择，取决于哪个最适合该提示词",
      "— router can pick across tiers, depending on the best fit for the prompt",
    );
    expectChinese("—— 路由器只能在层级内选择模型", "— router can only pick models within tier");
  });

  it("renders the affinity help in Chinese", () => {
    renderWithProviders(<AffinityControls value={value} onChange={vi.fn()} />);

    expectChinese(
      "让会话保持在组内的同一部署上，从而保持提供商提示词缓存的热度。关闭后每一轮都会进行负载均衡。",
      "Keeps a session on the same deployment within a group, so provider prompt caches stay warm. Turn off to load-balance every turn.",
    );
  });

  it("renders the escalation tooltip and help in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EscalationKeywords keywords={[]} onChange={vi.fn()} />);

    await user.hover(findTooltipTriggerBeside(screen.getByText("升级关键词")));
    expect(
      await screen.findByText(
        "用户可在消息中包含的区分大小写的短语，用于在对结果不满意时强制提升到下一个更高的复杂度层级。它们可以强制使用更强的模型，但不能选择具体哪个。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Case-sensitive phrases a user can include in their message to force a bump to the next-higher complexity tier when they aren't happy with results. They can force a stronger model, but not choose which one.",
      ),
    ).not.toBeInTheDocument();

    expectChinese(
      "可选：当用户消息包含这些短语之一时，请求会被提升一个层级，高于原本的路由目标。匹配区分大小写，因此“LITELLM ESCALATE”仅在完全一致的大写形式下触发。留空则禁用。",
      'Optional: when a user message contains one of these phrases, the request is bumped one tier higher than it would otherwise route to. Matching is case-sensitive, so "LITELLM ESCALATE" only fires on the exact, shouted form. Leave empty to disable.',
    );
  });

  it("renders the keyword rules tooltip, help, aria labels and empty state in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <KeywordTierRules
        rules={[{ id: "r1", keywords: [], tier: "MEDIUM" }]}
        onChange={vi.fn()}
        tierLabels={undefined}
      />,
    );

    await user.hover(findTooltipTriggerBeside(screen.getByText("关键词层级覆盖")));
    expect(
      await screen.findByText("匹配已知术语，并将请求直接强制路由到选定的复杂度层级，绕过基于规则的评分。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Match known terms and force the request straight to a chosen complexity tier, bypassing rule-based scoring.",
      ),
    ).not.toBeInTheDocument();

    expectChinese(
      "可选：将包含特定关键词的请求直接路由到某个层级，例如将“invoice、refund、billing”路由到中等层级。",
      'Optional: route requests containing specific keywords directly to a tier, e.g. route "invoice, refund, billing" to the medium tier.',
    );
    expectChineseLabel("将关键词规则 1 路由到层级", "Route keyword rule 1 to tier");
    expectChineseLabel("移除关键词规则 1", "Remove keyword rule 1");

    await user.click(screen.getByPlaceholderText("e.g., invoice, refund, billing"));
    expect(await screen.findByText("输入以添加关键词")).toBeInTheDocument();
    expect(screen.queryByText("Type to add a keyword")).not.toBeInTheDocument();
  });

  it("renders the stall escalation help and repeats help in Chinese", () => {
    renderWithProviders(
      <StallEscalationConfig value={{ ...value, stall_escalation_enabled: true }} onChange={vi.fn()} />,
    );

    expectChinese(
      "当模型不断重复同一个工具调用，或同一个调用持续出错时，只要看起来卡住，就将请求提升一个层级。这是升级关键词的自动对应机制：无需有人注意到循环并主动请求。关闭时，卡住的任务会继续使用其被分类到的模型。",
      "When the model keeps repeating the same tool call, or the same call keeps erroring, bump the request one tier higher for as long as it looks stuck. The automatic counterpart to an escalation keyword: nobody has to notice the loop and ask. Off means a stuck task keeps the model it was classified onto.",
    );
    expectChinese(
      "多少次相同或失败的调用算作卡住。至少为 2；数值越低反应越快，误判也越多。",
      "How many identical or failing calls count as stuck. At least 2; lower reacts sooner and misfires more.",
    );
  });

  it("renders the compression controls in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompressionControls
        value={{ routing: "headroom", sameAsRouting: false, model: undefined }}
        onChange={vi.fn()}
      />,
    );

    await user.hover(findTooltipTriggerBeside(screen.getByText("路由决策")));
    expect(
      await screen.findByText("应用于分类器自身选择层级调用的压缩，独立于请求所路由到的模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Compression applied to the classifier's own call that picks a tier, separate from the model the request routes to.",
      ),
    ).not.toBeInTheDocument();

    expectChineseLabel("路由决策压缩", "Routing decision compression");
    expectChinese("模型调用", "Model call");
    expectChinese("与路由决策相同", "Same as the routing decision");
    expectChinese("使用不同的压缩", "Use a different compression");
    expectChinesePlaceholder("无（不压缩）", "None (no compression)");
    expectChineseLabel("模型调用压缩", "Model call compression");

    const routingInput = screen.getByPlaceholderText("继承请求自身的压缩 guardrail");
    await user.click(routingInput);
    await user.type(routingInput, "zzz");
    expect(await screen.findByText("未找到压缩 guardrail")).toBeInTheDocument();
    expect(screen.queryByText("No compression guardrails found")).not.toBeInTheDocument();
  });

  it("renders the routing help and routed result copy in Chinese", async () => {
    const user = userEvent.setup();
    const networking = await import("../networking");
    vi.mocked(networking.testAutoRouterRouting).mockResolvedValue({
      status: "success",
      result: {
        routed_model: "o3",
        routed_model_configured: false,
        routing_decision: {
          router_model_name: "my-router",
          router_type: "complexity",
          routed_model: "o3",
          cause: "heuristic_scorer",
          tier: "REASONING",
          score: 0.91,
        },
      },
    } as never);

    renderWithProviders(
      <AutoRouterRoutingTest
        accessToken="token"
        config={{ tiers: value.tiers, classifier_type: "heuristic" } as unknown as ComplexityRouterConfigPayload}
        defaultModel="gpt-4o"
        routerName="my-router"
        teamId={undefined}
      />,
    );

    expectChinese(
      "通过此路由器的分类器发送一个提示词，查看它会选择哪个模型以及原因。该提示词仅被分类：不会发送给它所路由到的模型。",
      "Send a prompt through this router's classifier to see which model it would pick, and why. The prompt is only classified: nothing is sent to the model it routes to.",
    );

    fireEvent.change(screen.getByTestId("auto-router-routing-test-prompt"), { target: { value: "hello" } });
    await user.click(screen.getByTestId("auto-router-routing-test-send"));

    expect(await screen.findByText("路由到")).toBeInTheDocument();
    expect(screen.queryByText("Routed to")).not.toBeInTheDocument();
    expect(await screen.findByText("此代理没有该名称的模型组")).toBeInTheDocument();
    expect(screen.queryByText("This proxy has no model group by that name")).not.toBeInTheDocument();
  });

  it("renders the routing running label in Chinese", async () => {
    const user = userEvent.setup();
    const networking = await import("../networking");
    vi.mocked(networking.testAutoRouterRouting).mockReturnValue(new Promise(() => {}) as never);

    renderWithProviders(
      <AutoRouterRoutingTest
        accessToken="token"
        config={{ tiers: value.tiers, classifier_type: "heuristic" } as unknown as ComplexityRouterConfigPayload}
        defaultModel="gpt-4o"
        routerName="my-router"
        teamId={undefined}
      />,
    );

    fireEvent.change(screen.getByTestId("auto-router-routing-test-prompt"), { target: { value: "hello" } });
    await user.click(screen.getByTestId("auto-router-routing-test-send"));

    expect(await screen.findByText("正在路由……")).toBeInTheDocument();
    expect(screen.queryByText("Routing...")).not.toBeInTheDocument();
  });

  it("renders the stall escalation blocked reasons in Chinese", () => {
    const { unmount } = renderWithProviders(
      <StallEscalationConfig value={{ ...value, session_affinity: true }} onChange={vi.fn()} />,
    );
    expectChinese(
      "请将“高级：分类方法”下的“分类频率”设为“每个请求”以使用此功能。每个会话仅评分一次会重放该模型而不是进行分类，因此停滞永远不会到达分类器。",
      'Set "How often to classify" to every request under Advanced: Classification Method to use this. Scoring once per session replays that model instead of classifying, so a stall never reaches the classifier.',
    );
    unmount();

    renderWithProviders(
      <StallEscalationConfig value={{ ...value, classification_mode: "user_turn" }} onChange={vi.fn()} />,
    );
    expectChinese(
      "请将“高级：分类方法”下的“分类频率”设为“每个请求”以使用此功能。仅对新用户消息评分会跳过停滞出现的工具调用轮次。",
      'Set "How often to classify" to every request under Advanced: Classification Method to use this. Scoring only new user messages skips the tool-call turns a stall shows up in.',
    );
  });
});
