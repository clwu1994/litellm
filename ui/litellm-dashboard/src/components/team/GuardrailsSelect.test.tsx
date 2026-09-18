import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "../../../tests/test-utils";
import { GuardrailsSelect } from "./GuardrailsSelect";

const baseProps = {
  value: [] as string[],
  onValueChange: () => {},
  globalGuardrails: [],
  otherGuardrails: [],
  globalGuardrailNames: new Set<string>(),
};

describe("GuardrailsSelect localization", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default placeholder under zh", async () => {
    await i18n.changeLanguage("zh");
    renderWithProviders(<GuardrailsSelect {...baseProps} />);

    expect(screen.getByPlaceholderText("选择 Guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select guardrails")).not.toBeInTheDocument();
  });

  it("renders the English default placeholder under en", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<GuardrailsSelect {...baseProps} />);

    expect(screen.getByPlaceholderText("Select guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("选择 Guardrails")).not.toBeInTheDocument();
  });

  it("keeps a caller-supplied placeholder instead of the catalog default", async () => {
    await i18n.changeLanguage("zh");
    renderWithProviders(<GuardrailsSelect {...baseProps} placeholder="Custom placeholder" />);

    expect(screen.getByPlaceholderText("Custom placeholder")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("选择 Guardrails")).not.toBeInTheDocument();
  });

  it("renders the Chinese group labels when both sources have guardrails", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderWithProviders(
      <GuardrailsSelect
        {...baseProps}
        globalGuardrails={[{ name: "global-a", disabled: false }]}
        otherGuardrails={[{ name: "other-a", disabled: false }]}
        globalGuardrailNames={new Set(["global-a"])}
      />,
    );

    await user.click(screen.getByPlaceholderText("选择 Guardrails"));

    expect(await screen.findByText("全局")).toBeInTheDocument();
    expect(screen.getByText("其他")).toBeInTheDocument();
    expect(screen.queryByText("Global")).not.toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });
});
