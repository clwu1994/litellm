import React from "react";
import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import * as networking from "@/components/networking";
import { getFrameworks } from "@/data/compliancePrompts";
import type { Guardrail } from "@/components/guardrails/types";
import type { GuardrailPipeline, PipelineStep, PipelineTestResult, Policy } from "@/components/policies/types";

import PipelineFlowBuilder, { FlowBuilderPage, PipelineInfoDisplay } from "./pipeline_flow_builder";

vi.mock("@/components/networking");

const step = (overrides: Partial<PipelineStep> = {}): PipelineStep => ({
  guardrail: "pii-masker",
  on_pass: "next",
  on_fail: "block",
  on_error: null,
  modify_response_message: null,
  ...overrides,
});

const pipeline = (steps: PipelineStep[]): GuardrailPipeline => ({ mode: "pre_call", steps });

const guardrails = [
  { guardrail_id: "g1", guardrail_name: "pii-masker" },
  { guardrail_id: "g2", guardrail_name: "prompt-injection" },
] as Guardrail[];

const makePolicy = (overrides: Partial<Policy> = {}): Policy => ({
  policy_id: "policy-1",
  policy_name: "my-policy",
  inherit: null,
  description: null,
  guardrails_add: [],
  guardrails_remove: [],
  condition: null,
  ...overrides,
});

const pipelinePolicy = makePolicy({ policy_id: "", policy_name: "", guardrails_add: ["pii-masker"] });

const pageProps = {
  onBack: vi.fn(),
  onSuccess: vi.fn(),
  accessToken: "sk-test" as string | null,
  availableGuardrails: guardrails,
  createPolicy: vi.fn(),
  updatePolicy: vi.fn(),
};

const renderPage = (overrides: Partial<typeof pageProps> & { editingPolicy?: Policy } = {}) =>
  renderWithProviders(<FlowBuilderPage {...pageProps} {...overrides} />);

const euPrompts = getFrameworks()
  .find((framework) => framework.name === "EU AI Act")!
  .categories.flatMap((category) => category.prompts);

const findLine = (text: string) => screen.getAllByText((_, element) => element?.textContent === text).at(0) ?? null;

const quickChatResult: PipelineTestResult = {
  terminal_action: "modify_response",
  step_results: [
    {
      guardrail_name: "pii-masker",
      outcome: "pass",
      action_taken: "next",
      modified_data: null,
      error_detail: null,
      duration_seconds: 0.25,
    },
    {
      guardrail_name: "prompt-injection",
      outcome: "fail",
      action_taken: "block",
      modified_data: null,
      error_detail: "blocked by policy",
      duration_seconds: null,
    },
    {
      guardrail_name: "other-guardrail",
      outcome: "error",
      action_taken: "allow",
      modified_data: null,
      error_detail: "provider down",
      duration_seconds: null,
    },
  ],
  modified_data: null,
  error_message: null,
  modify_response_message: "blocked for safety",
};

const datasetResult: PipelineTestResult = {
  terminal_action: "block",
  step_results: [],
  modified_data: null,
  error_message: null,
  modify_response_message: null,
};

describe("PipelineInfoDisplay Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese trigger and action lines", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step()])} />);

    expect(screen.getByText("触发器")).toBeInTheDocument();
    expect(screen.queryByText("TRIGGER")).not.toBeInTheDocument();
    expect(screen.getByText("传入的 LLM 请求")).toBeInTheDocument();
    expect(screen.queryByText("Incoming LLM Request")).not.toBeInTheDocument();
    expect(screen.getByText("GUARDRAIL")).toBeInTheDocument();
    expect(screen.getByText("步骤 1")).toBeInTheDocument();
    expect(screen.queryByText("Step 1")).not.toBeInTheDocument();
    expect(screen.getByText("通过 → 下一步")).toBeInTheDocument();
    expect(screen.queryByText(/Pass .* Next Step/)).not.toBeInTheDocument();
    expect(screen.getByText("失败时 → 拦截")).toBeInTheDocument();
    expect(screen.getByText("API 失败时 → 拦截（与失败时相同）")).toBeInTheDocument();
    expect(screen.queryByText(/same as on fail/)).not.toBeInTheDocument();
  });

  it("renders the Chinese explicit API failure action", () => {
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step({ on_error: "allow" })])} />);

    expect(screen.getByText("API 失败时 → 允许")).toBeInTheDocument();
    expect(screen.queryByText("API 失败时 → 拦截（与失败时相同）")).not.toBeInTheDocument();
  });
});

