import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { SearchToolView } from "./SearchToolView";
import { AvailableSearchProvider, SearchTool } from "./types";

vi.mock("./SearchToolTester", () => ({
  SearchToolTester: () => <div data-testid="search-tool-tester" />,
}));

const availableProviders: AvailableSearchProvider[] = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
];

const makeSearchTool = (overrides: Partial<SearchTool> = {}): SearchTool => ({
  search_tool_id: "test-tool-id-123",
  search_tool_name: "Test Search Tool",
  litellm_params: { search_provider: "perplexity", api_key: "sk-test-key" },
  search_tool_info: { description: "Test description" },
  created_at: "2024-01-15T10:30:00Z",
  ...overrides,
});

const renderView = (searchTool: SearchTool = makeSearchTool()) =>
  renderWithProviders(
    <SearchToolView
      searchTool={searchTool}
      onBack={vi.fn()}
      isEditing={false}
      accessToken="test-token"
      availableProviders={availableProviders}
    />,
  );

describe("SearchToolView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese back button, copy labels and detail labels", () => {
    renderView();

    expect(screen.getByRole("button", { name: "返回所有搜索工具" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Back to All Search Tools/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制搜索工具名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy search tool name")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制搜索工具 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy search tool ID")).not.toBeInTheDocument();

    expect(screen.getByText("提供方")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("API Key")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("Created At")).not.toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("renders the Chinese not-set and unknown fallbacks with the English originals absent", () => {
    renderView(
      makeSearchTool({
        litellm_params: { search_provider: "perplexity" },
        created_at: undefined,
        search_tool_info: {},
      }),
    );

    expect(screen.getByText("未设置")).toBeInTheDocument();
    expect(screen.queryByText("Not set")).not.toBeInTheDocument();
    expect(screen.getByText("未知")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });
});
