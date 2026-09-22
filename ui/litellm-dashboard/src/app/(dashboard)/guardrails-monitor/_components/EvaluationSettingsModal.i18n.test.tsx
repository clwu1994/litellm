import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";

import { EvaluationSettingsModal } from "./EvaluationSettingsModal";

const mockFetchAvailableModels = vi.fn();
vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: (...args: unknown[]) => mockFetchAvailableModels(...args),
}));

const modelGroups = [{ model_group: "gpt-5.2" }, { model_group: "claude-sonnet-5" }];

const ZH_DEFAULT_PROMPT = `评估此 Guardrail 的判定是否正确。
分析用户输入和 Guardrail 采取的操作，判断该操作是否恰当。

请考虑：
- 用户意图是否确实有害或违反策略？
- Guardrail 的操作（block / flag / pass）是否恰当？
- 这可能是误报还是漏报？

返回包含置信度和理由的结构化结论。`;

const EN_DEFAULT_PROMPT = `Evaluate whether this guardrail's decision was correct.
Analyze the user input, the guardrail action taken, and determine if it was appropriate.

Consider:
— Was the user's intent genuinely harmful or policy-violating?
— Was the guardrail's action (block / flag / pass) appropriate?
— Could this be a false positive or false negative?

Return a structured verdict with confidence and justification.`;

const EN_DEFAULT_SCHEMA = `{
  "verdict": "correct" | "false_positive" | "false_negative",
  "confidence": 0.0,
  "justification": "string",
  "risk_category": "string",
  "suggested_action": "keep" | "adjust threshold" | "add allowlist"
}
`;

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  guardrailName: "pii-detector",
  accessToken: "test-token",
  onRunEvaluation: vi.fn(),
};

const renderModal = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProviders(<EvaluationSettingsModal {...defaultProps} {...props} />);

describe("EvaluationSettingsModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchAvailableModels.mockResolvedValue(modelGroups);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, description and prompt section", async () => {
    renderModal();
    await screen.findByPlaceholderText("选择模型");

    expect(screen.getByText("评估设置")).toBeInTheDocument();
    expect(screen.queryByText("Evaluation Settings")).not.toBeInTheDocument();
    expect(screen.getByText("为 pii-detector 配置 AI 评估")).toBeInTheDocument();
    expect(screen.queryByText("Configure AI evaluation for pii-detector")).not.toBeInTheDocument();
    expect(screen.getByText("评估提示词")).toBeInTheDocument();
    expect(screen.queryByText("Evaluation Prompt")).not.toBeInTheDocument();
    expect(screen.getByText("重置为默认")).toBeInTheDocument();
    expect(screen.queryByText("Reset to default")).not.toBeInTheDocument();
    expect(screen.getByText("发送给评估模型的系统提示词。输出通过 response_format 结构化。")).toBeInTheDocument();
    expect(
      screen.queryByText("System prompt sent to the evaluation model. Output is structured via response_format."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese generic description when no guardrail name is given", async () => {
    renderModal({ guardrailName: undefined });
    await screen.findByPlaceholderText("选择模型");

    expect(screen.getByText("配置 AI 评估以在日志上重新运行")).toBeInTheDocument();
    expect(screen.queryByText("Configure AI evaluation for re-running on logs")).not.toBeInTheDocument();
  });

  it("prefills the Chinese default prompt and keeps the schema sample in English", async () => {
    renderModal();
    await screen.findByPlaceholderText("选择模型");

    const promptBox = screen.getByLabelText("评估提示词");
    expect(promptBox).toHaveValue(ZH_DEFAULT_PROMPT);
    expect(promptBox).not.toHaveValue(EN_DEFAULT_PROMPT);
    expect(screen.getByLabelText("响应 schema")).toHaveValue(EN_DEFAULT_SCHEMA);
  });

  it("renders the Chinese schema labels", async () => {
    renderModal();
    await screen.findByPlaceholderText("选择模型");

    expect(screen.getByText("响应 schema")).toBeInTheDocument();
    expect(screen.queryByText("Response Schema")).not.toBeInTheDocument();
    expect(screen.getByText("response_format: json_schema")).toBeInTheDocument();
  });

  it("renders the Chinese model label and select placeholder", async () => {
    renderModal();

    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Model")).not.toBeInTheDocument();
    expect(await screen.findByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholder while the models are in flight", () => {
    mockFetchAvailableModels.mockReturnValue(new Promise(() => {}));
    renderModal();

    expect(screen.getByPlaceholderText("正在加载模型…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models…")).not.toBeInTheDocument();
  });

  it("renders the Chinese sign-in empty state when there is no access token", async () => {
    const user = userEvent.setup();
    renderModal({ accessToken: null });

    await user.click(screen.getByPlaceholderText("选择模型"));

    expect(await screen.findByText("登录后查看模型")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to see models")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-models empty state when the account has no models", async () => {
    const user = userEvent.setup();
    mockFetchAvailableModels.mockResolvedValue([]);
    renderModal();

    await user.click(await screen.findByPlaceholderText("选择模型"));

    expect(await screen.findByText("没有可用模型")).toBeInTheDocument();
    expect(screen.queryByText("No models available")).not.toBeInTheDocument();
  });

  it("renders the Chinese footer buttons", async () => {
    renderModal();
    await screen.findByPlaceholderText("选择模型");

    expect(screen.getByRole("button", { name: /取消/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /运行评估/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Run Evaluation/ })).not.toBeInTheDocument();
  });

  it("restores the Chinese default prompt when reset is clicked", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByPlaceholderText("选择模型");

    const promptBox = screen.getByLabelText("评估提示词");
    await user.clear(promptBox);
    fireEvent.change(promptBox, { target: { value: "custom prompt" } });
    expect(promptBox).toHaveValue("custom prompt");

    await user.click(screen.getByText("重置为默认"));

    await waitFor(() => expect(promptBox).toHaveValue(ZH_DEFAULT_PROMPT));
  });
});
