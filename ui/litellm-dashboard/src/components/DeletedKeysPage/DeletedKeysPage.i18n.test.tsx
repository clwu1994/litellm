import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DeletedKeyResponse, useDeletedKeys } from "@/app/(dashboard)/hooks/keys/useKeys";

import DeletedKeysPage from "./DeletedKeysPage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useDeletedKeys: vi.fn(),
}));

const mockUseDeletedKeys = vi.mocked(useDeletedKeys);

const mockDeletedKey: DeletedKeyResponse = {
  token: "sk-1234567890abcdef",
  token_id: "key-1",
  key_alias: "Test Key Alias",
  spend: 5.5,
  max_budget: 100,
  models: ["gpt-3.5-turbo"],
  user_id: "user-1",
  team_id: "team-1",
  organization_id: "org-1",
  created_at: "2024-11-01T10:00:00Z",
  team_alias: "Test Team",
  user_email: "user@example.com",
  deleted_at: "2024-11-15T10:00:00Z",
  deleted_by: "user-1",
} as DeletedKeyResponse;

describe("DeletedKeysPage Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseDeletedKeys.mockReturnValue({
      data: { keys: [mockDeletedKey], total_count: 1, current_page: 1, total_pages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useDeletedKeys>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the enterprise notice in Chinese", () => {
    renderWithProviders(<DeletedKeysPage />);

    expect(screen.getByText("即将在企业版推出")).toBeInTheDocument();
    expect(screen.queryByText("Coming soon to Enterprise")).not.toBeInTheDocument();
    expect(
      screen.getByText("已删除密钥的审计功能正在从 Beta 版升级到我们的企业版审计与合规套件。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Deleted key auditing is graduating from beta into our Enterprise audit & compliance suite."),
    ).not.toBeInTheDocument();
  });

  it("renders the column headers in Chinese", () => {
    renderWithProviders(<DeletedKeysPage />);

    expect(screen.getByText("Key ID")).toBeInTheDocument();
    expect(screen.getByText("密钥别名")).toBeInTheDocument();
    expect(screen.queryByText("Key Alias")).not.toBeInTheDocument();
    expect(screen.getByText("团队别名")).toBeInTheDocument();
    expect(screen.queryByText("Team Alias")).not.toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.queryByText("User Email")).not.toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.getByText("创建者")).toBeInTheDocument();
    expect(screen.queryByText("Created By")).not.toBeInTheDocument();
    expect(screen.getByText("删除时间")).toBeInTheDocument();
    expect(screen.queryByText("Deleted At")).not.toBeInTheDocument();
    expect(screen.getByText("删除者")).toBeInTheDocument();
    expect(screen.queryByText("Deleted By")).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese", () => {
    mockUseDeletedKeys.mockReturnValue({
      data: { keys: [], total_count: 0, current_page: 1, total_pages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useDeletedKeys>);

    renderWithProviders(<DeletedKeysPage />);

    expect(screen.getByText("未找到已删除的密钥")).toBeInTheDocument();
    expect(screen.queryByText("No deleted keys found")).not.toBeInTheDocument();
    expect(screen.getByText("从此 Proxy 删除的密钥会显示在这里。")).toBeInTheDocument();
    expect(screen.queryByText("Keys deleted from this proxy will show up here.")).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese", () => {
    mockUseDeletedKeys.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useDeletedKeys>);

    renderWithProviders(<DeletedKeysPage />);

    expect(screen.getByText("正在加载已删除的密钥…")).toBeInTheDocument();
    expect(screen.queryByText("Loading deleted keys…")).not.toBeInTheDocument();
  });
});
