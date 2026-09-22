import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VariableTextArea from "./variable_textarea";

describe("VariableTextArea Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese detected-variables label and hides the English original", () => {
    renderWithProviders(<VariableTextArea value="Hello {{name}}" onChange={vi.fn()} placeholder="Prompt" />);

    expect(screen.getByText("检测到的变量：")).toBeInTheDocument();
    expect(screen.queryByText("Detected variables:")).not.toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
  });

  it("renders the Chinese popover copy while it is open and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VariableTextArea value="Hello {{name}}" onChange={vi.fn()} placeholder="Prompt" />);

    await user.click(screen.getByText("name"));

    expect(await screen.findByText("编辑变量名")).toBeInTheDocument();
    expect(screen.queryByText("Edit variable name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("变量名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Variable name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
