import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AlertingSettings from "./alerting/alerting_settings";
import DynamicForm from "./alerting/dynamic_form";
import EmailEventSettings from "./email_events/email_event_settings";
import EmailSettings from "./email_settings";
import { LoggingSettingsView } from "./logging_settings_view";

const {
  getEmailEventSettings,
  updateEmailEventSettings,
  resetEmailEventSettings,
  serviceHealthCheck,
  setCallbacksCall,
  alertingSettingsCall,
  updateConfigFieldSetting,
} = vi.hoisted(() => ({
  getEmailEventSettings: vi.fn(),
  updateEmailEventSettings: vi.fn(),
  resetEmailEventSettings: vi.fn(),
  serviceHealthCheck: vi.fn(),
  setCallbacksCall: vi.fn(),
  alertingSettingsCall: vi.fn(),
  updateConfigFieldSetting: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getEmailEventSettings,
  updateEmailEventSettings,
  resetEmailEventSettings,
  serviceHealthCheck,
  setCallbacksCall,
  alertingSettingsCall,
  updateConfigFieldSetting,
}));

vi.mock("./email_events", () => ({
  EmailEventSettings: () => <div>email event settings</div>,
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), fromError: vi.fn() },
}));

const ALERTING_SETTINGS = [
  {
    field_name: "daily_report_frequency",
    field_description: "How often the report runs",
    field_type: "Integer",
    field_value: 12,
    stored_in_db: true,
    premium_field: false,
  },
  {
    field_name: "region_name",
    field_description: "Region to watch",
    field_type: "String",
    field_value: "us-east",
    stored_in_db: false,
    premium_field: false,
  },
  {
    field_name: "slack_alerting",
    field_description: "Send to slack",
    field_type: "Boolean",
    field_value: false,
    stored_in_db: null,
    premium_field: false,
  },
  {
    field_name: "premium_flag",
    field_description: "A premium field",
    field_type: "String",
    field_value: "",
    stored_in_db: null,
    premium_field: true,
  },
];

const EMAIL_ALERTS = [
  {
    name: "email",
    variables: {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USERNAME: "username",
      SMTP_PASSWORD: "********",
      SMTP_SENDER_EMAIL: "sender@berri.ai",
      TEST_EMAIL_ADDRESS: "info@berri.ai",
      EMAIL_LOGO_URL: "https://example.com/logo.png",
      EMAIL_SUPPORT_CONTACT: "support@berri.ai",
    },
  },
];

