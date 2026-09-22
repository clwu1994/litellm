import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import ModelConfigCard from "./ModelConfigCard";

vi.mock("@/components/common_components/ModelSelector", () => ({
  default: () => <div data-testid="model-selector" />,
}));

const defaultProps = {
  model: "gpt-4o",
  accessToken: "token",
  onModelChange: vi.fn(),
  temperature: 1,
  maxTokens: 1000,
  onTemperatureChange: vi.fn(),
  onMaxTokensChange: vi.fn(),
};

describe("ModelConfigCard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese parameters trigger and dialog, hiding the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModelConfigCard {...defaultProps} />);

    const trigger = screen.getByRole("button", { name: "参数" });
    expect(screen.queryByRole("button", { name: "Parameters" })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("模型参数")).toBeInTheDocument();
    expect(screen.queryByText("Model Parameters")).not.toBeInTheDocument();
    expect(screen.getByLabelText("温度")).toBeInTheDocument();
    expect(screen.queryByLabelText("Temperature")).not.toBeInTheDocument();
    expect(screen.getByLabelText("最大 Token 数")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Tokens")).not.toBeInTheDocument();
  });
});
