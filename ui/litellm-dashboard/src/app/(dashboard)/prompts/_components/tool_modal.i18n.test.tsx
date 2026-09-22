import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ToolModal from "./tool_modal";

describe("ToolModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese modal chrome and hides the English originals", async () => {
    renderWithProviders(<ToolModal visible initialJson="{}" onSave={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText("添加工具")).toBeInTheDocument();
    expect(screen.queryByText("Add Tool")).not.toBeInTheDocument();
    expect(screen.getByLabelText("工具 JSON")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tool JSON")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("在此粘贴工具 JSON...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Paste your tool JSON here...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-JSON error and hides the English original", async () => {
    renderWithProviders(<ToolModal visible initialJson="{}" onSave={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("工具 JSON"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));

    expect(await screen.findByText("JSON 格式无效，请检查语法。")).toBeInTheDocument();
    expect(screen.queryByText("Invalid JSON format. Please check your syntax.")).not.toBeInTheDocument();
  });
});
