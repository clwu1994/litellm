import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import {
  approveMCPServer,
  fetchMCPSubmissions,
  getGeneralSettingsCall,
  rejectMCPServer,
  updateConfigFieldSetting,
} from "@/components/networking";
import { toast } from "@/lib/toast";
import type { MCPServer, MCPSubmissionsSummary } from "@/components/mcp_tools/types";

import { MCPSubmissionsTab } from "./MCPSubmissionsTab";

vi.mock("@/components/networking", () => ({
  fetchMCPSubmissions: vi.fn(),
  approveMCPServer: vi.fn(),
  rejectMCPServer: vi.fn(),
  getGeneralSettingsCall: vi.fn(),
  updateConfigFieldSetting: vi.fn(),
}));

const server = (overrides: Partial<MCPServer> = {}): MCPServer =>
  ({
    server_id: "srv-1",
    server_name: "github",
    alias: "github",
    description: "GitHub MCP",
    url: "https://api.github.com/mcp",
    transport: "sse",
    submitted_by: "user@example.com",
    submitted_at: "2026-01-01T00:00:00Z",
    approval_status: "pending_review",
    ...overrides,
  }) as MCPServer;

const summary = (items: MCPServer[]): MCPSubmissionsSummary => ({
  total: items.length,
  pending_review: items.filter((s) => s.approval_status === "pending_review").length,
  active: items.filter((s) => s.approval_status === "active").length,
  rejected: items.filter((s) => s.approval_status === "rejected").length,
  items,
});

const settingsWith = (requiredFields: string[]) => ({
  data: [{ field_name: "mcp_required_fields", field_value: requiredFields }],
});

const renderTab = () => render(<MCPSubmissionsTab accessToken="sk-test" />);

const mockLoaded = (items: MCPServer[], requiredFields: string[] = []) => {
  vi.mocked(fetchMCPSubmissions).mockResolvedValue(summary(items));
  vi.mocked(getGeneralSettingsCall).mockResolvedValue(settingsWith(requiredFields) as never);
};

