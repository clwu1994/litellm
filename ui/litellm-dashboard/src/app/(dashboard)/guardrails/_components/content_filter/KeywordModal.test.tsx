import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n/bootstrapI18n";
import KeywordModal from "./KeywordModal";

describe("KeywordModal", () => {
  const handlers = {
    onKeywordChange: vi.fn(),
    onActionChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onAdd: vi.fn(),
    onCancel: vi.fn(),
  };

  const renderModal = (overrides: Partial<React.ComponentProps<typeof KeywordModal>> = {}) =>
    render(<KeywordModal visible keyword="" action="BLOCK" description="" {...handlers} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the keyword, action and description fields", async () => {
    renderModal();

    expect(await screen.findByText("Add blocked keyword")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter sensitive keyword or phrase")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Explain why this keyword is sensitive")).toBeInTheDocument();
    expect(screen.getByText("Description (optional)")).toBeInTheDocument();
    expect(
      screen.getByText("Choose what action the guardrail should take when this keyword is detected"),
    ).toBeInTheDocument();
  });

  it("should report keyword edits", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(await screen.findByPlaceholderText("Enter sensitive keyword or phrase"), {
      target: { value: "s" },
    });

    expect(handlers.onKeywordChange).toHaveBeenCalledWith("s");
  });

  it("should report description edits", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(await screen.findByPlaceholderText("Explain why this keyword is sensitive"), {
      target: { value: "x" },
    });

    expect(handlers.onDescriptionChange).toHaveBeenCalledWith("x");
  });

  it("should report the chosen action", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("combobox"));
    const maskOptions = await screen.findAllByText("Mask");
    await user.click(maskOptions[maskOptions.length - 1]);

    expect(handlers.onActionChange).toHaveBeenCalled();
    expect(handlers.onActionChange.mock.calls[0][0]).toBe("MASK");
  });

  it("should show the current keyword and description values", async () => {
    renderModal({ keyword: "secret", description: "sensitive term" });

    expect(await screen.findByDisplayValue("secret")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sensitive term")).toBeInTheDocument();
  });

  it("should add and cancel through the footer buttons", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add" }));
    expect(handlers.onAdd).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not render its content when not visible", () => {
    renderModal({ visible: false });

    expect(screen.queryByText("Add blocked keyword")).not.toBeInTheDocument();
  });

  it("should not raise the dialog above the portalled popup layer its Action select renders into", async () => {
    renderModal();
    await screen.findByText("Add blocked keyword");

    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content).not.toBeNull();
    expect(Array.from(content!.classList).filter((cls) => cls.startsWith("z-"))).toEqual(["z-popup"]);
  });
});

describe("KeywordModal Chinese copy", () => {
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
      <KeywordModal
        visible
        keyword=""
        action="BLOCK"
        description=""
        onKeywordChange={vi.fn()}
        onActionChange={vi.fn()}
        onDescriptionChange={vi.fn()}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(await screen.findByText("添加屏蔽关键词")).toBeInTheDocument();
    expect(screen.getByText("关键词")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入敏感关键词或短语")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByText("选择检测到此关键词时 Guardrail 应执行的操作")).toBeInTheDocument();
    expect(screen.getByText("描述（可选）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("说明此关键词为何敏感")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();

    expect(screen.queryByText("Add blocked keyword")).not.toBeInTheDocument();
    expect(screen.queryByText("Description (optional)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter sensitive keyword or phrase")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Explain why this keyword is sensitive")).not.toBeInTheDocument();
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Choose what action the guardrail should take when this keyword is detected"),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
