import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ProviderDiscountTable from "./provider_discount_table";

const renderTable = (discountConfig: Record<string, number>) =>
  renderWithProviders(
    <ProviderDiscountTable discountConfig={discountConfig} onDiscountChange={vi.fn()} onRemoveProvider={vi.fn()} />,
  );

describe("ProviderDiscountTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers and hides the English originals", () => {
    renderTable({ openai: 0.05 });

    expect(screen.getByRole("columnheader", { name: "提供商" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "折扣百分比" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Provider" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Discount Percentage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions and swaps them when editing", async () => {
    const user = userEvent.setup();
    renderTable({ openai: 0.05 });

    expect(screen.getByRole("button", { name: "编辑 OpenAI 的折扣" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 OpenAI 的折扣" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit discount for OpenAI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove discount for OpenAI" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑 OpenAI 的折扣" }));

    expect(screen.getByRole("button", { name: "保存 OpenAI 的折扣" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消编辑 OpenAI 的折扣" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save discount for OpenAI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel editing discount for OpenAI" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty message when no discounts are configured", () => {
    renderTable({});

    expect(screen.getByText("尚未配置提供商折扣")).toBeInTheDocument();
    expect(screen.queryByText("No provider discounts configured")).not.toBeInTheDocument();
  });
});
