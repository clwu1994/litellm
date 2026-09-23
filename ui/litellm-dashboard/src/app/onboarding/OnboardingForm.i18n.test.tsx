import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { OnboardingForm } from "./OnboardingForm";

const { credentialsMock, claimMock } = vi.hoisted(() => ({
  credentialsMock: vi.fn(),
  claimMock: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/onboarding/useOnboarding", () => ({
  useOnboardingCredentials: (...args: unknown[]) => credentialsMock(...args),
  useClaimOnboardingToken: (...args: unknown[]) => claimMock(...args),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: () => ({ user_email: "user@example.com", user_id: "user-1", key: "sk-token" }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("invitation_id=inv-1"),
}));

describe("OnboardingForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    credentialsMock.mockReturnValue({ data: { token: "jwt" }, isLoading: false, isError: false });
    claimMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese session-start failure and hides the English", async () => {
    const mutate = vi.fn((_payload: unknown, options: { onSuccess: (data: { token?: string }) => void }) => {
      options.onSuccess({});
    });
    claimMock.mockReturnValue({ mutate, isPending: false });
    const user = userEvent.setup();
    renderWithProviders(<OnboardingForm variant="signup" />);

    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret" } });
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("启动会话失败，请重试。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to start session. Please try again.")).not.toBeInTheDocument();
  });

  it("renders the Chinese submit failure and hides the English", async () => {
    const mutate = vi.fn((_payload: unknown, options: { onError: (error: Error) => void }) => {
      options.onError(new Error(""));
    });
    claimMock.mockReturnValue({ mutate, isPending: false });
    const user = userEvent.setup();
    renderWithProviders(<OnboardingForm variant="signup" />);

    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret" } });
    await user.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("提交失败，请重试。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to submit. Please try again.")).not.toBeInTheDocument();
  });
});
