import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";
import i18n from "@/i18n/bootstrapI18n";

import { type ReactElement, type ReactNode } from "react";

import { KeyResponse } from "../key_team_helpers/key_list";
import { RegenerateKeyModal } from "./RegenerateKeyModal";

const mockRegenerateKeyCall = vi.fn();
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: ReactElement }) => <span data-testid="tooltip-trigger">{render}</span>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("../networking", () => ({
  regenerateKeyCall: (...args: unknown[]) => mockRegenerateKeyCall(...args),
}));

const makeToken = (overrides: Partial<KeyResponse> = {}): KeyResponse =>
  ({
    token: "token-hash-123",
    token_id: "token-id-123",
    key_name: "sk-test-key",
    key_alias: "my-test-key",
    max_budget: 100,
    tpm_limit: 5000,
    rpm_limit: 500,
    duration: "30d",
    expires: "2026-12-31T00:00:00Z",
    ...overrides,
  }) as KeyResponse;

const renderModal = (overrides: Partial<React.ComponentProps<typeof RegenerateKeyModal>> = {}) =>
  renderWithProviders(
    <RegenerateKeyModal selectedToken={makeToken()} visible onClose={vi.fn()} onKeyUpdate={vi.fn()} {...overrides} />,
  );

describe("RegenerateKeyModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the form title, labels and placeholders in Chinese and hides the English originals", () => {
    renderModal();

    expect(screen.getByText("重新生成 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByText("Regenerate Virtual Key")).not.toBeInTheDocument();
    expect(screen.getByLabelText("密钥别名")).toBeInTheDocument();
    expect(screen.queryByLabelText("Key Alias")).not.toBeInTheDocument();
    expect(screen.getByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("TPM 上限")).toBeInTheDocument();
    expect(screen.queryByLabelText("TPM Limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("RPM 上限")).toBeInTheDocument();
    expect(screen.queryByLabelText("RPM Limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("密钥过期")).toBeInTheDocument();
    expect(screen.queryByLabelText("Expire Key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 30s、30h、30d")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 30s, 30h, 30d")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新生成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Regenerate" })).not.toBeInTheDocument();
  });

  it("renders the current expiry and grace period in Chinese and hides the English originals", () => {
    renderModal();

    expect(screen.getByText(/当前过期时间：/)).toBeInTheDocument();
    expect(screen.queryByText(/Current expiry:/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/宽限期/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Grace Period/)).not.toBeInTheDocument();
    expect(screen.getByText("建议：生产密钥使用 24h 到 72h")).toBeInTheDocument();
    expect(screen.queryByText("Recommended: 24h to 72h for production keys")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 24h、2d")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 24h, 2d")).not.toBeInTheDocument();
  });

  it("renders the grace period hint tooltip in Chinese in the open state", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getAllByTestId("tooltip-trigger").length).toBeGreaterThan(0);
    expect(
      screen.getByText("轮换后旧密钥在此期限内保持有效。在此期间两个密钥都可用，实现无缝切换。留空 = 立即吊销。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Keep the old key valid for this duration after rotation. Both keys work during this period for seamless cutover. Empty = immediate revoke.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the invalid-duration message in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderModal();

    const durationField = screen.getByPlaceholderText("例如 30s、30h、30d");
    fireEvent.change(durationField, { target: { value: "bogus" } });
    await user.click(screen.getByRole("button", { name: "重新生成" }));

    expect(await screen.findByText("时长格式必须类似 30s、30m、24h、2d、1w 或 1mo")).toBeInTheDocument();
    expect(screen.queryByText("Must be a duration like 30s, 30m, 24h, 2d, 1w, or 1mo")).not.toBeInTheDocument();
  });

  it("renders the expired-duration message and expired suffix in Chinese and hides the English originals", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-06-06T12:00:00Z"));
    const user = userEvent.setup();
    renderModal({ selectedToken: makeToken({ expires: "2026-06-01T12:00:00Z", duration: "" }) });

    expect(screen.getByText(/（已过期）/)).toBeInTheDocument();
    expect(screen.queryByText(/\(expired\)/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重新生成" }));

    expect(await screen.findByText("已过期的密钥必须设置过期时间")).toBeInTheDocument();
    expect(screen.queryByText("Expiration is required for expired keys")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("renders the regenerated-key view in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({ key: "sk-new-key", token: "new-hash" });
    renderModal({ selectedToken: makeToken({ key_alias: "" }) });

    await user.click(screen.getByRole("button", { name: "重新生成" }));

    expect(await screen.findByText("立即保存，之后将无法再次查看")).toBeInTheDocument();
    expect(screen.queryByText("Save it now, you will not see it again")).not.toBeInTheDocument();
    expect(screen.getByText("未设置别名")).toBeInTheDocument();
    expect(screen.queryByText("No alias set")).not.toBeInTheDocument();
    expect(screen.getByText("Virtual Key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: "Close" }).every((b) => b.getAttribute("data-slot") === "dialog-close"),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "复制密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Key" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复制密钥" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "已复制" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Copied" })).not.toBeInTheDocument();
  });

  it("renders the new-expiry preview in Chinese and hides the English original", () => {
    renderModal();

    fireEvent.change(screen.getByPlaceholderText("例如 30s、30h、30d"), { target: { value: "30d" } });

    expect(screen.getByText(/新过期时间：/)).toBeInTheDocument();
    expect(screen.queryByText(/New expiry:/)).not.toBeInTheDocument();
  });

  it("renders the regeneration success toast in Chinese", async () => {
    const user = userEvent.setup();
    mockRegenerateKeyCall.mockResolvedValue({ key: "sk-new-key", token: "new-hash" });
    renderModal();

    await user.click(screen.getByRole("button", { name: "重新生成" }));

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Virtual Key 重新生成成功");
    });
  });
});
