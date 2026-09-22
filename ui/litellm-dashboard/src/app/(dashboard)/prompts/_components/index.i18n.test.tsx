import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deletePromptCall, getPromptsList } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import PromptsPanel from "./index";

vi.mock("@/components/networking", () => ({
  getPromptsList: vi.fn(),
  deletePromptCall: vi.fn(),
}));

vi.mock("./PromptTable", () => ({
  __esModule: true,
  default: ({
    isLoading,
    onDeleteClick,
  }: {
    isLoading: boolean;
    onDeleteClick: (id: string, name: string, environment: string) => void;
  }) => (
    <div data-testid="prompt-table">
      {isLoading ? "table-loading" : "table-loaded"}
      <button type="button" onClick={() => onDeleteClick("prompt-1", "my-prompt", "staging")}>
        row-delete
      </button>
    </div>
  ),
}));

vi.mock("./prompt_info", () => ({ __esModule: true, default: () => null }));
vi.mock("./add_prompt_form", () => ({ __esModule: true, default: () => null }));
vi.mock("./prompt_editor_view", () => ({ __esModule: true, default: () => null }));

const mockGetPromptsList = vi.mocked(getPromptsList);
const mockDeletePromptCall = vi.mocked(deletePromptCall);

const renderPanel = () => renderWithProviders(<PromptsPanel accessToken="sk-test" userRole="Admin" />);

const openDeleteDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("button", { name: "row-delete" }));
  return screen.findByRole("alertdialog");
};

describe("PromptsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetPromptsList.mockResolvedValue({ prompts: [] } as never);
    mockDeletePromptCall.mockResolvedValue(undefined as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese create actions and all-environments placeholder, hiding the English originals", async () => {
    renderPanel();
    await screen.findByText("table-loaded");

    expect(screen.getByRole("button", { name: "新增提示词" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Add New Prompt" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传 .prompt 文件" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Upload .prompt File" })).not.toBeInTheDocument();
    expect(screen.getByText("所有环境")).toBeInTheDocument();
    expect(screen.queryByText("All Environments")).not.toBeInTheDocument();
  });

  it("renders the Chinese environment filter options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("table-loaded");

    await user.click(screen.getByRole("combobox"));

    for (const [zh, en] of [
      ["开发", "Development"],
      ["预发布", "Staging"],
      ["生产", "Production"],
    ] as const) {
      expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese delete dialog and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel();

    const dialog = await openDeleteDialog(user);

    expect(within(dialog).getByText("删除提示词")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Prompt")).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("确定要删除 预发布 环境的提示词 my-prompt 吗？此操作无法撤销。"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText(/Are you sure you want to delete the staging copy/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows the Chinese deleted toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderPanel();

    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("提示词「my-prompt」已从 预发布 环境删除"));
    expect(toast.success).not.toHaveBeenCalledWith('Prompt "my-prompt" deleted successfully from staging');
  });

  it("shows the Chinese delete-failure toast and hides the English original", async () => {
    const user = userEvent.setup();
    mockDeletePromptCall.mockRejectedValue(new Error("boom"));
    renderPanel();

    const dialog = await openDeleteDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除提示词失败"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete prompt");
  });
});
