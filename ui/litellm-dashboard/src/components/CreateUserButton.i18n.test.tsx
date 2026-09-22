import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { cleanup } from "@/../tests/test-utils";
import { CreateUserButton } from "./CreateUserButton";
import { invitationCreateCall, userCreateCall } from "./networking";
import { toast } from "@/lib/toast";

const proxyUiSettings = vi.hoisted(() => ({
  PROXY_BASE_URL: null,
  PROXY_LOGOUT_URL: null,
  DEFAULT_TEAM_DISABLED: false,
  SSO_ENABLED: false,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: ReactElement }) => <span data-testid="tooltip-trigger">{render}</span>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("./networking", () => ({
  userCreateCall: vi.fn(),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  invitationCreateCall: vi.fn(),
  organizationMemberAddCall: vi.fn(),
  getProxyUISettings: vi.fn().mockResolvedValue(proxyUiSettings),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost"),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const defaultProps = {
  userID: "123",
  accessToken: "token",
  possibleUIRoles: null as Record<string, Record<string, string>> | null,
};

describe("CreateUserButton Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the embedded form labels and actions in Chinese and hides the English originals", () => {
    renderWithProviders(<CreateUserButton {...defaultProps} isEmbedded />);

    expect(screen.getByText("邮件邀请")).toBeInTheDocument();
    expect(screen.queryByText("Email invitations")).not.toBeInTheDocument();
    expect(screen.getByText("了解如何设置邮件通知")).toBeInTheDocument();
    expect(screen.queryByText("Learn how to set up email notifications")).not.toBeInTheDocument();
    expect(screen.getByText(/只有在配置了邮件集成/)).toBeInTheDocument();
    expect(screen.queryByText(/New users receive an email invite/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("用户邮箱")).toBeInTheDocument();
    expect(screen.queryByLabelText("User Email")).not.toBeInTheDocument();
    expect(screen.getByLabelText("用户角色")).toBeInTheDocument();
    expect(screen.queryByLabelText("User Role")).not.toBeInTheDocument();
    expect(screen.getByLabelText("团队")).toBeInTheDocument();
    expect(screen.queryByLabelText("Team")).not.toBeInTheDocument();
    expect(screen.getByText("如果选择，用户将以 'user' 角色添加到该团队。")).toBeInTheDocument();
    expect(screen.queryByText("If selected, user will be added as a 'user' role to the team.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("元数据")).toBeInTheDocument();
    expect(screen.queryByLabelText("Metadata")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("以 JSON 输入元数据")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter metadata as JSON")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "发送邀请邮件" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Send invitation email" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建用户" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create User" })).not.toBeInTheDocument();
  });

  it("renders the standalone invite dialog in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateUserButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ 邀请用户" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "+ Invite User" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ 邀请用户" }));

    expect(await screen.findByText("创建一个可以拥有密钥的用户")).toBeInTheDocument();
    expect(screen.queryByText("Create a User who can own keys")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/全局 Proxy 角色/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Global Proxy Role")).not.toBeInTheDocument();
    expect(screen.getByLabelText("组织")).toBeInTheDocument();
    expect(screen.queryByLabelText("Organization")).not.toBeInTheDocument();
    expect(screen.getByText("用户将被添加到所选组织。")).toBeInTheDocument();
    expect(screen.queryByText("The user will be added to the selected organization(s).")).not.toBeInTheDocument();
    expect(screen.getByText("个人密钥创建")).toBeInTheDocument();
    expect(screen.queryByText("Personal Key Creation")).not.toBeInTheDocument();

    await user.click(screen.getByText("个人密钥创建"));

    expect(await screen.findByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "邀请用户" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite User" })).not.toBeInTheDocument();
  });

  it("renders the global proxy role hint tooltip in Chinese in the open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateUserButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ 邀请用户" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "+ 邀请用户" }));

    expect(screen.getAllByTestId("tooltip-trigger").length).toBeGreaterThan(0);
    expect(screen.getByText("此角色独立于任何团队/组织特定角色。请在设置中配置团队/组织管理员")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "This role is independent of any team/org specific roles. Configure Team / Organization Admins in the Settings",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the personal-key models hint in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateUserButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ 邀请用户" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "+ 邀请用户" }));
    await user.click(await screen.findByText("个人密钥创建"));

    expect(screen.getAllByText("用户在团队范围之外可以访问的模型。").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Models user has access to, outside of team scope.")).toHaveLength(0);
  });

  it("renders the generic create-user failure in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(userCreateCall).mockRejectedValue({});
    renderWithProviders(<CreateUserButton {...defaultProps} isEmbedded />);

    await user.type(screen.getByLabelText("用户邮箱"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "创建用户" }));

    await waitFor(() => {
      expect(vi.mocked(toast.fromError)).toHaveBeenCalledWith("创建用户时出错");
    });
    expect(vi.mocked(toast.fromError)).not.toHaveBeenCalledWith("Error creating the user");
  });

  it("renders the API-user-created toast in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(userCreateCall).mockResolvedValue({ data: { user_id: "u1" } });
    vi.mocked(invitationCreateCall).mockResolvedValue({ id: "inv-1" });
    renderWithProviders(<CreateUserButton {...defaultProps} isEmbedded />);

    await user.type(screen.getByLabelText("用户邮箱"), "new@example.com");
    await user.click(screen.getByRole("button", { name: "创建用户" }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("API 用户已创建");
    });
    expect(vi.mocked(toast.success)).not.toHaveBeenCalledWith("API user Created");
  });
});
