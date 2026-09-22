import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ReasoningContent from "./ReasoningContent";

describe("ReasoningContent Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese expanded toggle while hiding the English original", () => {
    render(<ReasoningContent reasoningContent="thinking hard" />);

    expect(screen.getByRole("button", { name: "隐藏推理过程" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide reasoning" })).not.toBeInTheDocument();
  });

  it("renders the Chinese collapsed toggle while hiding the English original", () => {
    render(<ReasoningContent reasoningContent="thinking hard" />);

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button", { name: "显示推理过程" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show reasoning" })).not.toBeInTheDocument();
  });
});
