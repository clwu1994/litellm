import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";

import ModelAliasManager from "./ModelAliasManager";

vi.mock("./ModelSelector", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      aria-label="target model"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), fromError: vi.fn(), info: vi.fn() } }));

const renderManager = () =>
  renderWithProviders(
    <ModelAliasManager accessToken="tok" initialModelAliases={{}} onAliasUpdate={vi.fn()} showExampleConfig />,
  );

const addAlias = async (user: ReturnType<typeof userEvent.setup>, name = "gpt-4o-mini", model = "gpt-4o") => {
  await user.type(screen.getByPlaceholderText("例如 gpt-4o"), name);
  await user.type(screen.getByLabelText("target model"), model);
  await user.click(screen.getByRole("button", { name: /添加别名/ }));
};

describe("ModelAliasManager Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese headings, labels and empty state and hides the English originals", () => {
    renderManager();

    expect(screen.getByText("添加新别名")).toBeInTheDocument();
    expect(screen.getByLabelText("别名名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加别名/ })).toBeInTheDocument();
    expect(screen.getByText("管理现有别名")).toBeInTheDocument();
    expect(screen.getByText("尚未添加别名。请在上方添加新别名。")).toBeInTheDocument();
    expect(screen.getByText("配置示例")).toBeInTheDocument();
    expect(screen.getByText("以下是当前别名在配置中的样子：")).toBeInTheDocument();

    expect(screen.queryByText("Add New Alias")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage Existing Aliases")).not.toBeInTheDocument();
    expect(screen.queryByText("No aliases added yet. Add a new alias above.")).not.toBeInTheDocument();
    expect(screen.queryByText("Configuration Example")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Alias/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese table headers and hides the English originals", () => {
    renderManager();

    const table = within(screen.getByRole("table"));
    expect(table.getByText("别名名称")).toBeInTheDocument();
    expect(table.getByText("目标模型")).toBeInTheDocument();
    expect(table.getByText("操作")).toBeInTheDocument();
    expect(table.queryByText("Alias Name")).not.toBeInTheDocument();
    expect(table.queryByText("Target Model")).not.toBeInTheDocument();
    expect(table.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders the Chinese placeholders and hides the English originals", () => {
    renderManager();

    expect(screen.getByPlaceholderText("例如 gpt-4o")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择目标模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., gpt-4o")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select target model")).not.toBeInTheDocument();
  });

  it("renders the Chinese save, cancel and delete labels when editing and hides the English originals", async () => {
    const user = userEvent.setup();
    renderManager();
    await addAlias(user);

    expect(screen.getByLabelText("删除gpt-4o-mini")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete gpt-4o-mini")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("编辑gpt-4o-mini"));

    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-field toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderManager();
    await addAlias(user);
    await user.click(screen.getByLabelText("编辑gpt-4o-mini"));
    await user.clear(screen.getByLabelText("编辑别名名称"));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(toast.fromError).toHaveBeenCalledWith("请同时提供别名名称和目标模型");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please provide both alias name and target model");
  });

  it("renders the Chinese added and duplicate toasts and hides the English originals", async () => {
    const user = userEvent.setup();
    renderManager();
    await addAlias(user);

    expect(toast.success).toHaveBeenCalledWith("别名添加成功");
    expect(toast.success).not.toHaveBeenCalledWith("Alias added successfully");

    await addAlias(user);

    expect(toast.fromError).toHaveBeenCalledWith("已存在同名别名");
    expect(toast.fromError).not.toHaveBeenCalledWith("An alias with this name already exists");
  });

  it("renders the Chinese updated and deleted toasts and hides the English originals", async () => {
    const user = userEvent.setup();
    renderManager();
    await addAlias(user);

    await user.click(screen.getByLabelText("编辑gpt-4o-mini"));
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(toast.success).toHaveBeenCalledWith("别名更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Alias updated successfully");

    await user.click(screen.getByLabelText("删除gpt-4o-mini"));
    expect(toast.success).toHaveBeenCalledWith("别名删除成功");
    expect(toast.success).not.toHaveBeenCalledWith("Alias deleted successfully");
  });
});
