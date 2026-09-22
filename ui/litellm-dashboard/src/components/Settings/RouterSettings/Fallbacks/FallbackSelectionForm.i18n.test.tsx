import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { FallbackSelectionForm } from "./FallbackSelectionForm";
import type { FallbackGroup } from "./FallbackGroupConfig";

const AVAILABLE_MODELS = ["gpt-4", "gpt-3.5-turbo", "claude-3-opus"];

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const renderForm = (
  groups: FallbackGroup[],
  { maxFallbacks, availableModels = AVAILABLE_MODELS }: { maxFallbacks?: number; availableModels?: string[] } = {},
) =>
  renderWithProviders(
    <FallbackSelectionForm
      groups={groups}
      onGroupsChange={vi.fn()}
      availableModels={availableModels}
      maxFallbacks={maxFallbacks}
    />,
  );

describe("FallbackSelectionForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the empty state in Chinese and hides the English originals", () => {
    renderForm([]);

    expect(screen.getByText("未配置回退分组")).toBeInTheDocument();
    expect(screen.queryByText("No fallback groups configured")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建第一个分组" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create First Group" })).not.toBeInTheDocument();
  });

  it("renders the group tab and every fallback group config label in Chinese and hides the English originals", () => {
    renderForm([{ id: "1", primaryModel: null, fallbackModels: [] }]);

    expect(screen.getByRole("tab", { name: "分组 1" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Group 1" })).not.toBeInTheDocument();
    expect(screen.getByText("主模型")).toBeInTheDocument();
    expect(screen.queryByText("Primary Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择主模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select primary model")).not.toBeInTheDocument();
    expect(screen.getByText("选择一个模型以开始配置回退")).toBeInTheDocument();
    expect(screen.queryByText("Select a model to begin configuring fallbacks")).not.toBeInTheDocument();
    expect(screen.getByText("如果失败，尝试...")).toBeInTheDocument();
    expect(screen.queryByText("IF FAILS, TRY...")).not.toBeInTheDocument();
    expect(screen.getByText("回退链")).toBeInTheDocument();
    expect(screen.queryByText("Fallback Chain")).not.toBeInTheDocument();
    expect(screen.getByText("（一次最多 10 个回退）")).toBeInTheDocument();
    expect(screen.queryByText("(Max 10 fallbacks at a time)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要添加的回退模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select fallback models to add...")).not.toBeInTheDocument();
    expect(screen.getByText("搜索并选择多个模型。所选模型将按顺序显示在下方。（已使用 0/10）")).toBeInTheDocument();
    expect(
      screen.queryByText("Search and select multiple models. Selected models will appear below in order. (0/10 used)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("未选择回退模型")).toBeInTheDocument();
    expect(screen.queryByText("No fallback models selected")).not.toBeInTheDocument();
    expect(screen.getByText("从上方下拉菜单添加模型")).toBeInTheDocument();
    expect(screen.queryByText("Add models from the dropdown above")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加回退分组" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add fallback group" })).not.toBeInTheDocument();
  });

  it("renders the fallback chain list and the reached-limit copy in Chinese and hides the English originals", () => {
    renderForm([{ id: "1", primaryModel: "gpt-4", fallbackModels: ["gpt-3.5-turbo"] }], { maxFallbacks: 1 });

    const chain = screen.getByRole("list", { name: "回退链" });
    expect(within(chain).getByText("gpt-3.5-turbo")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Fallback chain" })).not.toBeInTheDocument();
    expect(within(chain).getByRole("button", { name: "移除 gpt-3.5-turbo" })).toBeInTheDocument();
    expect(within(chain).queryByRole("button", { name: "Remove gpt-3.5-turbo" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("已达到最多 1 个回退")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Maximum 1 fallbacks reached")).not.toBeInTheDocument();
    expect(screen.getByText("已达到最多 1 个回退。请移除一些以添加更多。")).toBeInTheDocument();
    expect(screen.queryByText("Maximum 1 fallbacks reached. Remove some to add more.")).not.toBeInTheDocument();
  });

  it("renders the no-models empty text in Chinese while the picker is open and hides the English original", async () => {
    renderForm([{ id: "1", primaryModel: null, fallbackModels: [] }], { availableModels: [] });

    await user().click(screen.getByPlaceholderText("选择主模型"));

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });
});

describe("FallbackSelectionForm English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the empty state byte-identical", () => {
    renderForm([]);

    expect(screen.getByText("No fallback groups configured")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create First Group" })).toBeInTheDocument();
  });

  it("keeps every fallback group config label byte-identical", () => {
    renderForm([{ id: "1", primaryModel: null, fallbackModels: [] }]);

    expect(screen.getByRole("tab", { name: "Group 1" })).toBeInTheDocument();
    expect(screen.getByText("Primary Model")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select primary model")).toBeInTheDocument();
    expect(screen.getByText("Select a model to begin configuring fallbacks")).toBeInTheDocument();
    expect(screen.getByText("IF FAILS, TRY...")).toBeInTheDocument();
    expect(screen.getByText("Fallback Chain")).toBeInTheDocument();
    expect(screen.getByText("(Max 10 fallbacks at a time)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select fallback models to add...")).toBeInTheDocument();
    expect(
      screen.getByText("Search and select multiple models. Selected models will appear below in order. (0/10 used)"),
    ).toBeInTheDocument();
    expect(screen.getByText("No fallback models selected")).toBeInTheDocument();
    expect(screen.getByText("Add models from the dropdown above")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add fallback group" })).toBeInTheDocument();
  });

  it("keeps the fallback chain list and the reached-limit copy byte-identical", () => {
    renderForm([{ id: "1", primaryModel: "gpt-4", fallbackModels: ["gpt-3.5-turbo"] }], { maxFallbacks: 1 });

    const chain = screen.getByRole("list", { name: "Fallback chain" });
    expect(within(chain).getByRole("button", { name: "Remove gpt-3.5-turbo" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Maximum 1 fallbacks reached")).toBeInTheDocument();
    expect(screen.getByText("Maximum 1 fallbacks reached. Remove some to add more.")).toBeInTheDocument();
  });

  it("keeps the no-models empty text byte-identical while the picker is open", async () => {
    renderForm([{ id: "1", primaryModel: null, fallbackModels: [] }], { availableModels: [] });

    await user().click(screen.getByPlaceholderText("Select primary model"));

    expect(await screen.findByText("No models found")).toBeInTheDocument();
  });
});
