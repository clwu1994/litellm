import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import A2AMetrics, { type A2ATaskMetadata } from "./A2AMetrics";

const METADATA: A2ATaskMetadata = {
  taskId: "task-1",
  contextId: "ctx-1",
  status: { state: "completed", timestamp: "2026-01-01T10:00:00Z", message: "all done" },
  metadata: { trace: "abc" },
};

describe("A2AMetrics Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese A2A chrome and aliases the status wire value", () => {
    render(<A2AMetrics a2aMetadata={METADATA} timeToFirstToken={200} totalLatency={1500} />);

    expect(screen.getByText("A2A 元数据")).toBeInTheDocument();
    expect(screen.queryByText("A2A Metadata")).not.toBeInTheDocument();

    expect(screen.getByText("已完成")).toBeInTheDocument();
    expect(screen.queryByText("completed")).not.toBeInTheDocument();

    expect(screen.getByText("TTFT：0.20s")).toBeInTheDocument();
    expect(screen.queryByText("TTFT: 0.20s")).not.toBeInTheDocument();

    expect(screen.getByText("Task：task-1")).toBeInTheDocument();
    expect(screen.queryByText("Task: task-1")).not.toBeInTheDocument();
    expect(screen.getByText("Session：ctx-1")).toBeInTheDocument();
    expect(screen.queryByText("Session: ctx-1")).not.toBeInTheDocument();

    expect(screen.getByLabelText("复制 task ID task-1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy task ID task-1")).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制 session ID ctx-1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy session ID ctx-1")).not.toBeInTheDocument();
  });

  it("renders every Chinese status alias and falls back to the raw wire value", () => {
    const cases: Array<[string, string]> = [
      ["working", "处理中"],
      ["submitted", "已提交"],
      ["failed", "失败"],
      ["canceled", "已取消"],
    ];
    for (const [state, chinese] of cases) {
      const { unmount } = render(<A2AMetrics a2aMetadata={{ status: { state } }} />);
      expect(screen.getByText(chinese), state).toBeInTheDocument();
      expect(screen.queryByText(state), state).not.toBeInTheDocument();
      unmount();
    }

    render(<A2AMetrics a2aMetadata={{ status: { state: "input-required" } }} />);
    expect(screen.getByText("input-required")).toBeInTheDocument();
  });

  it("renders the Chinese latency and TTFT tooltips while they are open", async () => {
    const user = userEvent.setup({ delay: null });
    render(<A2AMetrics a2aMetadata={METADATA} timeToFirstToken={200} totalLatency={1500} />);

    await user.hover(screen.getByText("1.50s"));
    expect(await screen.findByText("总延迟")).toBeInTheDocument();
    expect(screen.queryByText("Total latency")).not.toBeInTheDocument();

    await user.hover(screen.getByText("TTFT：0.20s"));
    expect(await screen.findByText("首 Token 时间")).toBeInTheDocument();
    expect(screen.queryByText("Time to first token")).not.toBeInTheDocument();
  });

  it("renders the Chinese copy tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    render(<A2AMetrics a2aMetadata={METADATA} />);

    await user.hover(screen.getByLabelText("复制 task ID task-1"));
    expect(await screen.findByText("点击复制：task-1")).toBeInTheDocument();
    expect(screen.queryByText("Click to copy: task-1")).not.toBeInTheDocument();
  });

  it("renders the Chinese details panel chrome when it is expanded", async () => {
    const user = userEvent.setup({ delay: null });
    render(<A2AMetrics a2aMetadata={METADATA} />);

    await user.click(screen.getByText("详情"));
    expect(screen.queryByText("Details")).not.toBeInTheDocument();

    expect(screen.getByText("状态消息：")).toBeInTheDocument();
    expect(screen.queryByText("Status Message:")).not.toBeInTheDocument();
    expect(screen.getByText("Task ID：")).toBeInTheDocument();
    expect(screen.queryByText("Task ID:")).not.toBeInTheDocument();
    expect(screen.getByText("Session ID：")).toBeInTheDocument();
    expect(screen.queryByText("Session ID:")).not.toBeInTheDocument();
    expect(screen.getByText("自定义元数据：")).toBeInTheDocument();
    expect(screen.queryByText("Custom Metadata:")).not.toBeInTheDocument();
  });
});
