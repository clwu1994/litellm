import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { ToolRow } from "@/components/networking";
import { toast } from "@/lib/toast";

import { ToolPoliciesPanel } from "./ToolPoliciesPanel";

const fetchToolsList = vi.fn();
const updateToolPolicy = vi.fn();

vi.mock("@/components/networking", () => ({
  fetchToolsList: (...args: unknown[]) => fetchToolsList(...args),
  updateToolPolicy: (...args: unknown[]) => updateToolPolicy(...args),
}));

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const fromBackend = vi.mocked(toast.fromError);

const NOW = new Date("2026-07-21T12:00:00Z");

const TOOLS: ToolRow[] = [
  {
    tool_id: "tool-1",
    tool_name: "get_weather",
    input_policy: "untrusted",
    output_policy: "untrusted",
    call_count: 12,
    team_id: "team-alpha",
    key_alias: "prod-key",
    key_hash: "hash-aaa",
    user_agent: "curl/8.7.1",
    created_at: "2026-07-21T10:00:00Z",
  },
  {
    tool_id: "tool-2",
    tool_name: "search_web",
    input_policy: "untrusted",
    output_policy: "trusted",
    call_count: 5,
    team_id: "team-beta",
    key_alias: "dev-key",
    key_hash: "hash-bbb",
    created_at: "2026-07-21T09:00:00Z",
  },
];

const renderPanel = () => renderWithProviders(<ToolPoliciesPanel accessToken="sk-token" onSelectTool={vi.fn()} />);

const waitForRows = () => screen.findAllByText("get_weather");

