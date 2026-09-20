import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import enGuardrails from "@/i18n/locales/en/guardrails.json";
import GuardrailGarden from "./guardrail_garden";
import GuardrailDetailView from "./guardrail_garden_detail";
import { ALL_CARDS, type GuardrailCardInfo } from "./guardrail_garden_data";

vi.mock("./add_guardrail_form", () => {
  const MockAddGuardrailForm = ({
    visible,
    preset,
  }: {
    visible: boolean;
    preset?: { nameSuggestionKey?: ParseKeys<"guardrails"> };
  }) => {
    const { t } = useTranslation("guardrails");
    return <span>{visible && preset?.nameSuggestionKey ? t(preset.nameSuggestionKey) : ""}</span>;
  };
  return { default: MockAddGuardrailForm };
});

const ZH_CARDS: Record<string, { name: string; description: string; preset: string }> = {
  cf_denied_financial: {
    name: "拒绝财务建议",
    description: "检测针对个性化财务建议、投资推荐或理财规划的请求。",
    preset: "拒绝财务建议",
  },
  cf_denied_insults: {
    name: "侮辱与人身攻击",
    description: "检测针对聊天机器人、员工或其他人的侮辱、辱骂和人身攻击。",
    preset: "侮辱与人身攻击",
  },
  cf_denied_legal: {
    name: "拒绝法律建议",
    description: "检测未经授权的法律建议、案件分析或法律推荐请求。",
    preset: "拒绝法律建议",
  },
  cf_denied_medical: {
    name: "拒绝医疗建议",
    description: "检测医疗诊断、治疗建议或健康建议请求。",
    preset: "拒绝医疗建议",
  },
  cf_harmful_violence: {
    name: "有害暴力内容",
    description: "检测与暴力、犯罪策划、攻击和暴力威胁相关的内容。",
    preset: "有害暴力内容",
  },
  cf_harmful_self_harm: {
    name: "有害自残内容",
    description: "检测与自残、自杀和危险的自毁行为相关的内容。",
    preset: "有害自残内容",
  },
  cf_harmful_child_safety: {
    name: "危害儿童安全内容",
    description: "检测可能危及儿童安全或剥削未成年人的内容。",
    preset: "危害儿童安全内容",
  },
  cf_harmful_illegal_weapons: {
    name: "有害非法武器内容",
    description: "检测与非法武器制造、分销或获取相关的内容。",
    preset: "有害非法武器内容",
  },
  cf_bias_gender: {
    name: "偏见：性别",
    description: "检测基于性别的歧视、刻板印象和偏见性语言。",
    preset: "偏见：性别",
  },
  cf_bias_racial: { name: "偏见：种族", description: "检测种族歧视、刻板印象和种族偏见内容。", preset: "偏见：种族" },
  cf_bias_religious: {
    name: "偏见：宗教",
    description: "检测宗教歧视、不宽容和宗教偏见内容。",
    preset: "偏见：宗教",
  },
  cf_bias_sexual_orientation: {
    name: "偏见：性取向",
    description: "检测基于性取向的歧视及相关偏见内容。",
    preset: "偏见：性取向",
  },
  cf_prompt_injection_jailbreak: {
    name: "提示注入：越狱",
    description: "检测旨在绕过 AI 安全准则和限制的越狱尝试。",
    preset: "提示注入：越狱",
  },
  cf_prompt_injection_data_exfil: {
    name: "提示注入：数据外泄",
    description: "检测通过提示词操纵提取敏感数据的尝试。",
    preset: "提示注入：数据外泄",
  },
  cf_prompt_injection_sql: {
    name: "提示注入：SQL",
    description: "检测嵌入提示词中的 SQL 注入尝试。",
    preset: "提示注入：SQL",
  },
  cf_prompt_injection_malicious_code: {
    name: "提示注入：恶意代码",
    description: "检测通过提示词注入恶意代码的尝试。",
    preset: "提示注入：恶意代码",
  },
  cf_prompt_injection_system_prompt: {
    name: "提示注入：系统提示词",
    description: "检测提取或覆盖系统提示词的尝试。",
    preset: "提示注入：系统提示词",
  },
  cf_toxic_abuse: {
    name: "有毒与辱骂性语言",
    description: "检测多种语言（EN、AU、DE、ES、FR）中的有毒、辱骂和仇恨性语言。",
    preset: "有毒与辱骂性语言",
  },
  cf_patterns: {
    name: "匹配模式",
    description: "检测并阻止 SSN、信用卡号、API Key 和自定义正则表达式等敏感数据模式。",
    preset: "匹配模式",
  },
  cf_keywords: {
    name: "关键词拦截",
    description: "阻止或屏蔽包含特定关键词或短语的内容。可上传自定义词表或逐个添加词语。",
    preset: "关键词拦截",
  },
  block_code_execution: {
    name: "阻止代码执行",
    description:
      "检测请求和响应中的 Markdown 围栏代码块。可按语言阻止或屏蔽可执行代码（例如 Python、JavaScript、Bash），并支持配置置信度。",
    preset: "阻止代码执行",
  },
  cf_competitor_intent: {
    name: "竞品名称拦截",
    description: "阻止或改写竞品对比和排名意图。检测用户要求对比或推荐竞品（航空公司或通用竞品列表）的情况。",
    preset: "竞品名称拦截",
  },
  presidio: {
    name: "Presidio PII",
    description: "Microsoft Presidio 用于 PII 检测和匿名化。支持 30 多种实体类型，可配置操作。",
    preset: "Presidio PII",
  },
  bedrock: {
    name: "Bedrock Guardrail",
    description: "AWS Bedrock Guardrails 用于内容过滤、主题规避和敏感信息检测。",
    preset: "Bedrock Guardrail",
  },
  lakera: {
    name: "Lakera",
    description: "AI 安全平台，防御提示注入、数据泄露和有害内容。",
    preset: "Lakera",
  },
  openai_moderation: {
    name: "OpenAI Moderation",
    description: "OpenAI 的内容审核 API，可跨多个类别检测有害内容。",
    preset: "OpenAI Moderation",
  },
  google_model_armor: {
    name: "Google Cloud Model Armor",
    description: "Google Cloud 的模型保护服务，助力安全、负责任的 AI 部署。",
    preset: "Google Cloud Model Armor",
  },
  guardrails_ai: {
    name: "Guardrails AI",
    description: "开源框架，为 LLM 输出增加结构、类型和质量保证。",
    preset: "Guardrails AI",
  },
  zscaler: {
    name: "Zscaler AI Guard",
    description: "Zscaler 提供的企业级 AI 安全，用于监控和保护 AI/ML 工作负载。",
    preset: "Zscaler AI Guard",
  },
  panw: {
    name: "PANW Prisma AIRS",
    description: "Palo Alto Networks Prisma AI Runtime Security，保障生产环境中的 AI 应用安全。",
    preset: "PANW Prisma AIRS",
  },
  cisco_ai_defense: {
    name: "Cisco AI Defense",
    description:
      "Cisco AI Defense Inspection API 提供运行时保护：提示注入、PII/PCI/PHI、骚扰、仇恨言论、亵渎、暴力和代码检测。",
    preset: "Cisco AI Defense",
  },
  noma: {
    name: "Noma Security",
    description: "AI 安全平台，用于检测和防范 AI 特有的威胁和漏洞。",
    preset: "Noma Security",
  },
  aporia: {
    name: "Aporia AI",
    description: "实时 AI Guardrail，用于幻觉检测、主题控制和策略执行。",
    preset: "Aporia AI",
  },
  aim: {
    name: "AIM Guardrail",
    description: "AIM Security Guardrail，提供全面的 AI 威胁检测和缓解。",
    preset: "AIM Guardrail",
  },
  cato_networks: {
    name: "Cato Networks Guardrail",
    description: "Cato Networks Guardrail，提供全面的 AI 威胁检测和缓解。",
    preset: "Cato Networks Guardrail",
  },
  prompt_security: {
    name: "Prompt Security",
    description: "防御提示注入攻击、数据泄露和其他 LLM 安全威胁。",
    preset: "Prompt Security",
  },
  lasso: {
    name: "Lasso Guardrail",
    description: "内容审核和安全 Guardrail，助力负责任的 AI 部署。",
    preset: "Lasso Guardrail",
  },
  pangea: {
    name: "Pangea Guardrail",
    description: "Pangea 的 AI Guardrail，打造安全、合规、可信的 AI 应用。",
    preset: "Pangea Guardrail",
  },
  enkryptai: {
    name: "EnkryptAI",
    description: "AI 安全与治理平台，助力企业 AI 安全与合规。",
    preset: "EnkryptAI",
  },
  javelin: {
    name: "Javelin Guardrails",
    description: "内置 Guardrail 的 AI 网关，保障安全合规的 AI 运营。",
    preset: "Javelin Guardrails",
  },
  pillar: {
    name: "Pillar Guardrail",
    description: "AI 安全平台，用于监控、测试和保护 AI 系统。",
    preset: "Pillar Guardrail",
  },
  akto: {
    name: "Akto Guardrail",
    description: "Akto.io 的 AI 安全平台，为 AI/ML 应用提供自动监控和 Guardrail。",
    preset: "Akto Guardrail",
  },
  promptguard: {
    name: "PromptGuard",
    description:
      "AI 安全网关，具备提示注入检测、PII 脱敏、主题过滤、实体黑名单和幻觉检测能力。可自托管，并支持即插即用的代理集成。",
    preset: "PromptGuard",
  },
  xecguard: {
    name: "XecGuard",
    description:
      "CyCraft XecGuard AI 安全网关。支持多策略扫描（提示注入、有害内容、PII、系统提示词强制）以及 RAG 上下文锚定。",
    preset: "XecGuard",
  },
  deepkeep: {
    name: "DeepKeep AI Firewall",
    description:
      "DeepKeep AI Firewall 提供全面的 LLM 安全防护：提示注入检测、PII 保护、内容审核和策略执行，并支持可配置的 Guardrail 流水线。",
    preset: "DeepKeep AI Firewall",
  },
  repelloai: {
    name: "RepelloAI Argus",
    description: "RepelloAI Argus 会根据 Repello 仪表盘中按资产配置的策略扫描提示词和响应。",
    preset: "RepelloAI Argus",
  },
  straiker: {
    name: "Straiker",
    description: "Defend AI 智能体 Guardrail：间接/直接提示注入、工具滥用、恶意 MCP 和技能",
    preset: "Straiker Guardrail",
  },
  alice: {
    name: "Alice",
    description:
      "基于策略的 Guardrail，针对提示词和模型响应按应用进行评估，因此同一个代理可为不同团队或产品执行不同的策略集。",
    preset: "Alice",
  },
  conduct: {
    name: "Conduct Guard",
    description:
      "Conduct Guard 在模型调用前根据工作区规则评估提示词：提示注入、PII 和自定义策略，并给出阻止、警告或批准结论。",
    preset: "Conduct Guard",
  },
};

