import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import Settings from "./settings";

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

import { getCallbackConfigsCall, getCallbacksCall } from "./networking";

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
  });
});
