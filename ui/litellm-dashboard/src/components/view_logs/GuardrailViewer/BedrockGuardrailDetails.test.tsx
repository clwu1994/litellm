import React from "react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import BedrockGuardrailDetails, {
  BedrockGuardrailResponse,
} from "@/components/view_logs/GuardrailViewer/BedrockGuardrailDetails";
import { cleanup, renderWithProviders, screen } from "../../../../tests/test-utils";
import {
  makeAssessment,
  makeBedrockCoverage,
  makeBedrockResponse,
  makeBedrockUsage,
} from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";
import i18n from "@/i18n/bootstrapI18n";

describe("BedrockGuardrailDetails", () => {
  it("returns null when response is falsy", () => {
    // @ts-expect-error testing nullish handling
    const { container } = renderWithProviders(<BedrockGuardrailDetails response={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders top summary: action chip, reason, blocked response", () => {
    const resp: BedrockGuardrailResponse = makeBedrockResponse({
      action: "GUARDRAIL_INTERVENED",
      actionReason: "Policy violation",
      blockedResponse: "[blocked]",
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    expect(screen.getByText("Action:")).toBeInTheDocument();
    expect(screen.getByText("Policy violation")).toBeInTheDocument();
    expect(screen.getByText("[blocked]")).toBeInTheDocument();
  });

  it("renders coverage and usage pills", () => {
    const resp = makeBedrockResponse({
      guardrailCoverage: makeBedrockCoverage(),
      usage: makeBedrockUsage({ contentPolicyUnits: 7, wordPolicyUnits: 1 }),
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    expect(screen.getByText(/text guarded 27\/100/)).toBeInTheDocument();
    expect(screen.getByText(/images guarded 1\/3/)).toBeInTheDocument();
    expect(screen.getByText(/contentPolicyUnits: 7/)).toBeInTheDocument();
    expect(screen.getByText(/wordPolicyUnits: 1/)).toBeInTheDocument();
  });

  it("renders outputs when present (prefers `outputs`, falls back to `output`)", () => {
    // Using outputs
    let resp = makeBedrockResponse({ outputs: [{ text: "hello" }] });
    const { rerender } = renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("Outputs")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();

    // Using output
    resp = makeBedrockResponse({ outputs: undefined, output: [{ text: "world" }] });
    rerender(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("renders assessments with all policy sections and metrics", () => {
    const resp = makeBedrockResponse({
      assessments: [makeAssessment()],
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);

    // Assessment section present
    expect(screen.getByText("Assessment #1")).toBeInTheDocument();

    // Word policy sections
    expect(screen.getByText("Word Policy")).toBeInTheDocument();
    expect(screen.getByText("Custom Words")).toBeInTheDocument();
    expect(screen.getByText("Managed Word Lists")).toBeInTheDocument();

    // Contextual grounding table headers
    expect(screen.getByText("Contextual Grounding")).toBeInTheDocument();
    expect(screen.getAllByText("Score").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Threshold").length).toBeGreaterThan(0);

    // Sensitive Info sections
    expect(screen.getByText("Sensitive Information")).toBeInTheDocument();
    expect(screen.getByText("PII Entities")).toBeInTheDocument();
    expect(screen.getByText("Custom Regexes")).toBeInTheDocument();

    // Topic Policy
    expect(screen.getByText("Topic Policy")).toBeInTheDocument();
    expect(screen.getByText("weapons")).toBeInTheDocument();

    // Invocation Metrics
    expect(screen.getByText("Invocation Metrics")).toBeInTheDocument();

    // Raw JSON section exists (closed by default)
    expect(screen.getByText("Raw Bedrock Guardrail Response")).toBeInTheDocument();
  });

  it("handles non-text outputs gracefully", () => {
    const resp = makeBedrockResponse({ outputs: [{}, { text: "texty" }] });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    expect(screen.getByText("(non-text output)")).toBeInTheDocument();
    expect(screen.getByText("texty")).toBeInTheDocument();
  });

  it("gracefully handles missing optional sections", () => {
    const resp = makeBedrockResponse({
      assessments: [
        {
          // only include minimal fields; others omitted
          invocationMetrics: { guardrailProcessingLatency: 5 },
        } as any,
      ],
      usage: undefined,
      guardrailCoverage: undefined,
      outputs: [],
    });
    renderWithProviders(<BedrockGuardrailDetails response={resp} />);
    // No crash, minimal render: Assessment + Invocation Metrics present, but no usage/coverage chips at top
    expect(screen.getByText("Assessment #1")).toBeInTheDocument();
  });
});

describe("BedrockGuardrailDetails Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese summary and assessment chrome and hides the English one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BedrockGuardrailDetails response={makeBedrockResponse()} />);

    expect(screen.getByText("输出")).toBeInTheDocument();
    expect(screen.getByText("评估 #1")).toBeInTheDocument();
    expect(screen.getByText("操作：")).toBeInTheDocument();
    expect(screen.getByText("覆盖范围：")).toBeInTheDocument();
    expect(screen.getByText("用量：")).toBeInTheDocument();
    expect(screen.getByText("文本已防护 27/100")).toBeInTheDocument();
    expect(screen.getByText("图片已防护 1/3")).toBeInTheDocument();
    expect(screen.getByText("词语策略")).toBeInTheDocument();
    expect(screen.getByText("内容策略")).toBeInTheDocument();
    expect(screen.getByText("主题策略")).toBeInTheDocument();
    expect(screen.getAllByText("敏感信息")).toHaveLength(2);
    expect(screen.getAllByText("上下文依据")).toHaveLength(2);
    expect(screen.getByText("自定义词语")).toBeInTheDocument();
    expect(screen.getByText("托管词表")).toBeInTheDocument();
    expect(screen.getByText("PII 实体")).toBeInTheDocument();
    expect(screen.getByText("自定义正则表达式")).toBeInTheDocument();
    expect(screen.getByText("自动推理结果")).toBeInTheDocument();
    expect(screen.getByText("原始 Bedrock 护栏响应")).toBeInTheDocument();
    expect(screen.getAllByText("已检测到").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未检测到").length).toBeGreaterThan(0);

    await user.click(screen.getByText("调用指标"));
    expect(screen.getByText("延迟（ms）")).toBeInTheDocument();
    expect(screen.getByText("文本 27/100")).toBeInTheDocument();
    expect(screen.getByText("图片 1/3")).toBeInTheDocument();

    expect(screen.queryByText("Outputs")).not.toBeInTheDocument();
    expect(screen.queryByText(/Assessment #/)).not.toBeInTheDocument();
    expect(screen.queryByText("Coverage:")).not.toBeInTheDocument();
    expect(screen.queryByText("Usage:")).not.toBeInTheDocument();
    expect(screen.queryByText("Word Policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Content Policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Topic Policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Sensitive Information")).not.toBeInTheDocument();
    expect(screen.queryByText("Contextual Grounding")).not.toBeInTheDocument();
    expect(screen.queryByText("sensitive-info")).not.toBeInTheDocument();
    expect(screen.queryByText("contextual-grounding")).not.toBeInTheDocument();
    expect(screen.queryByText("Custom Words")).not.toBeInTheDocument();
    expect(screen.queryByText("Managed Word Lists")).not.toBeInTheDocument();
    expect(screen.queryByText("PII Entities")).not.toBeInTheDocument();
    expect(screen.queryByText("Custom Regexes")).not.toBeInTheDocument();
    expect(screen.queryByText("Invocation Metrics")).not.toBeInTheDocument();
    expect(screen.queryByText("Automated Reasoning Findings")).not.toBeInTheDocument();
    expect(screen.queryByText("Raw Bedrock Guardrail Response")).not.toBeInTheDocument();
    expect(screen.queryByText("Latency (ms)")).not.toBeInTheDocument();
    expect(screen.queryByText("text guarded 27/100")).not.toBeInTheDocument();
    expect(screen.queryByText("images guarded 1/3")).not.toBeInTheDocument();
    expect(screen.queryByText("detected")).not.toBeInTheDocument();
    expect(screen.queryByText("not detected")).not.toBeInTheDocument();
  });

  it("renders the Chinese policy badges and table headers and hides the English ones", () => {
    renderWithProviders(<BedrockGuardrailDetails response={makeBedrockResponse()} />);

    expect(screen.getByText("词语")).toBeInTheDocument();
    expect(screen.getByText("内容")).toBeInTheDocument();
    expect(screen.getByText("主题")).toBeInTheDocument();
    expect(screen.getByText("自动推理")).toBeInTheDocument();
    expect(screen.getAllByText("类型").length).toBeGreaterThan(0);
    expect(screen.getAllByText("操作").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已检测").length).toBeGreaterThan(0);
    expect(screen.getByText("强度")).toBeInTheDocument();
    expect(screen.getAllByText("置信度").length).toBeGreaterThan(0);
    expect(screen.getByText("得分")).toBeInTheDocument();
    expect(screen.getByText("阈值")).toBeInTheDocument();

    expect(screen.queryByText("Strength")).not.toBeInTheDocument();
    expect(screen.queryByText("Threshold")).not.toBeInTheDocument();
    expect(screen.queryByText("Detected")).not.toBeInTheDocument();
    expect(screen.queryByText("Score")).not.toBeInTheDocument();
  });

  it("renders the Chinese reason, blocked response and N/A fallbacks and hides the English ones", async () => {
    const user = userEvent.setup();
    const responseOverrides = {
      action: undefined,
      actionReason: "Policy violation",
      blockedResponse: "[blocked]",
      assessments: [
        {
          wordPolicy: { customWords: [{ match: "badword", detected: true }] },
          sensitiveInformationPolicy: { regexes: [{ regex: "#[0-9]+", detected: true }] },
          topicPolicy: { topics: [{ detected: true }] },
        },
      ],
    };
    const response = makeBedrockResponse(responseOverrides);
    renderWithProviders(<BedrockGuardrailDetails response={response} />);

    expect(screen.getByText("操作原因：")).toBeInTheDocument();
    expect(screen.getByText("屏蔽的响应：")).toBeInTheDocument();
    expect(screen.getAllByText("无").length).toBeGreaterThan(0);
    expect(screen.getAllByText("主题").length).toBeGreaterThan(1);

    await user.click(screen.getByText("自定义正则表达式"));
    expect(screen.getByText("正则表达式")).toBeInTheDocument();

    expect(screen.queryByText("Action Reason:")).not.toBeInTheDocument();
    expect(screen.queryByText("Blocked Response:")).not.toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    expect(screen.queryByText("regex")).not.toBeInTheDocument();
    expect(screen.queryByText("topic")).not.toBeInTheDocument();
  });

  it("renders the Chinese non-text output placeholder and hides the English one", () => {
    renderWithProviders(<BedrockGuardrailDetails response={makeBedrockResponse({ outputs: [{}] })} />);

    expect(screen.getByText("（非文本输出）")).toBeInTheDocument();
    expect(screen.queryByText("(non-text output)")).not.toBeInTheDocument();
  });
});
