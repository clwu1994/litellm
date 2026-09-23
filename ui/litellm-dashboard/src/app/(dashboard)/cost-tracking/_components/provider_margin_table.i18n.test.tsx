import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ProviderMarginTable from "./provider_margin_table";

const renderTable = (marginConfig: Record<string, number | { percentage?: number; fixed_amount?: number }>) =>
  renderWithProviders(
    <ProviderMarginTable marginConfig={marginConfig} onMarginChange={vi.fn()} onRemoveProvider={vi.fn()} />,
  );

describe("ProviderMarginTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers and the global provider label", () => {
    renderTable({ openai: 0.1, global: 0.05 });

    expect(screen.getByRole("columnheader", { name: "提供商" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "加价" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.getByText("全局（所有提供商）")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Provider" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Margin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.queryByText("Global (All Providers)")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions for a named provider and for global", async () => {
    const user = userEvent.setup();
    renderTable({ openai: 0.1, global: 0.05 });

    expect(screen.getByRole("button", { name: "编辑 OpenAI 的加价" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 OpenAI 的加价" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑 全局 的加价" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 全局 的加价" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit margin for OpenAI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove margin for Global" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑 OpenAI 的加价" }));

    expect(screen.getByRole("button", { name: "保存 OpenAI 的加价" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消编辑 OpenAI 的加价" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save margin for OpenAI" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel editing margin for OpenAI" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty message when no margins are configured", () => {
    renderTable({});

    expect(screen.getByText("尚未配置提供商加价")).toBeInTheDocument();
    expect(screen.queryByText("No provider margins configured")).not.toBeInTheDocument();
  });
});
