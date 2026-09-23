import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { ModelSelector } from "./ModelSelector";

const MODELS = ["gpt-4", "gpt-3.5-turbo"];

describe("ModelSelector", () => {
  it("should render", () => {
    render(<ModelSelector value="" onChange={vi.fn()} models={MODELS} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("reports the model the user picks from the dropdown", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModelSelector value="" onChange={onChange} models={MODELS} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "gpt-4" }));

    expect(onChange).toHaveBeenCalledWith("gpt-4");
  });

  it("displays a custom value that is not one of the known models", () => {
    render(<ModelSelector value="custom-model-123" onChange={vi.fn()} models={MODELS} />);

    expect(screen.getByRole("combobox")).toHaveValue("custom-model-123");
  });

  it("reports a custom model typed into the custom name field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModelSelector value="" onChange={onChange} models={MODELS} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "+ Add custom model" }));
    await user.type(await screen.findByPlaceholderText("Custom Model Name (Enter to add)"), "my-custom-model{Enter}");

    expect(onChange).toHaveBeenCalledWith("my-custom-model");
  });

  it("disables the control when disabled is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ModelSelector value="custom-model-123" onChange={onChange} models={MODELS} />);
    expect(screen.getByRole("combobox")).toBeEnabled();

    rerender(<ModelSelector value="custom-model-123" onChange={onChange} models={MODELS} disabled={true} />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeDisabled();

    await user.click(combobox);
    await user.keyboard("gpt-4");

    expect(combobox).toHaveValue("custom-model-123");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ModelSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholders and hides the English originals", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ModelSelector value="" onChange={vi.fn()} models={MODELS} />);

    expect(screen.getByPlaceholderText("选择一个模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model")).not.toBeInTheDocument();

    unmount();
    render(<ModelSelector value="" onChange={vi.fn()} models={MODELS} loading />);
    expect(screen.getByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-model option and placeholder and hides the English originals", async () => {
    const user = userEvent.setup();
    render(<ModelSelector value="" onChange={vi.fn()} models={MODELS} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "+ 添加自定义模型" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "+ Add custom model" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "+ 添加自定义模型" }));
    expect(await screen.findByPlaceholderText("自定义模型名称（按 Enter 添加）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Custom Model Name (Enter to add)")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    const user = userEvent.setup();
    render(<ModelSelector value="" onChange={vi.fn()} models={MODELS} />);

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    await user.type(combobox, "zzz");

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });
});