describe("MCPSubmissionsTab Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(updateConfigFieldSetting).mockResolvedValue({} as never);
    vi.mocked(approveMCPServer).mockResolvedValue({} as never);
    vi.mocked(rejectMCPServer).mockResolvedValue({} as never);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the stat cards, search and filter controls in Chinese and hides the English originals", async () => {
    mockLoaded([server()]);
    renderTab();

    expect(await screen.findByText("已提交总数")).toBeInTheDocument();
    expect(screen.getAllByText("待审核").length).toBeGreaterThan(0);
    expect(screen.getAllByText("活动").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已拒绝").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("搜索 MCP 服务器...")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "所有状态" })).toBeInTheDocument();
    expect(screen.queryByText("Total Submitted")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Review")).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All Status" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search MCP servers...")).not.toBeInTheDocument();
  });

  it("renders the submission rules panel in Chinese and hides the English originals", async () => {
    mockLoaded([server()], ["description"]);
    renderTab();

    expect(await screen.findByText("提交规则")).toBeInTheDocument();
    expect(screen.getByText("（1 个必填字段）")).toBeInTheDocument();
    expect(screen.getAllByText("描述").length).toBeGreaterThan(0);
    expect(screen.queryByText("Submission Rules")).not.toBeInTheDocument();
    expect(screen.queryByText("(1 required field)")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("renders the expanded rules editor in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()], ["description"]);
    renderTab();

    await user.click(await screen.findByText("提交规则"));

    expect(
      screen.getByText("选择提交被视为合规前必须填写的字段。LiteLLM 会在下方每张提交卡片上为每条规则显示 ✓ / ✗。"),
    ).toBeInTheDocument();
    expect(screen.getByText("文档")).toBeInTheDocument();
    expect(screen.getByText("来源")).toBeInTheDocument();
    expect(screen.getByText("连接")).toBeInTheDocument();
    expect(screen.getByText("安全")).toBeInTheDocument();
    expect(screen.getByText("别名")).toBeInTheDocument();
    expect(screen.getByText("必须有显示别名")).toBeInTheDocument();
    expect(screen.getByText("GitHub / 源 URL")).toBeInTheDocument();
    expect(screen.getByText("必须链接到源代码仓库")).toBeInTheDocument();
    expect(screen.getByText("服务器 URL")).toBeInTheDocument();
    expect(screen.getByText("必须配置 URL")).toBeInTheDocument();
    expect(screen.getByText("已配置认证")).toBeInTheDocument();
    expect(screen.getByText("必须使用认证（不能是 'none'）")).toBeInTheDocument();
    expect(screen.getByText("保存规则")).toBeInTheDocument();
    expect(screen.queryByText("Save Rules")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select which fields must be filled in before a submission is considered compliant. LiteLLM will show ✓ / ✗ for each rule on every submission card below.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
    expect(screen.queryByText("Connection")).not.toBeInTheDocument();
    expect(screen.queryByText("Security")).not.toBeInTheDocument();
    expect(screen.queryByText("Server URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Auth configured")).not.toBeInTheDocument();
  });

  it("renders the no-rules state and the save-pending label in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()]);
    vi.mocked(updateConfigFieldSetting).mockReturnValue(new Promise(() => {}) as never);
    renderTab();

    expect(await screen.findByText("未设置规则")).toBeInTheDocument();
    expect(screen.queryByText("no rules set")).not.toBeInTheDocument();

    await user.click(screen.getByText("提交规则"));
    await user.click(screen.getByText("保存规则"));

    expect(await screen.findByText("正在保存…")).toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("renders the passing and failing check rows in Chinese and hides the English originals", async () => {
    mockLoaded([server()], ["description", "alias"]);
    renderTab();

    expect(await screen.findByText("所有检查均已通过")).toBeInTheDocument();
    expect(screen.getByText("2 项通过，0 项失败")).toBeInTheDocument();
    expect(screen.getAllByText("通过")).toHaveLength(2);
    expect(screen.getByText("传输方式：sse")).toBeInTheDocument();
    expect(screen.getByText("提交者：user@example.com")).toBeInTheDocument();
    expect(screen.queryByText("All checks passed")).not.toBeInTheDocument();
    expect(screen.queryByText("2 passing, 0 failing")).not.toBeInTheDocument();
    expect(screen.queryByText("Passes")).not.toBeInTheDocument();
    expect(screen.queryByText("Transport: sse")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitted by: user@example.com")).not.toBeInTheDocument();

    cleanup();
    mockLoaded([server({ description: "", alias: "" })], ["description", "alias"]);
    renderTab();

    expect(await screen.findByText("2 项检查失败")).toBeInTheDocument();
    expect(screen.getByText("0 项通过，2 项失败")).toBeInTheDocument();
    expect(screen.getAllByText("缺失")).toHaveLength(2);
    expect(screen.queryByText("2 checks failed")).not.toBeInTheDocument();
    expect(screen.queryByText("Missing")).not.toBeInTheDocument();
  });

  it("renders the rejection reason in Chinese and hides the English original", async () => {
    mockLoaded([server({ approval_status: "rejected", review_notes: "not documented" })]);
    renderTab();

    expect(await screen.findByText("拒绝原因：not documented")).toBeInTheDocument();
    expect(screen.queryByText("Rejection reason: not documented")).not.toBeInTheDocument();
  });

  it("renders the approve confirmation in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()]);
    renderTab();

    await user.click(await screen.findByRole("button", { name: "批准" }));

    expect(screen.getByText("批准 MCP 服务器")).toBeInTheDocument();
    expect(
      screen.getByText("确定要批准“github”吗？这将激活该服务器。批准后，提交用户将在其 MCP 服务器列表中看到它。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByText("Approve MCP Server")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Are you sure you want to approve "github"? This will activate the server. The submitting user will see it in their MCP Servers list once approved.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the pending-rejection confirmation in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()]);
    renderTab();

    await user.click(await screen.findByRole("button", { name: "拒绝" }));

    expect(screen.getByText("拒绝 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("确定要拒绝“github”吗？这会将提交标记为已拒绝。")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("拒绝原因（可选）")).toBeInTheDocument();
    expect(screen.queryByText("Reject MCP Server")).not.toBeInTheDocument();
    expect(
      screen.queryByText('Are you sure you want to reject "github"? This will mark the submission as rejected.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Reason for rejection (optional)")).not.toBeInTheDocument();
  });

  it("renders the live-rejection confirmation and re-approve action in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server({ approval_status: "active" })]);
    renderTab();

    await user.click(await screen.findByRole("button", { name: "拒绝" }));

    expect(
      screen.getByText("确定要拒绝“github”吗？此服务器当前正在运行。拒绝将立即将其从代理运行时中移除。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Are you sure you want to reject "github"? This server is currently live. Rejecting it will immediately remove it from the proxy runtime.',
      ),
    ).not.toBeInTheDocument();

    cleanup();
    mockLoaded([server({ approval_status: "rejected" })]);
    renderTab();

    expect(await screen.findByRole("button", { name: "重新批准" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Re-approve" })).not.toBeInTheDocument();
  });

  it("renders the empty result, loading and load-failure states in Chinese and hides the English originals", async () => {
    mockLoaded([]);
    renderTab();
    expect(await screen.findByText("没有符合筛选条件的 MCP 服务器提交。")).toBeInTheDocument();
    expect(screen.queryByText("No MCP server submissions match your filters.")).not.toBeInTheDocument();

    cleanup();
    vi.mocked(fetchMCPSubmissions).mockReturnValue(new Promise(() => {}) as never);
    renderTab();
    expect(await screen.findByText("正在加载提交…")).toBeInTheDocument();
    expect(screen.queryByText("Loading submissions…")).not.toBeInTheDocument();

    cleanup();
    vi.mocked(fetchMCPSubmissions).mockRejectedValue("nope");
    vi.mocked(getGeneralSettingsCall).mockRejectedValue("nope");
    renderTab();
    expect(await screen.findByText("加载提交失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load submissions")).not.toBeInTheDocument();
  });

  it("renders the approve, reject and rules toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()], ["description"]);
    renderTab();

    await user.click(await screen.findByRole("button", { name: "批准" }));
    await user.click(screen.getAllByRole("button", { name: "批准" }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("MCP 服务器“github”已批准"));
    expect(toast.success).not.toHaveBeenCalledWith('MCP server "github" approved');

    await user.click(await screen.findByRole("button", { name: "拒绝" }));
    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("MCP 服务器“github”已拒绝"));
    expect(toast.success).not.toHaveBeenCalledWith('MCP server "github" rejected');

    await user.click(screen.getByText("提交规则"));
    await user.click(screen.getByText("保存规则"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("提交规则已保存"));
    expect(toast.success).not.toHaveBeenCalledWith("Submission rules saved");
  });

  it("renders the approve and reject failure toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    mockLoaded([server()], ["description"]);
    vi.mocked(approveMCPServer).mockRejectedValue(new Error("boom"));
    vi.mocked(rejectMCPServer).mockRejectedValue(new Error("boom"));
    renderTab();

    await user.click(await screen.findByRole("button", { name: "批准" }));
    await user.click(screen.getAllByRole("button", { name: "批准" }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("批准 MCP 服务器失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to approve MCP server");

    await user.click(await screen.findByRole("button", { name: "拒绝" }));
    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("拒绝 MCP 服务器失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to reject MCP server");
  });

  it("renders the rules-save failure toast in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    mockLoaded([server()], ["description"]);
    vi.mocked(updateConfigFieldSetting).mockRejectedValue(new Error("boom"));
    renderTab();

    await user.click(await screen.findByText("提交规则"));
    await user.click(screen.getByText("保存规则"));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存提交规则失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save submission rules");
  });

  it("renders the search-miss state in Chinese and hides the English original", async () => {
    mockLoaded([server()]);
    renderTab();

    fireEvent.change(await screen.findByPlaceholderText("搜索 MCP 服务器..."), { target: { value: "zzz" } });

    expect(await screen.findByText("没有符合筛选条件的 MCP 服务器提交。")).toBeInTheDocument();
    expect(screen.queryByText("No MCP server submissions match your filters.")).not.toBeInTheDocument();
  });

  it("keeps the English singular/plural check labels when the locale is English", async () => {
    await i18n.changeLanguage("en");

    mockLoaded([server({ description: "", alias: "" })], ["description", "alias"]);
    renderTab();
    expect(await screen.findByText("2 checks failed")).toBeInTheDocument();

    cleanup();
    mockLoaded([server({ description: "" })], ["description"]);
    renderTab();
    expect(await screen.findByText("1 check failed")).toBeInTheDocument();
    expect(screen.getByText("(1 required field)")).toBeInTheDocument();
  });
});
