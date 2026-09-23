/* eslint-disable testing-library/no-node-access -- the hint triggers are icons with no accessible name, so opening their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import AddProviderForm from "./add_provider_form";

const DEFAULT_PROPS = {
  discountConfig: {},
  selectedProvider: undefined,
  newDiscount: "",
  onProviderChange: vi.fn(),
  onDiscountChange: vi.fn(),
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

describe("AddProviderForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese labels, placeholder and submit action", () => {
    renderWithProviders(<AddProviderForm {...DEFAULT_PROPS} />);

    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("折扣百分比")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择提供商")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加提供商折扣" })).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount Percentage")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select provider")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Provider Discount" })).not.toBeInTheDocument();
  });

  it("renders each Chinese hint in its open tooltip and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddProviderForm {...DEFAULT_PROPS} />);

    const providerHint = await openHint(user, "提供商");
    expect(providerHint).toHaveTextContent("选择要为其配置折扣的 LLM 提供商");
    expect(providerHint).not.toHaveTextContent("Select the LLM provider you want to configure a discount for");

    const discountHint = await openHint(user, "折扣百分比");
    expect(discountHint).toHaveTextContent("请输入百分比值（例如 5 表示 5% 折扣）");
    expect(discountHint).not.toHaveTextContent("Enter a percentage value (e.g., 5 for 5% discount)");
  });

  it("renders the Chinese empty combobox message", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddProviderForm {...DEFAULT_PROPS} />);

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("未找到提供商")).toBeInTheDocument();
    expect(screen.queryByText("No providers found")).not.toBeInTheDocument();
  });
});
