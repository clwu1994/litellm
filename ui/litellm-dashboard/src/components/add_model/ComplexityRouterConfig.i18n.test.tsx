import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";
import ComplexityRouterConfig, { type ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);

const mockModelInfo = [
  { model_group: "gpt-4", mode: "chat", supports_reasoning: true, supported_reasoning_efforts: ["medium", "high"] },
  { model_group: "gpt-3.5-turbo", mode: "chat" },
] as never[];

const tiers = {
  SIMPLE: ["gpt-3.5-turbo"],
  MEDIUM: ["gpt-3.5-turbo"],
  COMPLEX: ["gpt-4"],
  REASONING: ["gpt-4"],
};

const baseProps = {
  modelInfo: mockModelInfo,
  value: { tiers, classifier_type: "heuristic" } as ComplexityRouterConfigValue,
  onChange: vi.fn(),
  keywordTierRules: [],
  onKeywordTierRulesChange: vi.fn(),
  semanticMatchingEnabled: false,
  onSemanticMatchingEnabledChange: vi.fn(),
  embeddingModel: undefined,
  onEmbeddingModelChange: vi.fn(),
  matchThreshold: 0.5,
  onMatchThresholdChange: vi.fn(),
  escalationKeywords: [],
  onEscalationKeywordsChange: vi.fn(),
  onAutoRouterCompressionChange: vi.fn(),
};

