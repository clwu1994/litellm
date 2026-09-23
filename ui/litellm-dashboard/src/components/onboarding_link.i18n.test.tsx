import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import OnboardingModal from "./onboarding_link";

vi.mock("react-copy-to-clipboard", () => ({
  CopyToClipboard: ({ children, onCopy }: { children: React.ReactNode; onCopy: () => void }) => (
    <span onClick={onCopy}>{children}</span>
  ),
}));

const invitationLinkData = {
  id: "inv-1",
  user_id: "user-1",
  is_accepted: false,
  accepted_at: null,
  expires_at: new Date("2030-01-01"),
  created_at: new Date("2029-01-01"),
  created_by: "admin",
  updated_at: new Date("2029-01-01"),
  updated_by: "admin",
  has_user_setup_sso: false,
};

const renderModal = (modalType: "invitation" | "resetPassword" = "invitation") =>
  renderWithProviders(
    <OnboardingModal
      isInvitationLinkModalVisible
      setIsInvitationLinkModalVisible={vi.fn()}
      baseUrl="http://localhost:4000"
      invitationLinkData={invitationLinkData}
      modalType={modalType}
    />,
  );

describe("OnboardingModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese invitation chrome and hides the English originals", () => {
    renderModal();

    expect(screen.getAllByText("邀请链接").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Invitation Link")).toHaveLength(0);
    expect(screen.getByText("复制生成的链接并发送给此用户，以将其加入 Proxy。")).toBeInTheDocument();
    expect(
      screen.queryByText("Copy and send the generated link to onboard this user to the proxy."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制邀请链接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy invitation link" })).not.toBeInTheDocument();
  });

  it("renders the Chinese reset-password chrome and hides the English originals", () => {
    renderModal("resetPassword");

    expect(screen.getAllByText("重置密码链接").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Reset Password Link")).toHaveLength(0);
    expect(screen.getByText("复制生成的链接并发送给用户以重置其密码。")).toBeInTheDocument();
    expect(
      screen.queryByText("Copy and send the generated link to the user to reset their password."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制重置密码链接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy password reset link" })).not.toBeInTheDocument();
  });

  it("reports the Chinese copied toast and not the English original", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "复制邀请链接" }));

    expect(toast.success).toHaveBeenCalledWith("已复制！");
    expect(toast.success).not.toHaveBeenCalledWith("Copied!");
  });
});
