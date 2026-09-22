import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ProjectDetail } from "./ProjectDetailsPage";
import { ProjectBudget, ProjectResponse } from "@/app/(dashboard)/hooks/projects/useProjects";

const mockUseProjectDetails = vi.fn();
vi.mock("@/app/(dashboard)/hooks/projects/useProjectDetails", () => ({
  useProjectDetails: (id: string) => mockUseProjectDetails(id),
}));

const mockUseTeam = vi.fn();
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeam: (id?: string) => mockUseTeam(id),
}));

vi.mock("./ProjectModals/EditProjectModal", () => ({
  EditProjectModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="edit-modal" /> : null),
}));

vi.mock("@/components/common_components/DefaultProxyAdminTag", () => ({
  default: ({ userId }: { userId: string }) => <span>{userId}</span>,
}));

vi.mock("./ProjectKeysSection", () => ({
  ProjectKeysSection: ({ projectId }: { projectId: string }) => (
    <div data-testid="project-keys-section">{projectId}</div>
  ),
}));

const makeBudget = (maxBudget: number): ProjectBudget => ({
  budget_id: "budget-1",
  max_budget: maxBudget,
  soft_budget: null,
  max_parallel_requests: null,
  tpm_limit: null,
  rpm_limit: null,
  model_max_budget: null,
  budget_duration: null,
});

const makeProject = (overrides: Partial<ProjectResponse> = {}): ProjectResponse => ({
  project_id: "proj-1",
  project_alias: "My Project",
  description: "A sample project",
  team_id: "team-1",
  budget_id: null,
  metadata: null,
  models: ["gpt-4"],
  spend: 12.5,
  model_spend: { "gpt-4": 12.5 },
  model_rpm_limit: null,
  model_tpm_limit: null,
  blocked: false,
  object_permission_id: null,
  created_at: "2024-01-15T08:00:00Z",
  created_by: "user-1",
  updated_at: "2024-02-01T12:00:00Z",
  updated_by: "user-2",
  litellm_budget_table: null,
  ...overrides,
});

const renderDetail = (project: ProjectResponse | undefined, isLoading = false) => {
  mockUseProjectDetails.mockReturnValue({ data: project, isLoading });
  return renderWithProviders(<ProjectDetail projectId="proj-1" onBack={vi.fn()} />);
};

describe("ProjectDetail Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseTeam.mockReturnValue({ data: undefined, isLoading: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading indicator while the project is loading", () => {
    renderDetail(undefined, true);

    expect(screen.getByRole("status", { name: "加载中" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found state with the English original absent", () => {
    renderDetail(undefined);

    expect(screen.getByText("未找到项目")).toBeInTheDocument();
    expect(screen.queryByText("Project not found")).not.toBeInTheDocument();
    expect(screen.getByLabelText("返回")).toBeInTheDocument();
    expect(screen.queryByLabelText("Back")).not.toBeInTheDocument();
  });

  it("renders the Chinese header, back control and edit action", () => {
    renderDetail(makeProject());

    expect(screen.getByLabelText("返回")).toBeInTheDocument();
    expect(screen.queryByLabelText("Back")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑项目" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Project" })).not.toBeInTheDocument();
    expect(screen.getByText("ID：proj-1")).toBeInTheDocument();
    expect(screen.queryByText("ID: proj-1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制项目 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy project ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese detail labels and the creator attribution", () => {
    renderDetail(makeProject());

    expect(screen.getByText("项目详情")).toBeInTheDocument();
    expect(screen.queryByText("Project Details")).not.toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    expect(screen.getByText("更新时间")).toBeInTheDocument();
    expect(screen.queryByText("Last Updated")).not.toBeInTheDocument();
    expect(screen.getAllByText("由")).toHaveLength(2);
    expect(screen.queryByText("by")).not.toBeInTheDocument();
  });

  it("renders the Chinese active status badge", () => {
    renderDetail(makeProject());

    expect(screen.getByText("活跃")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("renders the Chinese blocked status badge", () => {
    renderDetail(makeProject({ blocked: true }));

    expect(screen.getByText("已封锁")).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
  });

  it("renders the Chinese unlimited budget copy when no max budget is set", () => {
    renderDetail(makeProject());

    expect(screen.getByText("预算")).toBeInTheDocument();
    expect(screen.queryByText("Budget")).not.toBeInTheDocument();
    expect(screen.getByText("无预算上限")).toBeInTheDocument();
    expect(screen.queryByText("No budget limit")).not.toBeInTheDocument();
  });

  it("renders the Chinese budget limit and utilization with the interpolated values", () => {
    renderDetail(makeProject({ litellm_budget_table: makeBudget(100) }));

    expect(screen.getByText("预算上限 $100.00")).toBeInTheDocument();
    expect(screen.queryByText("of $100.00 budget")).not.toBeInTheDocument();
    expect(screen.getByText("已使用 12.5%")).toBeInTheDocument();
    expect(screen.queryByText("12.5% utilized")).not.toBeInTheDocument();
  });

  it("renders the Chinese spend-by-model heading and the Chinese empty state", () => {
    renderDetail(makeProject({ model_spend: {} }));

    expect(screen.getByText("按模型支出")).toBeInTheDocument();
    expect(screen.queryByText("Spend by Model")).not.toBeInTheDocument();
    expect(screen.getByText("暂无模型支出记录")).toBeInTheDocument();
    expect(screen.queryByText("No model spend recorded yet")).not.toBeInTheDocument();
  });

  it("renders the Chinese team card with the team id and unlimited spend", () => {
    mockUseTeam.mockReturnValue({
      data: {
        team_info: {
          team_id: "team-1",
          team_alias: "Engineering",
          models: [],
          spend: 50,
          members_with_roles: [],
        },
      },
      isLoading: false,
    });
    renderDetail(makeProject());

    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.getByText("ID：team-1")).toBeInTheDocument();
    expect(screen.getByLabelText("复制团队 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy team ID")).not.toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
    expect(screen.getByText("所有模型")).toBeInTheDocument();
    expect(screen.queryByText("All models")).not.toBeInTheDocument();
    expect(screen.getByText("支出")).toBeInTheDocument();
    expect(screen.queryByText("Spend")).not.toBeInTheDocument();
    expect(screen.getByText("（无限制）")).toBeInTheDocument();
    expect(screen.queryByText("(Unlimited)")).not.toBeInTheDocument();
    expect(screen.getByText("成员")).toBeInTheDocument();
    expect(screen.queryByText("Members")).not.toBeInTheDocument();
  });

  it("renders the Chinese team loading indicator while the team is still loading", () => {
    renderDetail(makeProject());

    expect(screen.getByRole("status", { name: "正在加载团队" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading team" })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-team-assigned fallback", () => {
    renderDetail(makeProject({ team_id: null }));

    expect(screen.getByText("未分配团队")).toBeInTheDocument();
    expect(screen.queryByText("No team assigned")).not.toBeInTheDocument();
  });
});
