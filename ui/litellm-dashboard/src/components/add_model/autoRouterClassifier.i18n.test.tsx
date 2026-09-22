import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => ({ accessToken: "sk-test" }) }));

import ClassificationMethodConfig from "./ClassificationMethodConfig";
import OpeningPromptEditor from "./OpeningPromptEditor";
import ClassifierReasoningEffortSelect from "./ClassifierReasoningEffortSelect";
import ClassifierCircuitBreakerConfig from "./ClassifierCircuitBreakerConfig";
import ClassifierVisionConfig from "./ClassifierVisionConfig";
import ModelChoiceCombobox from "./ModelChoiceCombobox";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const value: ComplexityRouterConfigValue = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: ["o3"], REASONING: ["o3"] },
  classifier_type: "llm",
  classifier_llm_config: { model: "gpt-4o-mini", timeout_ms: 3000 },
};

const expectChinese = (zh: string, en: string) => {
  expect(screen.getAllByText(zh, { exact: false }).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en, { exact: false })).toHaveLength(0);
};

const expectChinesePlaceholder = (zh: string, en: string) => {
  expect(screen.getAllByPlaceholderText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByPlaceholderText(en)).toHaveLength(0);
};

describe("auto-router classifier Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the classifier method section in Chinese", () => {
    renderWithProviders(
      <ClassificationMethodConfig
        value={value}
        onChange={vi.fn()}
        modelOptions={[{ value: "gpt-4o-mini", label: "gpt-4o-mini" }]}
        effortOptionsByModel={{}}
        customTechnicalKeywords={[]}
        onCustomTechnicalKeywordsChange={vi.fn()}
      />,
    );

    expectChinese("启发式", "Heuristic");
    expectChinese("启发式 v2", "Heuristic v2");
    expectChinese("LLM 分类器", "LLM Classifier");
    expectChinese("启发式优先", "Heuristic first");
    expectChinese("混合", "Hybrid");
    expectChinese("分类频率", "How often to classify");
    expectChinese("每个请求", "Every request");
    expectChinese("每条新的用户消息", "Every new user message");
    expectChinese("每个会话一次", "Once per session");
    expectChinese("分类器模型", "Classifier Model");
    expectChinese("超时（毫秒）", "Timeout (ms)");
    expectChinese("分类器提示词", "Classifier Prompt");
    expectChinese("分类器失败时", "If the classifier fails");
    expectChinese("使用启发式评分", "Score with the heuristic");
    expectChinese("上下文窗口大小", "Context Window Size");
    expectChinese("上下文字符预算", "Context Character Budget");
    expectChinese("包含助手轮次", "Include Assistant Turns");
    expectChinese("自定义技术关键词", "Custom Technical Keywords");
    expectChinese("分类如何工作", "How Classification Works");
    expectChinesePlaceholder("选择用于分类请求复杂度的模型", "Select the model that will classify request complexity");
  });

  it("renders the opening prompt editor in Chinese", () => {
    renderWithProviders(
      <OpeningPromptEditor
        classificationPrompt={undefined}
        classificationExamples={undefined}
        onChange={vi.fn()}
        tierSource={{ kind: "builtIn", classificationRubric: "legacy" }}
        contextWindowSize={3}
      />,
    );

    expectChinese("自定义提示词", "Customize prompt");
    expectChinese(
      "基础评分标准提供开头说明和校准示例。自定义它们即可编写你自己的内容；层级标准和注入防护始终会追加在其下方。",
      "The base rubric supplies the opening instructions and calibration examples. Customize them to write your own; the tier criteria and the injection guard are always appended below them.",
    );
    expectChinese("旧版（未校准）", "Legacy (uncalibrated)");
  });

  it("renders the classifier reasoning effort select in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ClassifierReasoningEffortSelect
        model="gpt-4o-mini"
        value="low"
        explicitlySupported={["low", "high"]}
        onChange={vi.fn()}
      />,
    );

    expectChinese("推理强度", "Reasoning Effort");

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("默认")).toBeInTheDocument();
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });

  it("renders the circuit breaker and vision configs in Chinese", () => {
    renderWithProviders(
      <>
        <ClassifierCircuitBreakerConfig value={{ model: "m", timeout_ms: 3000 }} onChange={vi.fn()} />
        <ClassifierVisionConfig value={{ model: "m", timeout_ms: 3000 }} onChange={vi.fn()} />
      </>,
    );

    expectChinese("分类器熔断器", "Classifier circuit breaker");
    expectChinese("熔断器冷却时间（秒）", "Circuit breaker cooldown (seconds)");
    expectChinese("使用图像进行分类", "Use images for classification");
  });

  it("renders the model choice combobox empty state in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ModelChoiceCombobox
        id="choice"
        value={null}
        onChange={vi.fn()}
        choices={[]}
        placeholder="pick"
        ariaInvalid={undefined}
        ariaDescribedBy={undefined}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the classifier prompt dialog warning in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <OpeningPromptEditor
        classificationPrompt={undefined}
        classificationExamples={undefined}
        onChange={vi.fn()}
        tierSource={{ kind: "builtIn", classificationRubric: "legacy" }}
        contextWindowSize={3}
      />,
    );

    await user.click(screen.getByRole("button", { name: "自定义提示词" }));
    expect(await screen.findByText("分类器提示词")).toBeInTheDocument();
    expectChinese("分类说明", "Classification instructions");
    expectChinese("校准示例", "Calibration examples");
    expectChinese("此路由器发送的内容", "What this router sends");
    expectChinese("保存提示词", "Save prompt");
    expectChinese("取消", "Cancel");
    expectChinese("基础评分标准", "Base rubric");

    fireEvent.change(screen.getByLabelText("分类说明"), { target: { value: "hello" } });
  });
});
