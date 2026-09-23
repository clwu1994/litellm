/* eslint-disable testing-library/no-node-access -- the hint triggers are icons with no accessible name, so opening their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import AddMarginForm from "./add_margin_form";

const DEFAULT_PROPS = {
  marginConfig: {},
  selectedProvider: undefined,
  marginType: "percentage" as const,
  percentageValue: "",
  fixedAmountValue: "",
  onProviderChange: vi.fn(),
  onMarginTypeChange: vi.fn(),
  onPercentageChange: vi.fn(),
  onFixedAmountChange: vi.fn(),
  onAddProvider: vi.fn(),
};

const openHint = async (user: ReturnType<typeof userEvent.setup>, label: string): Promise<HTMLElement> => {
  const labelEl = screen.getByText(label).closest('[data-slot="field-label"]');
  const trigger = labelEl?.querySelector('[data-slot="tooltip-trigger"]');
  await user.hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

describe("AddMarginForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese provider field, margin type options and submit action", () => {
    renderWithProviders(<AddMarginForm {...DEFAULT_PROPS} />);

    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择提供商或「全局」")).toBeInTheDocument();
    expect(screen.getByText("加价类型")).toBeInTheDocument();
    expect(screen.getByText("基于百分比")).toBeInTheDocument();
    expect(screen.getByText("固定金额")).toBeInTheDocument();
    expect(screen.getByText("加价百分比")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加提供商加价" })).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select provider or 'Global'")).not.toBeInTheDocument();
    expect(screen.queryByText("Margin Type")).not.toBeInTheDocument();
    expect(screen.queryByText("Percentage-based")).not.toBeInTheDocument();
    expect(screen.queryByText("Fixed Amount")).not.toBeInTheDocument();
    expect(screen.queryByText("Margin Percentage")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Provider Margin" })).not.toBeInTheDocument();
  });

  it("renders the Chinese fixed amount field when the margin type is fixed", () => {
    renderWithProviders(<AddMarginForm {...DEFAULT_PROPS} marginType="fixed" />);

    expect(screen.getByText("固定加价金额")).toBeInTheDocument();
    expect(screen.queryByText("Fixed Margin Amount")).not.toBeInTheDocument();
  });

  it("renders each Chinese hint in its open tooltip and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMarginForm {...DEFAULT_PROPS} />);

    const providerHint = await openHint(user, "提供商");
    expect(providerHint).toHaveTextContent("选择「全局」以对所有提供商应用加价，或选择特定提供商");
    expect(providerHint).not.toHaveTextContent(
      "Select 'Global' to apply margin to all providers, or select a specific provider",
    );

    const typeHint = await openHint(user, "加价类型");
    expect(typeHint).toHaveTextContent("选择加价的应用方式：基于百分比或固定金额");
    expect(typeHint).not.toHaveTextContent("Choose how to apply the margin: percentage-based or fixed amount");

    const percentageHint = await openHint(user, "加价百分比");
    expect(percentageHint).toHaveTextContent("请输入百分比值（例如 10 表示 10% 加价）");
    expect(percentageHint).not.toHaveTextContent("Enter a percentage value (e.g., 10 for 10% margin)");
  });

  it("renders the Chinese fixed amount hint in its open tooltip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMarginForm {...DEFAULT_PROPS} marginType="fixed" />);

    const fixedHint = await openHint(user, "固定加价金额");
    expect(fixedHint).toHaveTextContent("请输入以 USD 计的固定金额（例如 0.001 表示每请求 $0.001）");
    expect(fixedHint).not.toHaveTextContent("Enter a fixed amount in USD (e.g., 0.001 for $0.001 per request)");
  });

  it("renders the Chinese empty combobox message", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMarginForm {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("没有匹配的提供商")).toBeInTheDocument();
    expect(screen.queryByText("No matching providers")).not.toBeInTheDocument();
  });
});