describe("ToolPolicies Chinese copy", () => {
  beforeEach(async () => {
    testQueryClient.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
    fetchToolsList.mockReset().mockResolvedValue(TOOLS);
    updateToolPolicy.mockReset().mockResolvedValue({});
    fromBackend.mockReset();
    can.mockReset().mockReturnValue(true);
    Element.prototype.scrollIntoView = vi.fn();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await i18n.changeLanguage("en");
  });

  it("renders the panel heading and metric labels in Chinese", async () => {
    renderPanel();
    await waitForRows();

    expect(screen.getByText("工具策略")).toBeInTheDocument();
    expect(screen.queryByText("Tool Policies")).not.toBeInTheDocument();
    expect(screen.getByText("今日新增")).toBeInTheDocument();
    expect(screen.queryByText("New Today")).not.toBeInTheDocument();
    expect(screen.getByText("已发现的工具总数")).toBeInTheDocument();
    expect(screen.queryByText("Total Tools Discovered")).not.toBeInTheDocument();
    expect(screen.getByText("已阻止的工具")).toBeInTheDocument();
    expect(screen.queryByText("Blocked Tools")).not.toBeInTheDocument();
    expect(screen.getByText("活跃团队")).toBeInTheDocument();
    expect(screen.queryByText("Active Teams")).not.toBeInTheDocument();
  });

  it("renders the needs-review banner and trend subtitle in Chinese", async () => {
    renderPanel();
    await waitForRows();

    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.queryByText("Needs Review")).not.toBeInTheDocument();
    expect(screen.getByText("发现 2 个需要策略决策的新工具。")).toBeInTheDocument();
    expect(screen.queryByText("2 new tools discovered that require policy decisions.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "审核" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Review" })).toHaveLength(0);
    expect(screen.getByText("较昨日 +2")).toBeInTheDocument();
    expect(screen.queryByText("+2 since yesterday")).not.toBeInTheDocument();
  });

  it("renders the singular needs-review sentence and the downward trend in Chinese", async () => {
    fetchToolsList.mockResolvedValue([{ ...TOOLS[0], created_at: "2026-07-21T10:00:00Z" }]);
    renderPanel();
    await waitForRows();

    expect(screen.getByText("发现 1 个需要策略决策的新工具。")).toBeInTheDocument();
    expect(screen.queryByText("1 new tool discovered that require policy decisions.")).not.toBeInTheDocument();

    cleanup();
    testQueryClient.clear();
    fetchToolsList.mockResolvedValue([{ ...TOOLS[0], input_policy: "trusted", created_at: "2026-07-20T10:00:00Z" }]);
    renderPanel();
    await waitForRows();

    expect(screen.getByText("较昨日 -1")).toBeInTheDocument();
    expect(screen.queryByText("-1 since yesterday")).not.toBeInTheDocument();
    expect(screen.queryByText("待审核")).not.toBeInTheDocument();
  });

  it("renders the table column headers and search placeholder in Chinese", async () => {
    renderPanel();
    await waitForRows();

    expect(screen.getByText("发现时间")).toBeInTheDocument();
    expect(screen.queryByText("Discovered")).not.toBeInTheDocument();
    expect(screen.getByText("工具名称")).toBeInTheDocument();
    expect(screen.queryByText("Tool Name")).not.toBeInTheDocument();
    expect(screen.getAllByText("输入策略").length).toBeGreaterThan(0);
    expect(screen.queryByText("Input Policy")).not.toBeInTheDocument();
    expect(screen.getAllByText("输出策略").length).toBeGreaterThan(0);
    expect(screen.queryByText("Output Policy")).not.toBeInTheDocument();
    expect(screen.getByText("调用次数")).toBeInTheDocument();
    expect(screen.queryByText("# Calls")).not.toBeInTheDocument();
    expect(screen.getByText("团队名称")).toBeInTheDocument();
    expect(screen.queryByText("Team Name")).not.toBeInTheDocument();
    expect(screen.getByText("密钥名称")).toBeInTheDocument();
    expect(screen.queryByText("Key Name")).not.toBeInTheDocument();
    expect(screen.getByText("密钥哈希")).toBeInTheDocument();
    expect(screen.queryByText("Key Hash")).not.toBeInTheDocument();
    expect(screen.getByText("用户代理")).toBeInTheDocument();
    expect(screen.queryByText("User Agent")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("按工具名称搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by Tool Name")).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese while the first load is in flight", () => {
    fetchToolsList.mockReturnValue(new Promise(() => {}));
    renderPanel();

    expect(screen.getByText("正在加载工具…")).toBeInTheDocument();
    expect(screen.queryByText("Loading tools…")).not.toBeInTheDocument();
  });

  it("renders the unfiltered empty state in Chinese", async () => {
    fetchToolsList.mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText("尚未发现工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools discovered")).not.toBeInTheDocument();
    expect(screen.getByText("发起一次返回 tool_calls 的聊天补全即可开始自动发现。")).toBeInTheDocument();
    expect(
      screen.queryByText("Make a chat completion that returns tool_calls to start auto-discovery."),
    ).not.toBeInTheDocument();
  });

  it("renders the filtered empty state in Chinese", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPanel();
    await waitForRows();

    const search = screen.getByTestId("datatable-search");
    await user.clear(search);
    await user.type(search, "zzzz");

    expect(await screen.findByText("没有匹配的工具")).toBeInTheDocument();
    expect(screen.queryByText("No matching tools")).not.toBeInTheDocument();
    expect(screen.getByText("没有工具符合你的搜索或筛选条件。")).toBeInTheDocument();
    expect(screen.queryByText("No tools match your search or filters.")).not.toBeInTheDocument();
  });

  it("renders the filter drawer copy and policy option labels in Chinese", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPanel();
    await waitForRows();

    await user.click(screen.getByTestId("datatable-filters-trigger"));

    expect((await screen.findAllByText("筛选")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Filters")).not.toBeInTheDocument();
    expect(screen.getByText("缩小已发现工具的范围")).toBeInTheDocument();
    expect(screen.queryByText("Narrow down discovered tools")).not.toBeInTheDocument();
    expect(screen.getAllByText("所有输入策略").length).toBeGreaterThan(0);
    expect(screen.queryByText("All Input Policies")).not.toBeInTheDocument();
    expect(screen.getAllByText("所有输出策略").length).toBeGreaterThan(0);
    expect(screen.queryByText("All Output Policies")).not.toBeInTheDocument();
    expect(screen.getAllByText("所有团队").length).toBeGreaterThan(0);
    expect(screen.queryByText("All Teams")).not.toBeInTheDocument();
    expect(screen.getAllByText("所有密钥").length).toBeGreaterThan(0);
    expect(screen.queryByText("All Keys")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("filter-input-policy"));

    expect(await screen.findByRole("option", { name: "可信" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "已阻止" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "trusted" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "blocked" })).not.toBeInTheDocument();
  });

  it("renders the inline policy options in Chinese", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPanel();
    await waitForRows();

    await user.click(screen.getAllByRole("combobox")[0]);

    expect(await screen.findByRole("option", { name: "不可信" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "可信" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "已阻止" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "untrusted" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "trusted" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "blocked" })).not.toBeInTheDocument();
  });

  it("reports a policy save failure in Chinese", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    updateToolPolicy.mockRejectedValue(new Error("nope"));
    renderPanel();
    await waitForRows();

    await user.click(screen.getAllByRole("combobox")[0]);
    await user.click(await screen.findByRole("option", { name: "可信" }));

    await waitFor(() => expect(fromBackend).toHaveBeenCalledWith("更新输入策略失败：nope"));
    expect(fromBackend).not.toHaveBeenCalledWith("Failed to update input policy: nope");
  });

  it("uses the Chinese unknown-error fallback when the failure is not an Error", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    updateToolPolicy.mockRejectedValue("bad");
    renderPanel();
    await waitForRows();

    await user.click(screen.getAllByRole("combobox")[1]);
    await user.click(await screen.findByRole("option", { name: "可信" }));

    await waitFor(() => expect(fromBackend).toHaveBeenCalledWith("更新输出策略失败：未知错误"));
    expect(fromBackend).not.toHaveBeenCalledWith("Failed to update output policy: unknown error");
  });

  it("renders the load-failure fallback in Chinese", async () => {
    fetchToolsList.mockRejectedValue("boom");
    renderPanel();

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("加载工具失败");
    expect(screen.queryByText("Failed to load tools")).not.toBeInTheDocument();
  });
});
