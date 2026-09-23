import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { toast } from "@/lib/toast";

import Settings from "./settings";

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), fromError: vi.fn() },
}));

vi.mock("./networking", () => ({
  getCallbacksCall: vi.fn(),
  getCallbackConfigsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
  serviceHealthCheck: vi.fn(),
  deleteCallback: vi.fn(),
  alertingSettingsCall: vi.fn().mockResolvedValue([]),
}));

vi.mock("./alerting/alerting_settings", () => ({
  __esModule: true,
  default: () => <div>alerting settings stub</div>,
}));

vi.mock("./email_settings", () => ({
  __esModule: true,
  default: () => <div>email settings stub</div>,
}));

vi.mock("./CloudZeroCostTracking/CloudZeroCostTracking", () => ({
  __esModule: true,
  default: () => <div>cloudzero stub</div>,
}));

import { deleteCallback, getCallbackConfigsCall, getCallbacksCall, setCallbacksCall } from "./networking";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never;
  }
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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
});

const renderSettings = () =>
  renderWithProviders(<Settings accessToken="token" userRole="admin" userID="user-123" premiumUser={false} />);

describe("Settings page Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getCallbacksCall).mockResolvedValue({ callbacks: [], available_callbacks: [], alerts: [] });
    vi.mocked(getCallbackConfigsCall).mockResolvedValue([]);
    vi.mocked(setCallbacksCall).mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the settings tabs in Chinese", async () => {
    renderSettings();

    expect(await screen.findByText("日志回调")).toBeInTheDocument();
    expect(screen.queryByText("Logging Callbacks")).not.toBeInTheDocument();
    expect(screen.getByText("CloudZero 成本跟踪")).toBeInTheDocument();
    expect(screen.queryByText("CloudZero Cost Tracking")).not.toBeInTheDocument();
    expect(screen.getByText("告警类型")).toBeInTheDocument();
    expect(screen.queryByText("Alerting Types")).not.toBeInTheDocument();
    expect(screen.getByText("告警设置")).toBeInTheDocument();
    expect(screen.queryByText("Alerting Settings")).not.toBeInTheDocument();
    expect(screen.getByText("邮件告警")).toBeInTheDocument();
    expect(screen.queryByText("Email Alerts")).not.toBeInTheDocument();
    expect(screen.getByText("MS Teams 告警")).toBeInTheDocument();
    expect(screen.queryByText("MS Teams Alerts")).not.toBeInTheDocument();
  });

  it("renders the alerting intro and webhook header in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("告警类型");
    await user.click(screen.getByText("告警类型"));

    const intro = await screen.findByText(/告警会发送到任何兼容 Slack/);
    expect(intro).toHaveTextContent(
      "告警会发送到任何兼容 Slack 的入站 Webhook URL（Slack、Rocket.Chat、Mattermost 等）。可从 此处 获取 Slack Webhook URL",
    );
    expect(intro).not.toHaveTextContent("Alerts are sent to any Slack-compatible incoming webhook URL");
    expect(screen.getByRole("link", { name: "此处" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();
    expect(screen.getByText("Webhook URL（兼容 Slack）")).toBeInTheDocument();
    expect(screen.queryByText("Webhook URL (Slack-compatible)")).not.toBeInTheDocument();

    expect(screen.getByText("LLM 异常")).toBeInTheDocument();
    expect(screen.queryByText("LLM Exceptions")).not.toBeInTheDocument();
    expect(screen.getByText("LLM 响应过慢")).toBeInTheDocument();
    expect(screen.getByText("LLM 请求挂起")).toBeInTheDocument();
    expect(screen.getByText("预算告警（API Key、用户）")).toBeInTheDocument();
    expect(screen.getByText("用户消费阈值（每日/每月）")).toBeInTheDocument();
    expect(screen.getByText("用户消费异常检测")).toBeInTheDocument();
    expect(screen.getByText("数据库异常（读/写）")).toBeInTheDocument();
    expect(screen.getByText("每周/每月消费报告")).toBeInTheDocument();
    expect(screen.getByText("服务中断告警")).toBeInTheDocument();
    expect(screen.getByText("区域中断告警")).toBeInTheDocument();
    expect(screen.getByText("模型弃用警告")).toBeInTheDocument();
    expect(screen.queryByText("Model Deprecation Warnings")).not.toBeInTheDocument();
  });

  it("renders the add-callback dialog in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("日志回调");
    await user.click(screen.getByRole("button", { name: "添加回调" }));

    expect(await screen.findByText("添加日志回调")).toBeInTheDocument();
    expect(screen.queryByText("Add Logging Callback")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LiteLLM 文档：日志" })).toBeInTheDocument();
    expect(screen.getByText("回调")).toBeInTheDocument();
    expect(screen.queryByText("Callback")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择一个日志回调...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Choose a logging callback...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "添加回调" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryAllByRole("button", { name: "Add Callback" })).toHaveLength(0);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("无结果")).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("renders the callback field placeholders in Chinese and reports a created callback", async () => {
    vi.mocked(getCallbackConfigsCall).mockResolvedValue([
      {
        id: "langfuse",
        displayName: "Langfuse",
        dynamic_params: {
          LANGFUSE_PUBLIC_KEY: { type: "text", ui_name: "Public Key" },
          LANGFUSE_SAMPLE_RATE: { type: "number", ui_name: "Sample Rate" },
          LANGFUSE_MODE: { type: "select", ui_name: "Mode", options: ["a", "b"] },
        },
      },
    ]);
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("日志回调");
    await user.click(screen.getByRole("button", { name: "添加回调" }));
    await screen.findByText("添加日志回调");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Langfuse/ }));

    expect(await screen.findByPlaceholderText("输入你的public key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your public key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入sample rate")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter sample rate")).not.toBeInTheDocument();
    expect(screen.getByText("选择mode")).toBeInTheDocument();
    expect(screen.queryByText("Select mode")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加回调" }));

    await waitFor(() => expect(setCallbacksCall).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("回调 langfuse 添加成功");
    expect(toast.success).not.toHaveBeenCalledWith("Callback langfuse added successfully");
  });

  it("renders the edit and delete callback dialogs in Chinese", async () => {
    vi.mocked(getCallbacksCall).mockResolvedValue({
      callbacks: [{ name: "langfuse", variables: { LANGFUSE_PUBLIC_KEY: "k" }, mode: "success" }],
      available_callbacks: {
        langfuse: {
          litellm_callback_name: "langfuse",
          litellm_callback_params: ["LANGFUSE_PUBLIC_KEY"],
          ui_callback_name: "Langfuse",
        },
      },
      alerts: [],
    });
    vi.mocked(getCallbackConfigsCall).mockResolvedValue([
      {
        id: "langfuse",
        displayName: "Langfuse",
        dynamic_params: { LANGFUSE_PUBLIC_KEY: { type: "text", ui_name: "Public Key" } },
      },
    ]);
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("Langfuse");
    await user.click(screen.getByTestId("callback-actions-langfuse-success"));
    await user.click(await screen.findByTestId("callback-action-edit"));

    expect(await screen.findByText("编辑回调设置")).toBeInTheDocument();
    expect(screen.queryByText("Edit Callback Settings")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("回调更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Callback updated successfully");

    await user.click(screen.getByTestId("callback-actions-langfuse-success"));
    await user.click(await screen.findByTestId("callback-action-delete"));

    expect(await screen.findByText("删除回调")).toBeInTheDocument();
    expect(screen.queryByText("Delete Callback")).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此回调吗？此操作无法撤销。")).toBeInTheDocument();
    expect(
      screen.queryByText("Are you sure you want to delete this callback? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("回调信息")).toBeInTheDocument();
    expect(screen.queryByText("Callback Information")).not.toBeInTheDocument();
    expect(screen.getAllByText("回调名称").length).toBeGreaterThan(0);
    expect(screen.queryByText("Callback Name")).not.toBeInTheDocument();
    expect(screen.getAllByText("模式").length).toBeGreaterThan(0);
    expect(screen.queryByText("Mode")).not.toBeInTheDocument();
  });

  it("renders the edit-callback pending label in Chinese", async () => {
    vi.mocked(getCallbacksCall).mockResolvedValue({
      callbacks: [{ name: "langfuse", variables: { LANGFUSE_PUBLIC_KEY: "k" }, mode: "success" }],
      available_callbacks: {
        langfuse: {
          litellm_callback_name: "langfuse",
          litellm_callback_params: ["LANGFUSE_PUBLIC_KEY"],
          ui_callback_name: "Langfuse",
        },
      },
      alerts: [],
    });
    vi.mocked(getCallbackConfigsCall).mockResolvedValue([
      {
        id: "langfuse",
        displayName: "Langfuse",
        dynamic_params: { LANGFUSE_PUBLIC_KEY: { type: "text", ui_name: "Public Key" } },
      },
    ]);
    vi.mocked(setCallbacksCall).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("Langfuse");
    await user.click(screen.getByTestId("callback-actions-langfuse-success"));
    await user.click(await screen.findByTestId("callback-action-edit"));
    await screen.findByText("编辑回调设置");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByRole("button", { name: "正在保存..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });

  it("reports an alerts update, an alert test and a health check in Chinese", async () => {
    vi.mocked(getCallbacksCall).mockResolvedValue({
      callbacks: [{ name: "langfuse", variables: { LANGFUSE_PUBLIC_KEY: "k" }, mode: "success" }],
      available_callbacks: {
        langfuse: {
          litellm_callback_name: "langfuse",
          litellm_callback_params: ["LANGFUSE_PUBLIC_KEY"],
          ui_callback_name: "Langfuse",
        },
      },
      alerts: [],
    });
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("告警类型");
    await user.click(screen.getByText("告警类型"));

    expect(await screen.findByRole("button", { name: "测试告警" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Alerts" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("告警更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Alerts updated successfully");

    await user.click(screen.getByRole("button", { name: "测试告警" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "告警测试已触发。已向 Slack 发送测试请求，请检查 Slack 上的日志/告警以验证",
      ),
    );
    expect(toast.success).not.toHaveBeenCalledWith(
      "Alert test triggered. Test request to slack made - check logs/alerts on slack to verify",
    );

    await user.click(screen.getByText("日志回调"));
    await screen.findByText("Langfuse");
    await user.click(screen.getByTestId("callback-actions-langfuse-success"));
    await user.click(await screen.findByTestId("callback-action-test"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("健康检查已触发"));
    expect(toast.success).not.toHaveBeenCalledWith("Health check triggered");
  });

  it("renders the add-callback pending label in Chinese", async () => {
    vi.mocked(getCallbackConfigsCall).mockResolvedValue([
      { id: "langfuse", displayName: "Langfuse", dynamic_params: {} },
    ]);
    vi.mocked(setCallbacksCall).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("日志回调");
    await user.click(screen.getByRole("button", { name: "添加回调" }));
    await screen.findByText("添加日志回调");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: /Langfuse/ }));
    await user.click(screen.getByRole("button", { name: "添加回调" }));

    expect(await screen.findByRole("button", { name: "正在添加..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adding..." })).not.toBeInTheDocument();
  });

  it("renders the callback-required validation in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("日志回调");
    await user.click(screen.getByRole("button", { name: "添加回调" }));
    await screen.findByText("添加日志回调");
    await user.click(screen.getByRole("button", { name: "添加回调" }));

    expect(await screen.findByText("请选择一个回调")).toBeInTheDocument();
    expect(screen.queryByText("Please select a callback")).not.toBeInTheDocument();
  });

  it("reports a callback-config load failure in Chinese and hides the English original", async () => {
    vi.mocked(getCallbackConfigsCall).mockRejectedValue(new Error("boom"));
    renderSettings();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载回调配置失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load callback configs: boom");
  });

  it("reports a deleted callback in Chinese and hides the English original", async () => {
    vi.mocked(getCallbacksCall).mockResolvedValue({
      callbacks: [{ name: "langfuse", variables: { LANGFUSE_PUBLIC_KEY: "k" }, mode: "success" }],
      available_callbacks: {
        langfuse: {
          litellm_callback_name: "langfuse",
          litellm_callback_params: ["LANGFUSE_PUBLIC_KEY"],
          ui_callback_name: "Langfuse",
        },
      },
      alerts: [],
    });
    vi.mocked(deleteCallback).mockResolvedValue({});
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("Langfuse");
    await user.click(screen.getByTestId("callback-actions-langfuse-success"));
    await user.click(await screen.findByTestId("callback-action-delete"));
    await screen.findByText("删除回调");
    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("回调 langfuse 删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Callback langfuse deleted successfully");
  });
});
