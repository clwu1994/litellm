import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { applyGuardrail } from "@/components/networking";

import GuardrailTestPanel from "./GuardrailTestPanel";
import GuardrailTestPlayground from "./GuardrailTestPlayground";
import GuardrailTestResults from "./GuardrailTestResults";

vi.mock("@/components/networking");

/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });

const writeText = vi.fn();
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

const guardrail = (name: string) => ({
  guardrail_id: name,
  guardrail_name: name,
  litellm_params: { guardrail: "presidio", mode: "pre_call" as const, default_on: false },
  guardrail_info: {},
});

const hasTextContent = (expected: string) => (_content: string, element: Element | null) =>
  element?.tagName === "SPAN" && element.textContent === expected;

const hoverLabelHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

const renderPlayground = (names: string[] = ["guardrail-one", "guardrail-two"]) =>
  renderWithProviders(
    <GuardrailTestPlayground
      guardrailsList={names.map(guardrail)}
      isLoading={false}
      accessToken="test-token"
      onClose={vi.fn()}
    />,
  );

const renderPanel = (names: string[], isLoading = false) =>
  renderWithProviders(
    <GuardrailTestPanel
      guardrailNames={names}
      onSubmit={vi.fn()}
      isLoading={isLoading}
      results={null}
      errors={null}
      onClose={vi.fn()}
    />,
  );

