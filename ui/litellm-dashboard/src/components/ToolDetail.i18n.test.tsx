import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, testQueryClient, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { ToolDetailResponse, ToolRow, ToolUsageLogsResponse } from "@/components/networking";

import { ToolDetail } from "./ToolDetail";
import ToolPoliciesView from "./ToolPoliciesView";

const fetchToolDetailMock = vi.fn();
const fetchToolPolicyOptionsMock = vi.fn();
const getToolUsageLogsMock = vi.fn();
const keyListCallMock = vi.fn();
const teamListCallMock = vi.fn();
const updateToolPolicyMock = vi.fn();
const deleteToolPolicyOverrideMock = vi.fn();

vi.mock("@/components/networking", () => ({
  deleteToolPolicyOverride: (...args: unknown[]) => deleteToolPolicyOverrideMock(...args),
  fetchToolDetail: (...args: unknown[]) => fetchToolDetailMock(...args),
  fetchToolPolicyOptions: (...args: unknown[]) => fetchToolPolicyOptionsMock(...args),
  getToolUsageLogs: (...args: unknown[]) => getToolUsageLogsMock(...args),
  keyListCall: (...args: unknown[]) => keyListCallMock(...args),
  teamListCall: (...args: unknown[]) => teamListCallMock(...args),
  updateToolPolicy: (...args: unknown[]) => updateToolPolicyMock(...args),
}));

vi.mock("@/components/common_components/team_dropdown", () => ({
  default: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" onClick={() => onChange("team-1")}>
      pick team
    </button>
  ),
}));

vi.mock("@/components/GuardrailsMonitor/LogViewer", () => ({
  LogViewer: () => <div>log viewer</div>,
}));

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const detail = {
  tool: {
    tool_name: "search_docs",
    input_policy: "untrusted",
    output_policy: "trusted",
    origin: "mcp",
    call_count: 42,
    user_agent: "litellm-python/1.0",
    created_at: "2026-03-04T10:00:00Z",
    last_used_at: "2026-03-05T10:00:00Z",
  },
  overrides: [],
} as unknown as ToolDetailResponse;

const renderDetail = () =>
  renderWithProviders(<ToolDetail toolName="search_docs" onBack={vi.fn()} accessToken="tok" />);

