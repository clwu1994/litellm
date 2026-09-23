import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { keyCreateCall } from "./networking";
import SCIMConfig from "./SCIM";

vi.mock("./networking", () => ({
  keyCreateCall: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

const ACCESS_TOKEN = "sk-access-token";
const USER_ID = "user-1234";

const renderSCIM = (accessToken: string | null = ACCESS_TOKEN) =>
  renderWithProviders(
    <SCIMConfig
      accessToken={accessToken}
      userID={USER_ID}
      proxySettings={{ PROXY_BASE_URL: "https://proxy.example.com" }}
    />,
  );

const createToken = async (user: ReturnType<typeof userEvent.setup>) => {
  fireEvent.change(screen.getByLabelText("Token 名称"), { target: { value: "My SCIM Token" } });
  await user.click(screen.getByRole("button", { name: "创建 SCIM Token" }));
};

describe("SCIM Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese card title and description and hides the English originals", () => {
    renderSCIM();

    expect(screen.getByText("SCIM 配置")).toBeInTheDocument();
    expect(screen.queryByText("SCIM Configuration")).not.toBeInTheDocument();
    expect(
      screen.getByText("跨域身份管理系统（SCIM）可让你在 LiteLLM 中自动配置和管理用户与群组。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "System for Cross-domain Identity Management (SCIM) allows you to automatically provision and manage users and groups in LiteLLM.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese tenant URL step and hides the English originals", () => {
    renderSCIM();

    expect(screen.getByText("SCIM 租户 URL")).toBeInTheDocument();
    expect(screen.queryByText("SCIM Tenant URL")).not.toBeInTheDocument();
    expect(screen.getByText("在你的身份提供商 SCIM 集成设置中使用此 URL。")).toBeInTheDocument();
    expect(
      screen.queryByText("Use this URL in your identity provider SCIM integration settings."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese copy action and hides the English original", () => {
    renderSCIM();

    expect(screen.getByRole("button", { name: "复制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
  });

  it("reports the Chinese URL-copied toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderSCIM();

    await user.click(screen.getByRole("button", { name: "复制" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("URL 已复制到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("URL copied to clipboard");
  });

  it("renders the Chinese token step, notice and form and hides the English originals", () => {
    renderSCIM();

    expect(screen.getByText("认证 Token")).toBeInTheDocument();
    expect(screen.queryByText("Authentication Token")).not.toBeInTheDocument();
    expect(screen.getByText("使用 SCIM")).toBeInTheDocument();
    expect(screen.queryByText("Using SCIM")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "你需要一个 SCIM Token 才能通过 SCIM API 进行认证。请在下方创建一个，并在你的 SCIM 提供商配置中使用它。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "You need a SCIM token to authenticate with the SCIM API. Create one below and use it in your SCIM provider configuration.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("Token 名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Token Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("SCIM 访问 Token")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("SCIM Access Token")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建 SCIM Token" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create SCIM Token" })).not.toBeInTheDocument();
  });

  it("renders the Chinese token-name-required message and hides the English original", async () => {
    const user = userEvent.setup();
    renderSCIM();

    await user.click(screen.getByRole("button", { name: "创建 SCIM Token" }));

    expect(await screen.findByText("请输入 Token 名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a name for your token")).not.toBeInTheDocument();
  });

  it("reports the Chinese login-required toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderSCIM(null);

    await createToken(user);

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("你需要登录后才能创建 SCIM Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("You need to be logged in to create a SCIM token");
  });

  it("reports the Chinese creation failure with the server detail and hides the English original", async () => {
    vi.mocked(keyCreateCall).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderSCIM();

    await createToken(user);

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建 SCIM Token 失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create SCIM token: boom");
  });

  it("renders the Chinese created-token panel and reports the Chinese success toast", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    await createToken(user);

    expect(await screen.findByText("你的 SCIM Token")).toBeInTheDocument();
    expect(screen.queryByText("Your SCIM Token")).not.toBeInTheDocument();
    expect(screen.getByText("请务必现在复制此 Token。之后你将无法再次查看它。")).toBeInTheDocument();
    expect(
      screen.queryByText("Make sure to copy this token now. You will not be able to see it again."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再创建一个 Token" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Another Token" })).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("SCIM Token 创建成功");
    expect(toast.success).not.toHaveBeenCalledWith("SCIM token created successfully");
  });

  it("reports the Chinese token-copied toast and hides the English original", async () => {
    vi.mocked(keyCreateCall).mockResolvedValue({ key: "sk-scim-generated" });
    const user = userEvent.setup();
    renderSCIM();

    await createToken(user);
    await screen.findByText("你的 SCIM Token");

    const copyButtons = screen.getAllByRole("button", { name: "复制" });
    await user.click(copyButtons[copyButtons.length - 1]);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Token 已复制到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Token copied to clipboard");
  });
});
