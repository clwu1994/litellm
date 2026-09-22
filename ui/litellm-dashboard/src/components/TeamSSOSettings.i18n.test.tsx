import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import * as networking from "./networking";
import TeamSSOSettings from "./TeamSSOSettings";

vi.mock("./networking");

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    token: "test-token",
    accessToken: "test-token",
    userId: "test-user",
    userEmail: "test-user@example.com",
    userRole: "Admin",
    premiumUser: true,
    disabledPersonalKeyCreation: null,
    showSSOBanner: false,
  }),
}));

vi.mock("./common_components/budget_duration_dropdown", () => {
  const BudgetDurationDropdown = () => <select data-testid="budget-duration-dropdown" aria-label="预算周期" />;
  BudgetDurationDropdown.displayName = "BudgetDurationDropdown";
  return {
    default: BudgetDurationDropdown,
    getBudgetDurationLabel: vi.fn((value: string) => value),
  };
});

vi.mock("./key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: vi.fn((model: string) => model),
}));

vi.mock("./common_components/OrganizationDropdown", () => ({
  default: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label="default-organization" placeholder={placeholder} readOnly />
  ),
}));

vi.mock("./ModelSelect/ModelSelect", () => {
  const ModelSelect = () => <select data-testid="model-select" aria-label="模型" multiple />;
  ModelSelect.displayName = "ModelSelect";
  return { ModelSelect };
});

const mockGetDefaultTeamSettings = vi.mocked(networking.getDefaultTeamSettings);
const mockUpdateDefaultTeamSettings = vi.mocked(networking.updateDefaultTeamSettings);

const MOCK_ORGANIZATIONS = [{ organization_id: "org-1", organization_alias: "Engineering" }];

const settingsResponse = {
  values: {
    max_budget: 1000,
    budget_duration: "30d",
    tpm_limit: 500,
    rpm_limit: 100,
    models: ["gpt-4"],
    team_member_permissions: ["/key/generate"],
  },
};

const renderSettings = () =>
  renderWithProviders(<TeamSSOSettings accessToken="test-token" userID="test-user" userRole="admin" />);

describe("TeamSSOSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    vi.mocked(networking.organizationListCall).mockResolvedValue(MOCK_ORGANIZATIONS);
    mockGetDefaultTeamSettings.mockResolvedValue(settingsResponse as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the section headings, row labels and descriptions in Chinese", async () => {
    renderSettings();

    expect(await screen.findByText("默认团队设置")).toBeInTheDocument();
    expect(screen.queryByText("Default Team Settings")).not.toBeInTheDocument();
    expect(screen.getByText("创建新团队时默认应用这些设置。")).toBeInTheDocument();
    expect(
      screen.queryByText("These settings will be applied by default when creating new teams."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("预算与速率限制")).toBeInTheDocument();
    expect(screen.queryByText("Budget & Rate Limits")).not.toBeInTheDocument();
    expect(screen.getByText("访问与权限")).toBeInTheDocument();
    expect(screen.queryByText("Access & Permissions")).not.toBeInTheDocument();

    expect(screen.getByText("最大预算")).toBeInTheDocument();
    expect(screen.queryByText("Max Budget")).not.toBeInTheDocument();
    expect(screen.getByText("新自动创建团队的最大预算（以 USD 计）。")).toBeInTheDocument();
    expect(screen.queryByText("Maximum budget (in USD) for new automatically created teams.")).not.toBeInTheDocument();

    expect(screen.getByText("预算周期")).toBeInTheDocument();
    expect(screen.queryByText("Budget Duration")).not.toBeInTheDocument();
    expect(screen.getByText("团队预算重置的频率。")).toBeInTheDocument();
    expect(screen.queryByText("How frequently the team's budget resets.")).not.toBeInTheDocument();

    expect(screen.getByText("所有模型合计允许的每分钟最大 Token 数。")).toBeInTheDocument();
    expect(screen.queryByText("Maximum tokens per minute allowed across all models.")).not.toBeInTheDocument();
    expect(screen.getByText("所有模型合计允许的每分钟最大请求数。")).toBeInTheDocument();
    expect(screen.queryByText("Maximum requests per minute allowed across all models.")).not.toBeInTheDocument();

    expect(screen.getByText("默认组织")).toBeInTheDocument();
    expect(screen.queryByText("Default Organization")).not.toBeInTheDocument();
    expect(screen.getByText("未指定组织而创建的团队会分配到该组织。")).toBeInTheDocument();
    expect(
      screen.queryByText("Teams created without an explicit organization are assigned to this organization."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("新团队默认可访问的模型列表。")).toBeInTheDocument();
    expect(screen.queryByText("Default list of models that new teams can access.")).not.toBeInTheDocument();

    expect(screen.getByText("团队成员权限")).toBeInTheDocument();
    expect(screen.queryByText("Team Member Permissions")).not.toBeInTheDocument();
    expect(
      screen.getByText("新创建团队的成员默认获得的权限。/key/info 和 /key/health 始终包含在内。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Default permissions granted to members of newly created teams. /key/info and /key/health are always included.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the edit controls, not-set placeholder and permission placeholder in Chinese", async () => {
    const user = userEvent.setup();
    renderSettings();

    await screen.findByText("默认团队设置");
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑设置" }));

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择权限")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select permissions")).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("未设置").length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Not set")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择组织")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an organization")).not.toBeInTheDocument();
  });

  it("renders the not-set fallback in Chinese when a value is missing", async () => {
    mockGetDefaultTeamSettings.mockResolvedValue({ values: {} } as never);
    renderSettings();

    expect(await screen.findAllByText("未设置")).not.toHaveLength(0);
    expect(screen.queryByText("Not set")).not.toBeInTheDocument();
  });

  it("renders the loading accessible name in Chinese", () => {
    mockGetDefaultTeamSettings.mockImplementation(() => new Promise(() => {}));
    renderSettings();

    expect(screen.getByLabelText("正在加载默认团队设置")).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading default team settings")).not.toBeInTheDocument();
  });

  it("renders the unavailable state and fetch failure toast in Chinese", async () => {
    mockGetDefaultTeamSettings.mockRejectedValue(new Error("Fetch failed"));
    renderSettings();

    expect(await screen.findByText("没有可用的团队设置，或者你没有查看权限。")).toBeInTheDocument();
    expect(
      screen.queryByText("No team settings available or you do not have permission to view them."),
    ).not.toBeInTheDocument();
    expect(toast.fromError).toHaveBeenCalledWith("获取团队设置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to fetch team settings");
  });

  it("reports the save outcome in Chinese", async () => {
    const user = userEvent.setup();
    mockUpdateDefaultTeamSettings.mockResolvedValue({ settings: settingsResponse.values } as never);
    renderSettings();

    await screen.findByText("默认团队设置");
    await user.click(screen.getByRole("button", { name: "编辑设置" }));
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("默认团队设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Default team settings updated successfully");

    mockUpdateDefaultTeamSettings.mockRejectedValueOnce(new Error("Save failed"));
    await user.click(screen.getByRole("button", { name: "编辑设置" }));
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新团队设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update team settings");
  });
});
