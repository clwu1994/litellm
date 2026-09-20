import React from "react";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import AddGuardrailForm from "./add_guardrail_form";

vi.mock("@/components/networking", () => ({
  createGuardrailCall: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn().mockResolvedValue({}),
  getGuardrailUISettings: vi.fn().mockResolvedValue({}),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
}));

import * as networking from "@/components/networking";

const renderForm = () => {
  const onClose = vi.fn();
  renderWithProviders(<AddGuardrailForm visible={true} onClose={onClose} accessToken={null} onSuccess={vi.fn()} />);
  return { onClose };
};

describe("AddGuardrailForm close behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not close when the user clicks outside the modal on the mask", () => {
    const { onClose } = renderForm();
    expect(screen.getByText("Create guardrail")).toBeInTheDocument();

    const backdrop = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when the user clicks the explicit close button", () => {
    const { onClose } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "✕" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("AddGuardrailForm provider options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders provider options with logos from the bundled guardrail logo map", async () => {
    renderForm();
    fireEvent.mouseDown(screen.getByLabelText("Guardrail Provider"));

    const logo = await screen.findByAltText("Presidio PII logo");
    expect(logo).toHaveAttribute("src", expect.stringContaining("microsoft_azure.svg"));
  });
});

const zhProviderParams = {
  bedrock: {
    ui_friendly_name: "Bedrock Guardrail",
    guardrailIdentifier: { description: "The guardrail id on Bedrock", required: true, type: null },
  },
  litellm_content_filter: { ui_friendly_name: "LiteLLM Content Filter" },
  llm_as_a_judge: { ui_friendly_name: "LiteLLM LLM as a Judge" },
  tool_permission: { ui_friendly_name: "Tool Permission" },
};

const zhUiSettings = {
  supported_entities: ["PERSON", "EMAIL"],
  supported_actions: ["MASK", "REDACT"],
  pii_entity_categories: [],
  supported_modes: [
    "pre_call",
    "during_call",
    "post_call",
    "logging_only",
    "pre_mcp_call",
    "during_mcp_call",
    "post_mcp_call",
  ],
};

const zhModeDescriptions = [
  "LLM 调用前 - 在 LLM 调用之前运行并检查输入（推荐）",
  "LLM 调用中 - 与 LLM 调用并行运行，检查完成前暂扣响应",
  "LLM 调用后 - 在 LLM 调用之后运行，仅检查输出",
  "仅记录日志 - 仅在日志回调中运行，不影响 LLM 调用",
  "MCP 工具调用前 - 在 MCP 工具执行之前运行并校验工具调用",
  "MCP 工具调用中 - 与 MCP 工具执行并行运行以进行监控",
  "MCP 工具调用后 - 在 MCP 工具执行之后运行并检查工具结果",
];

const renderZhForm = () => {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  const view = renderWithProviders(
    <AddGuardrailForm visible onClose={onClose} accessToken="test-token" onSuccess={onSuccess} preset={undefined} />,
  );
  return { ...view, onSuccess, onClose };
};

const pickZhProvider = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByLabelText("Guardrail 提供商"));
  await user.click(await screen.findByText(label));
};

