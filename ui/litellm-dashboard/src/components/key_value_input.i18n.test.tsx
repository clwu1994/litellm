import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import KeyValueInput from "./key_value_input";

describe("KeyValueInput Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header placeholders, remove label and add button", () => {
    render(<KeyValueInput value={[["Authorization", "Bearer abc"]]} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("请求头名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Header Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("请求头值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Header Value")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除请求头 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove header 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加请求头" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Header" })).not.toBeInTheDocument();
  });
});
