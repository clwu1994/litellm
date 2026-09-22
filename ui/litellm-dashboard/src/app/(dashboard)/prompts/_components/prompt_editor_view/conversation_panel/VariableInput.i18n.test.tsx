import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VariableInput from "./VariableInput";

describe("VariableInput Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title and variable placeholder, hiding the English originals", () => {
    renderWithProviders(<VariableInput extractedVariables={["name"]} variables={{}} onVariableChange={vi.fn()} />);

    expect(screen.getByText("填写模板变量以开始测试")).toBeInTheDocument();
    expect(screen.queryByText("Fill in template variables to start testing")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 name 的值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter value for name")).not.toBeInTheDocument();
  });

  it("renders the English variable placeholder byte-identically from the catalog", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<VariableInput extractedVariables={["name"]} variables={{}} onVariableChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("Enter value for name")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("输入 name 的值")).not.toBeInTheDocument();
  });
});
