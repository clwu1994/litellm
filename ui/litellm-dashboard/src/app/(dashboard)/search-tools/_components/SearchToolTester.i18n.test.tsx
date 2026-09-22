import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchToolQueryCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { SearchToolTester } from "./SearchToolTester";

vi.mock("@/components/networking", () => ({ searchToolQueryCall: vi.fn() }));

const mockSearch = vi.mocked(searchToolQueryCall);

const twoResults = {
  results: [
    { title: "Test Result 1", url: "https://example.com/result1", snippet: "short snippet" },
    { title: "Test Result 2", url: "https://example.com/result2", snippet: "another short snippet" },
  ],
};

const oneResult = {
  results: [{ title: "Only Result", url: "https://example.com/only", snippet: "only snippet" }],
};

const longSnippet = {
  results: [{ title: "Long Result", url: "https://example.com/long", snippet: "x".repeat(250) }],
};

const renderTester = () =>
  renderWithProviders(<SearchToolTester searchToolName="test-search-tool" accessToken="sk-test" />);

const queryInput = () => screen.getByPlaceholderText("输入你的搜索查询...");
const searchButton = () => screen.getByRole("button", { name: "搜索" });

const runSearch = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
  await user.type(queryInput(), query);
  await user.click(searchButton());
};

describe("SearchToolTester Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(twoResults);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, input, button and empty state with the English originals absent", () => {
    renderTester();

    expect(screen.getByRole("heading", { name: "测试搜索工具" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Test Search Tool" })).not.toBeInTheDocument();
    expect(queryInput()).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your search query...")).not.toBeInTheDocument();
    expect(searchButton()).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    expect(screen.getByText("测试你的搜索工具")).toBeInTheDocument();
    expect(screen.queryByText("Test your search tool")).not.toBeInTheDocument();
    expect(screen.getByText("在上方输入查询以查看搜索结果")).toBeInTheDocument();
    expect(screen.queryByText("Enter a query above to see search results")).not.toBeInTheDocument();
  });

  it("renders the Chinese result chrome for a multi-result search with the English originals absent", async () => {
    const user = userEvent.setup();
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("2 条结果")).toBeInTheDocument();
    expect(screen.queryByText("2 results")).not.toBeInTheDocument();
    expect(screen.getByText("搜索查询")).toBeInTheDocument();
    expect(screen.queryByText("Search Query")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "在新标签页中打开结果" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Open result in new tab" })).not.toBeInTheDocument();
  });

  it("renders the Chinese singular result count with the English original absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(oneResult);
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("1 条结果")).toBeInTheDocument();
    expect(screen.queryByText("1 result")).not.toBeInTheDocument();
  });

  it("renders the Chinese show-more and show-less labels for a long snippet", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(longSnippet);
    renderTester();

    await runSearch(user, "hello");

    const showMore = await screen.findByRole("button", { name: "展开" });
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();

    await user.click(showMore);

    expect(await screen.findByRole("button", { name: "收起" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show less" })).not.toBeInTheDocument();
  });

  it("renders the Chinese searching state with the English original absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockReturnValue(new Promise(() => {}));
    renderTester();

    await runSearch(user, "hello");

    expect(screen.getByText("正在搜索...")).toBeInTheDocument();
    expect(screen.queryByText("Searching...")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-results state with the English originals absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue({ results: [] });
    renderTester();

    await runSearch(user, "hello");

    expect(await screen.findByText("未找到结果")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
    expect(screen.getByText("尝试其他搜索查询")).toBeInTheDocument();
    expect(screen.queryByText("Try a different search query")).not.toBeInTheDocument();
  });

  it("renders the Chinese previous searches and clears the history in Chinese", async () => {
    const user = userEvent.setup();
    renderTester();

    await runSearch(user, "first query");
    await screen.findByText("2 条结果");
    await user.clear(queryInput());
    await runSearch(user, "second query");

    expect(await screen.findByText("之前的搜索")).toBeInTheDocument();
    expect(screen.queryByText("Previous Searches")).not.toBeInTheDocument();

    const clearAll = screen.getByRole("button", { name: "全部清空" });
    expect(screen.queryByRole("button", { name: "Clear All" })).not.toBeInTheDocument();

    await user.click(clearAll);

    expect(toast.success).toHaveBeenCalledWith("搜索历史已清除");
    expect(toast.success).not.toHaveBeenCalledWith("Search history cleared");
    expect(screen.queryByText("之前的搜索")).not.toBeInTheDocument();
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

  it("shows the Chinese query failure toast with the English original absent", async () => {
    const user = userEvent.setup();
    mockSearch.mockRejectedValue(new Error("boom"));
    renderTester();

    await runSearch(user, "hello");

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("查询搜索工具失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to query search tool");
  });
});

describe("SearchToolTester English result-count discrimination", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the singular English result count", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(oneResult);
    renderTester();

    await user.type(screen.getByPlaceholderText("Enter your search query..."), "hello");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("1 result")).toBeInTheDocument();
  });

  it("renders the plural English result count", async () => {
    const user = userEvent.setup();
    mockSearch.mockResolvedValue(twoResults);
    renderTester();

    await user.type(screen.getByPlaceholderText("Enter your search query..."), "hello");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("2 results")).toBeInTheDocument();
  });
});
