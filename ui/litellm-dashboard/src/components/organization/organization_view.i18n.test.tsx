import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import {
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
  userFilterUICall,
} from "../networking";
import OrganizationInfoView from "./organization_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/organizations",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("../networking", () => ({
  __esModule: true,
  organizationMemberAddCall: vi.fn(),
  organizationMemberUpdateCall: vi.fn(),
  organizationMemberDeleteCall: vi.fn(),
  userFilterUICall: vi.fn(),
  serverRootPath: "",
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganization: vi.fn(),
  organizationKeys: {
    all: ["organizations"],
    list: () => ["organizations", "list"],
    detail: (id: string) => ["organizations", "detail", id],
  },
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [] }),
  useTeam: () => ({ data: undefined }),
}));

vi.mock("../object_permissions_view", () => ({
  __esModule: true,
  default: () => <div data-testid="object-permissions-view" />,
}));

const mockUseOrganization = vi.mocked(useOrganization);

const mockOrg = {
  organization_alias: "Acme Corp",
  organization_id: "org_123",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  created_by: "admin@example.com",
  spend: 12.5,
  models: [] as string[],
  litellm_budget_table: {
    tpm_limit: 100,
    rpm_limit: 50,
    max_budget: 1000,
    budget_duration: "30d",
    max_parallel_requests: 7,
  },
  object_permission: {},
  members: [
    {
      user_id: "u1",
      user_email: "u1@example.com",
      user_role: "org_admin",
      spend: 1.5,
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
  teams: [],
  metadata: null,
};

const renderView = () =>
  renderWithProviders(
    <OrganizationInfoView
      organizationId="org_123"
      onClose={() => {}}
      accessToken="test-token"
      is_org_admin={false}
      is_proxy_admin
      userModels={[]}
      editOrg={false}
    />,
  );

const createdDate = () => new Date(mockOrg.created_at).toLocaleDateString();
const updatedDate = () => new Date(mockOrg.updated_at).toLocaleDateString();

describe("OrganizationInfoView Chinese copy", () => {
  beforeEach(async () => {
    mockUseOrganization.mockReturnValue({ data: mockOrg, isLoading: false } as unknown as ReturnType<
      typeof useOrganization
    >);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the overview header, cards and badges in Chinese and hides the English originals", () => {
    renderView();

    expect(screen.getByRole("button", { name: "返回组织" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Organizations" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制组织 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy organization ID")).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "成员" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Settings" })).not.toBeInTheDocument();

    expect(screen.getByText("组织详情")).toBeInTheDocument();
    expect(screen.queryByText("Organization Details")).not.toBeInTheDocument();
    expect(screen.getByText(`创建时间：${createdDate()}`)).toBeInTheDocument();
    expect(screen.queryByText(`Created: ${createdDate()}`)).not.toBeInTheDocument();
    expect(screen.getByText(`更新时间：${updatedDate()}`)).toBeInTheDocument();
    expect(screen.queryByText(`Updated: ${updatedDate()}`)).not.toBeInTheDocument();
    expect(screen.getByText("创建者：admin@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Created By: admin@example.com")).not.toBeInTheDocument();

    expect(screen.getByText("预算状态")).toBeInTheDocument();
    expect(screen.queryByText("Budget Status")).not.toBeInTheDocument();
    expect(screen.getByText("共 $1,000.0000")).toBeInTheDocument();
    expect(screen.queryByText("of $1,000.0000")).not.toBeInTheDocument();
    expect(screen.getByText("重置：30d")).toBeInTheDocument();
    expect(screen.queryByText("Reset: 30d")).not.toBeInTheDocument();

    expect(screen.getByText("速率限制")).toBeInTheDocument();
    expect(screen.queryByText("Rate Limits")).not.toBeInTheDocument();
    expect(screen.getByText("最大并行请求数：7")).toBeInTheDocument();
    expect(screen.queryByText("Max Parallel Requests: 7")).not.toBeInTheDocument();

    expect(screen.getByText("所有 Proxy 模型")).toBeInTheDocument();
    expect(screen.queryByText("All proxy models")).not.toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.queryByText("Teams")).not.toBeInTheDocument();
  });

  it("renders the member table headings and empty state in Chinese", async () => {
    const user = userEvent.setup();
    mockUseOrganization.mockReturnValue({
      data: { ...mockOrg, members: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useOrganization>);
    renderView();

    await user.click(screen.getByRole("tab", { name: "成员" }));

    const panel = screen.getByRole("tabpanel", { name: "成员" });
    expect(within(panel).getByText("组织角色")).toBeInTheDocument();
    expect(within(panel).queryByText("Organization Role")).not.toBeInTheDocument();
    expect(within(panel).getByText("消费（USD）")).toBeInTheDocument();
    expect(within(panel).queryByText("Spend (USD)")).not.toBeInTheDocument();
    expect(within(panel).getAllByText("创建时间").length).toBeGreaterThan(0);
    expect(within(panel).queryByText("Created At")).not.toBeInTheDocument();
    expect(within(panel).getByText("未找到成员")).toBeInTheDocument();
    expect(within(panel).queryByText("No members found")).not.toBeInTheDocument();
  });

  it("renders the settings tab in Chinese, including the unlimited and never fallbacks", async () => {
    const user = userEvent.setup();
    mockUseOrganization.mockReturnValue({
      data: {
        ...mockOrg,
        litellm_budget_table: { ...mockOrg.litellm_budget_table, max_budget: null, budget_duration: null },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useOrganization>);
    renderView();

    await user.click(screen.getByRole("tab", { name: "设置" }));

    const panel = screen.getByRole("tabpanel", { name: "设置" });
    expect(within(panel).getByText("组织设置")).toBeInTheDocument();
    expect(within(panel).queryByText("Organization Settings")).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();
    expect(within(panel).getByText("组织名称")).toBeInTheDocument();
    expect(within(panel).queryByText("Organization Name")).not.toBeInTheDocument();
    expect(within(panel).getByText("组织 ID")).toBeInTheDocument();
    expect(within(panel).queryByText("Organization ID")).not.toBeInTheDocument();
    expect(within(panel).getByText("预算")).toBeInTheDocument();
    expect(within(panel).queryByText("Budget")).not.toBeInTheDocument();
    expect(within(panel).getByText("最大：不限")).toBeInTheDocument();
    expect(within(panel).queryByText("Max: No Limit")).not.toBeInTheDocument();
    expect(within(panel).getByText("重置：从不")).toBeInTheDocument();
    expect(within(panel).queryByText("Reset: Never")).not.toBeInTheDocument();
  });

  it("renders the add-member modal title, role labels and role descriptions in Chinese", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(await screen.findByRole("button", { name: "添加成员" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("添加组织成员")).toBeInTheDocument();
    expect(screen.queryByText("Add Organization Member")).not.toBeInTheDocument();

    await user.click(within(dialog).getByLabelText("成员角色"));

    expect(await screen.findByRole("option", { name: /组织管理员/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^org_admin / })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: /内部用户（只读）/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^internal_user_viewer / })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^internal_user / })).not.toBeInTheDocument();
    expect(screen.getByText("- 可以添加和移除成员，并更改他们的角色。")).toBeInTheDocument();
    expect(screen.queryByText("- Can add and remove members, and change their roles.")).not.toBeInTheDocument();
    expect(screen.getByText("- 可以在组织内查看或创建自己的密钥。")).toBeInTheDocument();
    expect(screen.queryByText("- Can view/create keys for themselves within organization.")).not.toBeInTheDocument();
    expect(screen.getByText("- 只能查看自己在组织内的密钥。")).toBeInTheDocument();
    expect(screen.queryByText("- Can only view their keys within organization.")).not.toBeInTheDocument();
  });

  it("renders the edit-member modal title and role options in Chinese", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(await screen.findByTestId("edit-member"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("编辑成员")).toBeInTheDocument();
    expect(screen.queryByText("Edit Member")).not.toBeInTheDocument();

    await user.click(within(dialog).getByLabelText(/角色/));

    expect(await screen.findByRole("option", { name: "组织管理员" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Org Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "内部用户" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Internal User" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "内部用户（只读）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Internal User Viewer" })).not.toBeInTheDocument();
  });

  it("reports member delete outcomes in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(organizationMemberDeleteCall).mockResolvedValueOnce(undefined as never);
    renderView();

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(await screen.findByTestId("delete-member"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("组织成员删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Organization member deleted successfully");

    vi.mocked(organizationMemberDeleteCall).mockRejectedValueOnce(new Error("boom"));
    await user.click(screen.getByTestId("delete-member"));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除组织成员失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete organization member");
  });

  it("reports member update outcomes in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(organizationMemberUpdateCall).mockResolvedValueOnce(undefined as never);
    renderView();

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(await screen.findByTestId("edit-member"));
    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("组织成员更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Organization member updated successfully");

    vi.mocked(organizationMemberUpdateCall).mockRejectedValueOnce(new Error("boom"));
    await user.click(screen.getByTestId("edit-member"));
    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新组织成员失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update organization member");
  });

  it("reports member add outcomes in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(userFilterUICall).mockResolvedValue([
      { user_id: "u2", user_email: "new@example.com", role: "internal_user" },
    ] as never);
    vi.mocked(organizationMemberAddCall).mockResolvedValueOnce(undefined as never);
    renderView();

    const pickUserAndSubmit = async () => {
      const dialog = await screen.findByRole("dialog");
      const emailInput = within(within(dialog).getByTestId("member-email-search")).getByRole("combobox");
      await user.click(emailInput);
      await user.type(emailInput, "new");
      await waitFor(() => expect(userFilterUICall).toHaveBeenCalled(), { timeout: 3000 });
      await user.click(await screen.findByRole("option", { name: "new@example.com" }));
      await user.click(within(dialog).getByRole("button", { name: "添加成员" }));
    };

    await user.click(screen.getByRole("tab", { name: "成员" }));
    await user.click(await screen.findByRole("button", { name: "添加成员" }));
    await pickUserAndSubmit();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("组织成员添加成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Organization member added successfully");

    vi.mocked(organizationMemberAddCall).mockRejectedValueOnce(new Error("boom"));
    await user.click(await screen.findByRole("button", { name: "添加成员" }));
    await pickUserAndSubmit();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("添加组织成员失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to add organization member");
  });

  it("renders the loading and not-found states in Chinese", () => {
    mockUseOrganization.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<
      typeof useOrganization
    >);
    renderView();
    expect(screen.getByText("加载中…")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    cleanup();
    mockUseOrganization.mockReturnValue({ data: undefined, isLoading: false } as unknown as ReturnType<
      typeof useOrganization
    >);
    renderView();
    expect(screen.getByText("未找到组织")).toBeInTheDocument();
    expect(screen.queryByText("Organization not found")).not.toBeInTheDocument();
  });
});