const ZH_TAGS: Record<string, string> = {
  contentCategory: "内容类别",
  topicBlocker: "主题拦截",
  safety: "安全",
  bias: "偏见",
  promptInjection: "提示注入",
  toxicity: "毒性内容",
  pii: "PII",
  regex: "正则",
  dataProtection: "数据保护",
  keywords: "关键词",
  blocklist: "黑名单",
  code: "代码",
  competitor: "竞品",
  microsoft: "Microsoft",
  aws: "AWS",
  contentSafety: "内容安全",
  security: "安全",
  contentModeration: "内容审核",
  openai: "OpenAI",
  googleCloud: "Google Cloud",
  openSource: "开源",
  validation: "校验",
  enterprise: "企业级",
  threatDetection: "威胁检测",
  hallucination: "幻觉检测",
  policy: "策略",
  compliance: "合规",
  governance: "治理",
  gateway: "网关",
  monitoring: "监控",
  agentic: "智能体",
  toolMisuse: "工具滥用",
  mcp: "MCP",
  skills: "技能",
  grounding: "事实锚定",
  rag: "RAG",
  firewall: "防火墙",
};

const ZH_SUBCATEGORIES: Record<string, string> = {
  contentCategory: "内容类别",
  patterns: "匹配模式",
  keywords: "关键词",
  codeSafety: "代码安全",
};

