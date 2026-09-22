import { cleanup, fireEvent, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import type { AccessGroupResponse } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";

import { AccessGroupsPage } from "./AccessGroupsPage";

const mockUseAccessGroups = vi.fn();
const mockUseDeleteAccessGroup = vi.fn();
const mockMutate = vi.fn();

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: () => mockUseAccessGroups(),
}));

vi.mock("@/app/(dashboard)/hooks/accessGroups/useDeleteAccessGroup", () => ({
  useDeleteAccessGroup: () => mockUseDeleteAccessGroup(),
}));

vi.mock("./AccessGroupsDetailsPage", () => ({
  AccessGroupDetail: () => null,
}));

vi.mock("./access-group-create/AccessGroupCreateDialog", () => ({
  AccessGroupCreateDialog: () => null,
}));

const makeGroup = (overrides: Partial<AccessGroupResponse> = {}): AccessGroupResponse => ({
  access_group_id: "ag-1",
  access_group_name: "Admin Group",
  description: "Administrators with full access",
  access_model_names: ["m1", "m2"],
  access_mcp_server_ids: ["s1"],
  access_agent_ids: ["a1"],
  assigned_team_ids: [],
  assigned_key_ids: [],
  access_mcp_servers: [{ id: "s1", name: "Server One" }],
  access_agents: [{ id: "a1", name: "Agent One" }],
  assigned_teams: [],
  assigned_keys: [],
  created_at: "2024-01-15T10:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-20T12:00:00Z",
  updated_by: "user-1",
  ...overrides,
});

const renderPage = () => renderWithProviders(<AccessGroupsPage />);

const openRowMenu = async (user: ReturnType<typeof userEvent.setup>, groupId: string) => {
  await user.click(screen.getByTestId(`access-group-actions-${groupId}`));
  return screen.findByTestId("access-group-action-delete");
};

describe("AccessGroupsPage Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseAccessGroups.mockReturnValue({ data: [makeGroup()], isLoading: false });
    mockUseDeleteAccessGroup.mockReturnValue({ mutate: mockMutate, isPending: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header, create action and search placeholder", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "访问组" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access Groups" })).not.toBeInTheDocument();
    expect(screen.getByText("管理组织的资源权限")).toBeInTheDocument();
    expect(screen.queryByText("Manage resource permissions for your organization")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建访问组" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Access Group" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、ID 或描述搜索访问组...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search groups by name, ID, or description...")).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-search control only once a query is typed", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByLabelText("清除搜索")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("按名称、ID 或描述搜索访问组..."), "Admin");

    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty and filtered empty states", async () => {
    mockUseAccessGroups.mockReturnValue({ data: [], isLoading: false });
    renderPage();

    expect(screen.getByText("暂无访问组")).toBeInTheDocument();
    expect(screen.queryByText("No access groups yet")).not.toBeInTheDocument();
    expect(screen.getByText("创建访问组以管理组织的资源权限。")).toBeInTheDocument();
    expect(
      screen.queryByText("Create an access group to manage resource permissions for your organization."),
    ).not.toBeInTheDocument();

    cleanup();
    mockUseAccessGroups.mockReturnValue({ data: [makeGroup()], isLoading: false });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("按名称、ID 或描述搜索访问组..."), {
      target: { value: "zzz-no-match" },
    });

    await waitFor(() => {
      expect(screen.getByText("没有匹配的访问组")).toBeInTheDocument();
    });
    expect(screen.queryByText("No matching access groups")).not.toBeInTheDocument();
    expect(screen.getByText("尝试其他搜索词。")).toBeInTheDocument();
    expect(screen.queryByText("Try a different search term.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the groups load", () => {
    mockUseAccessGroups.mockReturnValue({ data: undefined, isLoading: true });
    renderPage();

    expect(screen.getByText("正在加载访问组…")).toBeInTheDocument();
    expect(screen.queryByText("Loading access groups…")).not.toBeInTheDocument();
  });

  it("renders every Chinese column header and the hidden actions label", () => {
    renderPage();

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByTestId("sort-header-name")).toHaveTextContent("名称");
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.getByText("资源")).toBeInTheDocument();
    expect(screen.queryByText("Resources")).not.toBeInTheDocument();
    expect(screen.getByTestId("sort-header-createdAt")).toHaveTextContent("创建时间");
    expect(screen.queryByText("Created")).not.toBeInTheDocument();
    expect(screen.getByText("更新时间")).toBeInTheDocument();
    expect(screen.queryByText("Updated")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders the Chinese resource-count tooltips", () => {
    renderPage();

    expect(screen.getByTitle("2 个模型")).toHaveTextContent("2");
    expect(screen.getByTitle("1 个 MCP 服务器")).toHaveTextContent("1");
    expect(screen.getByTitle("1 个 Agent")).toHaveTextContent("1");
    expect(screen.queryByTitle("2 Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions and delete dialog", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByLabelText("打开访问组操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open access group actions")).not.toBeInTheDocument();

    const deleteItem = await openRowMenu(user, "ag-1");
    expect(deleteItem).toHaveTextContent("删除访问组");
    expect(screen.queryByText("Delete access group")).not.toBeInTheDocument();

    await user.click(deleteItem);
    const dialog = await screen.findByRole("dialog", { name: "删除访问组" });
    expect(screen.queryByRole("dialog", { name: "Delete Access Group" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此访问组？此操作无法撤销。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Are you sure you want to delete this access group? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("访问组信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Access Group Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("ID")).toBeInTheDocument();
    expect(within(dialog).getByText("名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Name")).not.toBeInTheDocument();
    expect(within(dialog).getByText("描述")).toBeInTheDocument();
    expect(within(dialog).queryByText("Description")).not.toBeInTheDocument();
  });
});
