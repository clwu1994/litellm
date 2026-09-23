/* eslint-disable testing-library/no-node-access -- the description and help copy interleave plain text with a link and a marker span, so the rendered string is asserted on the paragraph that owns them */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MSTeamsSettings from "./MSTeamsSettings";
import { getCallbacksCall, serviceHealthCheck, setCallbacksCall } from "./networking";

vi.mock("./networking", () => ({
  getCallbacksCall: vi.fn(),
  serviceHealthCheck: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

const alerts = [{ name: "ms_teams", variables: { MS_TEAMS_WEBHOOK_URL: "https://example.com/hook" } }];

const renderSettings = () =>
  renderWithProviders(<MSTeamsSettings accessToken="sk-test" userID="user-1" userRole="Admin" alerts={alerts} />);

const DESCRIPTION_ZH =
  "通过入站 webhook 将 LiteLLM 告警发送到 Microsoft Teams 频道。可从 Microsoft Docs：入站 webhook 创建。";
const DESCRIPTION_EN =
  "Send LiteLLM alerts to a Microsoft Teams channel via an incoming webhook. Create one from Microsoft Docs: incoming webhooks";
const HELP_ZH = "用于 Teams 频道的入站 webhook URL（Workflows 或 incoming webhook connector）";
const HELP_EN = "Incoming webhook URL for your Teams channel (Workflows or incoming webhook connector)";

describe("MSTeamsSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getCallbacksCall).mockResolvedValue({ active_alerting_destinations: [] });
    vi.mocked(setCallbacksCall).mockResolvedValue({});
    vi.mocked(serviceHealthCheck).mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese card title and hides the English original", () => {
    renderSettings();

    expect(screen.getByText("Microsoft Teams 告警设置")).toBeInTheDocument();
    expect(screen.queryByText("Microsoft Teams Alerting Settings")).not.toBeInTheDocument();
  });

  it("renders the Chinese description and link and hides the English originals", () => {
    renderSettings();

    const description = screen.getByRole("link", { name: "Microsoft Docs：入站 webhook" }).closest("p");
    expect(description).not.toBeNull();
    expect(description).toHaveTextContent(DESCRIPTION_ZH);
    expect(description).not.toHaveTextContent(DESCRIPTION_EN);
    expect(screen.queryByRole("link", { name: "Microsoft Docs: incoming webhooks" })).not.toBeInTheDocument();
  });

  it("renders the Chinese webhook help and required marker and hides the English originals", () => {
    renderSettings();

    const help = screen.getByText("必填 *").parentElement as HTMLElement;
    expect(help).toHaveTextContent(HELP_ZH);
    expect(help).not.toHaveTextContent(HELP_EN);
  });

  it("renders the Chinese save action and hides the English original", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese credential visibility labels and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();

    expect(screen.getByRole("button", { name: "显示凭据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show credential" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "显示凭据" }));

    expect(screen.getByRole("button", { name: "隐藏凭据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide credential" })).not.toBeInTheDocument();
  });

  it("renders the Chinese test action and hides the English original", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "测试 MS Teams 告警" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test MS Teams Alerts" })).not.toBeInTheDocument();
  });

  it("reports the Chinese settings-updated toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("MS Teams 设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("MS Teams settings updated successfully");
  });

  it("reports the Chinese test-triggered toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "测试 MS Teams 告警" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("MS Teams 测试告警已触发。请检查你的 Teams 频道。"));
    expect(toast.success).not.toHaveBeenCalledWith("MS Teams test alert triggered. Check your Teams channel.");
  });
});
