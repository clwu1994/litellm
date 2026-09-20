import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import AdditionalModelSettings from "./AdditionalModelSettings";

describe("AdditionalModelSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese streaming toggle and its tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdditionalModelSettings onStreamingChange={vi.fn()} />);

    expect(screen.getByText("流式响应")).toBeInTheDocument();
    expect(screen.queryByText("Stream responses")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("帮助：流式响应"));
    expect(
      await screen.findByText("逐 Token 流式返回答案。取消勾选则发送非流式请求并一次性渲染完整响应。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Streams the answer token by token. Uncheck to send a non-streaming request and render the full response at once.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese advanced parameters toggle and the temperature chrome", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdditionalModelSettings useAdvancedParams />);

    expect(screen.getByText("使用高级参数")).toBeInTheDocument();
    expect(screen.queryByText("Use Advanced Parameters")).not.toBeInTheDocument();

    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByText("最大 Token 数")).toBeInTheDocument();
    expect(screen.queryByText("Max Tokens")).not.toBeInTheDocument();

    expect(screen.getByLabelText("Temperature 值")).toBeInTheDocument();
    expect(screen.queryByLabelText("Temperature value")).not.toBeInTheDocument();
    expect(screen.getByLabelText("最大 Token 数值")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max tokens value")).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("帮助：Temperature"));
    expect(await screen.findByText("控制随机性。值越低输出越确定，值越高越有创造性。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Controls randomness. Lower values make output more deterministic, higher values more creative.",
      ),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText("帮助：最大 Token 数"));
    expect(await screen.findByText("响应中要生成的最大 Token 数。")).toBeInTheDocument();
    expect(screen.queryByText("Maximum number of tokens to generate in the response.")).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback simulation copy and its popover while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdditionalModelSettings onMockTestFallbacksChange={vi.fn()} />);

    expect(screen.getByText("模拟失败以测试 fallback")).toBeInTheDocument();
    expect(screen.queryByText("Simulate failure to test fallbacks")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("帮助：模拟失败以测试 fallback"));
    expect(
      await screen.findByText("让第一个请求失败，以便路由器尝试 fallback（如果已配置）。用此验证你的 fallback 设置。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Causes the first request to fail so the router tries fallbacks (if configured). Use this to verify your fallback setup.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByText("当配置了密钥、团队或路由器设置时，行为可能不同。", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("了解更多")).toBeInTheDocument();
    expect(screen.queryByText("Learn more")).not.toBeInTheDocument();
  });
});