describe("Guardrail test surfaces Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese playground chrome and hides the English", () => {
    renderPlayground();

    expect(screen.getByText("Guardrail 列表")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索 Guardrail...")).toBeInTheDocument();
    expect(screen.getAllByText("类型：")).toHaveLength(2);
    expect(screen.getAllByText("模式：")).toHaveLength(2);
    expect(screen.getByText("已选择 0 / 2")).toBeInTheDocument();
    expect(screen.getByText("Guardrail 测试 Playground")).toBeInTheDocument();
    expect(screen.getByText("选择要测试的 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("从左侧栏选择一个或多个 Guardrail，开始测试并比较结果。")).toBeInTheDocument();

    expect(screen.queryByText("Guardrails")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search guardrails...")).not.toBeInTheDocument();
    expect(screen.queryByText("Type:")).not.toBeInTheDocument();
    expect(screen.queryByText("Mode:")).not.toBeInTheDocument();
    expect(screen.queryByText("0 of 2 selected")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Testing Playground")).not.toBeInTheDocument();
    expect(screen.queryByText("Select Guardrails to Test")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Choose one or more guardrails from the left sidebar to start testing and comparing results."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match and no-available states and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = renderPlayground();

    await user.type(screen.getByPlaceholderText("搜索 Guardrail..."), "zzz");
    expect(screen.getByText("没有符合搜索条件的 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails match your search")).not.toBeInTheDocument();
    unmount();

    renderPlayground([]);
    expect(screen.getByText("暂无可用 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails available")).not.toBeInTheDocument();
  });

  it("emits the Chinese playground result toasts and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(applyGuardrail).mockResolvedValue({ response_text: "ok" } as never);
    const { unmount } = renderPlayground(["guardrail-one"]);

    await user.click(screen.getByText("guardrail-one"));
    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.click(screen.getByRole("button", { name: "测试 1 个 Guardrail" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("1 个 Guardrail 应用成功"));
    expect(toast.success).not.toHaveBeenCalledWith("1 guardrail applied successfully");
    unmount();

    renderPlayground();
    await user.click(screen.getByText("guardrail-one"));
    await user.click(screen.getByText("guardrail-two"));
    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.click(screen.getByRole("button", { name: "测试 2 个 Guardrail" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("2 个 Guardrail 应用成功"));
    expect(toast.success).not.toHaveBeenCalledWith("2 guardrails applied successfully");
  });

  it("emits the Chinese playground failure toasts and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(applyGuardrail).mockRejectedValue(new Error("nope"));
    const { unmount } = renderPlayground(["guardrail-one"]);

    await user.click(screen.getByText("guardrail-one"));
    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.click(screen.getByRole("button", { name: "测试 1 个 Guardrail" }));
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("1 个 Guardrail 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("1 guardrail failed");
    unmount();

    renderPlayground();
    await user.click(screen.getByText("guardrail-one"));
    await user.click(screen.getByText("guardrail-two"));
    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.click(screen.getByRole("button", { name: "测试 2 个 Guardrail" }));
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("2 个 Guardrail 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("2 guardrails failed");
  });

  it("renders the Chinese panel chrome for a single guardrail and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    renderPanel(["guardrail-one"]);

    expect(screen.getByText("测试 Guardrails：")).toBeInTheDocument();
    expect(screen.getByText("测试 1 个 Guardrail 并比较结果")).toBeInTheDocument();
    expect(screen.getByText("输入文本")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本...")).toBeInTheDocument();
    expect(screen.getByText("元数据（可选）")).toBeInTheDocument();
    expect(screen.getByText(hasTextContent("字符数：0"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试 1 个 Guardrail" })).toBeInTheDocument();

    await hoverLabelHint(user, "输入文本");
    expect(await screen.findByText("按 Enter 提交，按 Shift+Enter 换行。")).toBeInTheDocument();
    expect(screen.queryByText("Press Enter to submit. Use Shift+Enter for new line.")).not.toBeInTheDocument();

    await hoverLabelHint(user, "元数据（可选）");
    expect(
      await screen.findByText(
        "作为 request_data['metadata'] 转发给 Guardrail 的 JSON 对象。自定义 Guardrail 可从中读取按请求的配置。",
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "JSON object forwarded to the guardrail as request_data['metadata']. Custom guardrails can read per-request configuration from it.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.queryByText("Test Guardrails:")).not.toBeInTheDocument();
    expect(screen.queryByText("Test 1 guardrail and compare results")).not.toBeInTheDocument();
    expect(screen.queryByText("Input Text")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter text to test with guardrails...")).not.toBeInTheDocument();
    expect(screen.queryByText("Metadata (optional)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 1 guardrail" })).not.toBeInTheDocument();
  });

  it("renders the Chinese panel enter hint with its keycaps", () => {
    renderPanel(["guardrail-one"]);

    expect(screen.getByText(hasTextContent("按 Enter 提交 • 按 Shift+Enter 换行"))).toBeInTheDocument();
    expect(
      screen.queryByText(hasTextContent("Press Enter to submit • Shift+Enter for new line")),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese panel copy button and characters count", async () => {
    const user = userEvent.setup({ delay: null });
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderPanel(["guardrail-one"]);

    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    expect(screen.getByRole("button", { name: "复制输入" })).toBeInTheDocument();
    expect(screen.getByText(hasTextContent("字符数：5"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Input" })).not.toBeInTheDocument();
    expect(screen.queryByText("Characters: 5")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复制输入" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("输入已复制到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Input copied to clipboard");
  });

  it("emits the Chinese copy-input failure toast", async () => {
    const user = userEvent.setup({ delay: null });
    writeText.mockRejectedValue(new Error("nope"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderPanel(["guardrail-one"]);

    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.click(screen.getByRole("button", { name: "复制输入" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("复制输入失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to copy input");
  });

  it("renders the Chinese panel plural copy and loading label", () => {
    const { unmount } = renderPanel(["guardrail-one", "guardrail-two"]);
    expect(screen.getByText("测试 2 个 Guardrail 并比较结果")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试 2 个 Guardrail" })).toBeInTheDocument();
    expect(screen.queryByText("Test 2 guardrails and compare results")).not.toBeInTheDocument();
    unmount();

    renderPanel(["guardrail-one"], true);
    expect(screen.getByRole("button", { name: "正在测试 1 个 Guardrail..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Testing 1 guardrail..." })).not.toBeInTheDocument();
    cleanup();

    renderPanel(["guardrail-one", "guardrail-two"], true);
    expect(screen.getByRole("button", { name: "正在测试 2 个 Guardrail..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Testing 2 guardrails..." })).not.toBeInTheDocument();
  });

  it("emits the Chinese metadata validation toasts and inline messages", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = renderPanel(["guardrail-one"]);

    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.type(screen.getByPlaceholderText('{"forbidden_topics": ["tax", "finance"]}'), '"a string"');
    await user.click(screen.getByRole("button", { name: "测试 1 个 Guardrail" }));

    expect(await screen.findByText("元数据必须是 JSON 对象")).toBeInTheDocument();
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("元数据：元数据必须是 JSON 对象"));
    expect(screen.queryByText("Metadata must be a JSON object")).not.toBeInTheDocument();
    expect(toast.fromError).not.toHaveBeenCalledWith("Metadata: 元数据必须是 JSON 对象");
    unmount();

    renderPanel(["guardrail-one"]);
    await user.type(screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本..."), "hello");
    await user.type(screen.getByPlaceholderText('{"forbidden_topics": ["tax", "finance"]}'), "{{not json");
    await user.click(screen.getByRole("button", { name: "测试 1 个 Guardrail" }));

    expect(await screen.findByText("无效的 JSON")).toBeInTheDocument();
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("元数据：无效的 JSON"));
    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
    expect(toast.fromError).not.toHaveBeenCalledWith("Metadata: 无效的 JSON");
  });

  it("emits the Chinese enter-text validation toast", async () => {
    const user = userEvent.setup({ delay: null });
    renderPanel(["guardrail-one"]);

    const textarea = screen.getByPlaceholderText("输入要使用 Guardrail 测试的文本...");
    textarea.focus();
    await user.keyboard("{Enter}");

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请输入要测试的文本"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Please enter text to test");
  });

  it("renders the Chinese results chrome and hides the English", () => {
    renderWithProviders(
      <GuardrailTestResults
        results={[{ guardrailName: "ok-guardrail", response_text: "response body", latency: 12 }]}
        errors={[{ guardrailName: "err-guardrail", error: new Error("boom"), latency: 34 }]}
      />,
    );

    expect(screen.getByText("结果")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
    expect(screen.getByText("输出文本")).toBeInTheDocument();
    expect(screen.getByText(hasTextContent("字符数："))).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("err-guardrail - 错误")).toBeInTheDocument();
    expect(screen.queryByText("Characters:")).not.toBeInTheDocument();

    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    expect(screen.queryByText("Output Text")).not.toBeInTheDocument();
    expect(screen.queryByText("err-guardrail - Error")).not.toBeInTheDocument();
  });

  it("emits the Chinese result copy toasts", async () => {
    const user = userEvent.setup({ delay: null });
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { unmount } = renderWithProviders(
      <GuardrailTestResults
        results={[{ guardrailName: "ok-guardrail", response_text: "response body", latency: 12 }]}
        errors={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "复制" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("结果已复制到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Result copied to clipboard");
    unmount();

    writeText.mockRejectedValue(new Error("nope"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderWithProviders(
      <GuardrailTestResults
        results={[{ guardrailName: "ok-guardrail", response_text: "response body", latency: 12 }]}
        errors={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "复制" }));
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("复制结果失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to copy result");
  });
});
