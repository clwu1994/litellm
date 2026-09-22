import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { vectorStoreSearchCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { VectorStoreTester } from "./VectorStoreTester";

vi.mock("@/components/networking", () => ({
  vectorStoreSearchCall: vi.fn(),
}));

const mockSearch = vi.mocked(vectorStoreSearchCall);

const searchResponse = {
  object: "vector_store.search_results.page",
  search_query: "hello",
  data: [
    {
      score: 0.91234,
      content: [{ text: "the quick brown fox", type: "text" }],
      file_id: "file-1",
      filename: "notes.txt",
      attributes: { source: "manual" },
    },
  ],
};

const renderTester = () => renderWithProviders(<VectorStoreTester vectorStoreId="vs_123" accessToken="sk-test" />);

const queryInput = () => screen.getByPlaceholderText("输入你的搜索查询...（Shift+Enter 换行）");
const searchButton = () => screen.getByRole("button", { name: "搜索" });

const runSearch = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
  await user.type(queryInput(), query);
  await user.click(searchButton());
};

describe("VectorStoreTester Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(searchResponse);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, input and empty state with the English originals absent", () => {
    renderTester();

    expect(screen.getByRole("heading", { name: "测试向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Test Vector Store" })).not.toBeInTheDocument();
    expect(screen.getByText("在下方的搜索框中输入查询以测试你的向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Test your vector store by entering a search query below")).not.toBeInTheDocument();
    expect(queryInput()).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter your search query... (Shift+Enter for new line)"),
    ).not.toBeInTheDocument();
    expect(searchButton()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
  });

  it("renders the Chinese search result chrome with the English originals absent", async () => {
    const user = userEvent.setup();
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("结果 1")).toBeInTheDocument();
    expect(screen.queryByText("Result 1")).not.toBeInTheDocument();
    expect(screen.getByText("1 条结果")).toBeInTheDocument();
    expect(screen.queryByText("1 results")).not.toBeInTheDocument();
    expect(screen.getByText("得分：0.9123")).toBeInTheDocument();
    expect(screen.queryByText("Score: 0.9123")).not.toBeInTheDocument();
    expect(screen.getByText("查询")).toBeInTheDocument();
    expect(screen.queryByText("Query")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储结果")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store Results")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空历史" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear History" })).not.toBeInTheDocument();
  });

  it("renders the Chinese result detail labels while a result is expanded", async () => {
    const user = userEvent.setup();
    renderTester();

    await runSearch(user, "hello");
    await user.click(await screen.findByText("结果 1"));

    expect(screen.getByText("内容（text）")).toBeInTheDocument();
    expect(screen.queryByText("Content (text)")).not.toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.queryByText("Metadata")).not.toBeInTheDocument();
    expect(screen.getByText("文件 ID：")).toBeInTheDocument();
    expect(screen.getByText("file-1")).toHaveTextContent("文件 ID：");
    expect(screen.queryByText("File ID:")).not.toBeInTheDocument();
    expect(screen.getByText("文件名：")).toBeInTheDocument();
    expect(screen.getByText("notes.txt")).toHaveTextContent("文件名：");
    expect(screen.queryByText("Filename:")).not.toBeInTheDocument();
    expect(screen.getByText("属性：")).toBeInTheDocument();
    expect(screen.queryByText("Attributes:")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-results message with the English original absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue({ object: "vector_store.search_results.page", search_query: "hello", data: [] });
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("未找到结果")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("renders the Chinese search-failure message with the English original absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockRejectedValue(new Error("boom"));
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("搜索失败：boom")).toBeInTheDocument();
    expect(screen.queryByText("Search failed: boom")).not.toBeInTheDocument();
  });

  it("warns in Chinese instead of searching when the query is only whitespace", async () => {
    const user = userEvent.setup();
    renderTester();

    await user.type(queryInput(), "   ");
    await user.type(queryInput(), "{Enter}");

    expect(toast.warning).toHaveBeenCalledWith("请输入搜索查询");
    expect(toast.warning).not.toHaveBeenCalledWith("Please enter a search query");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("shows the Chinese history-cleared toast when the history is cleared", async () => {
    const user = userEvent.setup();
    renderTester();

    await runSearch(user, "hello");
    await screen.findByText("结果 1");
    await user.click(screen.getByRole("button", { name: "清空历史" }));

    expect(toast.success).toHaveBeenCalledWith("搜索历史已清除");
    expect(toast.success).not.toHaveBeenCalledWith("Search history cleared");
    expect(screen.queryByText("结果 1")).not.toBeInTheDocument();
  });
});
