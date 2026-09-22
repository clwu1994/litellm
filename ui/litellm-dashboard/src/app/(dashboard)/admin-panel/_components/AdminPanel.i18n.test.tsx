/* eslint-disable testing-library/no-node-access -- The shared dialog renders an untranslated sr-only Close button and the login alert wraps its copy in a link, so the route-owned footer and description are reached by data-slot to keep the absence assertions on the element under test */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AdminPanel from "./AdminPanel";

const mocks = vi.hoisted(() => ({
  getSSOSettings: vi.fn(),
  getAllowedIPs: vi.fn(),
  addAllowedIP: vi.fn(),
  deleteAllowedIP: vi.fn(),
  useAuthorized: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "http://localhost:4000",
  getGlobalLitellmHeaderName: () => "Authorization",
  getSSOSettings: mocks.getSSOSettings,
  getAllowedIPs: mocks.getAllowedIPs,
  addAllowedIP: mocks.addAllowedIP,
  deleteAllowedIP: mocks.deleteAllowedIP,
}));

vi.mock("@/components/constants", () => ({
  useBaseUrl: () => "http://localhost:4000",
}));

vi.mock("@/components/Settings/AdminSettings/SSOSettings/SSOSettings", () => ({
  default: () => <div data-testid="sso-settings-panel" />,
}));

vi.mock("@/components/Settings/AdminSettings/UISettings/UISettings", () => ({
  default: () => <div data-testid="ui-settings-panel" />,
}));

vi.mock("@/components/SCIM", () => ({
  default: () => <div data-testid="scim-panel" />,
}));

vi.mock("@/components/SSOModals", () => ({
  default: () => null,
}));

vi.mock("@/components/UIAccessControlForm", () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <button type="button" onClick={onSuccess}>
      ui-access-control-success
    </button>
  ),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: mocks.useAuthorized,
}));

const authorizedAs = (premiumUser: boolean) =>
  mocks.useAuthorized.mockReturnValue({ premiumUser, accessToken: "test-token", userId: "user-1" });

const dialogFooter = (dialog: HTMLElement): HTMLElement => {
  const footer = dialog.querySelector('[data-slot="dialog-footer"]');
  if (footer === null) throw new Error("dialog footer not found");
  return footer as HTMLElement;
};

const loginAlertDescription = (): HTMLElement => {
  const link = screen.getByRole("link", { name: "http://localhost:4000/fallback/login" });
  const description = link.closest('[data-slot="alert-description"]');
  if (description === null) throw new Error("login alert description not found");
  return description as HTMLElement;
};

const openSecurityTab = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole("tab", { name: label }));
};

const openAllowedIpsDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await openSecurityTab(user, "安全设置");
  await user.click(screen.getByRole("button", { name: "允许的 IP" }));
  return screen.findByRole("dialog", { name: "管理允许的 IP 地址" });
};

const openAddIpDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  const manageDialog = await openAllowedIpsDialog(user);
  await user.click(within(manageDialog).getByRole("button", { name: "添加 IP 地址" }));
  return screen.findByRole("dialog", { name: "添加允许的 IP 地址" });
};

