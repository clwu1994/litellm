import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import PassThroughGuardrailsSection from "./PassThroughGuardrailsSection";

vi.mock("../guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const renderSection = () =>
  render(<PassThroughGuardrailsSection accessToken="sk-test" value={{ pii: null }} onChange={vi.fn()} />);

function findHintTrigger(label: string): Element | null {
  const labelElement = screen.getByText(label);
  return labelElement.closest("label")?.querySelector("svg") ?? null;
}

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = findHintTrigger(label);
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("PassThroughGuardrailsSection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese guardrails chrome and field targeting alert", () => {
    renderSection();

    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(
      screen.getByText(
        "配置 Guardrails 以对请求和响应强制执行策略。透传 Endpoint 默认不启用 Guardrails，需要手动开启。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Guardrails are opt-in for passthrough endpoints/)).not.toBeInTheDocument();
    expect(screen.getByText(/字段级定向/)).toBeInTheDocument();
    expect(screen.queryByText(/Field-Level Targeting/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "（了解更多）" })).toBeInTheDocument();
    expect(
      screen.getByText("可以选择性地指定要检查哪些字段。如果留空，整个请求/响应都会发送给 Guardrail。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Optionally specify which fields to check/)).not.toBeInTheDocument();
    expect(screen.getByText("常见示例：")).toBeInTheDocument();
    expect(screen.queryByText("Common Examples:")).not.toBeInTheDocument();
    expect(screen.getByText(/单个字段/)).toBeInTheDocument();
    expect(screen.queryByText(/Single field/)).not.toBeInTheDocument();
    expect(screen.getByText(/documents 数组中的所有文本/)).toBeInTheDocument();
    expect(screen.queryByText(/All text in documents array/)).not.toBeInTheDocument();
    expect(screen.getByText(/所有消息内容/)).toBeInTheDocument();
    expect(screen.queryByText(/All message contents/)).not.toBeInTheDocument();
    expect(screen.getByText("选择 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Select Guardrails")).not.toBeInTheDocument();
    expect(screen.getByText("字段定向（可选）")).toBeInTheDocument();
    expect(screen.queryByText("Field Targeting (Optional)")).not.toBeInTheDocument();
    expect(screen.getByText("💡 提示：留空表示检查整个负载")).toBeInTheDocument();
    expect(screen.queryByText(/Tip: Leave empty to check entire payload/)).not.toBeInTheDocument();
    expect(screen.getByText("请求字段（pre_call）")).toBeInTheDocument();
    expect(screen.queryByText("Request Fields (pre_call)")).not.toBeInTheDocument();
    expect(screen.getByText("响应字段（post_call）")).toBeInTheDocument();
    expect(screen.queryByText("Response Fields (post_call)")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("输入字段名，或使用上方的 + 按钮（例如 query、documents[*].text）"),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type field name or use \+ buttons above/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入字段名，或使用上方的 + 按钮（例如 results[*].text）")).toBeInTheDocument();
  });

  it("renders the Chinese select-guardrails hint while its tooltip is open", async () => {
    const user = userEvent.setup();
    renderSection();

    await hoverHint(user, "选择 Guardrails");

    expect(
      await screen.findByText(
        "选择应在此 Endpoint 上运行的 Guardrails。组织/团队/密钥级别的 Guardrails 也会被包含在内。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Choose which guardrails should run on this endpoint. Org/team/key level guardrails will also be included.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese request field hint while its tooltip is open", async () => {
    const user = userEvent.setup();
    renderSection();

    await hoverHint(user, "请求字段（pre_call）");

    expect(await screen.findByText("指定要检查哪些请求字段")).toBeInTheDocument();
    expect(screen.queryByText("Specify which request fields to check")).not.toBeInTheDocument();
    expect(screen.getByText("示例：")).toBeInTheDocument();
    expect(screen.queryByText("Examples:")).not.toBeInTheDocument();
  });

  it("renders the Chinese response field hint while its tooltip is open", async () => {
    const user = userEvent.setup();
    renderSection();

    await hoverHint(user, "响应字段（post_call）");

    expect(await screen.findByText("指定要检查哪些响应字段")).toBeInTheDocument();
    expect(screen.queryByText("Specify which response fields to check")).not.toBeInTheDocument();
  });
});
