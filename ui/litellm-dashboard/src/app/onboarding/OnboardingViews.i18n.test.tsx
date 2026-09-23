import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { OnboardingErrorView } from "./OnboardingErrorView";
import { OnboardingLoadingView } from "./OnboardingLoadingView";

describe("Onboarding views Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese invitation error and hides the English", () => {
    renderWithProviders(<OnboardingErrorView />);

    expect(screen.getByText("加载邀请失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load invitation")).not.toBeInTheDocument();
    expect(screen.getByText("邀请链接可能无效或已过期。")).toBeInTheDocument();
    expect(screen.queryByText("The invitation link may be invalid or expired.")).not.toBeInTheDocument();
    expect(screen.getByText("返回登录")).toBeInTheDocument();
    expect(screen.queryByText("Back to Login")).not.toBeInTheDocument();
  });

  it("renders the Chinese invitation loading label and hides the English", () => {
    renderWithProviders(<OnboardingLoadingView />);

    expect(screen.getByRole("status", { name: "正在加载邀请" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading invitation" })).not.toBeInTheDocument();
  });
});