describe("Settings views Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getEmailEventSettings.mockResolvedValue({
      settings: [
        { event: "Virtual Key Created", enabled: true },
        { event: "New User Invitation", enabled: false },
        { event: "Something Happened", enabled: false },
      ],
    });
    updateEmailEventSettings.mockResolvedValue({});
    resetEmailEventSettings.mockResolvedValue({});
    serviceHealthCheck.mockResolvedValue({});
    setCallbacksCall.mockResolvedValue({});
    updateConfigFieldSetting.mockResolvedValue({});
    alertingSettingsCall.mockResolvedValue([
      {
        field_name: "slack_alerting",
        field_type: "Boolean",
        field_value: true,
        field_default_value: false,
        field_description: "Send to slack",
        stored_in_db: true,
        premium_field: false,
      },
    ]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the logging settings view in Chinese", () => {
    renderWithProviders(
      <LoggingSettingsView
        loggingConfigs={[{ callback_name: "langfuse", callback_type: "success", callback_vars: { a: "1" } }]}
        disabledCallbacks={["datadog"]}
      />,
    );

    expect(screen.getByText("日志设置")).toBeInTheDocument();
    expect(screen.queryByText("Logging Settings")).not.toBeInTheDocument();
    expect(screen.getByText("此密钥的启用日志集成和已禁用回调")).toBeInTheDocument();
    expect(
      screen.queryByText("Active logging integrations and disabled callbacks for this key"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("日志集成")).toBeInTheDocument();
    expect(screen.queryByText("Logging Integrations")).not.toBeInTheDocument();
    expect(screen.getByText("已配置 1 个参数")).toBeInTheDocument();
    expect(screen.queryByText("1 parameters configured")).not.toBeInTheDocument();
    expect(screen.getByText("仅成功")).toBeInTheDocument();
    expect(screen.queryByText("Success Only")).not.toBeInTheDocument();
    expect(screen.getByText("已禁用的回调")).toBeInTheDocument();
    expect(screen.queryByText("Disabled Callbacks")).not.toBeInTheDocument();
    expect(screen.getByText("此密钥已禁用")).toBeInTheDocument();
    expect(screen.queryByText("Disabled for this key")).not.toBeInTheDocument();
    expect(screen.getByText("已禁用")).toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
  });

  it("renders the logging settings empty states in Chinese", () => {
    renderWithProviders(<LoggingSettingsView />);

    expect(screen.getByText("未配置日志集成")).toBeInTheDocument();
    expect(screen.queryByText("No logging integrations configured")).not.toBeInTheDocument();
    expect(screen.getByText("没有已禁用的回调")).toBeInTheDocument();
    expect(screen.queryByText("No callbacks disabled")).not.toBeInTheDocument();
  });

  it("renders the combined success-and-failure event label in Chinese", () => {
    renderWithProviders(
      <LoggingSettingsView
        loggingConfigs={[{ callback_name: "langfuse", callback_type: "success_and_failure", callback_vars: {} }]}
      />,
    );

    expect(screen.getByText("成功与失败")).toBeInTheDocument();
    expect(screen.queryByText("Success & Failure")).not.toBeInTheDocument();
  });

  it("renders the failure event label in Chinese", () => {
    renderWithProviders(
      <LoggingSettingsView
        loggingConfigs={[{ callback_name: "langfuse", callback_type: "failure", callback_vars: {} }]}
      />,
    );

    expect(screen.getByText("仅失败")).toBeInTheDocument();
    expect(screen.queryByText("Failure Only")).not.toBeInTheDocument();
  });

  it("renders the email event settings in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailEventSettings accessToken="sk-test" />);

    expect(await screen.findByText("邮件通知")).toBeInTheDocument();
    expect(screen.queryByText("Email Notifications")).not.toBeInTheDocument();
    expect(screen.getByText("选择哪些事件应触发邮件通知。")).toBeInTheDocument();
    expect(screen.queryByText("Select which events should trigger email notifications.")).not.toBeInTheDocument();
    expect(screen.getByText("当使用其用户 ID 创建新的 Virtual Key 时，会向该用户发送邮件")).toBeInTheDocument();
    expect(
      screen.queryByText("An email will be sent to the user when a new virtual key is created with their user ID"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("创建新用户时，会向该用户的邮箱地址发送邮件")).toBeInTheDocument();
    expect(screen.getByText("当something happened时接收邮件通知")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置为默认值" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset to Defaults" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(updateEmailEventSettings).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("邮件事件设置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Email event settings updated successfully");

    await user.click(screen.getByRole("button", { name: "重置为默认值" }));
    await waitFor(() => expect(resetEmailEventSettings).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("邮件事件设置已重置为默认值");
    expect(toast.success).not.toHaveBeenCalledWith("Email event settings reset to defaults");
  });

  it("renders the email server settings in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailSettings accessToken="sk-test" premiumUser={false} alerts={EMAIL_ALERTS} />);

    expect(screen.getByText("邮件服务器设置")).toBeInTheDocument();
    expect(screen.queryByText("Email Server Settings")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LiteLLM 文档：邮件告警" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "LiteLLM Docs: email alerts" })).not.toBeInTheDocument();
    expect(screen.getByText("输入 SMTP 主机地址，例如 `smtp.resend.com`")).toBeInTheDocument();
    expect(screen.queryByText("Enter the SMTP host address, e.g. `smtp.resend.com`")).not.toBeInTheDocument();
    expect(screen.getByText("输入 SMTP 端口号，例如 `587`")).toBeInTheDocument();
    expect(screen.queryByText("Enter the SMTP port number, e.g. `587`")).not.toBeInTheDocument();
    expect(screen.getByText("输入 SMTP 用户名，例如 `username`")).toBeInTheDocument();
    expect(screen.queryByText("Enter the SMTP username, e.g. `username`")).not.toBeInTheDocument();
    expect(screen.getByText("输入发件人邮箱地址，例如 `sender@berri.ai`")).toBeInTheDocument();
    expect(screen.getByText("接收 `Test Email Alert` 的邮箱地址。例如：`info@berri.ai`")).toBeInTheDocument();
    expect(screen.getByText("（可选）自定义邮件中显示的 Logo，传入你的 Logo URL")).toBeInTheDocument();
    expect(screen.getByText("（可选）自定义邮件中显示的支持邮箱地址。默认为 support@berri.ai")).toBeInTheDocument();
    expect(screen.queryByText(/Customize the support email address/)).not.toBeInTheDocument();
    expect(screen.getAllByText("必填 *")).toHaveLength(6);
    expect(screen.queryByText("Required *")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "显示凭据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show credential" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "显示凭据" }));
    expect(screen.getByRole("button", { name: "隐藏凭据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide credential" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试邮件告警" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Email Alerts" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "测试邮件告警" }));
    await waitFor(() => expect(serviceHealthCheck).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("邮件测试已触发。请检查已配置的邮箱收件箱/日志。");
    expect(toast.success).not.toHaveBeenCalledWith("Email test triggered. Check your configured email inbox/logs.");
  });

  it("renders the alerting form in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DynamicForm
        alertingSettings={ALERTING_SETTINGS}
        handleInputChange={vi.fn()}
        handleResetField={vi.fn()}
        handleSubmit={vi.fn()}
        premiumUser={false}
      />,
    );

    expect(screen.getByText("在数据库中")).toBeInTheDocument();
    expect(screen.queryByText("In DB")).not.toBeInTheDocument();
    expect(screen.getByText("在配置中")).toBeInTheDocument();
    expect(screen.queryByText("In Config")).not.toBeInTheDocument();
    expect(screen.getAllByText("未设置").length).toBeGreaterThan(0);
    expect(screen.queryByText("Not Set")).not.toBeInTheDocument();
    expect(screen.getByText("✨ 企业版功能")).toBeInTheDocument();
    expect(screen.queryByText("✨ Enterprise Feature")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置 daily_report_frequency" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "更新设置" }));
    expect(user).toBeDefined();
  });

  it("reports the proxy update wait message in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AlertingSettings accessToken="sk-test" premiumUser={false} />);

    await user.click(await screen.findByRole("switch", { name: "slack_alerting" }));
    await user.click(screen.getByRole("button", { name: "更新设置" }));

    await waitFor(() => expect(updateConfigFieldSetting).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("请等待 10 秒以便代理更新。");
    expect(toast.success).not.toHaveBeenCalledWith("Wait 10s for proxy to update.");
  });
});
