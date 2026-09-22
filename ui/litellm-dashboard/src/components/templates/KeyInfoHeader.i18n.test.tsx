import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { KeyInfoData, KeyInfoHeader } from "./KeyInfoHeader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const DATA: KeyInfoData = {
  keyName: "My Test Key",
  keyId: "sk-1234567890abcdef",
  userId: "user-abc-123",
  userEmail: "test@example.com",
  userAlias: null,
  teamId: "team-xyz-789",
  teamAlias: "Platform Team",
  orgId: "org-abc-001",
  orgAlias: "Acme Org",
  createdBy: "admin@example.com",
  createdById: "admin-user-456",
  createdAt: "Oct 29, 2025 at 1:26 AM",
  lastUpdated: "Oct 29, 2025 at 1:47 AM",
  lastActive: "Oct 29, 2025 at 2:00 AM",
  expires: "Never",
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("KeyInfoHeader Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the metadata labels in Chinese and hides the English originals", () => {
    renderWithProviders(<KeyInfoHeader data={DATA} />);

    expectLocalized("用户", "User");
    expectLocalized("过期时间", "Expires");
    expectLocalized("创建时间", "Created At");
    expectLocalized("创建者", "Created By");
    expectLocalized("更新时间", "Last Updated");
    expectLocalized("最近活跃", "Last Active");
    expectLocalized("团队", "Team");
    expectLocalized("组织", "Organization");
    expect(screen.getByText("密钥 ID：sk-1234567890abcdef")).toBeInTheDocument();
    expect(screen.queryByText("Key ID: sk-1234567890abcdef")).not.toBeInTheDocument();
  });

  it("renders the copy accessible names in Chinese and hides the English originals", () => {
    renderWithProviders(<KeyInfoHeader data={DATA} />);

    expect(screen.getByLabelText("复制密钥别名")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy Key Alias")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制密钥 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy Key ID")).not.toBeInTheDocument();
  });

  it("renders the header actions in Chinese and hides the English originals", () => {
    renderWithProviders(
      <KeyInfoHeader
        data={DATA}
        onBack={vi.fn()}
        onCreateNew={vi.fn()}
        onRegenerate={vi.fn()}
        onDelete={vi.fn()}
        onResetSpend={vi.fn()}
        onToggleBlocked={vi.fn()}
      />,
    );

    expectLocalized("重新生成密钥", "Regenerate Key");
    expectLocalized("创建新密钥", "Create New Key");
    expectLocalized("返回密钥列表", "Back to Keys");
    expect(screen.getByRole("button", { name: "更多密钥操作" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More key actions" })).not.toBeInTheDocument();
  });

  it("renders the blocked badge in Chinese and hides the English original", () => {
    renderWithProviders(<KeyInfoHeader data={DATA} isBlocked />);

    expectLocalized("已封锁", "Blocked");
  });

  it("renders the destructive menu items in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <KeyInfoHeader data={DATA} onDelete={vi.fn()} onResetSpend={vi.fn()} onToggleBlocked={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "更多密钥操作" }));

    expect(await screen.findByRole("menuitem", { name: "封锁密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Block Key" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "重置消费" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reset Spend" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete Key" })).not.toBeInTheDocument();
  });

  it("renders the unblock menu item in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyInfoHeader data={DATA} isBlocked onDelete={vi.fn()} onToggleBlocked={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "更多密钥操作" }));

    expect(await screen.findByRole("menuitem", { name: "解封密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Unblock Key" })).not.toBeInTheDocument();
  });

  it("renders the user hover card labels and copy names in Chinese in the open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyInfoHeader data={DATA} />);

    await user.hover(screen.getByText("test@example.com"));

    expect(await screen.findByText("用户别名", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("User Alias")).not.toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.queryByText("User Email")).not.toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制用户邮箱")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy User Email")).not.toBeInTheDocument();
  });
});
