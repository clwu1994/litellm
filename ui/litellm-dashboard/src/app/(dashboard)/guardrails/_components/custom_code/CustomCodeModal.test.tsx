import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import CustomCodeModal from "./CustomCodeModal";
import { createGuardrailCall, updateGuardrailCall, testCustomCodeGuardrail } from "@/components/networking";

vi.mock("@/components/networking", () => ({
  createGuardrailCall: vi.fn(),
  updateGuardrailCall: vi.fn(),
  testCustomCodeGuardrail: vi.fn(),
}));

const mockCreate = vi.mocked(createGuardrailCall);
const mockUpdate = vi.mocked(updateGuardrailCall);
const mockTest = vi.mocked(testCustomCodeGuardrail);

describe("CustomCodeModal", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const renderModal = (overrides = {}) =>
    render(<CustomCodeModal visible onClose={onClose} onSuccess={onSuccess} accessToken="test-token" {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({} as never);
    mockUpdate.mockResolvedValue({} as never);
  });

  it("should render the create heading and the editor scaffolding", async () => {
    renderModal();

    expect(await screen.findByText("Create Custom Guardrail")).toBeInTheDocument();
    expect(screen.getByText("Define custom logic using Python-like syntax")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., block-pii-custom")).toBeInTheDocument();
    expect(screen.getByText("Guardrail Name")).toBeInTheDocument();
    expect(screen.getByText("Mode (can select multiple)")).toBeInTheDocument();
    expect(screen.getByText("Available Primitives")).toBeInTheDocument();
    expect(screen.getByText("Python Logic")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save guardrail/i })).toBeInTheDocument();
  });

  it("should seed the editor with the empty template", async () => {
    renderModal();

    const editor = await screen.findByDisplayValue(/async def apply_guardrail/);
    expect(editor).toBeInTheDocument();
  });

  it("should not render its content when not visible", () => {
    renderModal({ visible: false });

    expect(screen.queryByText("Create Custom Guardrail")).not.toBeInTheDocument();
  });

  it("should render the edit heading and existing values in edit mode", async () => {
    renderModal({
      editData: {
        guardrail_id: "g-1",
        guardrail_name: "existing-guardrail",
        litellm_params: { mode: "post_call", default_on: true, custom_code: "def apply_guardrail(): pass" },
      },
    });

    expect(await screen.findByText("Edit Custom Guardrail")).toBeInTheDocument();
    expect(screen.getByDisplayValue("existing-guardrail")).toBeInTheDocument();
    expect(screen.getByDisplayValue("def apply_guardrail(): pass")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update guardrail/i })).toBeInTheDocument();
  });

  it("should keep save disabled until a guardrail name is entered", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: /save guardrail/i }));
    expect(mockCreate).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText("e.g., block-pii-custom"), "my-guardrail");
    await user.click(screen.getByRole("button", { name: /save guardrail/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  it("should create the guardrail with the entered name, mode and code", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(await screen.findByPlaceholderText("e.g., block-pii-custom"), "block-pii");
    await user.click(screen.getByRole("button", { name: /save guardrail/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    const [token, payload] = mockCreate.mock.calls[0] as [string, Record<string, never>];
    expect(token).toBe("test-token");
    expect(payload).toMatchObject({
      guardrail_name: "block-pii",
      litellm_params: { guardrail: "custom_code", mode: ["pre_call"], default_on: false },
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("should switch the editor contents when a template is chosen", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(await screen.findByDisplayValue(/async def apply_guardrail/)).toBeInTheDocument();

    const comboboxes = screen.getAllByRole("combobox");
    await user.click(comboboxes[comboboxes.length - 1]);
    const options = await screen.findAllByText("Block SSN");
    await user.click(options[options.length - 1]);

    expect(await screen.findByDisplayValue(/SSN detected/)).toBeInTheDocument();
  });

  it("should narrow the mode options to the typed search text", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.keyboard("mcp");

    expect(await screen.findByText("pre_mcp_call (Before MCP Tool Call)")).toBeInTheDocument();
    expect(screen.queryByText("logging_only")).not.toBeInTheDocument();
  });

  it("should expand the test section and run a test against the backend", async () => {
    const user = userEvent.setup();
    mockTest.mockResolvedValue({ success: true, result: { action: "allow" } } as never);
    renderModal();

    await user.click(await screen.findByText("Test Your Guardrail"));

    const runButton = await screen.findByRole("button", { name: /run test/i });
    await user.click(runButton);

    await waitFor(() => {
      expect(mockTest).toHaveBeenCalled();
    });
    expect(await screen.findByText("Allowed")).toBeInTheDocument();
  });

  it("should surface a backend test error", async () => {
    const user = userEvent.setup();
    mockTest.mockResolvedValue({ success: false, error: "boom", error_type: "SyntaxError" } as never);
    renderModal();

    await user.click(await screen.findByText("Test Your Guardrail"));
    await user.click(await screen.findByRole("button", { name: /run test/i }));

    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(screen.getByText("[SyntaxError]")).toBeInTheDocument();
  });

  it("should cancel through the footer button", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

const renderZhModal = (overrides = {}) =>
  render(<CustomCodeModal visible onClose={vi.fn()} onSuccess={vi.fn()} accessToken="test-token" {...overrides} />);

const expandZhTest = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByText("测试你的 Guardrail"));
};

describe("CustomCodeModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({} as never);
    mockUpdate.mockResolvedValue({} as never);
    await i18n.changeLanguage("zh");
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese create chrome and hides the English one", async () => {
    renderZhModal();

    expect(await screen.findByText("创建自定义代码 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("使用类 Python 语法定义自定义逻辑")).toBeInTheDocument();
    expect(screen.getByText("Guardrail 名称")).toBeInTheDocument();
    expect(screen.getByText("模式（可多选）")).toBeInTheDocument();
    expect(screen.getByText("模板")).toBeInTheDocument();
    expect(screen.getByText("默认开启")).toBeInTheDocument();
    expect(screen.getByText("Python 逻辑")).toBeInTheDocument();
    expect(screen.getByText("受限环境（不允许导入）")).toBeInTheDocument();
    expect(screen.getByText("测试你的 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("可用原语")).toBeInTheDocument();
    expect(screen.getByText("点击即可复制函数到剪贴板")).toBeInTheDocument();
    expect(screen.getByText("更改会自动保存到本地草稿")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存 Guardrail/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();

    expect(screen.queryByText("Create Custom Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("Define custom logic using Python-like syntax")).not.toBeInTheDocument();
    expect(screen.queryByText("Mode (can select multiple)")).not.toBeInTheDocument();
    expect(screen.queryByText("Browse Community templates")).not.toBeInTheDocument();
    expect(screen.queryByText("Python Logic")).not.toBeInTheDocument();
    expect(screen.queryByText("Available Primitives")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save Guardrail/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese edit chrome and update button", async () => {
    renderZhModal({
      editData: {
        guardrail_id: "g-1",
        guardrail_name: "existing-guardrail",
        litellm_params: { mode: "post_call", default_on: true, custom_code: "def apply_guardrail(): pass" },
      },
    });

    expect(await screen.findByText("编辑自定义代码 Guardrail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /更新 Guardrail/ })).toBeInTheDocument();
    expect(screen.queryByText("Edit Custom Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update Guardrail/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese mode options, empty state and deselect placeholder", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhModal();

    await user.click(screen.getAllByRole("combobox")[0]);
    expect(await screen.findByText("pre_mcp_call（MCP 工具调用前）")).toBeInTheDocument();
    expect(screen.getByText("post_call（响应）")).toBeInTheDocument();
    expect(screen.getByText("during_call（并行）")).toBeInTheDocument();
    expect(screen.getByText("post_mcp_call（MCP 工具调用后）")).toBeInTheDocument();
    expect(screen.getByText("during_mcp_call（MCP 工具调用期间）")).toBeInTheDocument();
    expect(screen.getByText("logging_only")).toBeInTheDocument();
    expect(screen.queryByText("pre_mcp_call (Before MCP Tool Call)")).not.toBeInTheDocument();

    await user.keyboard("zzz");
    expect(await screen.findByText("没有匹配的模式")).toBeInTheDocument();
    expect(screen.queryByText("No matching modes")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name: "pre_call（请求）" }));
    expect(await screen.findByPlaceholderText("选择模式")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select modes")).not.toBeInTheDocument();
  });

  it("renders the Chinese template names and the standard group label", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhModal();

    await user.click(screen.getAllByRole("combobox")[1]);

    expect(await screen.findByText("标准")).toBeInTheDocument();
    expect(screen.getByText("浏览社区模板")).toBeInTheDocument();
    for (const name of [
      "空白模板",
      "阻止 SSN",
      "脱敏电子邮件",
      "阻止 SQL 注入",
      "校验 JSON",
      "外部 API 检查（异步）",
    ]) {
      expect(await screen.findByRole("option", { name })).toBeInTheDocument();
    }
    expect(screen.queryByText("STANDARD")).not.toBeInTheDocument();
    expect(screen.queryByText("Empty Template")).not.toBeInTheDocument();
    expect(screen.queryByText("Browse Community templates")).not.toBeInTheDocument();
  });

  it("renders the Chinese test input chrome and field descriptions", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhModal();

    await expandZhTest(user);

    expect(await screen.findByText("测试输入（JSON）")).toBeInTheDocument();
    expect(screen.getByText("加载示例：")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "调用前" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MCP 调用前" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "调用后" })).toBeInTheDocument();
    expect(screen.getByText(/：消息内容（始终）/)).toBeInTheDocument();
    expect(screen.getByText(/：Base64 图片（视觉）/)).toBeInTheDocument();
    expect(screen.getByText(/：工具定义/)).toBeInTheDocument();
    expect(screen.getByText(/，作为 OpenAI 工具的 MCP/)).toBeInTheDocument();
    expect(screen.getByText(/：LLM 工具调用/)).toBeInTheDocument();
    expect(screen.getByText(/：完整消息/)).toBeInTheDocument();
    expect(screen.getByText(/：模型名称（始终）/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /运行测试/ })).toBeInTheDocument();

    expect(screen.queryByText("Test Input (JSON)")).not.toBeInTheDocument();
    expect(screen.queryByText("Load example:")).not.toBeInTheDocument();
    expect(screen.queryByText(/Message content \(always\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Model name \(always\)/)).not.toBeInTheDocument();
  });

  it.each([
    { label: "allow", result: { action: "allow" }, chinese: "已允许", english: "Allowed" },
    { label: "block", result: { action: "block", reason: "bad" }, chinese: "已阻止：bad", english: "Blocked: bad" },
    { label: "modify", result: { action: "modify", texts: ["hello"] }, chinese: "已修改", english: "Modified" },
    { label: "unknown action", result: { action: "" }, chinese: "未知", english: "Unknown" },
  ])("renders the Chinese $label test result and hides the English one", async ({ result, chinese, english }) => {
    const user = userEvent.setup({ delay: null });
    mockTest.mockResolvedValue({ success: true, result } as never);
    renderZhModal();

    await expandZhTest(user);
    await user.click(await screen.findByRole("button", { name: /运行测试/ }));
    expect(await screen.findByText(chinese)).toBeInTheDocument();
    expect(screen.queryByText(english)).not.toBeInTheDocument();
  });

  it("renders the Chinese running label and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    mockTest.mockReturnValue(new Promise(() => {}));
    renderZhModal();

    await expandZhTest(user);
    await user.click(await screen.findByRole("button", { name: /运行测试/ }));
    expect(await screen.findByText("运行中...")).toBeInTheDocument();
    expect(screen.queryByText("Running...")).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown test error and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    mockTest.mockResolvedValue({ success: true, result: null } as never);
    renderZhModal();

    await expandZhTest(user);
    await user.click(await screen.findByRole("button", { name: /运行测试/ }));
    expect(await screen.findByText("发生未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error occurred")).not.toBeInTheDocument();
  });

  it("renders the Chinese failed test error and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    mockTest.mockRejectedValue("boom");
    renderZhModal();

    await expandZhTest(user);
    await user.click(await screen.findByRole("button", { name: /运行测试/ }));
    expect(await screen.findByText("测试自定义代码失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to test custom code")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid test input error and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    mockTest.mockResolvedValue({ success: true, result: { action: "allow" } } as never);
    renderZhModal();

    await expandZhTest(user);
    fireEvent.change(screen.getByPlaceholderText('{"texts": ["test message"], ...}'), { target: { value: "{bad" } });
    await user.click(screen.getByRole("button", { name: /运行测试/ }));
    expect(await screen.findByText("测试输入 JSON 无效")).toBeInTheDocument();
    expect(screen.queryByText("Invalid test input JSON")).not.toBeInTheDocument();
  });

  it("renders the Chinese contribution banner and primitive reference", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhModal();

    expect(screen.getByText("构建了实用的 Guardrail？")).toBeInTheDocument();
    expect(screen.getByText("分享给社区，帮助其他人更快构建")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /贡献模板/ })).toBeInTheDocument();

    expect(screen.getByText("返回值")).toBeInTheDocument();
    expect(screen.getByText("放行请求/响应")).toBeInTheDocument();
    expect(screen.getByText("带消息拒绝")).toBeInTheDocument();
    expect(screen.getByText("放行并记录非阻断违规")).toBeInTheDocument();
    expect(screen.getByText("转换内容")).toBeInTheDocument();

    const categories: Array<[string, string[]]> = [
      ["HTTP 请求（异步）", ["发起异步 HTTP 请求", "异步 GET 请求", "异步 POST 请求"]],
      ["正则函数", ["找到匹配模式时返回 True", "替换所有匹配项", "返回匹配项列表"]],
      ["JSON 函数", ["解析 JSON 字符串，出错时返回 None", "转换为 JSON 字符串", "根据 JSON schema 校验"]],
      ["URL 函数", ["从文本中提取所有 URL", "检查 URL 是否有效", "检查文本中所有 URL 是否有效"]],
      ["代码检测", ["检测到代码时返回 True", "返回检测到的语言列表", "检查特定语言"]],
      ["文本工具", ["检查子字符串是否存在", "检查是否存在任一子字符串", "统计单词数", "统计字符数", "字符串转换"]],
    ];
    for (const [category, descriptions] of categories) {
      await user.click(screen.getByRole("button", { name: category }));
      for (const description of descriptions) {
        expect(await screen.findByText(description)).toBeInTheDocument();
      }
    }

    await user.click(screen.getByRole("button", { name: /allow\(\)/ }));
    expect(await screen.findByText("已复制！")).toBeInTheDocument();
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();

    expect(screen.queryByText("Built a useful guardrail?")).not.toBeInTheDocument();
    expect(screen.queryByText("Return Values")).not.toBeInTheDocument();
    expect(screen.queryByText("Let request/response through")).not.toBeInTheDocument();
  });

  it("renders the Chinese code validation and save toasts and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = renderZhModal();

    await user.type(screen.getByPlaceholderText("e.g., block-pii-custom"), "my-code");
    fireEvent.change(screen.getByDisplayValue(/async def apply_guardrail/), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: /保存 Guardrail/ }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请输入自定义代码"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Please enter custom code");

    unmount();
    renderZhModal();
    await user.type(screen.getByPlaceholderText("e.g., block-pii-custom"), "my-code");
    await user.click(screen.getByRole("button", { name: /保存 Guardrail/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("自定义代码 Guardrail 创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Custom code guardrail created successfully");

    unmount();
    renderZhModal({
      editData: {
        guardrail_id: "g-1",
        guardrail_name: "existing",
        litellm_params: { mode: "pre_call", default_on: false, custom_code: "def apply_guardrail(): pass" },
      },
    });
    await user.click(screen.getByRole("button", { name: /更新 Guardrail/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("自定义代码 Guardrail 更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Custom code guardrail updated successfully");
  });

  it("renders the Chinese save-failure toasts and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    mockCreate.mockRejectedValue(new Error("boom"));
    const { unmount } = renderZhModal();

    await user.type(screen.getByPlaceholderText("e.g., block-pii-custom"), "my-code");
    await user.click(screen.getByRole("button", { name: /保存 Guardrail/ }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建 Guardrail 失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create guardrail: boom");

    unmount();
    mockUpdate.mockRejectedValue(new Error("boom"));
    renderZhModal({
      editData: {
        guardrail_id: "g-1",
        guardrail_name: "existing",
        litellm_params: { mode: "pre_call", default_on: false, custom_code: "def apply_guardrail(): pass" },
      },
    });
    await user.click(screen.getByRole("button", { name: /更新 Guardrail/ }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新 Guardrail 失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update guardrail: boom");
  });
});
