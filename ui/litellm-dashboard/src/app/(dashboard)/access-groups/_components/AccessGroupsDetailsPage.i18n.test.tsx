import { useAccessGroupDetails } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroupDetails";
import { AccessGroupResponse } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { AccessGroupDetail } from "./AccessGroupsDetailsPage";

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroupDetails");
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./AccessGroupsModal/AccessGroupEditModal", () => ({
  AccessGroupEditModal: () => null,
}));

const mockUseAccessGroupDetails = vi.mocked(useAccessGroupDetails);

const baseMockReturnValue = {
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  isFetching: false,
  isPending: false,
  isSuccess: true,
  status: "success" as const,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  errorUpdateCount: 0,
  isFetched: true,
  isFetchedAfterMount: true,
  isRefetching: false,
  isLoadingError: false,
  isPaused: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isStale: false,
  fetchStatus: "idle" as const,
  refetch: vi.fn(),
} as unknown as ReturnType<typeof useAccessGroupDetails>;

const unnamed = (ids: readonly string[]) => ids.map((id) => ({ id, name: null }));

const createMockAccessGroup = (overrides: Partial<AccessGroupResponse> = {}): AccessGroupResponse => ({
  access_group_id: "ag-1",
  access_group_name: "Test Group",
  description: "A test access group",
  access_model_names: ["model-1", "model-2"],
  access_mcp_server_ids: ["mcp-1"],
  access_agent_ids: ["agent-1"],
  assigned_team_ids: ["team-1"],
  assigned_key_ids: ["key-1", "key-2"],
  access_mcp_servers: [{ id: "mcp-1", name: "GitHub MCP" }],
  access_agents: [{ id: "agent-1", name: "Support Agent" }],
  assigned_teams: [{ id: "team-1", name: "Platform Team" }],
  assigned_keys: [
    { id: "key-1", name: "ci-key" },
    { id: "key-2", name: null },
  ],
  created_at: "2025-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2025-01-02T00:00:00Z",
  updated_by: "user-1",
  ...overrides,
});

const renderWith = (overrides: Partial<AccessGroupResponse> = {}) => {
  mockUseAccessGroupDetails.mockReturnValue({
    ...baseMockReturnValue,
    data: createMockAccessGroup(overrides),
  } as ReturnType<typeof useAccessGroupDetails>);
  return renderWithProviders(<AccessGroupDetail accessGroupId="ag-1" onBack={vi.fn()} />);
};

describe("AccessGroupDetail Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseAccessGroupDetails.mockReturnValue({
      ...baseMockReturnValue,
      data: createMockAccessGroup(),
    } as ReturnType<typeof useAccessGroupDetails>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese detail chrome and metadata labels", () => {
    renderWith();

    expect(screen.getByLabelText("返回")).toBeInTheDocument();
    expect(screen.queryByLabelText("Back")).not.toBeInTheDocument();
    expect(screen.getByText("ID：ag-1")).toBeInTheDocument();
    expect(screen.queryByText("ID: ag-1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制访问组 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy access group ID")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑访问组" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Access Group" })).not.toBeInTheDocument();
    expect(screen.getByText("组详情")).toBeInTheDocument();
    expect(screen.queryByText("Group Details")).not.toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("最后更新")).toBeInTheDocument();
    expect(screen.queryByText("Last Updated")).not.toBeInTheDocument();
    expect(screen.getAllByText("由")).toHaveLength(2);
    expect(screen.queryAllByText("by")).toHaveLength(0);
  });

  it("renders the Chinese not-found state", () => {
    mockUseAccessGroupDetails.mockReturnValue({
      ...baseMockReturnValue,
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useAccessGroupDetails>);

    renderWithProviders(<AccessGroupDetail accessGroupId="ag-1" onBack={vi.fn()} />);

    expect(screen.getByText("未找到访问组")).toBeInTheDocument();
    expect(screen.queryByText("Access group not found")).not.toBeInTheDocument();
  });

  it("renders the Chinese attached sections and the view-all toggle", async () => {
    const user = userEvent.setup();
    renderWith({ assigned_keys: unnamed(["k1", "k2", "k3", "k4", "k5", "k6"]) });

    expect(screen.getByText("已附加的密钥")).toBeInTheDocument();
    expect(screen.queryByText("Attached Keys")).not.toBeInTheDocument();
    expect(screen.getByText("已附加的团队")).toBeInTheDocument();
    expect(screen.queryByText("Attached Teams")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "查看全部（6）" }));
    expect(screen.queryByRole("button", { name: "View All (6)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "收起" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Less" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty attached states", () => {
    renderWith({ assigned_keys: [], assigned_teams: [] });

    expect(screen.getByText("未附加密钥")).toBeInTheDocument();
    expect(screen.queryByText("No keys attached")).not.toBeInTheDocument();
    expect(screen.getByText("未附加团队")).toBeInTheDocument();
    expect(screen.queryByText("No teams attached")).not.toBeInTheDocument();
  });

  it("renders the Chinese tabs and their empty messages", async () => {
    const user = userEvent.setup();
    renderWith({ access_model_names: [], access_mcp_servers: [], access_agents: [] });

    expect(screen.getByRole("tab", { name: /模型/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Models/ })).not.toBeInTheDocument();
    expect(screen.getByText("此组未分配模型")).toBeInTheDocument();
    expect(screen.queryByText("No models assigned to this group")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /MCP 服务器/ }));
    expect(screen.queryByRole("tab", { name: /MCP Servers/ })).not.toBeInTheDocument();
    expect(screen.getByText("此组未分配 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("No MCP servers assigned to this group")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Agent/ }));
    expect(screen.queryByRole("tab", { name: /Agents/ })).not.toBeInTheDocument();
    expect(screen.getByText("此组未分配 Agent")).toBeInTheDocument();
    expect(screen.queryByText("No agents assigned to this group")).not.toBeInTheDocument();
  });
});
