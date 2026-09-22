import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import WorkflowRuns from "./WorkflowRuns";

vi.mock("@/components/networking", () => ({
  proxyBaseUrl: "",
  getGlobalLitellmHeaderName: () => "x-litellm-api-key",
}));

interface FakeRun {
  run_id: string;
  status: string;
  workflow_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface FakeEvent {
  event_id: string;
  event_type: string;
  step_name: string;
  sequence_number: number;
  created_at: string;
  data: Record<string, unknown> | null;
}

interface FakeMessage {
  message_id: string;
  role: string;
  content: string;
  sequence_number: number;
  created_at: string;
}

const NOW = () => Date.now();

const run = (
  run_id: string,
  status: string,
  created_at: string,
  metadata: Record<string, unknown> | null,
): FakeRun => ({ run_id, status, workflow_type: "grill", created_at, metadata });

const buildRuns = (): FakeRun[] => {
  const now = NOW();
  return [
    run("run-aaaaaaaa-1111", "completed", new Date(now - 30_000).toISOString(), {
      title: "First run",
      state: "done",
    }),
    run("run-bbbbbbbb-2222", "running", new Date(now - 5 * 60_000).toISOString(), { title: "Second run" }),
    run("run-cccccccc-3333", "paused", new Date(now - 3 * 3_600_000).toISOString(), { title: "Third run" }),
    run("run-dddddddd-4444", "failed", new Date(now - 2 * 86_400_000).toISOString(), { title: "Fourth run" }),
  ];
};

const LONG_PATH = `/tmp/${"worktree-".repeat(15)}`;

const DETAIL_METADATA: Record<string, unknown> = {
  title: "First run",
  state: "done",
  pr_url: "https://example.com/pr/1",
  worktree_path: LONG_PATH,
};

const buildDetailRun = (): FakeRun =>
  run("run-aaaaaaaa-1111", "completed", new Date(NOW() - 30_000).toISOString(), DETAIL_METADATA);

const detailEvent = (sequence: number, eventType: string): FakeEvent => ({
  event_id: `ev-${sequence}`,
  event_type: eventType,
  step_name: `step-${sequence}`,
  sequence_number: sequence,
  created_at: new Date(NOW() - 30_000 + sequence * 1000).toISOString(),
  data: null,
});

const message: FakeMessage = {
  message_id: "msg-1",
  role: "user",
  content: "kick off the run",
  sequence_number: 1,
  created_at: new Date(NOW() - 29_000).toISOString(),
};

const okJson = (body: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

function mockFetch({
  runs,
  events = [],
  messages = [],
}: {
  runs: FakeRun[];
  events?: FakeEvent[];
  messages?: FakeMessage[];
}) {
  return vi.fn((url: string) => {
    if (url.includes("/runs?limit")) return okJson({ runs });
    if (url.includes("/events")) return okJson({ events });
    if (url.includes("/messages")) return okJson({ messages });
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

const renderTable = (runs: FakeRun[] = buildRuns()) => {
  vi.stubGlobal("fetch", mockFetch({ runs }));
  return renderWithProviders(<WorkflowRuns accessToken="tok" />);
};

const openDetail = async (options: { runs?: FakeRun[]; events?: FakeEvent[]; messages?: FakeMessage[] } = {}) => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    mockFetch({ runs: options.runs ?? [buildDetailRun()], events: options.events, messages: options.messages }),
  );
  renderWithProviders(<WorkflowRuns accessToken="tok" />);

  await user.click(await screen.findByText("First run"));
  const drawer = await screen.findByRole("dialog");
  await within(drawer).findAllByText("First run");
  return { user, drawer };
};

const openFilterDrawer = async () => {
  const user = userEvent.setup();
  renderTable();
  await screen.findByText("First run");
  await user.click(screen.getByTestId("datatable-filters-trigger"));
  return { user, drawer: await screen.findByRole("dialog") };
};

describe("WorkflowRuns Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header and hides the English original", async () => {
    renderTable();

    expect(await screen.findByText("工作流运行")).toBeInTheDocument();
    expect(screen.getByText("为 Agent 和自动化工作流提供持久的状态跟踪")).toBeInTheDocument();

    expect(screen.queryByText("Workflow Runs")).not.toBeInTheDocument();
    expect(screen.queryByText("Durable state tracking for agents and automated workflows")).not.toBeInTheDocument();
  });

  it("renders the Chinese column headers and search placeholder and hides the English originals", async () => {
    renderTable();
    await screen.findByText("First run");

    expect(screen.getByRole("columnheader", { name: "运行" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "类型" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "状态" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "创建时间" })).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: "Run" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Type" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Created" })).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("搜索运行…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search runs…")).not.toBeInTheDocument();
  });

  it("renders the Chinese relative timestamps and hides the English originals", async () => {
    renderTable();
    await screen.findByText("First run");

    expect(screen.getByText("30 秒前")).toBeInTheDocument();
    expect(screen.getByText("5 分钟前")).toBeInTheDocument();
    expect(screen.getByText("3 小时前")).toBeInTheDocument();
    expect(screen.getByText("2 天前")).toBeInTheDocument();

    expect(screen.queryByText("30s ago")).not.toBeInTheDocument();
    expect(screen.queryByText("5m ago")).not.toBeInTheDocument();
    expect(screen.queryByText("3h ago")).not.toBeInTheDocument();
    expect(screen.queryByText("2d ago")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the runs are loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithProviders(<WorkflowRuns accessToken="tok" />);

    expect(await screen.findByText("正在加载工作流运行…")).toBeInTheDocument();
    expect(screen.queryByText("Loading workflow runs…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    renderTable([]);

    expect(await screen.findByText("还没有工作流运行")).toBeInTheDocument();
    expect(screen.queryByText("No workflow runs yet")).not.toBeInTheDocument();
  });

  it("renders the Chinese filter drawer chrome and hides the English originals", async () => {
    const { drawer } = await openFilterDrawer();

    expect(within(drawer).getByText("筛选")).toBeInTheDocument();
    expect(within(drawer).queryByText("Filters")).not.toBeInTheDocument();

    expect(within(drawer).getByText("缩小工作流运行范围")).toBeInTheDocument();
    expect(within(drawer).queryByText("Narrow down workflow runs")).not.toBeInTheDocument();

    expect(within(drawer).getByText("状态")).toBeInTheDocument();
    expect(within(drawer).queryByText("Status")).not.toBeInTheDocument();

    expect(within(drawer).getByText("类型")).toBeInTheDocument();
    expect(within(drawer).queryByText("Type")).not.toBeInTheDocument();

    expect(within(drawer).getByText("所有状态")).toBeInTheDocument();
    expect(within(drawer).queryByText("All statuses")).not.toBeInTheDocument();

    expect(within(drawer).getByPlaceholderText("按类型筛选…")).toBeInTheDocument();
    expect(within(drawer).queryByPlaceholderText("Filter by type…")).not.toBeInTheDocument();
  });

  it("renders the Chinese status filter options and hides the English originals", async () => {
    const { user, drawer } = await openFilterDrawer();

    await user.click(within(drawer).getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "所有状态" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "待处理" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "运行中" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "已暂停" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "已完成" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "失败" })).toBeInTheDocument();

    expect(screen.queryByRole("option", { name: "All statuses" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Pending" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Running" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Paused" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Completed" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Failed" })).not.toBeInTheDocument();
  });

  it("renders the Chinese drawer chrome and section headings and hides the English originals", async () => {
    const { drawer } = await openDetail({ events: [detailEvent(1, "step.started"), detailEvent(2, "hook.waiting")] });

    expect(within(drawer).getByText("工作流运行详情")).toBeInTheDocument();
    expect(within(drawer).queryByText("Workflow run details")).not.toBeInTheDocument();

    expect(within(drawer).getByText("所选工作流运行的元数据、时间线和消息")).toBeInTheDocument();
    expect(
      within(drawer).queryByText("Metadata, timeline and messages for the selected workflow run"),
    ).not.toBeInTheDocument();

    expect(within(drawer).getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "close" })).not.toBeInTheDocument();

    expect(within(drawer).getByRole("button", { name: "刷新" })).toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();

    expect(within(drawer).getByText("时间线")).toBeInTheDocument();
    expect(within(drawer).queryByText("Timeline")).not.toBeInTheDocument();

    expect(within(drawer).getByText("2 个事件")).toBeInTheDocument();
    expect(within(drawer).queryByText("2 events")).not.toBeInTheDocument();

    expect(within(drawer).getByText("消息")).toBeInTheDocument();
    expect(within(drawer).queryByText("Messages")).not.toBeInTheDocument();
  });

  it("renders the Chinese singular event count and hides the English original", async () => {
    const { drawer } = await openDetail({ events: [detailEvent(1, "step.started")] });

    expect(within(drawer).getByText("1 个事件")).toBeInTheDocument();
    expect(within(drawer).queryByText("1 event")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty timeline and messages copy and hides the English originals", async () => {
    const { user, drawer } = await openDetail({ events: [], messages: [] });

    expect(within(drawer).getByText("暂无事件记录")).toBeInTheDocument();
    expect(within(drawer).queryByText("No events recorded")).not.toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: /消息/ }));

    expect(within(drawer).getByText("暂无消息")).toBeInTheDocument();
    expect(within(drawer).queryByText("No messages")).not.toBeInTheDocument();
  });

  it("renders the Chinese truncation controls and hides the English originals", async () => {
    const { user, drawer } = await openDetail({ events: [], messages: [] });

    const more = within(drawer).getByRole("button", { name: "更多" });
    expect(within(drawer).queryByRole("button", { name: "more" })).not.toBeInTheDocument();

    await user.click(more);

    expect(within(drawer).getByRole("button", { name: "收起" })).toBeInTheDocument();
    expect(within(drawer).queryByRole("button", { name: "less" })).not.toBeInTheDocument();
  });
});

