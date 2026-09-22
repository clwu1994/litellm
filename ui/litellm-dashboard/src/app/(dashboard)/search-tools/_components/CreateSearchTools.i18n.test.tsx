/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name and the nested dialog footer has no accessible scope, so reaching both needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as networking from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, fireEvent, renderWithProviders, screen, within } from "@/../tests/test-utils";

import CreateSearchTool from "./CreateSearchTools";

vi.mock("@/components/networking", () => ({
  createSearchTool: vi.fn(),
  fetchAvailableSearchProviders: vi.fn(),
}));

vi.mock("./SearchConnectionTest", () => ({
  default: () => <div data-testid="search-connection-test" />,
}));

const providers = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
  { provider_name: "tavily", ui_friendly_name: "Tavily Search" },
];

const renderModal = () =>
  renderWithProviders(
    <CreateSearchTool
      userRole="Admin"
      accessToken="test-token"
      onCreateSuccess={vi.fn()}
      isModalVisible
      setModalVisible={vi.fn()}
    />,
  );

const pickProvider = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getAllByRole("combobox")[0]);
  await user.click(await screen.findByText(label));
};

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("CreateSearchTool Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.fetchAvailableSearchProviders).mockResolvedValue({ providers });
    vi.mocked(networking.createSearchTool).mockResolvedValue({ search_tool_id: "st-1" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese create dialog labels and placeholders with the English originals absent", async () => {
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    expect(screen.getByText("添加新的搜索工具")).toBeInTheDocument();
    expect(screen.queryByText("Add New Search Tool")).not.toBeInTheDocument();

    expect(screen.getByLabelText(/搜索工具名称/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Search Tool Name/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 perplexity-search、my-tavily-tool")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., perplexity-search, my-tavily-tool")).not.toBeInTheDocument();

    expect(screen.getByLabelText(/搜索提供方/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Search Provider/)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择搜索提供方")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a search provider")).not.toBeInTheDocument();

    expect(screen.getByLabelText(/API Key/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 API key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your API key")).not.toBeInTheDocument();

    expect(screen.getByLabelText("描述（可选）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description (Optional)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("简要描述此搜索工具的用途")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Brief description of this search tool's purpose")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "需要帮助？" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Need Help?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Connection" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加搜索工具" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Search Tool" })).not.toBeInTheDocument();
  });

  it("renders the Chinese hint tooltips while they are open with the English originals absent", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    await hoverHint(user, "搜索工具名称");
    expect(
      await screen.findByText("用于标识此搜索工具配置的唯一名称（例如 'perplexity-search'、'tavily-news-search'）。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "A unique name to identify this search tool configuration (e.g., 'perplexity-search', 'tavily-news-search').",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "搜索提供方");
    expect(await screen.findByText("选择你要使用的搜索提供方。每个提供方的能力和价格各不相同。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select the search provider you want to use. Each provider has different capabilities and pricing.",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "API Key");
    expect(await screen.findByText("用于向搜索提供方进行身份验证的 API key。它将被安全存储。")).toBeInTheDocument();
    expect(
      screen.queryByText("The API key for authenticating with the search provider. This will be securely stored."),
    ).not.toBeInTheDocument();

    await user.hover(screen.getByRole("link", { name: "需要帮助？" }));
    expect(await screen.findByText("在我们的 github 上获取帮助")).toBeInTheDocument();
    expect(screen.queryByText("Get help on our github")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-matching-providers empty state with the English original absent", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.type(screen.getAllByRole("combobox")[0], "zzz");

    expect(await screen.findByText("没有匹配的搜索提供方")).toBeInTheDocument();
    expect(screen.queryByText("No matching search providers")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-field messages when the form is submitted empty", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    await user.click(screen.getByRole("button", { name: "添加搜索工具" }));

    expect(await screen.findByText("请输入搜索工具名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a search tool name")).not.toBeInTheDocument();
    expect(screen.getByText("请选择搜索提供方")).toBeInTheDocument();
    expect(screen.queryByText("Please select a search provider")).not.toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("renders the Chinese name-pattern message for a name with invalid characters", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    fireEvent.change(screen.getByLabelText(/搜索工具名称/), { target: { value: "bad name!" } });
    await pickProvider(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "添加搜索工具" }));

    expect(await screen.findByText("名称只能包含字母、数字、连字符和下划线")).toBeInTheDocument();
    expect(
      screen.queryByText("Name can only contain letters, numbers, hyphens, and underscores"),
    ).not.toBeInTheDocument();
    expect(networking.createSearchTool).not.toHaveBeenCalled();
  });

  it("shows the Chinese test-missing-fields toast with the English original absent", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    await user.click(screen.getByRole("button", { name: "测试连接" }));

    expect(toast.error).toHaveBeenCalledWith("测试前请填写搜索提供方和 API Key");
    expect(toast.error).not.toHaveBeenCalledWith("Please fill in Search Provider and API Key before testing");
  });

  it("shows the Chinese created toast with the English original absent", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    fireEvent.change(screen.getByLabelText(/搜索工具名称/), { target: { value: "my-search" } });
    await pickProvider(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "添加搜索工具" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("搜索工具创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Search tool created successfully");
  });

  it("shows the Chinese create-failure toast with the English original absent", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.createSearchTool).mockRejectedValue(new Error("boom"));
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    fireEvent.change(screen.getByLabelText(/搜索工具名称/), { target: { value: "my-search" } });
    await pickProvider(user, "Perplexity AI");
    await user.click(screen.getByRole("button", { name: "添加搜索工具" }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("创建搜索工具出错：Error: boom"));
    expect(toast.error).not.toHaveBeenCalledWith("Error creating search tool: Error: boom");
  });

  it("renders the Chinese connection-test dialog title and close button", async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByLabelText(/搜索工具名称/);

    await pickProvider(user, "Perplexity AI");
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: "sk-secret" } });
    await user.click(screen.getByRole("button", { name: "测试连接" }));

    expect(await screen.findByText("连接测试结果")).toBeInTheDocument();
    expect(screen.queryByText("Connection Test Results")).not.toBeInTheDocument();
    expect(screen.getByTestId("search-connection-test")).toBeInTheDocument();

    const innerFooter = screen
      .getByText("连接测试结果")
      .closest('[data-slot="dialog-content"]')
      ?.querySelector('[data-slot="dialog-footer"]');
    expect(innerFooter).not.toBeNull();
    expect(within(innerFooter as HTMLElement).getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(within(innerFooter as HTMLElement).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