const customValue: ComplexityRouterConfigValue = {
  ...baseProps.value,
  classifier_type: "llm",
  classifier_llm_config: { model: "gpt-4", timeout_ms: 3000 },
  custom_tier_set: {
    tiers: [
      { id: "CASUAL", name: "CASUAL", definition: "small talk", models: ["gpt-3.5-turbo"] },
      { id: "sec", name: "SECURITY_REVIEW", definition: "audits", models: ["gpt-4"] },
    ],
    fallback_tier_id: "CASUAL",
  },
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

const openSection = (label: string) => fireEvent.click(screen.getByText(label));

describe("ComplexityRouterConfig Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the heading, tier rows, default model and advanced section labels in Chinese", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    expectChinese("复杂度层级配置", "Complexity Tier Configuration");
    expectChinese("简单 层级", "Simple Tier");
    expectChinese("中等 层级", "Medium Tier");
    expectChinese("复杂 层级", "Complex Tier");
    expectChinese("推理 层级", "Reasoning Tier");
    expectChinese("示例：", "Examples:");
    expectChinese("默认模型", "Default Model");
    expectChinese(
      "当请求落入的层级没有模型，以及分类器失败且选择了“路由到默认模型”时使用。",
      'Used when the tier the request lands in has no model, and when the classifier fails with "Route to the default model" selected.',
    );
    expectChinese("高级：分类方法", "Advanced: Classification Method");
    expectChinese("高级：自适应路由", "Advanced: Adaptive Routing");
    expectChinese("高级：亲和性", "Advanced: Affinity");
    expectChinese("高级：模态路由", "Advanced: Modality Routing");
    expectChinese("高级：计划模式覆盖", "Advanced: Plan-Mode Override");
    expectChinese("高级：上下文窗口升级", "Advanced: Context Window Escalation");
    expectChinese("高级：停滞任务升级", "Advanced: Stalled Task Escalation");
    expectChinese("高级：响应格式", "Advanced: Response Format");
    expectChinese("高级：升级关键词", "Advanced: Escalation Keywords");
    expectChinese("高级：压缩", "Advanced: Compression");
    expectChinese("高级：关键词/语义匹配", "Advanced: Keyword/Semantic Matching");
    expectChinese(
      "复杂度路由器使用基于规则的评分自动按复杂度对请求进行分类（不调用 API，延迟低于 1 毫秒）。请配置每个层级由哪些模型处理。",
      "The complexity router automatically classifies requests by complexity using rule-based scoring (no API calls, <1ms latency). Configure which model(s) handle each tier.",
    );
    expectChinesePlaceholder("由层级推导：gpt-3.5-turbo", "Derived from tiers: gpt-3.5-turbo");
    expectChineseLabel("默认模型", "Default model");
  });

  it("renders the Chinese heading tooltip inside the open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    await user.hover(findTooltipTriggerBeside(screen.getByText("复杂度层级配置")));

    expect(
      await screen.findByText(
        "将每个复杂度层级映射到一个或多个模型。简单查询使用更便宜、更快的模型，复杂查询使用能力更强的模型。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Map each complexity tier to one or more models. Simple queries use cheaper/faster models, complex queries use more capable models.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese non-reasoning, modality, context-window and response-format sections when opened", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    expectChinese("添加非推理层级", "Add a non-reasoning tier");
    expectChinese(
      "在简单层级下方添加 NON_REASONING，用于中继或重新格式化信息而非进行推理的操作性智能体流量。当请求需要更多能力时，升级仍会从此层级向上移动。",
      "Adds NON_REASONING below Simple, for operational agent traffic that relays or reformats information rather than reasoning about it. Escalation still moves up out of it when a request needs more.",
    );
    expectChinese("需要 LLM 分类方法。", "Requires the LLM classification method.");

    openSection("高级：模态路由");
    expectChinese("将图像请求路由到支持视觉的模型", "Route image requests to vision-capable models");
    expectChinese("为图像请求覆盖会话固定", "Override session pin for image requests");
    expectChinese(
      "即使会话被固定到无法接收图像的模型，也将图像轮次路由到具备能力的模型。固定会被保留，因此下一轮文本请求仍会回到该模型。需要开启图像路由。",
      "Route an image turn to a capable model even when the session is pinned to one that cannot take images. The pin is kept, so the next text turn goes back to it. Needs image routing turned on.",
    );

    openSection("高级：上下文窗口升级");
    expectChinese("将超大提示升级到合适的层级", "Escalate oversized prompts to a tier that fits");
    expectChinese("窗口适配缓冲", "Window fit buffer");
    expectChinese(
      "计数后的提示必须适配的模型窗口比例，大于 0 且不超过 1。留空则跟随后端默认值 0.95。",
      "Fraction of a model's window the counted prompt must fit within, above 0 up to 1. Empty tracks the backend default of 0.95.",
    );

    openSection("高级：响应格式");
    expectChinese("返回原始模型名称", "Return raw model name");
    expectChinese(
      "在响应中返回解析后的底层模型名称，而不是自动路由器别名。",
      "Return the resolved underlying model name in responses instead of the autorouter alias.",
    );
  });

  it("renders the Chinese plan-mode override copy when the plan-mode section is opened", () => {
    renderWithProviders(
      <ComplexityRouterConfig {...baseProps} value={{ ...baseProps.value, plan_mode_min_tier: "SIMPLE" }} />,
    );
    openSection("高级：计划模式覆盖");

    expectChinese("将计划模式请求路由到最低层级", "Route plan-mode requests to a minimum tier");
    expectChinese(
      "处于计划模式的编码智能体（Claude Code、GitHub Copilot）发出的请求至少路由到此层级。当分类器选择更高层级时仍然以分类器为准，该覆盖仅在计划模式激活期间有效。",
      "Requests from coding agents in plan mode (Claude Code, GitHub Copilot) route to at least this tier. The classifier still wins when it picks higher, and the override only lasts while plan mode is active.",
    );
    expectChineseLabel("计划模式最低层级", "Plan-mode minimum tier");
  });

  it("renders the Chinese tier-set toolbar and fallback field for an edited tier set", () => {
    renderWithProviders(
      <ComplexityRouterConfig {...baseProps} value={customValue} editingTiers onEditingTiersChange={vi.fn()} />,
    );

    expectChinese("添加层级", "Add tier");
    expectChinese("完成", "Done");
    expectChinese("恢复默认值", "Restore defaults");
    expectChinese(
      "添加或移除层级以定义你自己的层级集。每个自定义层级都需要一个 LLM 分类器用于路由的定义，编辑过的层级集需要 LLM 分类方法",
      "Add or remove tiers to define your own set. Every custom tier needs a definition the LLM classifier routes on, and an edited set requires the LLM classification method",
    );
    expectChinese("回退层级", "Fallback Tier");
    expectChinesePlaceholder("层级名称，例如 SECURITY_REVIEW", "Tier name, e.g. SECURITY_REVIEW");
    expectChinesePlaceholder(
      "此层级应包含什么，例如请求安全审计",
      "What belongs in this tier, e.g. requests asking for a security audit",
    );
    expectChinese("移除", "Remove");
    expectChinese("自定义", "custom");
    expectChinese("内置", "built-in");
    expectChineseLabel("第 1 个层级的名称", "Name for tier 1");
    expectChineseLabel("第 1 个层级的定义", "Definition for tier 1");
  });

  it("renders the Chinese edit-tier affordance when the parent owns the editor flag", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} onEditingTiersChange={vi.fn()} />);
    expectChinese("编辑层级", "Edit tiers");
  });

  it("renders the Chinese tier label tooltip for a built-in row", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    await user.hover(findTooltipTriggerBeside(screen.getByText("简单 层级")));

    expect(await screen.findByText("基础问题、问候、简单的事实查询")).toBeInTheDocument();
    expect(screen.queryByText("Basic questions, greetings, simple factual queries")).not.toBeInTheDocument();
  });
});
