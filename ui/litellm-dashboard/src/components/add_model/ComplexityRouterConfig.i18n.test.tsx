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

  it("renders the non-reasoning tier row, its tooltip and the requires-LLM hint in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ComplexityRouterConfig {...baseProps} value={{ ...baseProps.value, enable_non_reasoning_tier: true }} />,
    );

    expectChinese("非推理 层级", "Non-reasoning Tier");
    expectChinese(" 需要 LLM 分类方法。", " Requires the LLM classification method.");

    await user.hover(findTooltipTriggerBeside(screen.getByText("非推理 层级")));
    expect(await screen.findByText("操作性中继工作：只传递信息，不进行任何判断")).toBeInTheDocument();
    expect(
      screen.queryByText("Operational relay work: passing information along with no judgment about it"),
    ).not.toBeInTheDocument();
  });

  it("renders the built-in tier descriptions inside their open tooltips in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    const cases = [
      ["中等 层级", "需要一定推理或解释的标准查询", "Standard queries requiring some reasoning or explanation"],
      ["复杂 层级", "需要深入知识的技术性多部分请求", "Technical, multi-part requests requiring deep knowledge"],
      ["推理 层级", "思维链、分析、明确的推理请求", "Chain-of-thought, analysis, explicit reasoning requests"],
    ];
    for (const [label, zh, en] of cases) {
      await user.hover(findTooltipTriggerBeside(screen.getByText(label)));
      expect(await screen.findByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the default-model tooltip, tier placeholders and effort labels in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    await user.hover(findTooltipTriggerBeside(screen.getAllByText("默认模型")[0]));
    expect(
      await screen.findByText("留空则跟随层级。在此选择的模型会被固定：无论层级如何变化，它都保持为默认值。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Leave empty to follow the tiers. A model chosen here is pinned: it stays the default however the tiers change.",
      ),
    ).not.toBeInTheDocument();

    expectChinesePlaceholder("为 简单 查询选择模型", "Select model(s) for simple queries");
    expectChinesePlaceholder("为 中等 查询选择模型", "Select model(s) for medium queries");
    expectChineseLabel("复杂 层级中 gpt-4 的推理强度", "Reasoning effort for gpt-4 in the COMPLEX tier");

    await user.hover(findTooltipTriggerBeside(screen.getAllByText("推理强度")[0]));
    expect(
      await screen.findByText(
        "作为 reasoning_effort 发送到此层级路由到该模型的请求，覆盖调用方的值。默认值保持请求不变。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Sent as reasoning_effort on requests this tier routes to the model, overriding the caller's value. Default leaves the request untouched.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the tier display-name affordances in Chinese", () => {
    renderWithProviders(
      <ComplexityRouterConfig {...baseProps} value={{ ...baseProps.value, tier_labels: { SIMPLE: "Basic" } }} />,
    );

    expectChinesePlaceholder("显示名称（默认：简单）", "Display name (default: Simple)");
    expectChineseLabel("简单 层级的显示名称", "Display name for the Simple tier");
    expectChineseLabel("清除 简单 层级的显示名称", "Clear display name for the Simple tier");
  });

  it("renders the LLM intro copy in Chinese", () => {
    renderWithProviders(
      <ComplexityRouterConfig {...baseProps} value={{ ...baseProps.value, classifier_type: "llm" }} />,
    );

    expectChinese(
      "重命名层级，以便在仪表盘和支出日志中使用你自己的术语。重命名不会改变请求的分类方式，调用方也看不到这些名称。",
      "Rename a tier to use your own vocabulary in the dashboard and your spend logs. Renaming doesn't change how requests are classified, and callers never see these names.",
    );
    expectChinese(
      " 你的分类器模型会读取这些名称，因此更清晰的名称可以提升其判断质量。",
      " Your classifier model reads these names, so clearer ones can sharpen its choices.",
    );
  });

  it("renders the modality and context-window help in Chinese", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    openSection("高级：模态路由");
    expectChinese(
      "将无法接收图像输入的路由模型替换为最近的、能够接收的更高层级，其次替换为默认模型，而不是让提供商返回 400。只有明确声明 supports_vision 为 false 的模型会被替换；除非开启下方覆盖，否则保留的会话固定仍然优先。",
      "Replaces a routed model that cannot take image input with the nearest higher tier that can, then the default model, instead of failing with a provider 400. Only models explicitly declared supports_vision false are replaced, and a kept session pin still wins unless you turn on the override below.",
    );

    openSection("高级：上下文窗口升级");
    expectChinese(
      "当提示明显无法放入已确定层级的上下文窗口时，将其路由到窗口能够容纳它的最低层级，而不是让提供商拒绝。关闭时，请求仅按复杂度分发。",
      "When a prompt provably cannot fit the decided tier's context windows, route it to the lowest tier whose window holds it instead of letting the provider reject it. Off means requests dispatch on complexity alone.",
    );
  });

  it("renders the plan-mode empty help in Chinese", () => {
    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        value={{
          ...baseProps.value,
          tiers: { SIMPLE: [], MEDIUM: [], COMPLEX: [], REASONING: [] },
          plan_mode_min_tier: "SIMPLE",
        }}
      />,
    );
    openSection("高级：计划模式覆盖");

    expectChinese(" 请为某个层级添加模型以启用此功能。", " Add models to a tier to enable this.");
  });

  it("renders the tier missing-model and multiple-model copy in Chinese", () => {
    const { unmount } = renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        showValidationErrors
        value={{ ...baseProps.value, tiers: { ...tiers, COMPLEX: [] } }}
      />,
    );
    expectChinese("必须配置 复杂 层级", "The 复杂 tier is required");
    unmount();

    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        value={{ ...baseProps.value, tiers: { ...tiers, COMPLEX: ["gpt-4", "gpt-3.5-turbo"] } }}
      />,
    );
    expectChinese(
      "选择了多个模型：路由器会按请求随机选择（开启自适应路由时则在模型池中进行 Thompson 采样）。",
      "Multiple models selected: the router randomly picks among them per request (or Thompson-samples within the pool when adaptive routing is on).",
    );
  });

  it("renders the custom tier-set toolbar, fallback and row chrome in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        value={customValue}
        editingTiers
        onEditingTiersChange={vi.fn()}
        keywordRulesError={
          { key: "autoRouterConfig.complexity.keywordRuleError.orphaned", values: { rules: "1" } } as never
        }
      />,
    );

    expectChinese("第 1 个层级，共 2 个", "Tier 1 of 2");
    expectChineseLabel("移除 CASUAL 层级", "Remove the CASUAL tier");
    expectChinese(
      "请在“高级：关键词/语义匹配”下编辑规则，或恢复该层级",
      "Edit the rules under Advanced: Keyword/Semantic Matching, or bring the tier back",
    );

    await user.hover(findTooltipTriggerBeside(screen.getByText("回退层级")));
    expect(
      await screen.findByText(
        "当 LLM 分类器出错、超时或返回无法解析的回复时请求的路由目标。编辑过的层级集必须设置：启发式评分器无法生成你的层级。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Where requests route when the LLM classifier errors, times out, or returns an unparseable reply. Required for an edited tier set: the heuristic scorer cannot produce your tiers.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the fallback placeholder in Chinese when no fallback tier is chosen", () => {
    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        value={{ ...customValue, custom_tier_set: { ...customValue.custom_tier_set!, fallback_tier_id: "" } }}
      />,
    );

    expectChinese("选择分类器失败时的路由层级", "Pick the tier classifier failures route to");
  });

  it("renders the built-in definition placeholder and the required-definition copy in Chinese", () => {
    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        editingTiers
        onEditingTiersChange={vi.fn()}
        showValidationErrors
        value={{
          ...baseProps.value,
          classifier_type: "llm",
          classifier_llm_config: { model: "gpt-4", timeout_ms: 3000 },
          custom_tier_set: {
            tiers: [
              { id: "s", name: "SIMPLE", definition: "", models: ["gpt-4"] },
              { id: "b", name: "AUDIT", definition: "", models: ["gpt-4"] },
            ],
            fallback_tier_id: "s",
          },
        }}
      />,
    );

    expectChinesePlaceholder("留空以保留内置定义", "Leave blank to keep the built-in definition");
    expectChinese(
      "必须提供定义：它是分类器为此层级路由所依据的评分标准",
      "A definition is required: it is the rubric the classifier routes on for this tier",
    );
  });

  it("renders the custom tier tooltip and unnamed row label in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ComplexityRouterConfig
        {...baseProps}
        editingTiers
        onEditingTiersChange={vi.fn()}
        value={{
          ...baseProps.value,
          classifier_type: "llm",
          classifier_llm_config: { model: "gpt-4", timeout_ms: 3000 },
          custom_tier_set: {
            tiers: [
              { id: "a", name: "", definition: "", models: ["gpt-4"] },
              { id: "b", name: "AUDIT", definition: "audits", models: ["gpt-4"] },
            ],
            fallback_tier_id: "b",
          },
        }}
      />,
    );

    expectChineseLabel("移除 层级 1 层级", "Remove the tier 1 tier");

    await user.hover(findTooltipTriggerBeside(screen.getByText("新建 层级")));
    expect(await screen.findByText("你定义的层级。分类器会将符合其定义的请求路由到这里。")).toBeInTheDocument();
    expect(
      screen.queryByText("A tier you defined. The classifier routes requests matching its definition here."),
    ).not.toBeInTheDocument();
  });
});