/* eslint-disable testing-library/no-node-access -- The hint trigger is an icon with no accessible name, so reaching its portal needs the DOM */
const hoverZhHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const fieldLabel = screen.getByText(label);
  const trigger = fieldLabel.closest("label")?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("AddGuardrailForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue(zhProviderParams);
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue(zhUiSettings);
    vi.mocked(networking.modelAvailableCall).mockResolvedValue({ data: [{ id: "gpt-5" }] });
    vi.mocked(networking.createGuardrailCall).mockResolvedValue({ guardrail_id: "new" });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese basic info chrome, hints and steps and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    expect(await screen.findByText("创建 Guardrail")).toBeInTheDocument();
    expect(screen.getByLabelText("Guardrail 名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入此 Guardrail 的名称")).toBeInTheDocument();
    expect(screen.getByLabelText("Guardrail 提供商")).toBeInTheDocument();
    expect(screen.getByLabelText("模式")).toBeInTheDocument();
    expect(screen.getByLabelText("始终开启")).toBeInTheDocument();
    expect(screen.getByText("在 Guardrail 中跳过 system 消息")).toBeInTheDocument();
    expect(screen.getByText("在 Guardrail 中跳过 tool 消息")).toBeInTheDocument();
    expect(screen.getAllByText("基本信息").length).toBeGreaterThan(0);
    expect(screen.getByText("提供商配置")).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
    expect(screen.getByText("下一步")).toBeInTheDocument();

    await hoverZhHint(user, "模式");
    expect(await screen.findByText("Guardrail 的应用方式")).toBeInTheDocument();
    await hoverZhHint(user, "始终开启");
    expect(await screen.findByText("启用后，此 Guardrail 将默认应用于所有请求。")).toBeInTheDocument();
    await hoverZhHint(user, "在 Guardrail 中跳过 system 消息");
    expect(
      await screen.findByText(
        "仅统一 Guardrail：从 Guardrail 评估输入中省略 role: system（OpenAI chat + Anthropic messages）。模型仍会收到完整消息。使用全局默认值将遵循 litellm_settings.skip_system_message_in_guardrail。",
      ),
    ).toBeInTheDocument();
    await hoverZhHint(user, "在 Guardrail 中跳过 tool 消息");
    expect(
      await screen.findByText(
        "仅统一 Guardrail：从 Guardrail 评估输入中省略 role: tool（OpenAI chat + Anthropic messages）。模型仍会收到完整消息。使用全局默认值将遵循 litellm_settings.skip_tool_message_in_guardrail。",
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText("Create guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a name for this guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Always On")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("renders the Chinese provider placeholder, empty state and skip message options", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    expect(screen.getByPlaceholderText("选择 Guardrail 提供商")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Guardrail 提供商"));
    await user.type(screen.getByLabelText("Guardrail 提供商"), "zzz");
    expect(await screen.findByText("没有匹配的提供商")).toBeInTheDocument();
    expect(screen.queryByText("No matching providers")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText("在 Guardrail 中跳过 system 消息"));
    expect(await screen.findByText("是 — 从 Guardrail 扫描中排除")).toBeInTheDocument();
    expect(screen.getByText("否 — 始终包含在扫描中")).toBeInTheDocument();
    expect(screen.getAllByText("使用全局默认值").length).toBeGreaterThan(0);
    expect(screen.queryByText("Yes — exclude from guardrail scan")).not.toBeInTheDocument();
  });

  it("renders the Chinese mode descriptions and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.click(screen.getByLabelText("模式"));

    for (const description of zhModeDescriptions) {
      expect(await screen.findByText(description)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Before LLM Call - Runs before the LLM call/)).not.toBeInTheDocument();
    expect(screen.queryByText(/After MCP Tool Call - Runs after MCP tool execution/)).not.toBeInTheDocument();
  });

  it("renders the Chinese validation messages and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.click(screen.getByText("下一步"));
    expect(await screen.findByText("请输入 Guardrail 名称")).toBeInTheDocument();
    expect(await screen.findByText("请选择提供商")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a guardrail name")).not.toBeInTheDocument();
    expect(screen.queryByText("Please select a provider")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    await user.click(screen.getByLabelText("模式"));
    const preCallOption = (await screen.findAllByText("pre_call")).at(-1) as HTMLElement;
    await user.click(preCallOption);
    await user.click(screen.getByText("下一步"));
    expect(await screen.findByText("请选择模式")).toBeInTheDocument();
    expect(screen.queryByText("Please select a mode")).not.toBeInTheDocument();
  });

  it("renders the Chinese content-filter steps and endpoint settings and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue({
      ...zhUiSettings,
      content_filter_settings: undefined,
    });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-filter");
    await pickZhProvider(user, "LiteLLM Content Filter");

    expect(screen.getByText("主题")).toBeInTheDocument();
    expect(screen.getByText("匹配模式")).toBeInTheDocument();
    expect(screen.getByText("关键词")).toBeInTheDocument();
    expect(screen.getByText("Endpoint 设置（可选）")).toBeInTheDocument();
    expect(screen.getByText("可选")).toBeInTheDocument();

    await user.click(screen.getByText("下一步"));
    expect(screen.getByText("上一步")).toBeInTheDocument();
    expect(screen.getByText("编辑")).toBeInTheDocument();
    await user.click(screen.getByText("下一步"));
    await user.click(screen.getByText("下一步"));
    await user.click(screen.getByText("下一步"));

    expect(await screen.findByText("调用类型")).toBeInTheDocument();
    expect(screen.getByText("选择调用类型")).toBeInTheDocument();
    expect(screen.getByText(/为特定调用类型配置设置/)).toBeInTheDocument();
    expect(screen.getByText("更多调用类型即将推出。")).toBeInTheDocument();

    await user.click(screen.getByLabelText("调用类型"));
    await user.click(await screen.findByRole("option", { name: "/v1/realtime" }));
    expect(await screen.findByText("/v1/realtime 设置")).toBeInTheDocument();
    await user.click(screen.getByText("/v1/realtime 设置"));

    expect(await screen.findByText("X 次违规后结束会话")).toBeInTheDocument();
    expect(screen.getByText(/在达到此数量的 Guardrail 违规后自动关闭会话/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 3")).toBeInTheDocument();
    expect(screen.getByText("违规时")).toBeInTheDocument();
    expect(screen.getByText("警告")).toBeInTheDocument();
    expect(screen.getByText("结束会话")).toBeInTheDocument();
    expect(screen.getByText("Bot 朗读该消息，会话继续")).toBeInTheDocument();
    expect(screen.getByText("Bot 朗读该消息，连接立即关闭")).toBeInTheDocument();
    expect(screen.getByText("用户听到的消息")).toBeInTheDocument();
    expect(screen.getByText(/此 Guardrail 触发时 Bot 朗读的内容/)).toBeInTheDocument();

    expect(screen.queryByText("Call type")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a call type")).not.toBeInTheDocument();
    expect(screen.queryByText("More call types coming soon.")).not.toBeInTheDocument();
    expect(screen.queryByText("/v1/realtime settings")).not.toBeInTheDocument();
    expect(screen.queryByText("End session after X violations")).not.toBeInTheDocument();
    expect(screen.queryByText("On violation")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "创建 Guardrail" }));
    await vi.waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith("请至少配置一项内容过滤设置（类别、匹配模式、关键词或竞品意图）"),
    );
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Please configure at least one content filter setting (category, pattern, keyword, or competitor intent)",
    );
  });

  it("renders the Chinese PII step title and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-pii");
    await pickZhProvider(user, "Presidio PII");

    expect(screen.getByText("PII 配置")).toBeInTheDocument();
    expect(screen.queryByText("PII Configuration")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-JSON toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({
      bedrock: {
        ui_friendly_name: "Bedrock Guardrail",
        config: { description: "Config JSON", required: false, type: null },
      },
    });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    fireEvent.change(screen.getByLabelText("config"), { target: { value: "{not json" } });
    await user.click(screen.getByText("下一步"));
    await user.click(screen.getByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("配置中的 JSON 无效"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON in configuration");
  });

  it("renders the Chinese fix-highlighted toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({
      bedrock: {
        ui_friendly_name: "Bedrock Guardrail",
        optional_params: {
          description: "Optional parameters",
          required: false,
          type: "nested",
          fields: { severity_threshold: { description: "Severity threshold", required: true, type: "number" } },
        },
      },
    });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    await user.click(screen.getByText("下一步"));
    await user.click(await screen.findByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建 Guardrail 失败：请修正高亮的字段"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create guardrail: please fix the highlighted fields");
  });

  it("renders the Chinese tool-rule toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-tools");
    await pickZhProvider(user, "Tool Permission");
    await user.click(screen.getByText("下一步"));
    await user.click(await screen.findByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请至少添加一条工具权限规则"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Add at least one tool permission rule");
  });

  it("renders the Chinese criteria-required toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "judge-zh");
    await pickZhProvider(user, "LiteLLM LLM as a Judge");
    await user.click(screen.getByText("下一步"));
    await user.click(await screen.findByLabelText("评判模型"));
    await user.click(await screen.findByTitle("gpt-5"));
    await user.click(screen.getByLabelText("移除标准"));
    await user.click(screen.getByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请至少添加一个评判标准"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Add at least one evaluation criterion");
  });

  it("renders the Chinese criteria-weight toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "judge-zh");
    await pickZhProvider(user, "LiteLLM LLM as a Judge");
    await user.click(screen.getByText("下一步"));

    await user.type(await screen.findByPlaceholderText("标准名称（例如 Policy accuracy）"), "Accuracy");
    await user.type(screen.getByPlaceholderText("评判模型应针对此标准检查什么？"), "Is it right");
    const weight = screen.getByPlaceholderText("e.g. 50");
    await user.clear(weight);
    await user.type(weight, "60");
    await user.click(screen.getByLabelText("评判模型"));
    await user.click(await screen.findByTitle("gpt-5"));
    await user.click(screen.getByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("各评判标准权重之和必须为 100%（当前为 60%）"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Criterion weights must sum to 100% (currently 60%)");
  });

  it("renders the Chinese created toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    await user.click(screen.getByText("下一步"));
    await user.click(await screen.findByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardrail 创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Guardrail created successfully");
  });

  it("renders the Chinese create-failure toast and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.createGuardrailCall).mockRejectedValue(new Error("boom"));
    renderZhForm();

    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    await user.click(screen.getByText("下一步"));
    await user.click(await screen.findByRole("button", { name: "创建 Guardrail" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建 Guardrail 失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create guardrail: boom");
  });

  it("renders the Chinese configuration load-failure toast and hides the English one", async () => {
    vi.mocked(networking.getGuardrailUISettings).mockRejectedValue(new Error("nope"));
    renderZhForm();

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载 Guardrail 配置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load guardrail configuration");
  });
});

describe("AddGuardrailForm fully Chinese configuration editors", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    vi.mocked(networking.getGuardrailUISettings).mockResolvedValue(zhUiSettings);
    vi.mocked(networking.modelAvailableCall).mockResolvedValue({ data: [{ id: "gpt-5" }] });
    vi.mocked(networking.createGuardrailCall).mockResolvedValue({ guardrail_id: "new" });
    vi.mocked(networking.getGuardrailProviderSpecificParams).mockResolvedValue({
      ...zhProviderParams,
      bedrock: {
        ui_friendly_name: "Bedrock Guardrail",
        guardrailIdentifier: { description: "The guardrail id on Bedrock", required: true, type: null },
        optional_params: {
          description: "",
          required: false,
          type: "nested",
          fields: { severity_threshold: { description: "Severity threshold", required: false, type: "number" } },
        },
      },
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("shows no English editor chrome at step 1 for a PII, an LLM-judge and a plain provider", async () => {
    const user = userEvent.setup({ delay: null });

    const { unmount } = renderZhForm();
    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-pii");
    await pickZhProvider(user, "Presidio PII");
    await user.click(screen.getByText("下一步"));

    expect(await screen.findByText("配置 PII 保护")).toBeInTheDocument();
    expect(screen.getByText("已选择 0 项")).toBeInTheDocument();
    expect(screen.getByText("按类别筛选")).toBeInTheDocument();
    expect(screen.getByText("快捷操作")).toBeInTheDocument();
    expect(screen.getByText("PII 类型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选并屏蔽" })).toBeInTheDocument();
    expect(screen.queryByText("Configure PII Protection")).not.toBeInTheDocument();
    expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();
    expect(screen.queryByText("PII Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Select All & Mask")).not.toBeInTheDocument();

    unmount();

    renderZhForm();
    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-judge");
    await pickZhProvider(user, "LiteLLM LLM as a Judge");
    await user.click(screen.getByText("下一步"));

    expect(await screen.findByLabelText("评判模型")).toBeInTheDocument();
    expect(screen.getByText("通过的最低分数")).toBeInTheDocument();
    expect(screen.getByText("失败时")).toBeInTheDocument();
    expect(screen.getByText("评判标准")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加标准" })).toBeInTheDocument();
    expect(screen.queryByText("Judge Model")).not.toBeInTheDocument();
    expect(screen.queryByText("Minimum Score to Pass")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluation Criteria")).not.toBeInTheDocument();

    unmount();

    renderZhForm();
    await user.type(await screen.findByLabelText("Guardrail 名称"), "my-bedrock");
    await pickZhProvider(user, "Bedrock Guardrail");
    await user.click(screen.getByText("下一步"));

    expect(await screen.findByText("可选参数")).toBeInTheDocument();
    expect(screen.queryByText("Optional Parameters")).not.toBeInTheDocument();
    expect(screen.queryByText("No configuration fields available for this provider.")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading provider parameters...")).not.toBeInTheDocument();
  });
});
