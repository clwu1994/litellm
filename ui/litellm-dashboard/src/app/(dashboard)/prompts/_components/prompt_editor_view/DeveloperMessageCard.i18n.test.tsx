import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import DeveloperMessageCard from "./DeveloperMessageCard";

vi.mock("../variable_textarea", () => ({
  default: (props: { value: string; onChange: (value: string) => void; placeholder?: string }) => (
    <textarea
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      placeholder={props.placeholder}
    />
  ),
}));

describe("DeveloperMessageCard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, hint and placeholder, hiding the English originals", () => {
    renderWithProviders(<DeveloperMessageCard value="" onChange={vi.fn()} />);

    expect(screen.getByText("开发者消息")).toBeInTheDocument();
    expect(screen.queryByText("Developer message")).not.toBeInTheDocument();
    expect(screen.getByText("为模型提供的可选系统指令")).toBeInTheDocument();
    expect(screen.queryByText("Optional system instructions for the model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：你是一个乐于助人的助手...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., You are a helpful assistant...")).not.toBeInTheDocument();
  });
});
