import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VariableWarning from "./VariableWarning";

describe("VariableWarning Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese warning and missing-variable list, hiding the English originals", () => {
    renderWithProviders(<VariableWarning extractedVariables={["name", "topic"]} variables={{ name: "Ada" }} />);

    expect(screen.getByText("请填写上方所有模板变量")).toBeInTheDocument();
    expect(screen.queryByText("Please fill in all template variables above")).not.toBeInTheDocument();
    expect(screen.getByText("缺少：{{topic}}")).toBeInTheDocument();
    expect(screen.queryByText("Missing: {{topic}}")).not.toBeInTheDocument();
  });

  it("renders the English missing-variable list byte-identically from the catalog", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<VariableWarning extractedVariables={["name", "topic"]} variables={{ name: "Ada" }} />);

    expect(screen.getByText("Missing: {{topic}}")).toBeInTheDocument();
    expect(screen.queryByText("缺少：{{topic}}")).not.toBeInTheDocument();
  });
});
