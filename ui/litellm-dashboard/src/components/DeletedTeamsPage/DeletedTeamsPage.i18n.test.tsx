import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DeletedTeam, useDeletedTeams } from "@/app/(dashboard)/hooks/teams/useTeams";

import DeletedTeamsPage from "./DeletedTeamsPage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useDeletedTeams: vi.fn(),
}));

const mockUseDeletedTeams = vi.mocked(useDeletedTeams);

const mockDeletedTeam: DeletedTeam = {
  team_id: "team-1",
  team_alias: "Test Team",
  models: ["gpt-3.5-turbo"],
  max_budget: 500,
  budget_duration: "1m",
  tpm_limit: 5000,
  rpm_limit: 500,
  organization_id: "org-1",
  created_at: "2024-10-01T10:00:00Z",
  keys: [],
  members_with_roles: [],
  deleted_at: "2024-11-15T10:00:00Z",
  deleted_by: "user-1",
  spend: 100.5,
};

describe("DeletedTeamsPage Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseDeletedTeams.mockReturnValue({
      data: { teams: [mockDeletedTeam], total: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useDeletedTeams>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the enterprise notice in Chinese", () => {
    renderWithProviders(<DeletedTeamsPage />);

    expect(screen.getByText("即将在企业版推出")).toBeInTheDocument();
    expect(screen.queryByText("Coming soon to Enterprise")).not.toBeInTheDocument();
    expect(
      screen.getByText("已删除团队的审计功能正在从 Beta 版升级到我们的企业版审计与合规套件。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Deleted team auditing is graduating from beta into our Enterprise audit & compliance suite."),
    ).not.toBeInTheDocument();
  });

  it("renders the column headers in Chinese", () => {
    renderWithProviders(<DeletedTeamsPage />);

    expect(screen.getByText("团队名称")).toBeInTheDocument();
    expect(screen.queryByText("Team Name")).not.toBeInTheDocument();
    expect(screen.getByText("团队 ID")).toBeInTheDocument();
    expect(screen.queryByText("Team ID")).not.toBeInTheDocument();
    expect(screen.getByText("删除时间")).toBeInTheDocument();
    expect(screen.queryByText("Deleted At")).not.toBeInTheDocument();
    expect(screen.getByText("删除者")).toBeInTheDocument();
    expect(screen.queryByText("Deleted By")).not.toBeInTheDocument();
    expect(screen.getByText("组织")).toBeInTheDocument();
    expect(screen.queryByText("Organization")).not.toBeInTheDocument();
    expect(screen.getByText("消费（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Spend (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("预算（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Budget (USD)")).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese", () => {
    mockUseDeletedTeams.mockReturnValue({
      data: { teams: [], total: 0 },
      isLoading: false,
    } as unknown as ReturnType<typeof useDeletedTeams>);

    renderWithProviders(<DeletedTeamsPage />);

    expect(screen.getByText("未找到已删除的团队")).toBeInTheDocument();
    expect(screen.queryByText("No deleted teams found")).not.toBeInTheDocument();
    expect(screen.getByText("从此 Proxy 删除的团队会显示在这里。")).toBeInTheDocument();
    expect(screen.queryByText("Teams deleted from this proxy will show up here.")).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese", () => {
    mockUseDeletedTeams.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useDeletedTeams>);

    renderWithProviders(<DeletedTeamsPage />);

    expect(screen.getByText("正在加载已删除的团队…")).toBeInTheDocument();
    expect(screen.queryByText("Loading deleted teams…")).not.toBeInTheDocument();
  });
});