describe("WorkflowRuns English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English page header, columns, timestamps and search placeholder byte-identical", async () => {
    renderTable();
    await screen.findByText("First run");

    expect(screen.getByText("Workflow Runs")).toBeInTheDocument();
    expect(screen.getByText("Durable state tracking for agents and automated workflows")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Run" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Created" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search runs…")).toBeInTheDocument();
    expect(screen.getByText("30s ago")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("keeps the original English loading and empty copy byte-identical", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithProviders(<WorkflowRuns accessToken="tok" />);

    expect(await screen.findByText("Loading workflow runs…")).toBeInTheDocument();
    cleanup();

    renderTable([]);
    expect(await screen.findByText("No workflow runs yet")).toBeInTheDocument();
  });

  it("keeps the original English filter drawer copy byte-identical", async () => {
    const { user, drawer } = await openFilterDrawer();

    expect(within(drawer).getByText("Filters")).toBeInTheDocument();
    expect(within(drawer).getByText("Narrow down workflow runs")).toBeInTheDocument();
    expect(within(drawer).getByText("Status")).toBeInTheDocument();
    expect(within(drawer).getByText("Type")).toBeInTheDocument();
    expect(within(drawer).getByText("All statuses")).toBeInTheDocument();
    expect(within(drawer).getByPlaceholderText("Filter by type…")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Running" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Paused" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Completed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Failed" })).toBeInTheDocument();
  });

  it("keeps the original English drawer copy byte-identical", async () => {
    const { drawer } = await openDetail({ events: [detailEvent(1, "step.started"), detailEvent(2, "hook.waiting")] });

    expect(within(drawer).getByText("Workflow run details")).toBeInTheDocument();
    expect(
      within(drawer).getByText("Metadata, timeline and messages for the selected workflow run"),
    ).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "close" })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(within(drawer).getByText("Timeline")).toBeInTheDocument();
    expect(within(drawer).getByText("2 events")).toBeInTheDocument();
    expect(within(drawer).getByText("Messages")).toBeInTheDocument();
  });

  it("renders the singular English event label for a single event", async () => {
    const { drawer } = await openDetail({ events: [detailEvent(1, "step.started")] });

    expect(within(drawer).getByText("1 event")).toBeInTheDocument();
    expect(within(drawer).queryByText("1 events")).not.toBeInTheDocument();
  });

  it("keeps the original English empty timeline, messages and truncation copy byte-identical", async () => {
    const { user, drawer } = await openDetail({ events: [], messages: [] });

    expect(within(drawer).getByText("No events recorded")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: /Messages/ }));
    expect(within(drawer).getByText("No messages")).toBeInTheDocument();

    await user.click(within(drawer).getByRole("button", { name: "more" }));
    expect(within(drawer).getByRole("button", { name: "less" })).toBeInTheDocument();
  });
});
