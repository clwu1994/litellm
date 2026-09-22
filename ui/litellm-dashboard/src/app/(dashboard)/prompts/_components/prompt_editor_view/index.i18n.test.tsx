import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPromptCall, updatePromptCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";

import PromptEditorView from "./index";

vi.mock("@/components/networking", () => ({
  createPromptCall: vi.fn(),
  updatePromptCall: vi.fn(),
  getPromptInfo: vi.fn(),
}));

vi.mock("@/components/common_components/ModelSelector", () => ({ default: () => null }));

vi.mock("./conversation_panel", () => ({ __esModule: true, default: () => null }));

vi.mock("../tool_modal", () => ({
  __esModule: true,
  default: ({ onSave }: { onSave: (json: string) => void }) => (
    <>
      <button type="button" onClick={() => onSave("not json")}>
        tool-save-invalid
      </button>
      <button type="button" onClick={() => onSave(JSON.stringify({ function: { description: "no name" } }))}>
        tool-save-unnamed
      </button>
    </>
  ),
}));

vi.mock("./PublishModal", () => ({
  __esModule: true,
  default: ({ visible, onPublish }: { visible: boolean; onPublish: () => void }) =>
    visible ? (
      <button type="button" onClick={onPublish}>
        publish-submit
      </button>
    ) : null,
}));

vi.mock("./VersionHistorySidePanel", () => ({
  __esModule: true,
  default: ({ isOpen, onSelectVersion }: { isOpen: boolean; onSelectVersion: (version: unknown) => void }) =>
    isOpen ? (
      <button type="button" onClick={() => onSelectVersion({})}>
        select-broken-version
      </button>
    ) : null,
}));

const validDotprompt = "---\nmodel: gpt-4o\n---\n\nUser: Hello";

const existingPrompt = {
  prompt_spec: {
    prompt_id: "welcome",
    litellm_params: { dotprompt_content: validDotprompt },
  },
};

const renderEditor = (props: { accessToken?: string | null; initialPromptData?: unknown } = {}) =>
  renderWithProviders(<PromptEditorView onClose={vi.fn()} onSuccess={vi.fn()} accessToken="sk-test" {...props} />);

describe("PromptEditorView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(createPromptCall).mockResolvedValue(undefined as never);
    vi.mocked(updatePromptCall).mockResolvedValue(undefined as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese view modes and default name while the seeded message body stays English", () => {
    renderEditor();

    expect(screen.getByRole("button", { name: "美化" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PRETTY" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOTPROMPT" })).toBeInTheDocument();
    const nameField = screen.getByRole("textbox", { name: "提示词名称" });
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "新提示词");
    expect(screen.queryByDisplayValue("New prompt")).not.toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Enter task specifics. Use {{template_variables}} for dynamic inputs"),
    ).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("在此填写任务细节。使用 {{template_variables}} 作为动态输入"),
    ).not.toBeInTheDocument();
  });

  it("keeps the English view modes, default name and default message byte-identical", async () => {
    await i18n.changeLanguage("en");
    renderEditor();

    expect(screen.getByRole("button", { name: "PRETTY" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DOTPROMPT" })).toBeInTheDocument();
    const nameField = screen.getByRole("textbox", { name: "Prompt name" });
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "New prompt");
    expect(
      screen.getByDisplayValue("Enter task specifics. Use {{template_variables}} for dynamic inputs"),
    ).toBeInTheDocument();
  });

  it("renders the Chinese unnamed-prompt placeholder while the raw name stays English", () => {
    renderEditor({
      initialPromptData: { prompt_spec: { litellm_params: { dotprompt_content: validDotprompt } } },
    });

    const nameField = screen.getByRole("textbox", { name: "提示词名称" });
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "未命名提示词");
    expect(screen.queryByDisplayValue("Unnamed Prompt")).not.toBeInTheDocument();
  });

  it("persists the English message body in dotprompt_content when saving from the Chinese UI", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "保存" }));
    await user.click(screen.getByRole("button", { name: "publish-submit" }));

    await vi.waitFor(() =>
      expect(createPromptCall).toHaveBeenCalledWith(
        "sk-test",
        expect.objectContaining({
          litellm_params: expect.objectContaining({
            dotprompt_content: expect.stringContaining(
              "User: Enter task specifics. Use {{template_variables}} for dynamic inputs",
            ),
          }),
        }),
      ),
    );
    expect(JSON.stringify(vi.mocked(createPromptCall).mock.calls)).not.toContain("在此填写任务细节");
  });

  it("shows the Chinese parse-failure toast and hides the English original", () => {
    renderEditor({ initialPromptData: { prompt_spec: { litellm_params: { dotprompt_content: "no frontmatter" } } } });

    expect(toast.fromError).toHaveBeenCalledWith("解析提示词数据失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to parse prompt data");
  });

  it("adds a tool under the Chinese unnamed-tool fallback, hiding the English original", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "添加" }));
    await user.click(screen.getByRole("button", { name: "tool-save-unnamed" }));

    expect(screen.getByText("未命名工具")).toBeInTheDocument();
    expect(screen.queryByText("Unnamed Tool")).not.toBeInTheDocument();
  });

  it("shows the Chinese invalid-JSON toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "添加" }));
    await user.click(screen.getByRole("button", { name: "tool-save-invalid" }));

    expect(toast.fromError).toHaveBeenCalledWith("JSON 格式无效");
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON format");
  });

  it("shows the Chinese version-load-failure toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor({ initialPromptData: existingPrompt });

    await user.click(screen.getByRole("button", { name: "历史记录" }));
    await user.click(screen.getByRole("button", { name: "select-broken-version" }));

    expect(toast.fromError).toHaveBeenCalledWith("加载提示词版本失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load prompt version");
  });

  it("shows the Chinese access-token toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor({ accessToken: null, initialPromptData: existingPrompt });

    await user.click(screen.getByRole("button", { name: "更新" }));

    expect(toast.fromError).toHaveBeenCalledWith("需要访问 Token");
    expect(toast.fromError).not.toHaveBeenCalledWith("Access token is required");
  });

  it("shows the Chinese prompt-name-required toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor();

    const nameField = screen.getByRole("textbox", { name: "提示词名称" });
    fireEvent.change(nameField, { target: { value: "named" } });
    fireEvent.change(nameField, { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "保存" }));
    await user.click(screen.getByRole("button", { name: "publish-submit" }));

    expect(toast.fromError).toHaveBeenCalledWith("请输入有效的提示词名称");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please enter a valid prompt name");
  });

  it("shows the Chinese created toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole("button", { name: "保存" }));
    await user.click(screen.getByRole("button", { name: "publish-submit" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("提示词创建成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Prompt created successfully!");
  });

  it("shows the Chinese updated toast and hides the English original", async () => {
    const user = userEvent.setup();
    renderEditor({ initialPromptData: existingPrompt });

    await user.click(screen.getByRole("button", { name: "更新" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("提示词更新成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Prompt updated successfully!");
  });

  it("shows the Chinese update-failure toast and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(updatePromptCall).mockRejectedValue(new Error("boom"));
    renderEditor({ initialPromptData: existingPrompt });

    await user.click(screen.getByRole("button", { name: "更新" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新提示词失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update prompt");
  });

  it("shows the Chinese save-failure toast and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(createPromptCall).mockRejectedValue(new Error("boom"));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "保存" }));
    await user.click(screen.getByRole("button", { name: "publish-submit" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存提示词失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save prompt");
  });
});
