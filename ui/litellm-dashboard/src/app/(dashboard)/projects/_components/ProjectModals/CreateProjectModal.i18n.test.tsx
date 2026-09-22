import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";

import { CreateProjectModal } from "./CreateProjectModal";

const mutate = vi.fn();

vi.mock("@/app/(dashboard)/hooks/projects/useCreateProject", () => ({
  useCreateProject: () => ({ mutate, isPending: false }),
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

const renderModal = async () => {
  const view = renderWithProviders(<CreateProjectModal isOpen onClose={vi.fn()} />);
  await act(async () => {});
  return view;
};

const pickTeam = async (user: User) => {
  await user.click(screen.getByLabelText("团队"));
  await user.click(await screen.findByText("Engineering"));
};

const submit = async (user: User) => user.click(screen.getByRole("button", { name: "创建项目" }));

const expandAdvanced = async (user: User) => {
  await user.click(screen.getByText("高级设置"));
  await screen.findByText("模型特定限制");
};

const mutationOptions = () =>
  mutate.mock.calls.at(-1)?.[1] as { onSuccess: () => void; onError: (error: Error) => void };

describe("CreateProjectModal Chinese copy", () => {
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

    expect(screen.getByText("创建新项目")).toBeInTheDocument();
    expect(screen.queryByText("Create New Project")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建项目" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Project" })).not.toBeInTheDocument();
  });

  it("renders the Chinese project-name validation message", async () => {
    const user = setup();
    await renderModal();

    await submit(user);

    expect(await screen.findByText("请输入项目名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a project name")).not.toBeInTheDocument();
  });

  it("renders the Chinese team validation message", async () => {
    const user = setup();
    await renderModal();

    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "My Project" } });
    await submit(user);

    expect(await screen.findByText("请选择团队")).toBeInTheDocument();
    expect(screen.queryByText("Please select a team")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("renders the Chinese missing-model validation message", async () => {
    const user = setup();
    await renderModal();

    await expandAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加模型限制" }));
    await submit(user);

    expect(await screen.findByText("缺少模型")).toBeInTheDocument();
    expect(screen.queryByText("Missing model")).not.toBeInTheDocument();
  });

  it("renders the Chinese duplicate-model validation message", async () => {
    const user = setup();
    await renderModal();

    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "My Project" } });
    await pickTeam(user);
    await expandAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加模型限制" }));
    await user.click(screen.getByRole("button", { name: "添加模型限制" }));
    const modelInputs = screen.getAllByPlaceholderText("模型名称（例如 gpt-4）");
    fireEvent.change(modelInputs[0], { target: { value: "gpt-4" } });
    fireEvent.change(modelInputs[1], { target: { value: "gpt-4" } });
    await submit(user);

    expect(await screen.findByText("模型重复")).toBeInTheDocument();
    expect(screen.queryByText("Duplicate model")).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-metadata validation messages", async () => {
    const user = setup();
    await renderModal();

    await expandAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加键值对" }));
    await submit(user);

    expect(await screen.findByText("缺少键")).toBeInTheDocument();
    expect(screen.queryByText("Missing key")).not.toBeInTheDocument();
    expect(screen.getByText("缺少值")).toBeInTheDocument();
    expect(screen.queryByText("Missing value")).not.toBeInTheDocument();
  });

  it("renders the Chinese duplicate-key validation message", async () => {
    const user = setup();
    await renderModal();

    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "My Project" } });
    await pickTeam(user);
    await expandAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加键值对" }));
    await user.click(screen.getByRole("button", { name: "添加键值对" }));
    const keyInputs = screen.getAllByPlaceholderText("键");
    const valueInputs = screen.getAllByPlaceholderText("值");
    fireEvent.change(keyInputs[0], { target: { value: "owner" } });
    fireEvent.change(keyInputs[1], { target: { value: "owner" } });
    fireEvent.change(valueInputs[0], { target: { value: "platform" } });
    fireEvent.change(valueInputs[1], { target: { value: "platform" } });
    await submit(user);

    expect(await screen.findByText("键重复")).toBeInTheDocument();
    expect(screen.queryByText("Duplicate key")).not.toBeInTheDocument();
  });

  it("shows the Chinese create-success toast with the English original absent", async () => {
    const user = setup();
    await renderModal();

    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "My Project" } });
    await pickTeam(user);
    await submit(user);
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    await act(async () => {
      mutationOptions().onSuccess();
    });

    expect(toast.success).toHaveBeenCalledWith("项目创建成功");
    expect(toast.success).not.toHaveBeenCalledWith("Project created successfully");
  });

  it("shows the Chinese create-failure toast with the English original absent", async () => {
    const user = setup();
    await renderModal();

    fireEvent.change(screen.getByLabelText("项目名称"), { target: { value: "My Project" } });
    await pickTeam(user);
    await submit(user);
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    await act(async () => {
      mutationOptions().onError(new Error(""));
    });

    expect(toast.error).toHaveBeenCalledWith("创建项目失败");
    expect(toast.error).not.toHaveBeenCalledWith("Failed to create project");
  });
});
