import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

const OPTIONS: MultiSelectOption[] = [
  { value: "vs-alpha", label: "alpha-kb (vs-alpha)" },
  { value: "vs-beta", label: "beta-kb (vs-beta)" },
];

describe("MultiSelect Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English default", () => {
    renderWithProviders(<MultiSelect options={OPTIONS} onValueChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择选项")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select options")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholder and hides the English default", () => {
    renderWithProviders(<MultiSelect options={OPTIONS} onValueChange={vi.fn()} loading />);

    expect(screen.getByPlaceholderText("加载中...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English default", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MultiSelect options={OPTIONS} onValueChange={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("未找到选项")).toBeInTheDocument();
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("renders the Chinese create-custom-value label and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MultiSelect options={OPTIONS} onValueChange={vi.fn()} allowCustomValues />);

    await user.type(screen.getByRole("combobox"), "vs-typed");

    expect(await screen.findByText('创建 "vs-typed"')).toBeInTheDocument();
    expect(screen.queryByText('Create "vs-typed"')).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-all label and hides the English original", () => {
    renderWithProviders(<MultiSelect options={OPTIONS} value={["vs-alpha"]} onValueChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "清除全部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
  });
});
