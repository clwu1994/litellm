import { act, cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { convertPromptFileToJson, createPromptCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AddPromptForm from "./add_prompt_form";

vi.mock("@/components/networking", () => ({
  convertPromptFileToJson: vi.fn(),
  createPromptCall: vi.fn(),
}));

const mockConvert = vi.mocked(convertPromptFileToJson);
const mockCreate = vi.mocked(createPromptCall);

const renderForm = (accessToken: string | null = "sk-test") =>
  renderWithProviders(<AddPromptForm visible onClose={vi.fn()} accessToken={accessToken} onSuccess={vi.fn()} />);

const typePromptId = (value: string) => fireEvent.change(screen.getByLabelText("提示词 ID"), { target: { value } });

const attachPromptFile = async (file: File) => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
  await screen.findByText(`已选择：${file.name}`);
};

const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "创建提示词" }));
  });
};

describe("AddPromptForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockConvert.mockResolvedValue({ prompt_id: "converted_prompt_id", json_data: {} });
    mockCreate.mockResolvedValue({ status: "success" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome and hides the English originals", () => {
    renderForm();

    expect(screen.getByText("新增提示词")).toBeInTheDocument();
    expect(screen.queryByText("Add New Prompt")).not.toBeInTheDocument();
    expect(screen.getByLabelText("提示词 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Prompt ID")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入唯一的提示词 ID（例如 my_prompt_id）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter unique prompt ID (e.g., my_prompt_id)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("提示词集成")).toBeInTheDocument();
    expect(screen.queryByLabelText("Prompt Integration")).not.toBeInTheDocument();
    expect(screen.getByText("提示词文件")).toBeInTheDocument();
    expect(screen.queryByText("Prompt File")).not.toBeInTheDocument();
    expect(screen.getByLabelText("提示词文件")).toBeInTheDocument();
    expect(screen.queryByLabelText("Prompt file")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择 .prompt 文件" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select .prompt File" })).not.toBeInTheDocument();
    expect(screen.getByText("上传符合 Dotprompt 规范的 .prompt 文件")).toBeInTheDocument();
    expect(
      screen.queryByText("Upload a .prompt file that follows the Dotprompt specification"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建提示词" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Prompt" })).not.toBeInTheDocument();
  });

  it("renders the Chinese selected-file label and remove action and hides the English originals", async () => {
    renderForm();
    const file = new File(["model: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    await attachPromptFile(file);

    expect(screen.queryByText("Selected: greeting.prompt")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除 greeting.prompt")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove greeting.prompt")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-ID validation and hides the English original", async () => {
    renderForm();

    await submit();

    expect(await screen.findByText("请输入提示词 ID")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a prompt ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese ID-format validation and hides the English original", async () => {
    renderForm();
    const file = new File(["model: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my prompt!");
    await attachPromptFile(file);
    await submit();

    expect(await screen.findByText("提示词 ID 只能包含字母、数字、下划线和连字符")).toBeInTheDocument();
    expect(
      screen.queryByText("Prompt ID can only contain letters, numbers, underscores, and hyphens"),
    ).not.toBeInTheDocument();
  });

  it("toasts the Chinese upload-required message and hides the English original", async () => {
    renderForm();

    typePromptId("my_prompt_id");
    await submit();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("请上传 .prompt 文件"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Please upload a .prompt file");
  });

  it("toasts the Chinese access-token message and hides the English original", async () => {
    renderForm(null);

    typePromptId("my_prompt_id");
    await submit();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("需要访问 Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Access token is required");
  });

  it("toasts the Chinese conversion failure and hides the English original", async () => {
    mockConvert.mockRejectedValue(new Error("boom"));
    renderForm();
    const file = new File(["model: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my_prompt_id");
    await attachPromptFile(file);
    await submit();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("将提示词文件转换为 JSON 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to convert prompt file to JSON");
  });

  it("toasts the Chinese create success and hides the English original", async () => {
    renderForm();
    const file = new File(["model: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my_prompt_id");
    await attachPromptFile(file);
    await submit();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("提示词创建成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Prompt created successfully!");
  });

  it("toasts the Chinese create failure and hides the English original", async () => {
    mockCreate.mockRejectedValue(new Error("boom"));
    renderForm();
    const file = new File(["model: gpt-4o"], "greeting.prompt", { type: "text/plain" });

    typePromptId("my_prompt_id");
    await attachPromptFile(file);
    await submit();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建提示词失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create prompt");
  });
});
