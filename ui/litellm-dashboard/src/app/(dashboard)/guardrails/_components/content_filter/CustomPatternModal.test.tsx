import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n/bootstrapI18n";
import CustomPatternModal from "./CustomPatternModal";

describe("CustomPatternModal", () => {
  const mockOnAdd = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnNameChange = vi.fn();
  const mockOnRegexChange = vi.fn();
  const mockOnActionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow entering regex and pattern name and call onAdd when clicking add button", async () => {
    /**
     * Tests that user can enter a pattern name and regex, then clicking Add
     * calls the onAdd callback. This is the core functionality of adding custom patterns.
     */
    const user = userEvent.setup();

    render(
      <CustomPatternModal
        visible={true}
        patternName=""
        patternRegex=""
        patternAction="BLOCK"
        onNameChange={mockOnNameChange}
        onRegexChange={mockOnRegexChange}
        onActionChange={mockOnActionChange}
        onAdd={mockOnAdd}
        onCancel={mockOnCancel}
      />,
    );

    // Wait for modal to be visible
    await waitFor(() => {
      expect(screen.getByText("Add custom regex pattern")).toBeInTheDocument();
    });

    // Find and fill the pattern name input
    const nameInput = screen.getByPlaceholderText("e.g., internal_id, employee_code");
    fireEvent.change(nameInput, { target: { value: "employee_id" } });

    // Find and fill the regex pattern input - use paste instead of type to avoid special char issues
    const regexInput = screen.getByPlaceholderText("e.g., ID-[0-9]{6}");
    await user.click(regexInput);
    await user.paste("EMP-[0-9]{5}");

    // Verify the change handlers were called
    expect(mockOnNameChange).toHaveBeenCalled();
    expect(mockOnRegexChange).toHaveBeenCalled();

    // Find and click the Add button
    const addButton = screen.getByRole("button", { name: /add/i });
    await user.click(addButton);

    // Verify onAdd was called
    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });
});

describe("CustomPatternModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese modal chrome and hides the English one", async () => {
    render(
      <CustomPatternModal
        visible={true}
        patternName=""
        patternRegex=""
        patternAction="BLOCK"
        onNameChange={vi.fn()}
        onRegexChange={vi.fn()}
        onActionChange={vi.fn()}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(await screen.findByText("添加自定义正则匹配模式")).toBeInTheDocument();
    expect(screen.getByText("匹配模式名称")).toBeInTheDocument();
    expect(screen.getByText("正则表达式")).toBeInTheDocument();
    expect(screen.getByText("输入有效的正则表达式以匹配敏感数据")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByText("选择检测到此匹配模式时 Guardrail 应执行的操作")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g., ID-[0-9]{6}")).toBeInTheDocument();

    expect(screen.queryByText("Add custom regex pattern")).not.toBeInTheDocument();
    expect(screen.queryByText("Pattern name")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a valid regular expression to match sensitive data")).not.toBeInTheDocument();
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Choose what action the guardrail should take when this pattern is detected"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