const tagName = (key: string) => key.slice("garden.tags.".length);
const subcategoryName = (key: string) => key.slice("garden.subcategories.".length);
const enCard = (id: string) => enGuardrails.garden.cards[id as keyof typeof enGuardrails.garden.cards];

const renderGarden = () =>
  renderWithProviders(<GuardrailGarden accessToken="test-token" onGuardrailCreated={vi.fn()} />);

const renderDetail = (card: GuardrailCardInfo) =>
  renderWithProviders(
    <GuardrailDetailView card={card} onBack={vi.fn()} accessToken={null} onGuardrailCreated={vi.fn()} />,
  );

describe("guardrail garden Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese card name and description and hides the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    renderGarden();

    expect(screen.getByPlaceholderText("搜索 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 内容过滤")).toBeInTheDocument();
    expect(screen.getByText("由 LiteLLM 提供的内置 Guardrail。零延迟、无外部依赖、无额外费用。")).toBeInTheDocument();
    expect(screen.getByText("合作伙伴 Guardrails")).toBeInTheDocument();
    expect(screen.getByText("来自领先 AI 安全提供商的第三方 Guardrail 集成。")).toBeInTheDocument();
    expect(screen.getByText("显示全部（22）")).toBeInTheDocument();
    expect(screen.getAllByText(/个测试用例/).length).toBeGreaterThan(0);

    expect(screen.queryByPlaceholderText("Search guardrails")).not.toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Content Filter")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Built-in guardrails powered by LiteLLM. Zero latency, no external dependencies, no additional cost.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Partner Guardrails")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Third-party guardrail integrations from leading AI security providers."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/test cases/)).not.toBeInTheDocument();

    await user.click(screen.getByText("显示全部（22）"));
    expect(screen.getByText("收起")).toBeInTheDocument();
    expect(screen.queryByText("Show less")).not.toBeInTheDocument();

    for (const card of ALL_CARDS) {
      const expected = ZH_CARDS[card.id];
      expect(expected, `expected copy for ${card.id}`).toBeDefined();
      expect(screen.getByText(expected.name), `name ${card.id}`).toBeInTheDocument();
      expect(screen.getByText(expected.description), `description ${card.id}`).toBeInTheDocument();
      const en = enCard(card.id);
      if (en.name !== expected.name) {
        expect(screen.queryByText(en.name), `en name ${card.id}`).not.toBeInTheDocument();
      }
      if (en.description !== expected.description) {
        expect(screen.queryByText(en.description), `en description ${card.id}`).not.toBeInTheDocument();
      }
    }
  });

  it("renders every Chinese subcategory, tag and preset name and hides the English originals", async () => {
    const user = userEvent.setup({ delay: null });

    for (const card of ALL_CARDS) {
      const expected = ZH_CARDS[card.id];
      const { unmount } = renderDetail(card);

      const counts = new Map<string, number>();
      const add = (value: string, n: number) => counts.set(value, (counts.get(value) ?? 0) + n);
      add(expected.name, 3);
      add(expected.description, 2);
      if (card.subcategoryKey) add(ZH_SUBCATEGORIES[subcategoryName(card.subcategoryKey)], 1);
      for (const tagKey of card.tagKeys) add(ZH_TAGS[tagName(tagKey)], 1);

      for (const [value, count] of counts) {
        expect(screen.getAllByText(value), `${card.id} renders ${value} ${count} times`).toHaveLength(count);
      }

      if (card.subcategoryKey) {
        const subName = subcategoryName(card.subcategoryKey) as keyof typeof enGuardrails.garden.subcategories;
        expect(
          screen.queryByText(enGuardrails.garden.subcategories[subName]),
          `en subcategory ${card.id}`,
        ).not.toBeInTheDocument();
      }
      for (const tagKey of card.tagKeys) {
        const name = tagName(tagKey);
        const enTag = enGuardrails.garden.tags[name as keyof typeof enGuardrails.garden.tags];
        if (enTag !== ZH_TAGS[name]) {
          expect(screen.queryByText(enTag), `en tag ${card.id} ${name}`).not.toBeInTheDocument();
        }
      }

      await user.click(screen.getByRole("button", { name: "创建 Guardrail" }));
      const presetCount = counts.get(expected.preset) ?? 0;
      expect(screen.getAllByText(expected.preset), `preset ${card.id}`).toHaveLength(presetCount + 1);
      const presetKey = card.id as keyof typeof enGuardrails.garden.presetNames;
      if (enGuardrails.garden.presetNames[presetKey] !== expected.preset) {
        expect(
          screen.queryByText(enGuardrails.garden.presetNames[presetKey]),
          `en preset ${card.id}`,
        ).not.toBeInTheDocument();
      }

      unmount();
    }
  });

  it("renders the Chinese litellm detail chrome and hides the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    const card = ALL_CARDS.find((c) => c.id === "cf_denied_financial") as GuardrailCardInfo;
    renderDetail(card);

    expect(screen.getByRole("button", { name: "创建 Guardrail" })).toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 内容过滤")).toBeInTheDocument();
    expect(screen.getByText("子类别")).toBeInTheDocument();
    expect(screen.getByText("费用")).toBeInTheDocument();
    expect(screen.getByText("$0 / 次请求")).toBeInTheDocument();
    expect(screen.getByText("外部依赖")).toBeInTheDocument();
    expect(screen.getByText("无")).toBeInTheDocument();
    expect(screen.getByText("延迟")).toBeInTheDocument();
    expect(screen.getByText("Guardrail 详情")).toBeInTheDocument();
    expect(screen.getByText("详情如下")).toBeInTheDocument();
    expect(screen.getByText("属性")).toBeInTheDocument();
    expect(screen.getByText("Guardrail ID")).toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.getByText("内容过滤")).toBeInTheDocument();
    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.getAllByText("概览")).toHaveLength(2);
    expect(screen.getByText("评估结果")).toBeInTheDocument();

    expect(screen.queryByText("Create Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Subcategory")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("$0 / request")).not.toBeInTheDocument();
    expect(screen.queryByText("External Dependencies")).not.toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
    expect(screen.queryByText("Latency")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Details are as follows")).not.toBeInTheDocument();
    expect(screen.queryByText("Property")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Content Filter")).not.toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Eval Results")).not.toBeInTheDocument();

    await user.click(screen.getByText("评估结果"));

    expect(screen.getByText("指标")).toBeInTheDocument();
    expect(screen.getByText("数值")).toBeInTheDocument();
    expect(screen.getByText("精确率")).toBeInTheDocument();
    expect(screen.getByText("召回率")).toBeInTheDocument();
    expect(screen.getByText("F1 分数")).toBeInTheDocument();
    expect(screen.getByText("测试用例数")).toBeInTheDocument();
    expect(screen.getByText("误报")).toBeInTheDocument();
    expect(screen.getByText("漏报")).toBeInTheDocument();
    expect(screen.getByText("延迟（p50）")).toBeInTheDocument();

    expect(screen.queryByText("Metric")).not.toBeInTheDocument();
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    expect(screen.queryByText("Precision")).not.toBeInTheDocument();
    expect(screen.queryByText("Recall")).not.toBeInTheDocument();
    expect(screen.queryByText("F1 Score")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Cases")).not.toBeInTheDocument();
    expect(screen.queryByText("False Positives")).not.toBeInTheDocument();
    expect(screen.queryByText("False Negatives")).not.toBeInTheDocument();
    expect(screen.queryByText("Latency (p50)")).not.toBeInTheDocument();
  });

  it("renders the Chinese partner provider and type and the latency fallback", () => {
    const card = ALL_CARDS.find((c) => c.id === "bedrock") as GuardrailCardInfo;
    const { unmount } = renderDetail(card);

    expect(screen.getByText("合作伙伴 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("合作伙伴")).toBeInTheDocument();
    expect(screen.queryByText("Partner Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("Partner")).not.toBeInTheDocument();

    unmount();
    const litellmCard = ALL_CARDS.find((c) => c.id === "cf_denied_legal") as GuardrailCardInfo;
    renderDetail(litellmCard);

    expect(screen.getByText("延迟")).toBeInTheDocument();
    expect(screen.getByText("<1ms")).toBeInTheDocument();
  });
});
