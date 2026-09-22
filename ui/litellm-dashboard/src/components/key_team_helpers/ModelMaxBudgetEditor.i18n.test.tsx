import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { ModelMaxBudgetEditor, type ModelMaxBudget } from "./ModelMaxBudgetEditor";

const STORED: ModelMaxBudget = { "gpt-4o": { budget_limit: 5, time_period: "30d" } };

const renderEditor = (premiumUser: boolean, value: ModelMaxBudget = STORED) =>
  renderWithProviders(
    <ModelMaxBudgetEditor
      value={value}
      onChange={vi.fn()}
      availableModels={["gpt-4o", "claude-opus-4-8"]}
      premiumUser={premiumUser}
      usage={{ "gpt-4o": { current_spend: 1.25, budget_limit: 5, time_period: "30d" } }}
    />,
  );

describe("ModelMaxBudgetEditor Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the locked blurb in Chinese and hides the English original", () => {
    renderEditor(false);

    expect(screen.getByText("高级功能 - 升级后可设置按模型预算")).toBeInTheDocument();
    expect(screen.queryByText("Premium feature - Upgrade to set per-model budgets")).not.toBeInTheDocument();
  });

  it("renders the premium blurb in Chinese and hides the English original", () => {
    renderEditor(true);

    expect(
      screen.getByText("按模型限制其在各自窗口内的消费。为裸模型名设置的预算也会覆盖该模型的带提供商前缀写法。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Cap spend per model over its own window. A budget set on the bare model name also covers the provider-prefixed spelling of that model.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the entry fields, period label and window spend in Chinese and hides the English originals", () => {
    renderEditor(true);

    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Model")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加模型预算" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Model Budget" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("最大消费（$）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Max spend ($)")).not.toBeInTheDocument();
    expect(screen.getByText("每月")).toBeInTheDocument();
    expect(screen.queryByText("Monthly")).not.toBeInTheDocument();
    expect(screen.getByText("当前窗口消费：$1.25 / $5")).toBeInTheDocument();
    expect(screen.queryByText(/Current window spend: \$1.25/)).not.toBeInTheDocument();
  });

  it("renders the calendar-month period in Chinese and hides the English original", () => {
    renderEditor(true, { "gpt-4o": { budget_limit: 5, time_period: "1mo" } });

    expect(screen.getByText("自然月")).toBeInTheDocument();
    expect(screen.queryByText("Calendar month")).not.toBeInTheDocument();
  });

  it("renders the add-model-budget empty state in Chinese and hides the English originals", () => {
    renderEditor(true, {});

    expect(screen.getByRole("button", { name: "添加模型预算" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Model Budget" })).not.toBeInTheDocument();
    expect(
      screen.getByText("按模型限制其在各自窗口内的消费。为裸模型名设置的预算也会覆盖该模型的带提供商前缀写法。"),
    ).toBeInTheDocument();
  });
});
