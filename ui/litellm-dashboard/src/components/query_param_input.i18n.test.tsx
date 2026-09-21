import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import QueryParamInput from "./query_param_input";

describe("QueryParamInput Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese query parameter placeholders, remove label and add button", () => {
    render(<QueryParamInput value={[["version", "v1"]]} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("参数名称（例如 version）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Parameter Name (e.g., version)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("参数值（例如 v1）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Parameter Value (e.g., v1)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除查询参数 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove query parameter 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加查询参数" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Query Parameter" })).not.toBeInTheDocument();
  });
});
