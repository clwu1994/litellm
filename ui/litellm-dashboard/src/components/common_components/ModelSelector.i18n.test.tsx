import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { chooseSelectOption, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import ModelSelector from "./ModelSelector";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

describe("ModelSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese label and placeholder and hides the English defaults", () => {
    renderWithProviders(<ModelSelector accessToken="token" />);

    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a Model")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-model option and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelSelector accessToken="token" />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("输入自定义模型")).toBeInTheDocument();
    expect(screen.queryByText("Enter custom model")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-model input placeholder and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelSelector accessToken="token" />);

    await chooseSelectOption(user, screen.getByRole("combobox"), "输入自定义模型");

    expect(screen.getByPlaceholderText("输入自定义模型名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter custom model name")).not.toBeInTheDocument();
  });
});
