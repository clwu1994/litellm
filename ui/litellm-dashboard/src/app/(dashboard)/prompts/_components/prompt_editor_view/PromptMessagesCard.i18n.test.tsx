import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PromptMessagesCard from "./PromptMessagesCard";

vi.mock("../variable_textarea", () => ({
  default: (props: { value: string; onChange: (value: string) => void; placeholder?: string }) => (
    <textarea
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      placeholder={props.placeholder}
    />
  ),
}));

const defaultProps = {
  messages: [{ role: "user", content: "Hello" }],
  onAddMessage: vi.fn(),
  onUpdateMessage: vi.fn(),
  onRemoveMessage: vi.fn(),
  onMoveMessage: vi.fn(),
};

const fullText = (text: string) =>
  screen.queryByText((_content, element) => element?.tagName === "P" && element.textContent === text);

describe("PromptMessagesCard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese card title and the variable-syntax hint, hiding the English originals", () => {
    renderWithProviders(<PromptMessagesCard {...defaultProps} />);

    expect(screen.getByText("提示词消息")).toBeInTheDocument();
    expect(screen.queryByText("Prompt messages")).not.toBeInTheDocument();
    expect(fullText("使用 {{variable}} 语法表示模板变量")).toBeInTheDocument();
    expect(fullText("Use {{variable}} syntax for template variables")).not.toBeInTheDocument();
  });

  it("renders the English hint byte-identically from the catalog", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<PromptMessagesCard {...defaultProps} />);

    expect(fullText("Use {{variable}} syntax for template variables")).toBeInTheDocument();
    expect(fullText("使用 {{variable}} 语法表示模板变量")).not.toBeInTheDocument();
  });

  it("renders the Chinese message role label and options, hiding the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderWithProviders(<PromptMessagesCard {...defaultProps} />);

    const trigger = screen.getByRole("combobox", { name: "第 1 条消息的角色" });
    expect(trigger).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Message 1 role" })).not.toBeInTheDocument();

    await user.click(trigger);

    for (const [zh, en] of [
      ["用户", "User"],
      ["助手", "Assistant"],
      ["系统", "System"],
    ] as const) {
      expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese remove label, content placeholder and add action, hiding the English originals", () => {
    renderWithProviders(
      <PromptMessagesCard
        {...defaultProps}
        messages={[
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi" },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "移除第 1 条消息" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove message 1" })).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("输入提示词内容...")).toHaveLength(2);
    expect(screen.queryAllByPlaceholderText("Enter prompt content...")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /添加消息/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add message/ })).not.toBeInTheDocument();
  });
});
