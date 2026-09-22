import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ConversationList from "./ConversationList";
import type { Conversation } from "./types";

const DAY = 24 * 60 * 60 * 1000;

const conversation = (id: string, title: string, updatedAt: number): Conversation => ({
  id,
  title,
  model: "gpt-4",
  messages: [],
  mcpServerNames: [],
  createdAt: updatedAt,
  updatedAt,
});

const conversations = [
  conversation("c1", "Recent chat", Date.now()),
  conversation("c2", "Yesterday chat", Date.now() - DAY),
  conversation("c3", "Week chat", Date.now() - 3 * DAY),
  conversation("c4", "Old chat", Date.now() - 30 * DAY),
];

const renderList = (
  items: Conversation[] = conversations,
  props: Partial<React.ComponentProps<typeof ConversationList>> = {},
) =>
  render(
    <ConversationList
      conversations={items}
      activeConversationId={null}
      onSelect={vi.fn()}
      onDelete={vi.fn()}
      onRename={vi.fn()}
      {...props}
    />,
  );

const openTooltip = async (
  user: ReturnType<typeof userEvent.setup>,
  button: HTMLElement,
  zh: string,
): Promise<HTMLElement> => {
  await user.hover(button);
  return screen.findByText(zh);
};

describe("ConversationList Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese date-group headers while hiding the English originals", () => {
    renderList();

    expect(screen.getByText("最近")).toBeInTheDocument();
    expect(screen.queryByText("Recents")).not.toBeInTheDocument();
    expect(screen.getByText("昨天")).toBeInTheDocument();
    expect(screen.queryByText("Yesterday")).not.toBeInTheDocument();
    expect(screen.getByText("过去 7 天")).toBeInTheDocument();
    expect(screen.queryByText("Last 7 Days")).not.toBeInTheDocument();
    expect(screen.getByText("更早")).toBeInTheDocument();
    expect(screen.queryByText("Older")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state while hiding the English original", () => {
    renderList([]);

    expect(screen.getByText("还没有对话", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("在上方开始新对话", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => element?.textContent === "还没有对话在上方开始新对话", {
        selector: ".text-center",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No conversations yet", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Start a new chat above", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the Chinese rename tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup({ delay: null });
    renderList();

    const tooltip = await openTooltip(user, screen.getAllByRole("button")[0], "重命名");
    expect(tooltip).toBeInTheDocument();
    expect(screen.queryByText("Rename")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete tooltip and confirmation dialog while hiding the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    renderList();

    const tooltip = await openTooltip(user, screen.getAllByRole("button")[1], "删除");
    expect(tooltip).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button")[1]);

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("删除此对话？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete this conversation?")).not.toBeInTheDocument();
    expect(within(dialog).getByText("此操作无法撤销")).toBeInTheDocument();
    expect(within(dialog).queryByText("This action cannot be undone")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "删除" })).toBeInTheDocument();
  });

  it("renders the Chinese search dialog placeholder and result list while hiding the English originals", async () => {
    const user = userEvent.setup({ delay: null });
    renderList();

    await user.keyboard("{Meta>}k{/Meta}");

    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByPlaceholderText("搜索对话…");
    expect(input).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("Search conversations\\u2026")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Recent chat")).toBeInTheDocument();

    await user.type(input, "zzz");
    await waitFor(() => expect(within(dialog).getByText("未找到对话")).toBeInTheDocument());
    expect(within(dialog).queryByText("No conversations found")).not.toBeInTheDocument();
  });
});
