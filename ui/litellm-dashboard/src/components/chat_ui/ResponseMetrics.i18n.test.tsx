import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ResponseMetrics from "./ResponseMetrics";

const usage = {
  promptTokens: 12,
  completionTokens: 8,
  totalTokens: 20,
  reasoningTokens: 5,
  cacheReadTokens: 4695,
  cacheCreationTokens: 1234,
  cost: 0.000063,
};

const renderMetrics = (props: Partial<React.ComponentProps<typeof ResponseMetrics>> = {}) =>
  render(<ResponseMetrics timeToFirstToken={250} totalLatency={1200} usage={usage} toolName="list_repos" {...props} />);

const tooltipSelector = '[data-slot="tooltip-content"]';

const expectTooltipPair = async (
  user: ReturnType<typeof userEvent.setup>,
  triggerLabel: string,
  zh: string,
  en: string,
) => {
  await user.hover(screen.getByLabelText(triggerLabel));
  expect(await screen.findByText(zh, { selector: tooltipSelector })).toBeInTheDocument();
  expect(screen.queryByText(en, { selector: tooltipSelector })).not.toBeInTheDocument();
};

describe("ResponseMetrics Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese metric chip while hiding the English originals", () => {
    renderMetrics();

    expect(screen.getByLabelText("TTFT：0.25s")).toBeInTheDocument();
    expect(screen.queryByLabelText("TTFT: 0.25s")).not.toBeInTheDocument();
    expect(screen.getByLabelText("总延迟：1.20s")).toBeInTheDocument();
    expect(screen.queryByLabelText("Total Latency: 1.20s")).not.toBeInTheDocument();
    expect(screen.getByLabelText("输入：12")).toBeInTheDocument();
    expect(screen.queryByLabelText("In: 12")).not.toBeInTheDocument();
    expect(screen.getByLabelText("缓存读取：4695")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cache Read: 4695")).not.toBeInTheDocument();
    expect(screen.getByLabelText("缓存写入：1234")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cache Write: 1234")).not.toBeInTheDocument();
    expect(screen.getByLabelText("输出：8")).toBeInTheDocument();
    expect(screen.queryByLabelText("Out: 8")).not.toBeInTheDocument();
    expect(screen.getByLabelText("推理：5")).toBeInTheDocument();
    expect(screen.queryByLabelText("Reasoning: 5")).not.toBeInTheDocument();
    expect(screen.getByLabelText("总计：20")).toBeInTheDocument();
    expect(screen.queryByLabelText("Total: 20")).not.toBeInTheDocument();
    expect(screen.getByLabelText("消费：$0.000063")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cost: $0.000063")).not.toBeInTheDocument();
    expect(screen.getByLabelText("工具：list_repos")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tool: list_repos")).not.toBeInTheDocument();
  });

  it("renders the Chinese response-cache chip while hiding the English original", () => {
    renderMetrics({ usage: { ...usage, servedFromResponseCache: true } });

    expect(screen.getByLabelText("响应缓存：命中")).toBeInTheDocument();
    expect(screen.queryByLabelText("Response Cache: Hit")).not.toBeInTheDocument();
  });

  it("renders each Chinese tooltip in the same open state while hiding the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    renderMetrics();

    await expectTooltipPair(user, "TTFT：0.25s", "首 Token 时间", "Time to first token");
    await expectTooltipPair(user, "总延迟：1.20s", "总延迟", "Total latency");
    await expectTooltipPair(user, "输入：12", "输入 Token", "Prompt tokens");
    await expectTooltipPair(
      user,
      "缓存读取：4695",
      "从 LLM 提供商（例如 Anthropic / OpenAI）的提示缓存中读取的输入 Token，按折扣价计费。由提供商上报。",
      "Input tokens read from the LLM provider's prompt cache (e.g. Anthropic / OpenAI), billed at a discounted rate. Reported by the provider.",
    );
    await expectTooltipPair(
      user,
      "缓存写入：1234",
      "写入 LLM 提供商提示缓存以供后续请求复用的输入 Token。",
      "Input tokens written to the LLM provider's prompt cache for reuse by later requests.",
    );
    await expectTooltipPair(user, "输出：8", "输出 Token", "Completion tokens");
    await expectTooltipPair(user, "推理：5", "推理 Token", "Reasoning tokens");
    await expectTooltipPair(user, "总计：20", "总 Token", "Total tokens");
    await expectTooltipPair(user, "消费：$0.000063", "消费", "Cost");
    await expectTooltipPair(user, "工具：list_repos", "使用的工具", "Tool used");
  });

  it("renders the Chinese response-cache tooltip while hiding the English original", async () => {
    const user = userEvent.setup({ delay: null });
    renderMetrics({ usage: { ...usage, servedFromResponseCache: true } });

    await expectTooltipPair(
      user,
      "响应缓存：命中",
      "此响应来自 LiteLLM 的响应缓存。该请求从未到达提供商，因此没有读取或写入提供商自身的提示缓存。",
      "This response was replayed from LiteLLM's response cache. The request never reached the provider, so it did not read from or write to the provider's own prompt cache.",
    );
  });
});
