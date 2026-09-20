import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, renderWithProviders, screen, waitFor } from "../../../../tests/test-utils";
import {
  makeBedrockResponse,
  makeEntity,
  makeGuardrailInformation,
} from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";
import GuardrailViewer, { OUTCOME_LABEL_KEYS } from "@/components/view_logs/GuardrailViewer/GuardrailViewer";
import i18n from "@/i18n/bootstrapI18n";
import enLogs from "@/i18n/locales/en/logs.json";

// We will mock child components selectively for some tests to assert prop passthrough,
// but also run an integration-style render without mocks.
const PresidioPath = "@/components/view_logs/GuardrailViewer/PresidioDetectedEntities";
const BedrockPath = "@/components/view_logs/GuardrailViewer/BedrockGuardrailDetails";

describe("GuardrailViewer", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("shows header, status pill, and duration", () => {
    const data = makeGuardrailInformation({ duration: 1.23456, guardrail_status: "success" });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Guardrails & Policy Compliance")).toBeInTheDocument();
    // header shows passed count
    expect(screen.getByText(/1 Passed/)).toBeInTheDocument();
    // The PASSED badge in the evaluation card
    expect(screen.getByText("PASSED")).toBeInTheDocument();

    // duration displays in ms format: Math.round(1.23456 * 1000) = 1235
    expect(screen.getByText("1235ms")).toBeInTheDocument();
  });

  it("renders guardrail_flagged as FLAGGED (warning), not FAILED", () => {
    const data = makeGuardrailInformation({
      guardrail_name: "cc-flag",
      guardrail_status: "guardrail_flagged",
      guardrail_provider: "custom_code",
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText(/0 Passed/)).toBeInTheDocument();
    expect(screen.getByText(/1 Flagged/)).toBeInTheDocument();
    const badges = screen.getAllByText("FLAGGED");
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0]).toHaveClass("text-warning");
    expect(screen.queryByText("FAILED")).not.toBeInTheDocument();
  });

  it("calculates and displays masked entity totals", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailInformation({
      masked_entity_count: { EMAIL_ADDRESS: 2, PHONE_NUMBER: 1 },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // In collapsed state, the match count badge is visible
    expect(screen.getByText("3 matched")).toBeInTheDocument();

    // Expand the evaluation card to see entity details
    await user.click(screen.getByText("pii-rail"));
    // summary chips for each entry inside expanded card
    expect(screen.getByText("EMAIL_ADDRESS: 2")).toBeInTheDocument();
    expect(screen.getByText("PHONE_NUMBER: 1")).toBeInTheDocument();
  });

  it("hides matched badge when count is zero/empty", () => {
    const data = makeGuardrailInformation({ masked_entity_count: {} });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.queryByText(/matched/)).not.toBeInTheDocument();
  });

  it("toggles evaluation card open/closed on click", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailInformation({
      masked_entity_count: { EMAIL_ADDRESS: 2 },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // Initially collapsed — masked entity details not visible
    expect(screen.queryByText("EMAIL_ADDRESS: 2")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByText("EMAIL_ADDRESS: 2")).toBeInTheDocument();

    // Click again to collapse
    await user.click(screen.getByText("pii-rail"));
    await waitFor(() => {
      expect(screen.queryByText("EMAIL_ADDRESS: 2")).not.toBeInTheDocument();
    });
  });

  it("defaults to presidio provider when guardrail_provider is undefined", async () => {
    vi.doMock(PresidioPath, () => ({
      __esModule: true,
      default: ({ entities }: any) => <div data-testid="presidio-mock">presidio {entities?.length}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailInformation({
      guardrail_provider: undefined,
      guardrail_response: [makeEntity(), makeEntity()],
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("presidio-mock")).toHaveTextContent("presidio 2");
  });

  it('renders PresidioDetectedEntities when provider="presidio" and response has entities', async () => {
    vi.doMock(PresidioPath, () => ({
      __esModule: true,
      default: ({ entities }: any) => <div data-testid="presidio-mock">count:{entities?.length}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailInformation({
      guardrail_provider: "presidio",
      guardrail_response: [makeEntity()],
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("presidio-mock")).toHaveTextContent("count:1");
  });

  it('renders BedrockGuardrailDetails when provider="bedrock"', async () => {
    vi.doMock(BedrockPath, () => ({
      __esModule: true,
      default: ({ response }: any) => <div data-testid="bedrock-mock">{response?.action ?? "no-action"}</div>,
    }));
    const { default: Component } = await import("@/components/view_logs/GuardrailViewer/GuardrailViewer");

    const data = makeGuardrailInformation({
      guardrail_provider: "bedrock",
      guardrail_response: makeBedrockResponse({ action: "GUARDRAIL_INTERVENED" }),
    });
    renderWithProviders(<Component data={data} />);

    // Expand the card to see provider-specific content
    const user = userEvent.setup();
    await user.click(screen.getByText("pii-rail"));
    expect(screen.getByTestId("bedrock-mock")).toHaveTextContent("GUARDRAIL_INTERVENED");
  });

  it("unknown provider renders neither Presidio nor Bedrock details", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailInformation({
      guardrail_provider: "unknown",
    });
    renderWithProviders(<GuardrailViewer data={data} />);
    // Header still present
    expect(screen.getByText("Guardrails & Policy Compliance")).toBeInTheDocument();

    // Expand the card
    await user.click(screen.getByText("pii-rail"));
    // No Presidio or Bedrock sections
    expect(screen.queryByText(/Detected Entities/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Raw Bedrock Guardrail Response/)).not.toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is null", () => {
    const data = makeGuardrailInformation({ guardrail_mode: null });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Guardrails & Policy Compliance")).toBeInTheDocument();
    // Null mode should display as dash
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is an object", () => {
    const data = makeGuardrailInformation({
      guardrail_mode: { default: "pre_call", tags: {} },
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Guardrails & Policy Compliance")).toBeInTheDocument();
    expect(screen.getByText("PRE-CALL")).toBeInTheDocument();
  });

  it("renders without crashing when guardrail_mode is an array and shows in both timeline buckets", () => {
    const data = makeGuardrailInformation({
      guardrail_mode: ["pre_call", "post_call"],
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    expect(screen.getByText("Guardrails & Policy Compliance")).toBeInTheDocument();
    // Mode badge shows first element formatted
    expect(screen.getByText("PRE-CALL")).toBeInTheDocument();
    // Entry should appear in both pre-call and post-call timeline sections
    expect(screen.getByText(/Pre-call guardrail:/)).toBeInTheDocument();
    expect(screen.getByText(/Post-call guardrail:/)).toBeInTheDocument();
  });

  it("integration: renders with real Bedrock details without mocks", async () => {
    const user = userEvent.setup();
    const data = makeGuardrailInformation({
      guardrail_provider: "bedrock",
      guardrail_response: makeBedrockResponse({
        action: "NONE",
        outputs: [{ text: "ok" }],
      }),
    });
    renderWithProviders(<GuardrailViewer data={data} />);

    // Expand the card to reveal Bedrock details
    await user.click(screen.getByText("pii-rail"));

    // Bedrock summary bits
    expect(screen.getByText("Outputs")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});

const richEntryOverrides = {
  guardrail_name: "pii-rail",
  guardrail_status: "success",
  guardrail_mode: ["pre_call", "during_call", "post_call"],
  duration: 1.5,
  masked_entity_count: { EMAIL_ADDRESS: 2 },
  guardrail_usage: { text_records: 3 },
  guardrail_cost: 0.0001,
  guardrail_cost_in_spend: false,
  guardrail_provider: "unknown",
};

const richEntry = {
  ...makeGuardrailInformation(richEntryOverrides),
  patterns_checked: 5,
  confidence_score: 0.9,
  risk_score: 4,
  classification: { category: "cat", article_reference: "art-1", confidence: 0.5, reason: "why" },
  match_details: [{ type: "EMAIL", detection_method: "regex", action_taken: "BLOCK", category: "PII", snippet: "x" }],
};

describe("GuardrailViewer Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, lifecycle and outcome chrome and hides the English one", () => {
    const flagged = makeGuardrailInformation({ guardrail_name: "cc-flag", guardrail_status: "guardrail_flagged" });
    const failed = makeGuardrailInformation({ guardrail_name: "cc-fail", guardrail_status: "guardrail_intervened" });
    renderWithProviders(<GuardrailViewer data={[richEntry, flagged, failed]} />);

    expect(screen.getByText("护栏与策略合规")).toBeInTheDocument();
    expect(screen.getByText("已评估 3 个护栏")).toBeInTheDocument();
    expect(screen.getByText("1 个通过")).toBeInTheDocument();
    expect(screen.getByText("1 个已标记")).toBeInTheDocument();
    expect(screen.getByText(/总计：\d+ms 开销/)).toBeInTheDocument();
    expect(screen.getByText("导出合规日志")).toBeInTheDocument();
    expect(screen.getByText("请求生命周期")).toBeInTheDocument();
    expect(screen.getByText("已收到请求")).toBeInTheDocument();
    expect(screen.getByText("调用前护栏：pii-rail")).toBeInTheDocument();
    expect(screen.getByText("调用中护栏：pii-rail")).toBeInTheDocument();
    expect(screen.getByText("调用后护栏：pii-rail")).toBeInTheDocument();
    expect(screen.getByText("LLM 调用")).toBeInTheDocument();
    expect(screen.getByText("已返回响应")).toBeInTheDocument();
    expect(screen.getByText("评估详情")).toBeInTheDocument();
    expect(screen.getAllByText("通过").length).toBeGreaterThan(0);
    expect(screen.getByText("已标记")).toBeInTheDocument();
    expect(screen.getByText("失败")).toBeInTheDocument();

    expect(screen.queryByText("Guardrails & Policy Compliance")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluation Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Export Compliance Log")).not.toBeInTheDocument();
    expect(screen.queryByText("Request Lifecycle")).not.toBeInTheDocument();
    expect(screen.queryByText("Request received")).not.toBeInTheDocument();
    expect(screen.queryByText("LLM call")).not.toBeInTheDocument();
    expect(screen.queryByText(/guardrails evaluated/)).not.toBeInTheDocument();
    expect(screen.queryByText("PASSED")).not.toBeInTheDocument();
    expect(screen.queryByText("FLAGGED")).not.toBeInTheDocument();
    expect(screen.queryByText("FAILED")).not.toBeInTheDocument();
  });

  it("renders the singular guardrail count and hides the English one", () => {
    renderWithProviders(<GuardrailViewer data={richEntry} />);

    expect(screen.getByText("已评估 1 个护栏")).toBeInTheDocument();
    expect(screen.queryByText("1 guardrail evaluated")).not.toBeInTheDocument();
  });

  it("renders the Chinese match, risk, confidence and classification chrome and hides the English one", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailViewer data={richEntry} />);
    await user.click(screen.getByText("pii-rail"));

    expect(screen.getByText("匹配详情（1）")).toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.getByText("方式")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByText("详情")).toBeInTheDocument();
    expect(screen.getByText("匹配 2/5")).toBeInTheDocument();
    expect(screen.getByText("置信度 90%")).toBeInTheDocument();
    expect(screen.getByText("风险 4/10")).toBeInTheDocument();
    expect(screen.getByText("3 条文本记录")).toBeInTheDocument();
    expect(screen.getByText("分类")).toBeInTheDocument();
    expect(screen.getByText("类别：")).toBeInTheDocument();
    expect(screen.getByText("依据：")).toBeInTheDocument();
    expect(screen.getByText("置信度：")).toBeInTheDocument();
    expect(screen.getByText("原因：")).toBeInTheDocument();
    expect(screen.getByText("已屏蔽实体")).toBeInTheDocument();
    expect(screen.getByText("原始护栏响应")).toBeInTheDocument();

    expect(screen.queryByText(/Match Details/)).not.toBeInTheDocument();
    expect(screen.queryByText("Method")).not.toBeInTheDocument();
    expect(screen.queryByText("Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("2/5 matched")).not.toBeInTheDocument();
    expect(screen.queryByText("90% conf")).not.toBeInTheDocument();
    expect(screen.queryByText("Risk 4/10")).not.toBeInTheDocument();
    expect(screen.queryByText("3 text records")).not.toBeInTheDocument();
    expect(screen.queryByText("Classification")).not.toBeInTheDocument();
    expect(screen.queryByText("Masked Entities")).not.toBeInTheDocument();
    expect(screen.queryByText("Raw Guardrail Response")).not.toBeInTheDocument();
  });

  it("renders the Chinese matched-only badge and singular text-record label and hides the English ones", () => {
    const entry = makeGuardrailInformation({
      masked_entity_count: { EMAIL_ADDRESS: 2 },
      guardrail_usage: { text_records: 1 },
    });
    renderWithProviders(<GuardrailViewer data={entry} />);

    expect(screen.getByText("匹配 2 项")).toBeInTheDocument();
    expect(screen.getByText("1 条文本记录")).toBeInTheDocument();
    expect(screen.queryByText("2 matched")).not.toBeInTheDocument();
    expect(screen.queryByText("1 text record")).not.toBeInTheDocument();
  });

  it("renders the Chinese risk and estimated-cost tooltips and hides the English ones", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailViewer data={richEntry} />);

    await user.hover(screen.getByText("风险 4/10"));
    expect(await screen.findByText("风险评分：4/10")).toBeInTheDocument();
    expect(screen.queryByText("Risk score: 4/10")).not.toBeInTheDocument();

    await user.unhover(screen.getByText("风险 4/10"));
    await user.hover(screen.getByText(/^\$/));
    expect(await screen.findByText("预估护栏成本（仅作报告，不计入支出或预算）")).toBeInTheDocument();
    expect(
      screen.queryByText("Estimated guardrail cost (reported only; not counted against spend or budgets)"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese guardrail-cost tooltip and hides the English one", async () => {
    const user = userEvent.setup();
    const entry = { ...richEntry, guardrail_cost_in_spend: true };
    renderWithProviders(<GuardrailViewer data={entry} />);

    await user.hover(screen.getByText(/^\$/));
    expect(await screen.findByText("护栏成本")).toBeInTheDocument();
    expect(screen.queryByText("Guardrail cost")).not.toBeInTheDocument();
  });

  it("covers every outcome label the locale defines", () => {
    const cases = [
      ["success", "通过"],
      ["guardrail_flagged", "已标记"],
      ["guardrail_intervened", "失败"],
    ] as const;

    expect(cases).toHaveLength(Object.keys(OUTCOME_LABEL_KEYS).length);
    expect(Object.keys(OUTCOME_LABEL_KEYS)).toHaveLength(Object.keys(enLogs.guardrail.outcome).length);
  });
});
