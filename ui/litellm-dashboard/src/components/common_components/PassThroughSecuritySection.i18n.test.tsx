import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import PassThroughSecuritySection from "./PassThroughSecuritySection";

const renderSection = (premiumUser: boolean) =>
  render(<PassThroughSecuritySection premiumUser={premiumUser} authEnabled={false} onAuthChange={vi.fn()} />);

describe("PassThroughSecuritySection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese security title and description", () => {
    renderSection(true);

    expect(screen.getByText("安全")).toBeInTheDocument();
    expect(screen.queryByText("Security")).not.toBeInTheDocument();
    expect(screen.getByText("启用后，发往此 Endpoint 的请求需要有效的 LiteLLM Virtual Key")).toBeInTheDocument();
    expect(
      screen.queryByText("When enabled, requests to this endpoint will require a valid LiteLLM Virtual Key"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese premium label and enterprise notice", () => {
    renderSection(false);

    expect(screen.getByText("认证（高级版）")).toBeInTheDocument();
    expect(screen.queryByText("Authentication (Premium)")).not.toBeInTheDocument();
    expect(screen.getByText(/为透传 Endpoint 设置认证是 LiteLLM 企业版功能/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Setting authentication for pass-through endpoints is a LiteLLM Enterprise feature/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "此处" })).toBeInTheDocument();
  });
});
