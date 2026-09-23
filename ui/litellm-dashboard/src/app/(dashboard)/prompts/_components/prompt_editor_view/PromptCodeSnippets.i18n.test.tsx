import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PromptCodeSnippets from "./PromptCodeSnippets";

const defaultProps = {
  promptId: "welcome",
  model: "gpt-4o",
  promptVariables: { name: "Ada" },
  accessToken: "token",
  version: "2",
};

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  renderWithProviders(<PromptCodeSnippets {...defaultProps} />);
  await user.click(screen.getByRole("button", { name: "获取代码" }));
  return screen.findByRole("dialog");
};

describe("PromptCodeSnippets Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese trigger and dialog chrome, hiding the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderWithProviders(<PromptCodeSnippets {...defaultProps} />);

    expect(screen.getByRole("button", { name: "获取代码" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Get Code" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "获取代码" }));
    await screen.findByRole("dialog");

    expect(screen.getByText("生成的代码")).toBeInTheDocument();
    expect(screen.queryByText("Generated Code")).not.toBeInTheDocument();
    expect(screen.getByLabelText("语言")).toBeInTheDocument();
    expect(screen.queryByLabelText("Language")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /复制到剪贴板/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy to Clipboard/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "生成的代码类型" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist", { name: "Generated code type" })).not.toBeInTheDocument();
  });

  it("renders the Chinese snippet tabs, hiding the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    await openDialog(user);

    for (const [zh, en] of [
      ["基础", "Basic"],
      ["带消息", "With Messages"],
      ["带版本", "With Version"],
    ] as const) {
      expect(screen.getByRole("tab", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese programming-language labels and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    await openDialog(user);

    const trigger = screen.getByLabelText("语言");
    expect(trigger).toHaveTextContent("cURL");

    await user.click(trigger);
    expect(await screen.findByRole("option", { name: "Python（OpenAI SDK）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Python (OpenAI SDK)" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "JavaScript（OpenAI SDK）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "JavaScript (OpenAI SDK)" })).not.toBeInTheDocument();
  });

  it("shows the Chinese copied toast and hides the English original", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: /复制到剪贴板/ }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制到剪贴板！"));
    expect(toast.success).not.toHaveBeenCalledWith("Copied to clipboard!");
  });
});
