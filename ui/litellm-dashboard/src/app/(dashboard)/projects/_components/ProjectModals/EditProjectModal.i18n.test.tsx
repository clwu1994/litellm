import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";

import { EditProjectModal } from "./EditProjectModal";
import { ProjectResponse } from "@/app/(dashboard)/hooks/projects/useProjects";

const mutate = vi.fn();

vi.mock("@/app/(dashboard)/hooks/projects/useUpdateProject", () => ({
  useUpdateProject: () => ({ mutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ accessToken: "test-token", userId: "u-1", userRole: "Admin" }),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({
    data: [{ team_id: "team-1", team_alias: "Engineering", models: ["gpt-4"] }],
    isLoading: false,
  }),
}));

vi.mock("@/components/organisms/create_key_button", () => ({
  fetchTeamModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/networking", () => ({
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
}));

vi.mock("@/components/key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: (model: string) => model,
}));

const setup = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
type User = ReturnType<typeof setup>;

const project: ProjectResponse = {
  project_id: "proj-1",
  project_alias: "My Project",
  description: "A test project",
  team_id: "team-1",
  budget_id: null,
  metadata: null,
  models: ["gpt-4"],
  spend: 10,
  model_spend: null,
  model_rpm_limit: null,
  model_tpm_limit: null,
  blocked: false,
  object_permission_id: null,
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-02T00:00:00Z",
  updated_by: "user-1",
  litellm_budget_table: { max_budget: 50 },
} as unknown as ProjectResponse;

const renderModal = async () => {
  const view = renderWithProviders(<EditProjectModal isOpen project={project} onClose={vi.fn()} />);
  await act(async () => {});
  return view;
};

const save = async (user: User) => user.click(screen.getByRole("button", { name: "保存更改" }));

const mutationOptions = () =>
  mutate.mock.calls.at(-1)?.[1] as { onSuccess: () => void; onError: (error: Error) => void };

describe("EditProjectModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog title and buttons with the English originals absent", async () => {
    await renderModal();

    expect(screen.getByText("编辑项目")).toBeInTheDocument();
    expect(screen.queryByText("Edit Project")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese project-name validation message", async () => {
    const user = setup();
    await renderModal();
    await screen.findByDisplayValue("My Project");

    await user.clear(screen.getByLabelText("项目名称"));
    await save(user);

    expect(await screen.findByText("请输入项目名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a project name")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows the Chinese update-success toast with the English original absent", async () => {
    const user = setup();
    await renderModal();
    await screen.findByDisplayValue("My Project");

    await save(user);
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    await act(async () => {
      mutationOptions().onSuccess();
    });

    expect(toast.success).toHaveBeenCalledWith("项目更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Project updated successfully");
  });

  it("shows the Chinese update-failure toast with the English original absent", async () => {
    const user = setup();
    await renderModal();
    await screen.findByDisplayValue("My Project");

    await save(user);
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    await act(async () => {
      mutationOptions().onError(new Error(""));
    });

    expect(toast.error).toHaveBeenCalledWith("更新项目失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to update project");
  });
});
