import React, { useState } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PublishModal from "./PublishModal";

const defaultProps = {
  visible: true,
  promptName: "welcome",
  isSaving: false,
  onNameChange: vi.fn(),
  onPublish: vi.fn(),
  onCancel: vi.fn(),
};

const ControlledModal = ({ initialName }: { initialName: string }) => {
  const [name, setName] = useState(initialName);
  return <PublishModal {...defaultProps} promptName={name} onNameChange={setName} />;
};

describe("PublishModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome, hiding the English originals", async () => {
    renderWithProviders(<PublishModal {...defaultProps} />);

    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText("发布提示词")).toBeInTheDocument();
    expect(screen.queryByText("Publish Prompt")).not.toBeInTheDocument();
    expect(screen.getByText("发布的提示词会进行版本管理，并可在 API 调用中使用。")).toBeInTheDocument();
    expect(screen.queryByText("Published prompts are versioned and can be used in API calls.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入提示词名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter prompt name")).not.toBeInTheDocument();
    expect(screen.getByText("发布的提示词可在 API 调用中使用，并进行版本管理以便追踪。")).toBeInTheDocument();
    expect(
      screen.queryByText("Published prompts can be used in API calls and are versioned for easy tracking."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });

  it("shows the Chinese default prompt name as a display-only placeholder, hiding the English original", async () => {
    renderWithProviders(<PublishModal {...defaultProps} promptName="New prompt" />);

    const nameField = await screen.findByLabelText("名称");
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "新提示词");
    expect(screen.queryByDisplayValue("New prompt")).not.toBeInTheDocument();
  });

  it("shows the Chinese unnamed-prompt placeholder, hiding the English original", async () => {
    renderWithProviders(<PublishModal {...defaultProps} promptName="Unnamed Prompt" />);

    const nameField = await screen.findByLabelText("名称");
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "未命名提示词");
    expect(screen.queryByDisplayValue("Unnamed Prompt")).not.toBeInTheDocument();
  });

  it("stores the user's raw typed name, never the displayed placeholder", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledModal initialName="New prompt" />);

    const nameField = await screen.findByLabelText("名称");
    await user.type(nameField, "welcome");

    expect(nameField).toHaveValue("welcome");
    expect(nameField).toHaveAttribute("placeholder", "输入提示词名称");
  });

  it("keeps the English default prompt name byte-identical", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<PublishModal {...defaultProps} promptName="New prompt" />);

    const nameField = await screen.findByLabelText("Name");
    expect(nameField).toHaveValue("");
    expect(nameField).toHaveAttribute("placeholder", "New prompt");
  });
});
