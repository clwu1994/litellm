import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as networking from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import * as roles from "@/utils/roles";
import { act, cleanup, renderWithProviders, screen, testQueryClient, within } from "@/../tests/test-utils";

import SearchTools from "./SearchTools";
import { AvailableSearchProvider, SearchTool } from "./types";

vi.mock("@/components/networking", () => ({
  fetchSearchTools: vi.fn(),
  updateSearchTool: vi.fn(),
  deleteSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
  searchToolQueryCall: vi.fn(),
}));

vi.mock("@/utils/roles", () => ({ isAdminRole: vi.fn() }));

const mockSearchTools: SearchTool[] = [
  {
    search_tool_id: "tool-1",
    search_tool_name: "Perplexity Search",
    litellm_params: { search_provider: "perplexity", api_key: "sk-test-key" },
    search_tool_info: { description: "Test description" },
    created_at: "2024-01-15T10:30:00Z",
  },
];

const mockAvailableProviders: AvailableSearchProvider[] = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
];

const renderPage = () => renderWithProviders(<SearchTools accessToken="test-token" userRole="Admin" userID="user-1" />);

const openEditDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText("Perplexity Search");
  await user.click(screen.getByTestId("search-tool-actions-tool-1"));
  await user.click(await screen.findByTestId("search-tool-action-edit"));
  return screen.findByRole("dialog");
};

const openDeleteDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByText("Perplexity Search");
  await user.click(screen.getByTestId("search-tool-actions-tool-1"));
  await user.click(await screen.findByTestId("search-tool-action-delete"));
  return screen.findByRole("dialog");
};

describe("SearchTools Chinese copy", () => {
  beforeEach(async () => {
    testQueryClient.clear();
    vi.clearAllMocks();
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({ search_tools: mockSearchTools });
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedValue({ providers: mockAvailableProviders });
    vi.mocked(networking.updateSearchTool).mockResolvedValue({});
    vi.mocked(networking.deleteSearchTool).mockResolvedValue({});
    vi.mocked(roles.isAdminRole).mockReturnValue(true);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header, description and add button with the English originals absent", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "搜索工具" })).toBeInTheDocument();
    expect(screen.queryByText("Search Tools")).not.toBeInTheDocument();
    expect(screen.getByText("配置和管理你的搜索提供方")).toBeInTheDocument();
    expect(screen.queryByText("Configure and manage your search providers")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 添加搜索工具" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add New Search Tool" })).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-auth message with the English original absent", () => {
    renderWithProviders(<SearchTools accessToken={null} userRole="Admin" userID="user-1" />);

    expect(screen.getByText("缺少必要的认证参数。")).toBeInTheDocument();
    expect(screen.queryByText("Missing required authentication parameters.")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit dialog with the English originals absent", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const dialog = await openEditDialog(user);

    expect(within(dialog).getByText("编辑搜索工具")).toBeInTheDocument();
    expect(within(dialog).queryByText("Edit Search Tool")).not.toBeInTheDocument();

    expect(within(dialog).getByLabelText("搜索工具名称")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Search Tool Name")).not.toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("例如 my-perplexity-search")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("e.g., my-perplexity-search")).not.toBeInTheDocument();

    expect(within(dialog).getByLabelText("搜索提供方")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Search Provider")).not.toBeInTheDocument();

    expect(within(dialog).getByLabelText("API Key")).toBeInTheDocument();
    expect(within(dialog).getByText("搜索提供方的 API key")).toBeInTheDocument();
    expect(within(dialog).queryByText("API key for the search provider")).not.toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("输入 API key")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("Enter API key")).not.toBeInTheDocument();

    expect(within(dialog).getByLabelText("描述")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Description")).not.toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("此搜索工具的描述")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("Description of this search tool")).not.toBeInTheDocument();

    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "确定" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
  });

  it("renders the Chinese required-name message when the edit name is cleared", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const dialog = await openEditDialog(user);

    await user.clear(within(dialog).getByLabelText("搜索工具名称"));
    await user.click(within(dialog).getByRole("button", { name: "确定" }));

    expect(await screen.findByText("请输入搜索工具名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a search tool name")).not.toBeInTheDocument();
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });

  it("renders the Chinese provider placeholder and required-provider message when no provider is selected", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.fetchSearchTools).mockResolvedValue({
      search_tools: [
        {
          search_tool_id: "tool-1",
          search_tool_name: "Perplexity Search",
          litellm_params: { search_provider: "" },
        },
      ],
    });
    renderPage();
    const dialog = await openEditDialog(user);

    expect(within(dialog).getByText("选择搜索提供方")).toBeInTheDocument();
    expect(within(dialog).queryByText("Select a search provider")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "确定" }));

    expect(await screen.findByText("请选择搜索提供方")).toBeInTheDocument();
    expect(screen.queryByText("Please select a search provider")).not.toBeInTheDocument();
    expect(networking.updateSearchTool).not.toHaveBeenCalled();
  });

  it("shows the Chinese update success toast with the English original absent", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const dialog = await openEditDialog(user);

    await user.click(within(dialog).getByRole("button", { name: "确定" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("搜索工具更新成功"));
    });
    expect(toast.success).not.toHaveBeenCalledWith("Search tool updated successfully");
  });

  it("shows the Chinese update failure toast with the English original absent", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.updateSearchTool).mockRejectedValue(new Error("boom"));
    renderPage();
    const dialog = await openEditDialog(user);

    await user.click(within(dialog).getByRole("button", { name: "确定" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("更新搜索工具失败"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to update search tool");
  });

  it("renders the Chinese delete dialog and shows the Chinese deleted toast", async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();
    const dialog = await openDeleteDialog(user);

    expect(within(dialog).getByText("删除搜索工具")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Search Tool")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此搜索工具？此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Are you sure you want to delete this search tool/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("搜索工具信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Search Tool Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Name")).not.toBeInTheDocument();
    expect(within(dialog).getByText("ID")).toBeInTheDocument();
    expect(within(dialog).getByText("提供方")).toBeInTheDocument();
    expect(within(dialog).queryByText("Provider")).not.toBeInTheDocument();
    expect(within(dialog).getByText("描述")).toBeInTheDocument();
    expect(within(dialog).queryByText("Description")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("搜索工具删除成功"));
    });
    expect(toast.success).not.toHaveBeenCalledWith("Deleted search tool successfully");
  });

  it("shows the Chinese delete failure toast with the English original absent", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(networking.deleteSearchTool).mockRejectedValue(new Error("boom"));
    renderPage();
    const dialog = await openDeleteDialog(user);

    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("删除搜索工具失败"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete search tool");
  });
});
