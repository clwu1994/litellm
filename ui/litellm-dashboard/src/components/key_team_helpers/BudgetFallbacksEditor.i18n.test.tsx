import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { BudgetFallbacksEditor } from "./BudgetFallbacksEditor";

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("BudgetFallbacksEditor Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the empty state in Chinese and hides the English originals", () => {
    renderWithProviders(<BudgetFallbacksEditor value={{}} onChange={vi.fn()} availableModels={["gpt-4"]} />);

    expectLocalized(
      "当模型超出其按模型预算时，请求会自动改道到回退模型",
      "When a model exceeds its per-model budget, requests automatically reroute to fallback models",
    );
    expectLocalized("添加预算回退", "Add Budget Fallback");
  });

  it("renders the entry fields in Chinese and hides the English originals", () => {
    renderWithProviders(
      <BudgetFallbacksEditor
        value={{ "gpt-4": ["gpt-3.5-turbo", "claude-3"] }}
        onChange={vi.fn()}
        availableModels={["gpt-4"]}
      />,
    );

    expectLocalized("主模型", "Primary Model");
    expectLocalized("超出预算时，尝试", "IF BUDGET EXCEEDED, TRY");
    expectLocalized("回退模型", "Fallback Models");
    expect(screen.getByText("按顺序尝试；使用第一个仍在自身预算内的模型")).toBeInTheDocument();
    expect(
      screen.queryByText("Tried in order; first model still within its own budget is used"),
    ).not.toBeInTheDocument();
  });

  it("renders the fallback placeholder and empty text in Chinese in the open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BudgetFallbacksEditor value={{ "gpt-4": ["gpt-3.5-turbo"] }} onChange={vi.fn()} availableModels={[]} />,
    );

    expect(screen.getByPlaceholderText("选择回退模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select fallback models")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择回退模型"));

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the primary-model placeholder in Chinese after adding an entry", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetFallbacksEditor value={{}} onChange={vi.fn()} availableModels={[]} />);

    await user.click(screen.getByRole("button", { name: "添加预算回退" }));

    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("请先选择主模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a primary model first")).not.toBeInTheDocument();
  });
});
