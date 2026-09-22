import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import SearchToolTable from "./SearchToolTable";
import { AvailableSearchProvider, SearchTool } from "./types";

const makeSearchTool = (overrides: Partial<SearchTool> = {}): SearchTool => ({
  search_tool_id: "tool-1",
  search_tool_name: "Perplexity Search",
  litellm_params: { search_provider: "perplexity" },
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-16T10:30:00Z",
  ...overrides,
});

const availableProviders: AvailableSearchProvider[] = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
];

const defaultProps = {
  searchTools: [makeSearchTool()],
  isLoading: false,
  availableProviders,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("SearchToolTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderWithProviders(<SearchToolTable {...defaultProps} />);

    expect(screen.getByTestId("sort-header-search_tool_id")).toHaveTextContent("搜索工具 ID");
    expect(screen.queryByText("Search Tool ID")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-search_tool_name")).toHaveTextContent("名称");
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.getByText("提供方")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-created_at")).toHaveTextContent("创建时间");
    expect(screen.queryByText("Created At")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-updated_at")).toHaveTextContent("更新时间");
    expect(screen.queryByText("Updated At")).not.toBeInTheDocument();
    expect(screen.getByText("来源")).toBeInTheDocument();
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
    expect(screen.getByText("操作", { selector: "span.sr-only" })).toBeInTheDocument();
    expect(screen.queryByText("Actions", { selector: "span.sr-only" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state with the English originals absent", () => {
    renderWithProviders(<SearchToolTable {...defaultProps} searchTools={[]} />);

    expect(screen.getByText("未配置搜索工具")).toBeInTheDocument();
    expect(screen.queryByText("No search tools configured")).not.toBeInTheDocument();
    expect(screen.getByText("添加搜索工具以为你的模型启用 Web 搜索。")).toBeInTheDocument();
    expect(screen.queryByText("Add a search tool to enable web search for your models.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message with the English original absent", () => {
    renderWithProviders(<SearchToolTable {...defaultProps} searchTools={[]} isLoading />);

    expect(screen.getByText("正在加载搜索工具…")).toBeInTheDocument();
    expect(screen.queryByText("Loading search tools…")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions menu with the English originals absent", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SearchToolTable {...defaultProps} />);

    const trigger = screen.getByLabelText("打开搜索工具操作");
    expect(screen.queryByLabelText("Open search tool actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByTestId("search-tool-action-edit")).toHaveTextContent("编辑搜索工具");
    expect(screen.queryByText("Edit search tool")).not.toBeInTheDocument();
    expect(screen.getByTestId("search-tool-action-delete")).toHaveTextContent("删除搜索工具");
    expect(screen.queryByText("Delete search tool")).not.toBeInTheDocument();
  });

  it("renders the Chinese config hints on the disabled menu items", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<SearchToolTable {...defaultProps} searchTools={[makeSearchTool({ is_from_config: true })]} />);

    await user.click(screen.getByLabelText("打开搜索工具操作"));

    const editItem = await screen.findByTestId("search-tool-action-edit");
    expect(editItem).toHaveAttribute("title", "配置文件中的搜索工具无法在仪表盘上编辑。请编辑配置文件。");
    expect(editItem).not.toHaveAttribute(
      "title",
      "Config search tools cannot be edited on the dashboard. Please edit the config file.",
    );

    const deleteItem = screen.getByTestId("search-tool-action-delete");
    expect(deleteItem).toHaveAttribute("title", "配置文件中的搜索工具无法在仪表盘上删除。请编辑配置文件。");
    expect(deleteItem).not.toHaveAttribute(
      "title",
      "Config search tools cannot be deleted on the dashboard. Please edit the config file.",
    );
  });

  it("renders the Chinese source badges with the English originals absent", () => {
    renderWithProviders(
      <SearchToolTable
        {...defaultProps}
        searchTools={[
          makeSearchTool(),
          makeSearchTool({ search_tool_id: "config-tool", search_tool_name: "Config Search", is_from_config: true }),
        ]}
      />,
    );

    expect(screen.getByText("数据库")).toBeInTheDocument();
    expect(screen.queryByText("DB")).not.toBeInTheDocument();
    expect(screen.getByText("配置文件")).toBeInTheDocument();
    expect(screen.queryByText("Config")).not.toBeInTheDocument();
  });
});
