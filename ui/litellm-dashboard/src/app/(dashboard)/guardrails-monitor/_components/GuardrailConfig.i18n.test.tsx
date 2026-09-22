import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { act, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { GuardrailConfig } from "./GuardrailConfig";

const defaultProps = {
  guardrailName: "Content Safety",
  guardrailType: "Content Safety",
  provider: "bedrock",
};

const renderConfig = () => renderWithProviders(<GuardrailConfig {...defaultProps} />);

const combobox = (index: number) => screen.getAllByRole("combobox")[index];

describe("GuardrailConfig Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese version bar", () => {
    renderConfig();

    expect(screen.getByText("版本：")).toBeInTheDocument();
    expect(screen.queryByText("Version:")).not.toBeInTheDocument();
    expect(screen.getByText("v3（当前）")).toBeInTheDocument();
    expect(screen.queryByText("v3 (current)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看历史" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View history" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "还原" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revert" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "另存为 v4" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save as v4" })).not.toBeInTheDocument();
  });

  it("renders the Chinese version history entries behind the history toggle", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.queryByText("初始配置")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "查看历史" }));

    expect(screen.getByRole("button", { name: "隐藏历史" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide history" })).not.toBeInTheDocument();
    expect(screen.getByText("调整了医疗术语的敏感度")).toBeInTheDocument();
    expect(screen.queryByText("Adjusted sensitivity for medical terms")).not.toBeInTheDocument();
    expect(screen.getByText("添加了自定义类别列表")).toBeInTheDocument();
    expect(screen.queryByText("Added custom categories list")).not.toBeInTheDocument();
    expect(screen.getByText("初始配置")).toBeInTheDocument();
    expect(screen.queryByText("Initial configuration")).not.toBeInTheDocument();
  });

  it("renders the Chinese parameters section labels", () => {
    renderConfig();

    expect(screen.getByText("参数")).toBeInTheDocument();
    expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
    expect(screen.getByText("配置 Content Safety 的行为")).toBeInTheDocument();
    expect(screen.queryByText("Configure Content Safety behavior")).not.toBeInTheDocument();
    expect(screen.getByText("失败时的操作")).toBeInTheDocument();
    expect(screen.queryByText("Action on Failure")).not.toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrail 类型")).toBeInTheDocument();
    expect(screen.queryByText("Guardrail Type")).not.toBeInTheDocument();
    expect(screen.getByText("类别（逗号分隔）")).toBeInTheDocument();
    expect(screen.queryByText("Categories (comma-separated)")).not.toBeInTheDocument();
    expect(screen.getByText("在生产环境启用 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("Guardrail enabled in production")).not.toBeInTheDocument();
  });

  it("keeps the category field values in English", () => {
    renderConfig();

    expect(
      screen.getByDisplayValue("violence, hate_speech, sexual_content, self_harm, illegal_activity"),
    ).toBeInTheDocument();
  });

  it("renders the Chinese action options", async () => {
    const user = userEvent.setup();
    renderConfig();

    await user.click(combobox(1));

    expect(await screen.findByRole("option", { name: "拦截请求" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "标记待审核" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "仅记录日志" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "使用回退响应" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Block Request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Flag for Review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Log Only" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Use Fallback Response" })).not.toBeInTheDocument();
  });

  it("renders the Chinese guardrail type options", async () => {
    const user = userEvent.setup();
    renderConfig();

    await user.click(combobox(3));

    expect(await screen.findByRole("option", { name: "内容安全" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PII 检测" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "主题限制" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "提示注入" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "自定义" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Content Safety" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "PII Detection" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Topic Restriction" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Prompt Injection" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Custom" })).not.toBeInTheDocument();
  });

  it("keeps vendor provider names in English and translates the generic ones", async () => {
    const user = userEvent.setup();
    renderConfig();

    await user.click(combobox(2));

    expect(await screen.findByRole("option", { name: "AWS Bedrock Guardrails" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Google Cloud AI Safety" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "LiteLLM 内置" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "LiteLLM Built-in" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "自定义代码" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Custom Code" })).not.toBeInTheDocument();
  });

  it("renders the Chinese custom code override section and keeps the code sample in English", async () => {
    const user = userEvent.setup();
    renderConfig();

    expect(screen.getByText("自定义代码覆盖")).toBeInTheDocument();
    expect(screen.queryByText("Custom Code Override")).not.toBeInTheDocument();
    expect(screen.getByText("用自定义评估代码替换内置 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("Replace the built-in guardrail with custom evaluation code")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "自定义代码覆盖" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Custom Code Override" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "自定义代码覆盖" }));

    expect(screen.getByPlaceholderText(/async def evaluate/)).toBeInTheDocument();
  });

  it("renders the Chinese test configuration section and its re-run states", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderConfig();

    expect(screen.getByText("测试配置")).toBeInTheDocument();
    expect(screen.queryByText("Test Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("在最近的失败日志上重新运行此 Guardrail，以验证你的更改")).toBeInTheDocument();
    expect(
      screen.queryByText("Re-run this guardrail on recent failing logs to validate your changes"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "在失败日志上重新运行" }));
    expect(screen.getByText("正在 10 个样本上运行...")).toBeInTheDocument();
    expect(screen.queryByText("Running on 10 samples...")).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText("使用新配置后 7/10 将通过")).toBeInTheDocument();
    expect(screen.queryByText("7/10 would now pass with new config")).not.toBeInTheDocument();
  });
});