describe("PipelineFlowBuilder Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese step-card chrome", () => {
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableGuardrails={guardrails} />,
    );

    expect(screen.getAllByRole("button", { name: "插入步骤" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Insert step" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除步骤" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete step" })).not.toBeInTheDocument();
    expect(screen.getByText("GUARDRAIL")).toBeInTheDocument();
    expect(screen.getByText("步骤 1")).toBeInTheDocument();
    expect(screen.getByText("Guardrail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 Guardrail")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a guardrail")).not.toBeInTheDocument();
    expect(screen.getByText("通过时")).toBeInTheDocument();
    expect(screen.queryByText("ON PASS")).not.toBeInTheDocument();
    expect(screen.getByText("失败时")).toBeInTheDocument();
    expect(screen.queryByText("ON FAIL")).not.toBeInTheDocument();
    expect(screen.getByText("API 失败时")).toBeInTheDocument();
    expect(screen.queryByText("ON API FAILURE")).not.toBeInTheDocument();
    expect(screen.getAllByText("操作")).toHaveLength(3);
    expect(screen.getByText("与失败时相同")).toBeInTheDocument();
    expect(screen.queryByText("Same as ON FAIL")).not.toBeInTheDocument();

    expect(screen.getByText("触发器")).toBeInTheDocument();
    expect(screen.getByText("传入的 LLM 请求")).toBeInTheDocument();
    expect(screen.getByText("当请求匹配此策略时运行此流程")).toBeInTheDocument();
    expect(screen.getByText("结束")).toBeInTheDocument();
    expect(screen.queryByText("END")).not.toBeInTheDocument();
    expect(screen.getByText("继续发送至 LLM")).toBeInTheDocument();
    expect(screen.getByText("请求将继续发送到模型")).toBeInTheDocument();
  });

  it("renders the Chinese empty guardrail dropdown text", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableGuardrails={[]} />,
    );

    await user.type(screen.getByPlaceholderText("选择 Guardrail"), "zz");

    expect(await screen.findByText("未找到 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails found")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom response field", () => {
    renderWithProviders(
      <PipelineFlowBuilder
        pipeline={pipeline([step({ on_fail: "modify_response" })])}
        onChange={vi.fn()}
        availableGuardrails={guardrails}
      />,
    );

    expect(screen.getByText("自定义响应消息")).toBeInTheDocument();
    expect(screen.queryByText("Custom Response Message")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入自定义响应...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter custom response...")).not.toBeInTheDocument();
  });
});

describe("FlowBuilderPage Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.listPolicyVersions).mockResolvedValue({ versions: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header and description chrome", () => {
    renderPage();

    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.queryByText("Policies")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("策略名称...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Policy name...")).not.toBeInTheDocument();
    expect(screen.getByText("流程")).toBeInTheDocument();
    expect(screen.queryByText("Flow")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试流水线" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Pipeline" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Policy" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加描述（可选）...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add a description (optional)...")).not.toBeInTheDocument();
  });

  it("toasts the Chinese missing-guardrail validation", async () => {
    const user = userEvent.setup();
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("策略名称..."), { target: { value: "my-policy" } });
    await user.click(screen.getByRole("button", { name: "保存策略" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("请为所有步骤选择 Guardrail"));
    expect(toast.error).not.toHaveBeenCalledWith("Please select a guardrail for all steps");
  });

  it("renders the Chinese empty-step test error", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect(await screen.findByText("所有步骤都必须选择 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("All steps must have a guardrail selected")).not.toBeInTheDocument();
  });

  it("renders the Chinese test-panel chrome and dataset info", async () => {
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));

    expect(screen.getAllByText("测试流水线").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Test Pipeline" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "隐藏测试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide Test" })).not.toBeInTheDocument();
    expect(screen.getByText("测试方式")).toBeInTheDocument();
    expect(screen.queryByText("Test with")).not.toBeInTheDocument();
    expect(screen.getByText("快速对话（自定义消息）")).toBeInTheDocument();
    expect(screen.queryByText("Quick chat (custom message)")).not.toBeInTheDocument();
    expect(screen.getByText("消息")).toBeInTheDocument();
    expect(screen.queryByText("Message")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入测试消息...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter a test message...")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入测试消息...")).toHaveValue("你好，能帮帮我吗？");
    expect(screen.queryByDisplayValue("Hello, can you help me?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "运行测试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run Test" })).not.toBeInTheDocument();
    expect(screen.getByText("在上方选择测试来源（快速对话或合规数据集），然后点击「运行测试」")).toBeInTheDocument();
    expect(
      screen.queryByText('Choose a test source above (quick chat or a compliance dataset) and click "Run Test"'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("快速对话（自定义消息）"));
    await user.click(await screen.findByRole("option", { name: "所有合规数据集" }));

    expect(
      screen.getByText("针对所有合规提示词（EU AI Act、GDPR、Topic Blocking、Airline 等）运行流水线。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Run pipeline against all compliance prompts (EU AI Act, GDPR, Topic Blocking, Airline, etc.).",
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getAllByText("所有合规数据集")[0]);
    await user.click(await screen.findByRole("option", { name: "EU AI Act" }));

    expect(screen.getByText(`针对「EU AI Act」的 ${euPrompts.length} 条提示词运行流水线。`)).toBeInTheDocument();
    expect(
      screen.queryByText(`Run pipeline against ${euPrompts.length} prompts from "EU AI Act".`),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese quick-chat results", async () => {
    vi.mocked(networking.testPipelineCall).mockResolvedValue(quickChatResult);
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect(await screen.findByText("步骤 1：pii-masker")).toBeInTheDocument();
    expect(screen.queryByText("Step 1: pii-masker")).not.toBeInTheDocument();
    expect(screen.getByText("步骤 2：prompt-injection")).toBeInTheDocument();
    expect(screen.getByText("操作：下一步")).toBeInTheDocument();
    expect(screen.queryByText("Action: Next Step")).not.toBeInTheDocument();
    expect(screen.getByText("操作：拦截")).toBeInTheDocument();
    expect(screen.getByText("通过")).toBeInTheDocument();
    expect(screen.queryByText("PASS")).not.toBeInTheDocument();
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.queryByText("FAIL")).not.toBeInTheDocument();
    expect(screen.getByText("错误")).toBeInTheDocument();
    expect(screen.queryByText("ERROR")).not.toBeInTheDocument();
    expect(screen.getByText("结果")).toBeInTheDocument();
    expect(screen.queryByText("Result")).not.toBeInTheDocument();
    expect(screen.getByText("自定义响应")).toBeInTheDocument();
    expect(screen.getByText("响应：blocked for safety")).toBeInTheDocument();
    expect(screen.queryByText("Response: blocked for safety")).not.toBeInTheDocument();
  });

  it("renders the Chinese compliance dataset results", async () => {
    vi.mocked(networking.testPipelineCall).mockResolvedValue(datasetResult);
    const matchedCount = euPrompts.filter((prompt) => prompt.expectedResult === "fail").length;
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByText("快速对话（自定义消息）"));
    await user.click(await screen.findByRole("option", { name: "EU AI Act" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect(await screen.findByText("合规数据集")).toBeInTheDocument();
    expect(screen.queryByText("Compliance dataset")).not.toBeInTheDocument();
    expect(screen.getByText(`${matchedCount} / ${euPrompts.length} 符合预期`)).toBeInTheDocument();
    expect(screen.queryByText(`${matchedCount} / ${euPrompts.length} matched expected`)).not.toBeInTheDocument();
    expect(screen.getAllByText("预期：通过").length).toBeGreaterThan(0);
    expect(screen.getAllByText("预期：失败").length).toBeGreaterThan(0);
    expect(screen.queryByText("预期：pass")).not.toBeInTheDocument();
    expect(screen.queryByText("预期：fail")).not.toBeInTheDocument();
    expect(screen.queryByText("expected: pass")).not.toBeInTheDocument();
    expect(screen.getAllByText("实际：拦截").length).toBeGreaterThan(0);
    expect(screen.queryByText("actual: block")).not.toBeInTheDocument();
  });

  it("renders the Chinese raw allow terminal action", async () => {
    vi.mocked(networking.testPipelineCall).mockResolvedValue({ ...quickChatResult, terminal_action: "allow" });
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect(await screen.findByText("结果")).toBeInTheDocument();
    expect(screen.getByText("允许")).toBeInTheDocument();
    expect(screen.queryByText("allow")).not.toBeInTheDocument();
  });

  it("renders the Chinese raw modify_response actual result", async () => {
    vi.mocked(networking.testPipelineCall).mockResolvedValue({ ...datasetResult, terminal_action: "modify_response" });
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByText("快速对话（自定义消息）"));
    await user.click(await screen.findByRole("option", { name: "EU AI Act" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect((await screen.findAllByText("实际：自定义响应")).length).toBeGreaterThan(0);
    expect(screen.queryByText("实际：modify_response")).not.toBeInTheDocument();
    expect(screen.queryByText("actual: modify_response")).not.toBeInTheDocument();
  });

  it("renders the Chinese raw error actual result", async () => {
    vi.mocked(networking.testPipelineCall).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderPage({ editingPolicy: pipelinePolicy });

    await user.click(screen.getByRole("button", { name: "测试流水线" }));
    await user.click(screen.getByText("快速对话（自定义消息）"));
    await user.click(await screen.findByRole("option", { name: "EU AI Act" }));
    await user.click(screen.getByRole("button", { name: "运行测试" }));

    expect((await screen.findAllByText("实际：错误")).length).toBeGreaterThan(0);
    expect(screen.queryByText("实际：error")).not.toBeInTheDocument();
    expect(screen.queryByText("actual: error")).not.toBeInTheDocument();
  });

  it("renders the Chinese versions sidebar for a draft", async () => {
    vi.mocked(networking.listPolicyVersions).mockResolvedValue({
      versions: [
        makePolicy({ policy_id: "v1", version_number: 1, version_status: "draft" }),
        makePolicy({ policy_id: "v2", version_number: 2, version_status: "published" }),
        makePolicy({ policy_id: "v3", version_number: 3, version_status: "production" }),
      ],
    });
    renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "draft", guardrails_add: ["pii-masker"] }),
    });

    expect(await screen.findByText("版本")).toBeInTheDocument();
    expect(screen.queryByText("Versions")).not.toBeInTheDocument();
    expect(screen.getByText("生产版本 = 任何人按名称调用此策略时使用的版本。")).toBeInTheDocument();
    expect(
      screen.queryByText("Production = the version used when anyone calls this policy by name."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 新建版本" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ New Version" })).not.toBeInTheDocument();
    expect(await screen.findByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("已发布")).toBeInTheDocument();
    expect(screen.getByText("生产")).toBeInTheDocument();
    expect(screen.queryByText("draft")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.getByText("已发布的版本可以在 Playground 中测试，然后再提升为生产版本。")).toBeInTheDocument();
    expect(
      screen.queryByText("Published versions can be tested in the Playground before promoting to production."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("静默镜像")).toBeInTheDocument();
    expect(screen.queryByText("Silent Mirroring")).not.toBeInTheDocument();
    expect(screen.getByText("即将推出")).toBeInTheDocument();
    expect(screen.queryByText("COMING SOON")).not.toBeInTheDocument();
    expect(
      screen.getByText("在不拦截请求的情况下，用生产流量测试策略版本。影子测试有助于在全面上线前验证变更。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Shadow testing helps validate changes/)).not.toBeInTheDocument();
  });

  it("renders the Chinese versions sidebar for a published version", async () => {
    renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "published", guardrails_add: ["pii-masker"] }),
    });

    expect(await screen.findByRole("button", { name: "提升为生产版本" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Promote to production" })).not.toBeInTheDocument();
    expect(screen.getByText("此版本将在任何人按名称调用此策略时使用。")).toBeInTheDocument();
    expect(
      screen.queryByText("This version will be used when anyone calls this policy by name."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("未找到版本")).toBeInTheDocument();
    expect(screen.queryByText("No versions found")).not.toBeInTheDocument();
  });

  it("toasts the Chinese version lifecycle messages", async () => {
    vi.mocked(networking.createPolicyVersion).mockResolvedValue(makePolicy({ policy_id: "v-new" }));
    vi.mocked(networking.updatePolicyVersionStatus).mockResolvedValue(makePolicy({ policy_id: "p1" }));
    const user = userEvent.setup();
    const first = renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "draft", guardrails_add: ["pii-masker"] }),
    });

    await user.click(await screen.findByRole("button", { name: "+ 新建版本" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已创建新的草稿版本"));
    expect(toast.success).not.toHaveBeenCalledWith("New draft version created");

    await user.click(screen.getByRole("button", { name: "发布" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "版本已发布。你可以在 Playground 的 Policies 下拉框中选择此版本进行测试。",
      ),
    );
    expect(toast.success).not.toHaveBeenCalledWith(
      "Version published. You can test it in the Playground by selecting this version in the Policies dropdown.",
    );
    first.unmount();

    renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "published", guardrails_add: ["pii-masker"] }),
    });
    await user.click(await screen.findByRole("button", { name: "提升为生产版本" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("版本已提升为生产版本"));
    expect(toast.success).not.toHaveBeenCalledWith("Version promoted to production");
  });

  it("toasts the Chinese version failure messages", async () => {
    vi.mocked(networking.createPolicyVersion).mockRejectedValue(new Error("boom"));
    vi.mocked(networking.updatePolicyVersionStatus).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    const first = renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "draft", guardrails_add: ["pii-masker"] }),
    });

    await user.click(await screen.findByRole("button", { name: "+ 新建版本" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建版本失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create version: boom");

    await user.click(screen.getByRole("button", { name: "发布" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("发布失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to publish: boom");
    first.unmount();

    renderPage({
      editingPolicy: makePolicy({ policy_id: "p1", version_status: "published", guardrails_add: ["pii-masker"] }),
    });
    await user.click(await screen.findByRole("button", { name: "提升为生产版本" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("提升为生产版本失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to promote to production: boom");
  });

  it("keeps the English chrome when the language is English", async () => {
    await i18n.changeLanguage("en");
    renderPage();

    expect(screen.getByPlaceholderText("Policy name...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Policy" })).toBeInTheDocument();
    expect(findLine("TRIGGER")).toBeInTheDocument();
  });
});