describe("ToolDetail Chinese copy", () => {
  beforeEach(async () => {
    testQueryClient.clear();
    fetchToolDetailMock.mockReset().mockResolvedValue(detail);
    fetchToolPolicyOptionsMock.mockReset().mockResolvedValue({ input_policies: [], output_policies: [] });
    teamListCallMock.mockReset().mockResolvedValue({ data: [] });
    keyListCallMock.mockReset().mockResolvedValue({ keys: [] });
    getToolUsageLogsMock.mockReset().mockResolvedValue({ logs: [], total: 0 } as unknown as ToolUsageLogsResponse);
    updateToolPolicyMock.mockReset().mockResolvedValue(undefined as unknown as ToolRow);
    deleteToolPolicyOverrideMock
      .mockReset()
      .mockResolvedValue(undefined as unknown as { deleted: boolean; tool_name: string });
    can.mockReset().mockReturnValue(true);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the detail header and policy panels in Chinese", async () => {
    renderDetail();

    expect(await screen.findByText("search_docs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回工具策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Tool Policies" })).not.toBeInTheDocument();
    expect(screen.getByText("42 次调用")).toBeInTheDocument();
    expect(screen.queryByText("42 calls")).not.toBeInTheDocument();
    expect(screen.getByText("用户代理：")).toBeInTheDocument();
    expect(screen.queryByText("User Agent:")).not.toBeInTheDocument();
    expect(screen.getByText("首次发现：")).toBeInTheDocument();
    expect(screen.queryByText("First Discovered:")).not.toBeInTheDocument();
    expect(screen.getByText("上次使用：")).toBeInTheDocument();
    expect(screen.queryByText("Last Used:")).not.toBeInTheDocument();

    expect(screen.getByText("输入策略")).toBeInTheDocument();
    expect(screen.queryByText("Input Policy")).not.toBeInTheDocument();
    expect(screen.getByText("控制此工具允许接收的数据。")).toBeInTheDocument();
    expect(screen.queryByText("Controls what data this tool is allowed to accept.")).not.toBeInTheDocument();
    expect(screen.getByText("输出策略")).toBeInTheDocument();
    expect(screen.queryByText("Output Policy")).not.toBeInTheDocument();
    expect(screen.getByText("控制下游工具如何信任此工具的输出。")).toBeInTheDocument();
    expect(
      screen.queryByText("Controls how this tool's output is trusted by downstream tools."),
    ).not.toBeInTheDocument();

    expect(screen.getByText("按团队或密钥阻止")).toBeInTheDocument();
    expect(screen.queryByText("Block for team or key")).not.toBeInTheDocument();
    expect(screen.getByText("范围")).toBeInTheDocument();
    expect(screen.queryByText("Scope")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "团队" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Team" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Key" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "阻止团队" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Block for team" })).not.toBeInTheDocument();
    expect(screen.getByText("最近调用")).toBeInTheDocument();
    expect(screen.queryByText("Recent invocations")).not.toBeInTheDocument();
  });

  it("renders the blocked-overrides list in Chinese", async () => {
    fetchToolDetailMock.mockResolvedValue({
      ...detail,
      overrides: [
        { override_id: "o1", team_id: "team-alpha", key_hash: null, key_alias: null },
        { override_id: "o2", team_id: null, key_hash: "hash-abc", key_alias: "prod-key" },
      ],
    } as unknown as ToolDetailResponse);

    renderDetail();

    expect(await screen.findByText("已按团队或密钥阻止")).toBeInTheDocument();
    expect(screen.queryByText("Blocked for team or key")).not.toBeInTheDocument();
    expect(screen.getByText("团队：team-alpha")).toBeInTheDocument();
    expect(screen.queryByText("Team: team-alpha")).not.toBeInTheDocument();
    expect(screen.getByText("密钥：prod-key")).toBeInTheDocument();
    expect(screen.queryByText("Key: prod-key")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "移除" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Remove" })).toHaveLength(0);
  });

  it("renders the key-scope block form in Chinese", async () => {
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText("按团队或密钥阻止");
    await user.click(screen.getByRole("radio", { name: "密钥" }));

    expect(await screen.findByRole("button", { name: "阻止密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Block for key" })).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择密钥"));

    expect(await screen.findByText("未找到密钥")).toBeInTheDocument();
    expect(screen.queryByText("No keys found")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select key")).not.toBeInTheDocument();
  });

  it("renders the failed-load state in Chinese", async () => {
    fetchToolDetailMock.mockRejectedValue(new Error("nope"));

    renderDetail();

    expect(await screen.findByText("加载工具详情失败。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load tool details.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回工具策略" })).toBeInTheDocument();
  });

  it("reports override failures in Chinese", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    fetchToolDetailMock.mockResolvedValue({
      ...detail,
      overrides: [{ override_id: "o1", team_id: "team-alpha", key_hash: null, key_alias: null }],
    } as unknown as ToolDetailResponse);
    deleteToolPolicyOverrideMock.mockRejectedValue(new Error("boom"));

    renderDetail();

    await user.click(await screen.findByRole("button", { name: "移除" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("移除覆盖失败：boom"));
    expect(alertSpy).not.toHaveBeenCalledWith("Failed to remove override: boom");
    alertSpy.mockRestore();
  });

  it("reports a policy update failure in Chinese", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    updateToolPolicyMock.mockRejectedValue(new Error("boom"));

    renderDetail();

    await screen.findByText("输入策略");
    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name: "可信" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("更新输入策略失败：boom"));
    expect(alertSpy).not.toHaveBeenCalledWith("Failed to update input policy: boom");
    alertSpy.mockRestore();
  });

  it("reports an add-override failure in Chinese", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    updateToolPolicyMock.mockRejectedValue(new Error("boom"));

    renderDetail();

    await screen.findByText("按团队或密钥阻止");
    await user.click(screen.getByRole("button", { name: "pick team" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "阻止团队" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "阻止团队" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("添加覆盖失败：boom"));
    expect(alertSpy).not.toHaveBeenCalledWith("Failed to add override: boom");
    alertSpy.mockRestore();
  });

  it("renders the admin-only notice of the tool policies view in Chinese", () => {
    can.mockReturnValue(false);

    renderWithProviders(<ToolPoliciesView accessToken="token" />);

    expect(screen.getByText("工具策略仅对管理员用户可用。")).toBeInTheDocument();
    expect(screen.queryByText("Tool Policies is only available to admin users.")).not.toBeInTheDocument();
  });
});
