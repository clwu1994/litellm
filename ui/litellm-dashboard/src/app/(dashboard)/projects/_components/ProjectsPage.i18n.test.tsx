import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { fireEvent, cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";

import { ProjectsPage } from "./ProjectsPage";
import { ProjectResponse } from "@/app/(dashboard)/hooks/projects/useProjects";

const mockUseProjects = vi.fn();
vi.mock("@/app/(dashboard)/hooks/projects/useProjects", () => ({
  useProjects: () => mockUseProjects(),
}));

const mockUseTeams = vi.fn();
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => mockUseTeams(),
}));

vi.mock("./ProjectModals/CreateProjectModal", () => ({
  CreateProjectModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="create-modal" /> : null),
}));

vi.mock("./ProjectDetailsPage", () => ({
  ProjectDetail: ({ projectId }: { projectId: string }) => <div data-testid="project-detail">{projectId}</div>,
}));

const makeProject = (overrides: Partial<ProjectResponse> = {}): ProjectResponse => ({
  project_id: "proj-1",
  project_alias: "Alpha Project",
  description: "First project",
  team_id: "team-1",
  budget_id: null,
  metadata: null,
  models: ["gpt-4", "claude-3"],
  spend: 5,
  model_spend: null,
  model_rpm_limit: null,
  model_tpm_limit: null,
  blocked: false,
  object_permission_id: null,
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-01T00:00:00Z",
  updated_by: "user-1",
  litellm_budget_table: null,
  ...overrides,
});

const renderPage = () => renderWithProviders(<ProjectsPage />);

describe("ProjectsPage Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseTeams.mockReturnValue({ data: [], isLoading: false });
    mockUseProjects.mockReturnValue({ data: [], isLoading: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header and create action with the English originals absent", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "项目" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Projects" })).not.toBeInTheDocument();
    expect(screen.getByText("管理团队中的项目")).toBeInTheDocument();
    expect(screen.queryByText("Manage projects within your teams")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建项目" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Project" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、ID、描述或团队搜索项目...")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Search projects by name, ID, description, or team..."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-search control only once a query is typed", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByLabelText("清除搜索")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("按名称、ID、描述或团队搜索项目..."), "Alpha");

    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state for a project list with no rows", () => {
    renderPage();

    expect(screen.getByText("暂无项目")).toBeInTheDocument();
    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
    expect(screen.getByText("创建项目以整理团队中的密钥。")).toBeInTheDocument();
    expect(screen.queryByText("Create a project to organize keys within your teams.")).not.toBeInTheDocument();
  });

  it("renders the Chinese filtered empty state when the search matches nothing", async () => {
    mockUseProjects.mockReturnValue({ data: [makeProject()], isLoading: false });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("按名称、ID、描述或团队搜索项目..."), {
      target: { value: "zzz-no-match" },
    });

    await waitFor(() => {
      expect(screen.getByText("没有匹配的项目")).toBeInTheDocument();
    });
    expect(screen.queryByText("No matching projects")).not.toBeInTheDocument();
    expect(screen.getByText("尝试其他搜索词。")).toBeInTheDocument();
    expect(screen.queryByText("Try a different search term.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while projects are loading", () => {
    mockUseProjects.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();

    expect(screen.getByText("正在加载项目…")).toBeInTheDocument();
    expect(screen.queryByText("Loading projects…")).not.toBeInTheDocument();
  });

  it("renders every Chinese column header with the English original absent", () => {
    mockUseProjects.mockReturnValue({ data: [makeProject()], isLoading: false });
    renderPage();

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByTestId("sort-header-project_alias")).toHaveTextContent("名称");
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-team")).toHaveTextContent("团队");
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-created_at")).toHaveTextContent("创建时间");
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    expect(screen.getByText("更新时间")).toBeInTheDocument();
    expect(screen.queryByText("Updated")).not.toBeInTheDocument();
  });

  it("renders the Chinese active and blocked status badges", () => {
    mockUseProjects.mockReturnValue({
      data: [makeProject({ blocked: false }), makeProject({ project_id: "proj-2", blocked: true })],
      isLoading: false,
    });
    renderPage();

    expect(screen.getByText("活跃")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.getByText("已封锁")).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-models tooltip while the tooltip is open", async () => {
    const user = userEvent.setup();
    mockUseProjects.mockReturnValue({ data: [makeProject({ models: [] })], isLoading: false });
    renderPage();

    await user.hover(screen.getByText("0"));

    expect(await screen.findByText("无模型")).toBeInTheDocument();
    expect(screen.queryByText("No models")).not.toBeInTheDocument();
  });
});
