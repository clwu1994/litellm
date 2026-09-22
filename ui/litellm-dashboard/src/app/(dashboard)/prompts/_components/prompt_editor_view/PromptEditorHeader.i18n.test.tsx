import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PromptEditorHeader from "./PromptEditorHeader";

vi.mock("./PromptCodeSnippets", () => ({
  default: ({ promptId, environment }: { promptId: string; environment?: string }) => (
    <button data-testid="code-snippets" data-prompt-id={promptId} data-environment={environment} />
  ),
}));

const defaultProps = {
  promptName: "welcome",
  onNameChange: vi.fn(),
  onBack: vi.fn(),
  onSave: vi.fn(),
  isSaving: false,
  accessToken: "token",
  environment: "development",
  onEnvironmentChange: vi.fn(),
};

describe("PromptEditorHeader Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese navigation, name field and draft chrome, hiding the English originals", () => {
    renderWithProviders(<PromptEditorHeader {...defaultProps} />);

    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "提示词名称" })).toHaveValue("welcome");
    expect(screen.queryByRole("textbox", { name: "Prompt name" })).not.toBeInTheDocument();
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.getByText("未保存的更改")).toBeInTheDocument();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders the Chinese history and update actions in edit mode, hiding the English originals", () => {
    renderWithProviders(<PromptEditorHeader {...defaultProps} editMode onShowHistory={vi.fn()} />);

    expect(screen.getByRole("button", { name: "历史记录" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "History" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "保存" })).not.toBeInTheDocument();
  });

  it("shows the Chinese default prompt name without translating the identifier sent to the code snippets", () => {
    renderWithProviders(<PromptEditorHeader {...defaultProps} promptName="New prompt" />);

    expect(screen.getByRole("textbox", { name: "提示词名称" })).toHaveValue("新提示词");
    expect(screen.queryByDisplayValue("New prompt")).not.toBeInTheDocument();
    expect(screen.getByTestId("code-snippets")).toHaveAttribute("data-prompt-id", "New prompt");
  });

  it("keeps the English default prompt name byte-identical", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<PromptEditorHeader {...defaultProps} promptName="New prompt" />);

    expect(screen.getByRole("textbox", { name: "Prompt name" })).toHaveValue("New prompt");
    expect(screen.getByTestId("code-snippets")).toHaveAttribute("data-prompt-id", "New prompt");
  });

  it("renders the Chinese environment label and options, hiding the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderWithProviders(<PromptEditorHeader {...defaultProps} />);

    const trigger = screen.getByRole("combobox", { name: "环境" });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Environment" })).not.toBeInTheDocument();

    await user.click(trigger);

    for (const [zh, en] of [
      ["开发", "Development"],
      ["预发布", "Staging"],
      ["生产", "Production"],
    ] as const) {
      expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
    }
  });
});