describe("AdminPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    authorizedAs(false);
    mocks.getSSOSettings.mockResolvedValue({ values: {} });
    mocks.getAllowedIPs.mockResolvedValue([]);
    mocks.addAllowedIP.mockResolvedValue({});
    mocks.deleteAllowedIP.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page heading, description and tab labels and hides the English originals", () => {
    renderWithProviders(<AdminPanel />);

    expect(screen.getByRole("heading", { name: "管理员访问" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin Access" })).not.toBeInTheDocument();

    expect(screen.getByText("前往“内部用户”页面添加其他管理员。")).toBeInTheDocument();
    expect(screen.queryByText("Go to 'Internal Users' page to add other admins.")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "SSO 设置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "安全设置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "SCIM" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "UI 设置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "日志设置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Hashicorp Vault" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "CyberArk Conjur" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "插件" })).toBeInTheDocument();

    expect(screen.queryByRole("tab", { name: "SSO Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Security Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "UI Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Logging Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Plugins" })).not.toBeInTheDocument();
  });

  it("renders the Chinese security settings heading, deprecation warning, actions and login hint", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    expect(screen.getByRole("heading", { name: "✨ 安全设置" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "✨ Security Settings" })).not.toBeInTheDocument();

    expect(screen.getByText("SSO 配置已弃用")).toBeInTheDocument();
    expect(screen.queryByText("SSO Configuration Deprecated")).not.toBeInTheDocument();
    expect(
      screen.getByText("在此页面上编辑 SSO 设置已弃用，并将在未来版本中移除。请使用 SSO 设置标签页配置 SSO。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Editing SSO Settings on this page is deprecated and will be removed in a future version. Please use the SSO Settings tab for SSO configuration.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "添加 SSO" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add SSO" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "允许的 IP" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Allowed IPs" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "UI 访问控制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "UI Access Control" })).not.toBeInTheDocument();

    expect(screen.getByText("不使用 SSO 登录")).toBeInTheDocument();
    expect(screen.queryByText("Login without SSO")).not.toBeInTheDocument();

    const description = loginAlertDescription();
    expect(description).toHaveTextContent(
      "如果你需要在没有 SSO 的情况下登录，可以访问 http://localhost:4000/fallback/login",
    );
    expect(description).not.toHaveTextContent(
      "If you need to login without sso, you can access http://localhost:4000/fallback/login",
    );
  });

  it("renders the Chinese edit SSO action when SSO is configured and hides the English original", async () => {
    const user = userEvent.setup();
    mocks.getSSOSettings.mockResolvedValue({
      values: { google_client_id: "test-id", google_client_secret: "test-secret" },
    });
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    expect(await screen.findByRole("button", { name: "编辑 SSO 设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit SSO Settings" })).not.toBeInTheDocument();
  });

  it("renders the Chinese allowed IP table, sentinel row and delete action in the open dialog", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1", "All IP Addresses Allowed"]);
    renderWithProviders(<AdminPanel />);
    const manageDialog = await openAllowedIpsDialog(user);

    expect(screen.queryByRole("dialog", { name: "Manage Allowed IP Addresses" })).not.toBeInTheDocument();

    const table = within(manageDialog).getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "IP 地址" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "IP Address" })).not.toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Action" })).not.toBeInTheDocument();

    expect(within(manageDialog).getByText("允许所有 IP 地址")).toBeInTheDocument();
    expect(within(manageDialog).queryByText("All IP Addresses Allowed")).not.toBeInTheDocument();

    expect(within(manageDialog).getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(within(manageDialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    const footer = dialogFooter(manageDialog);
    expect(within(footer).getByRole("button", { name: "添加 IP 地址" })).toBeInTheDocument();
    expect(within(footer).queryByRole("button", { name: "Add IP Address" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(within(footer).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the Chinese add IP dialog, placeholder, submit action and validation message", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    renderWithProviders(<AdminPanel />);
    await openAddIpDialog(user);

    expect(screen.queryByRole("dialog", { name: "Add Allowed IP Address" })).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("输入 IP 地址")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter IP address")).not.toBeInTheDocument();

    const addForm = screen.getByPlaceholderText("输入 IP 地址").form as HTMLFormElement;
    expect(within(addForm).getByRole("button", { name: "添加 IP 地址" })).toBeInTheDocument();
    expect(within(addForm).queryByRole("button", { name: "Add IP Address" })).not.toBeInTheDocument();

    await user.click(within(addForm).getByRole("button", { name: "添加 IP 地址" }));

    expect(await screen.findByText("请输入 IP 地址")).toBeInTheDocument();
    expect(screen.queryByText("Please enter an IP address")).not.toBeInTheDocument();
    expect(mocks.addAllowedIP).not.toHaveBeenCalled();
  });

  it("renders the Chinese delete confirmation in its open dialog and hides the English originals", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1"]);
    renderWithProviders(<AdminPanel />);
    const manageDialog = await openAllowedIpsDialog(user);

    await user.click(within(manageDialog).getByRole("button", { name: "删除" }));
    const confirmDialog = await screen.findByRole("dialog", { name: "确认删除" });

    expect(screen.queryByRole("dialog", { name: "Confirm Delete" })).not.toBeInTheDocument();
    expect(within(confirmDialog).getByText("确定要删除 IP 地址：192.168.1.1 吗？")).toBeInTheDocument();
    expect(
      within(confirmDialog).queryByText("Are you sure you want to delete the IP address: 192.168.1.1?"),
    ).not.toBeInTheDocument();

    const footer = dialogFooter(confirmDialog);
    expect(within(footer).getByRole("button", { name: "是" })).toBeInTheDocument();
    expect(within(footer).queryByRole("button", { name: "Yes" })).not.toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(within(footer).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the Chinese UI access control dialog title and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    await user.click(screen.getByRole("button", { name: "UI 访问控制" }));

    expect(await screen.findByRole("dialog", { name: "UI 访问控制设置" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "UI Access Control Settings" })).not.toBeInTheDocument();
  });

  it("reports the premium-only allowed IP message in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    await user.click(screen.getByRole("button", { name: "允许的 IP" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("此功能仅对高级用户可用。请升级你的账户。"));
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "This feature is only available for premium users. Please upgrade your account.",
    );
  });

  it("reports the premium-only UI access control message in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    await user.click(screen.getByRole("button", { name: "UI 访问控制" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("只有高级用户可以配置 UI 访问控制"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Only premium users can configure UI access control");
  });

  it("reports a failed allowed IP fetch in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<AdminPanel />);

    await openAllowedIpsDialog(user);

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取允许的 IP 失败 Error: Network error"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to fetch allowed IPs Error: Network error");
  });

  it("reports a successful IP add in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    renderWithProviders(<AdminPanel />);
    const addDialog = await openAddIpDialog(user);

    const input = within(addDialog).getByPlaceholderText("输入 IP 地址");
    fireEvent.change(input, { target: { value: "192.168.1.50" } });
    await user.click(within(input.form as HTMLFormElement).getByRole("button", { name: "添加 IP 地址" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("IP 地址添加成功"));
    expect(toast.success).not.toHaveBeenCalledWith("IP address added successfully");
  });

  it("reports a failed IP add in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    mocks.addAllowedIP.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<AdminPanel />);
    const addDialog = await openAddIpDialog(user);

    const input = within(addDialog).getByPlaceholderText("输入 IP 地址");
    fireEvent.change(input, { target: { value: "192.168.1.50" } });
    await user.click(within(input.form as HTMLFormElement).getByRole("button", { name: "添加 IP 地址" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("添加 IP 地址失败 Error: Network error"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to add IP address Error: Network error");
  });

  it("reports a successful IP delete in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1"]);
    renderWithProviders(<AdminPanel />);
    const manageDialog = await openAllowedIpsDialog(user);

    await user.click(within(manageDialog).getByRole("button", { name: "删除" }));
    const confirmDialog = await screen.findByRole("dialog", { name: "确认删除" });
    await user.click(within(dialogFooter(confirmDialog)).getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("IP 地址删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("IP address deleted successfully");
  });

  it("reports a failed IP delete in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1"]);
    mocks.deleteAllowedIP.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<AdminPanel />);
    const manageDialog = await openAllowedIpsDialog(user);

    await user.click(within(manageDialog).getByRole("button", { name: "删除" }));
    const confirmDialog = await screen.findByRole("dialog", { name: "确认删除" });
    await user.click(within(dialogFooter(confirmDialog)).getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除 IP 地址失败 Error: Network error"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete IP address Error: Network error");
  });

  it("reports a successful UI access control update in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "安全设置");

    await user.click(screen.getByRole("button", { name: "UI 访问控制" }));
    await screen.findByRole("dialog", { name: "UI 访问控制设置" });
    await user.click(screen.getByRole("button", { name: "ui-access-control-success" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("UI 访问控制设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("UI Access Control settings updated successfully");
  });
});

describe("AdminPanel English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    authorizedAs(false);
    mocks.getSSOSettings.mockResolvedValue({ values: {} });
    mocks.getAllowedIPs.mockResolvedValue([]);
    mocks.addAllowedIP.mockResolvedValue({});
    mocks.deleteAllowedIP.mockResolvedValue({});
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English heading, description and tab labels byte-identical", () => {
    renderWithProviders(<AdminPanel />);

    expect(screen.getByRole("heading", { name: "Admin Access" })).toBeInTheDocument();
    expect(screen.getByText("Go to 'Internal Users' page to add other admins.")).toBeInTheDocument();

    for (const label of [
      "SSO Settings",
      "Security Settings",
      "SCIM",
      "UI Settings",
      "Logging Settings",
      "Hashicorp Vault",
      "CyberArk Conjur",
      "Plugins",
    ]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
  });

  it("keeps the original English security settings copy byte-identical", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    expect(screen.getByRole("heading", { name: "✨ Security Settings" })).toBeInTheDocument();
    expect(screen.getByText("SSO Configuration Deprecated")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Editing SSO Settings on this page is deprecated and will be removed in a future version. Please use the SSO Settings tab for SSO configuration.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add SSO" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Allowed IPs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "UI Access Control" })).toBeInTheDocument();
    expect(screen.getByText("Login without SSO")).toBeInTheDocument();

    const description = loginAlertDescription();
    expect(description).toHaveTextContent(
      "If you need to login without sso, you can access http://localhost:4000/fallback/login",
    );
  });

  it("keeps the original English edit SSO action byte-identical", async () => {
    const user = userEvent.setup();
    mocks.getSSOSettings.mockResolvedValue({
      values: { google_client_id: "test-id", google_client_secret: "test-secret" },
    });
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    expect(await screen.findByRole("button", { name: "Edit SSO Settings" })).toBeInTheDocument();
  });

  it("keeps the original English allowed IP dialog copy byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1", "All IP Addresses Allowed"]);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });

    const table = within(manageDialog).getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "IP Address" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Action" })).toBeInTheDocument();
    expect(within(manageDialog).getByText("All IP Addresses Allowed")).toBeInTheDocument();
    expect(within(manageDialog).getByRole("button", { name: "Delete" })).toBeInTheDocument();

    const footer = dialogFooter(manageDialog);
    expect(within(footer).getByRole("button", { name: "Add IP Address" })).toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("keeps the original English add IP dialog and validation copy byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });
    await user.click(within(manageDialog).getByRole("button", { name: "Add IP Address" }));

    const addDialog = await screen.findByRole("dialog", { name: "Add Allowed IP Address" });
    const input = within(addDialog).getByPlaceholderText("Enter IP address");
    expect(within(input.form as HTMLFormElement).getByRole("button", { name: "Add IP Address" })).toBeInTheDocument();

    await user.click(within(input.form as HTMLFormElement).getByRole("button", { name: "Add IP Address" }));
    expect(await screen.findByText("Please enter an IP address")).toBeInTheDocument();
  });

  it("keeps the original English delete confirmation copy byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1"]);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });
    await user.click(within(manageDialog).getByRole("button", { name: "Delete" }));

    const confirmDialog = await screen.findByRole("dialog", { name: "Confirm Delete" });
    expect(
      within(confirmDialog).getByText("Are you sure you want to delete the IP address: 192.168.1.1?"),
    ).toBeInTheDocument();
    const footer = dialogFooter(confirmDialog);
    expect(within(footer).getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(within(footer).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("keeps the original English UI access control dialog title byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    await user.click(screen.getByRole("button", { name: "UI Access Control" }));

    expect(await screen.findByRole("dialog", { name: "UI Access Control Settings" })).toBeInTheDocument();
  });

  it("keeps the original English add success toast byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });
    await user.click(within(manageDialog).getByRole("button", { name: "Add IP Address" }));
    const addDialog = await screen.findByRole("dialog", { name: "Add Allowed IP Address" });

    const input = within(addDialog).getByPlaceholderText("Enter IP address");
    fireEvent.change(input, { target: { value: "192.168.1.50" } });
    await user.click(within(input.form as HTMLFormElement).getByRole("button", { name: "Add IP Address" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("IP address added successfully"));
  });

  it("keeps the original English add failure toast byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["10.0.0.1"]);
    mocks.addAllowedIP.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });
    await user.click(within(manageDialog).getByRole("button", { name: "Add IP Address" }));
    const addDialog = await screen.findByRole("dialog", { name: "Add Allowed IP Address" });

    const input = within(addDialog).getByPlaceholderText("Enter IP address");
    fireEvent.change(input, { target: { value: "192.168.1.50" } });
    await user.click(within(input.form as HTMLFormElement).getByRole("button", { name: "Add IP Address" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("Failed to add IP address Error: Network error"));
  });

  it("keeps the original English allowed IP fetch failure toast byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));

    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith("Failed to fetch allowed IPs Error: Network error"),
    );
  });

  it("keeps the original English delete toasts byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    mocks.getAllowedIPs.mockResolvedValue(["192.168.1.1"]);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");
    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Manage Allowed IP Addresses" });

    await user.click(within(manageDialog).getByRole("button", { name: "Delete" }));
    const confirmDialog = await screen.findByRole("dialog", { name: "Confirm Delete" });
    await user.click(within(dialogFooter(confirmDialog)).getByRole("button", { name: "Yes" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("IP address deleted successfully"));

    mocks.deleteAllowedIP.mockRejectedValue(new Error("Network error"));
    await user.click(within(manageDialog).getByRole("button", { name: "Delete" }));
    const retryDialog = await screen.findByRole("dialog", { name: "Confirm Delete" });
    await user.click(within(dialogFooter(retryDialog)).getByRole("button", { name: "Yes" }));
    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith("Failed to delete IP address Error: Network error"),
    );
  });

  it("keeps the original English premium-only messages byte-identical", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    await user.click(screen.getByRole("button", { name: "Allowed IPs" }));
    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith(
        "This feature is only available for premium users. Please upgrade your account.",
      ),
    );

    await user.click(screen.getByRole("button", { name: "UI Access Control" }));
    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith("Only premium users can configure UI access control"),
    );
  });

  it("keeps the original English UI access control success toast byte-identical", async () => {
    const user = userEvent.setup();
    authorizedAs(true);
    renderWithProviders(<AdminPanel />);
    await openSecurityTab(user, "Security Settings");

    await user.click(screen.getByRole("button", { name: "UI Access Control" }));
    await screen.findByRole("dialog", { name: "UI Access Control Settings" });
    await user.click(screen.getByRole("button", { name: "ui-access-control-success" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("UI Access Control settings updated successfully"));
  });
});
