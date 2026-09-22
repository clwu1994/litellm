import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, MockedFunction, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { TeamsResponse, useTeamsTable } from "@/app/(dashboard)/hooks/teams/useTeams";
import { Team } from "../key_team_helpers/key_list";
import { TeamsTable } from "./TeamsTable";
import { exportTeamsToCsv } from "./teamsCsvExport";

vi.mock("@tanstack/react-pacer/debouncer", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    useDebouncedValue: (value: unknown) => [value, { cancel: vi.fn(), flush: vi.fn() }],
    useDebouncedState: (initial: unknown) => {
      const [value, setValue] = React.useState(initial);
      return [value, setValue, { cancel: vi.fn(), flush: vi.fn() }];
    },
  };
});

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: vi.fn(() => ({
    accessToken: "test-token",
    userId: "test-user",
    userRole: "Admin",
    premiumUser: true,
    token: "test-token",
  })),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeamsTable: vi.fn(),
  teamsTableKeys: { all: ["teamsTable"] },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: vi.fn().mockReturnValue({
    data: [{ organization_id: "org-1", organization_alias: "Test Organization" }],
  }),
}));

vi.mock("./teamsCsvExport", () => ({
  exportTeamsToCsv: vi.fn().mockResolvedValue(1),
}));

import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";

const mockTeam: Team = {
  team_id: "team-1",
  team_alias: "Acme Team",
  models: ["gpt-4", "gpt-3.5-turbo", "claude-3", "claude-3-5-sonnet"],
  max_budget: 100,
  budget_duration: "1mo",
  tpm_limit: 5000,
  rpm_limit: 500,
  organization_id: "org-1",
  created_at: "2024-10-01T10:00:00Z",
  updated_at: "2024-11-01T10:00:00Z",
  keys: [],
  keys_count: 3,
  members_with_roles: [
    { user_id: "u1", user_email: "a@x.com", role: "admin" },
    { user_id: "u2", user_email: "b@x.com", role: "user" },
  ] as unknown as Team["members_with_roles"],
  spend: 42.5,
};

const mockUseTeamsTable = useTeamsTable as MockedFunction<typeof useTeamsTable>;

const teamsResult = (teams: Team[], data: Partial<TeamsResponse> = {}, extra: Record<string, unknown> = {}) =>
  ({
    data: {
      teams,
      total: teams.length,
      page: 1,
      page_size: 50,
      total_pages: 1,
      ...data,
    } as TeamsResponse,
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
    ...extra,
  }) as never;

const noop = () => {};

const renderTable = () =>
  renderWithProviders(
    <TeamsTable userRole="Admin" userID="admin-1" onSelectTeam={noop} onEditTeam={noop} onDeleteTeam={noop} />,
  );

const openFilters = () => fireEvent.click(screen.getByRole("button", { name: "筛选" }));

describe("TeamsTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseTeamsTable.mockReturnValue(teamsResult([mockTeam]));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and resource tooltips in Chinese", () => {
    renderTable();

    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.getByText("资源")).toBeInTheDocument();
    expect(screen.queryByText("Resources")).not.toBeInTheDocument();
    expect(screen.getByText("消费 / 预算")).toBeInTheDocument();
    expect(screen.queryByText("Spend / Budget")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();

    expect(screen.getByTitle("2 名成员")).toBeInTheDocument();
    expect(screen.queryByTitle("2 members")).not.toBeInTheDocument();
    expect(screen.getByTitle("4 个模型")).toBeInTheDocument();
    expect(screen.queryByTitle("4 models")).not.toBeInTheDocument();
    expect(screen.getByTitle("3 个密钥")).toBeInTheDocument();
    expect(screen.queryByTitle("3 keys")).not.toBeInTheDocument();
  });

  it("renders the hidden Updated column title in Chinese once the columns menu opens", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "列" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("更新时间")).toBeInTheDocument();
    expect(within(menu).queryByText("Updated")).not.toBeInTheDocument();
  });

  it("renders the toolbar and export controls in Chinese", () => {
    renderTable();

    expect(screen.getByPlaceholderText("按名称或 ID 搜索团队…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search teams by name or ID…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();
  });

  it("shows the exporting label in Chinese while the export is pending", async () => {
    const user = userEvent.setup();
    vi.mocked(exportTeamsToCsv).mockImplementationOnce(() => new Promise(() => {}));
    renderTable();

    await user.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(await screen.findByRole("button", { name: "正在导出…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exporting..." })).not.toBeInTheDocument();
  });

  it("renders the filter drawer labels and placeholders in Chinese", async () => {
    renderTable();

    openFilters();

    expect(await screen.findByText("缩小团队范围")).toBeInTheDocument();
    expect(screen.queryByText("Narrow down your teams")).not.toBeInTheDocument();
    expect(screen.getByText("团队别名")).toBeInTheDocument();
    expect(screen.queryByText("Team alias")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入团队别名…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter team alias…")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入团队 ID…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter team ID…")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择组织…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an organization…")).not.toBeInTheDocument();
  });

  it("renders the empty organization filter text in Chinese when there are no organizations", async () => {
    const user = userEvent.setup();
    vi.mocked(useOrganizations).mockReturnValue({ data: [] } as never);
    renderTable();

    openFilters();
    const orgSelect = await screen.findByPlaceholderText("选择组织…");
    await user.click(orgSelect);

    expect(await screen.findByText("未找到组织")).toBeInTheDocument();
    expect(screen.queryByText("No organizations found")).not.toBeInTheDocument();
  });

  it("renders the row action menu in Chinese and reports the copy toast in Chinese", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByTestId("team-actions-team-1"));

    expect(await screen.findByText("编辑团队")).toBeInTheDocument();
    expect(screen.queryByText("Edit team")).not.toBeInTheDocument();
    expect(screen.getByText("删除团队")).toBeInTheDocument();
    expect(screen.queryByText("Delete team")).not.toBeInTheDocument();
    expect(screen.getByText("复制团队 ID")).toBeInTheDocument();
    expect(screen.queryByText("Copy team ID")).not.toBeInTheDocument();

    await user.click(screen.getByText("复制团队 ID"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("团队 ID 已复制"));
    expect(toast.success).not.toHaveBeenCalledWith("Team ID copied");
  });

  it("renders the empty and loading messages in Chinese", () => {
    mockUseTeamsTable.mockReturnValue(teamsResult([]));
    renderTable();

    expect(screen.getByText("未找到团队")).toBeInTheDocument();
    expect(screen.queryByText("No teams found")).not.toBeInTheDocument();

    cleanup();
    mockUseTeamsTable.mockReturnValue(teamsResult([], {}, { data: null, isPending: true, isFetching: true }));
    renderTable();

    expect(screen.getByText("正在加载团队…")).toBeInTheDocument();
    expect(screen.queryByText("Loading teams...")).not.toBeInTheDocument();
  });
});
