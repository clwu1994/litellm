import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { OnboardingFormBody } from "./OnboardingFormBody";

const renderBody = (variant: "signup" | "reset_password", isPending = false) =>
  renderWithProviders(
    <OnboardingFormBody
      variant={variant}
      userEmail="user@example.com"
      isPending={isPending}
      claimError={null}
      onSubmit={vi.fn()}
    />,
  );

describe("OnboardingFormBody Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the signup copy in Chinese and hides the English", () => {
    renderBody("signup");

    expect(screen.getAllByText("注册").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
    expect(screen.getByText("认领你的用户账号以登录 Admin UI。")).toBeInTheDocument();
    expect(screen.queryByText("Claim your user account to login to Admin UI.")).not.toBeInTheDocument();
    expect(screen.getByText("SSO")).toBeInTheDocument();
    expect(screen.getByText("SSO 属于企业版功能。")).toBeInTheDocument();
    expect(screen.queryByText("SSO is under the Enterprise Tier.")).not.toBeInTheDocument();
    expect(screen.getByText("获取免费试用")).toBeInTheDocument();
    expect(screen.queryByText("Get Free Trial")).not.toBeInTheDocument();
    expect(screen.getByLabelText("邮箱地址")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(screen.getByText("为你的账号创建密码")).toBeInTheDocument();
    expect(screen.queryByText("Create a password for your account")).not.toBeInTheDocument();
  });

  it("renders the reset-password copy in Chinese and hides the English", () => {
    renderBody("reset_password");

    expect(screen.getAllByText("重置密码").length).toBeGreaterThan(0);
    expect(screen.queryByText("Reset Password")).not.toBeInTheDocument();
    expect(screen.getByText("重置密码以访问 Admin UI。")).toBeInTheDocument();
    expect(screen.queryByText("Reset your password to access Admin UI.")).not.toBeInTheDocument();
    expect(screen.getByText("输入你的新密码")).toBeInTheDocument();
    expect(screen.queryByText("Enter your new password")).not.toBeInTheDocument();
    expect(screen.queryByText("SSO 属于企业版功能。")).not.toBeInTheDocument();
  });

  it("renders the Chinese validation message and the pending spinner label", async () => {
    const user = userEvent.setup();
    renderBody("signup");

    await user.click(screen.getByRole("button", { name: "注册" }));
    expect(await screen.findByText("注册需要密码")).toBeInTheDocument();
    expect(screen.queryByText("password required to sign up")).not.toBeInTheDocument();
  });

  it("labels the pending spinner in Chinese and hides the English", () => {
    renderBody("signup", true);

    expect(screen.getByRole("img", { name: "加载中" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "loading" })).not.toBeInTheDocument();
  });
});
