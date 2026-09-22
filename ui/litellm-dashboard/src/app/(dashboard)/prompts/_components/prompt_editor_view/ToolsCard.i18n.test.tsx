import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import ToolsCard from "./ToolsCard";
import { Tool } from "./types";

const tools: Tool[] = [
  { name: "Calculator", description: "Performs calculations", json: '{"function": {"name": "calculate"}}' },
];

const defaultProps = {
  tools: [] as Tool[],
  onAddTool: vi.fn(),
  onEditTool: vi.fn(),
  onRemoveTool: vi.fn(),
};

describe("ToolsCard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, add action and empty state, hiding the English originals", () => {
    renderWithProviders(<ToolsCard {...defaultProps} />);

    expect(screen.getByText("工具")).toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
    expect(screen.getByText("尚未添加工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools added")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit and remove labels for a listed tool, hiding the English originals", () => {
    renderWithProviders(<ToolsCard {...defaultProps} tools={tools} />);

    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 Calculator" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Calculator" })).not.toBeInTheDocument();
  });

  it("falls back to the Chinese unnamed-tool label when a tool has no name, hiding the English original", () => {
    renderWithProviders(<ToolsCard {...defaultProps} tools={[{ name: "", description: "", json: "{}" }]} />);

    expect(screen.getByText("未命名工具")).toBeInTheDocument();
    expect(screen.queryByText("Unnamed Tool")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 未命名工具" })).toBeInTheDocument();
  });
});
