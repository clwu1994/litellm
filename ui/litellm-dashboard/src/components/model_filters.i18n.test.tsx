import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ModelFilters from "./model_filters";

const models = [
  {
    model_group: "gpt-4",
    providers: ["openai"],
    mode: "chat",
    supports_parallel_function_calling: false,
    supports_vision: true,
    supports_function_calling: true,
    is_public_model_group: true,
  },
];

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("ModelFilters Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the filter labels and defaults in Chinese and hides the English originals", () => {
    renderWithProviders(<ModelFilters modelHubData={models} onFilteredDataChange={() => {}} />);

    expectLocalized("搜索模型：", "Search Models:");
    expectLocalized("提供商：", "Provider:");
    expectLocalized("模式：", "Mode:");
    expectLocalized("功能：", "Features:");
    expectLocalized("所有提供商", "All Providers");
    expectLocalized("所有模式", "All Modes");
    expectLocalized("所有功能", "All Features");
    expect(screen.getByPlaceholderText("搜索模型名称...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search model names...")).not.toBeInTheDocument();
  });

  it("renders the clear-filters action in Chinese and hides the English original", () => {
    renderWithProviders(<ModelFilters modelHubData={models} onFilteredDataChange={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("搜索模型名称..."), { target: { value: "gpt" } });

    expectLocalized("清除筛选", "Clear Filters");
  });

  it("keeps the provider, mode and feature values in English", () => {
    renderWithProviders(<ModelFilters modelHubData={models} onFilteredDataChange={() => {}} />);

    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("chat")).toBeInTheDocument();
    expect(screen.getByText("Vision")).toBeInTheDocument();
  });
});
