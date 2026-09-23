import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { LogViewer } from "./LogViewer";

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return { ...actual, uiSpendLogsCall: vi.fn() };
});

vi.mock("@/components/view_logs/LogDetailsDrawer", () => ({
  LogDetailsDrawer: () => <div data-testid="log-details-drawer" />,
}));

const blockedLog = {
  id: "l1",
  timestamp: "2026-09-02 09:50:13",
  action: "blocked" as const,
  input_snippet: "blocked prompt",
};

const passedLog = { ...blockedLog, id: "l2", action: "passed" as const };

describe("LogViewer Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty chrome and hides the English originals", () => {
    renderWithProviders(<LogViewer logs={[]} />);

    expect(screen.getByText("请求日志")).toBeInTheDocument();
    expect(screen.queryByText("Request Logs")).not.toBeInTheDocument();
    expect(screen.getByText("此时间段没有日志。请选择 Guardrail 和日期范围。")).toBeInTheDocument();
    expect(screen.queryByText("No logs for this period. Select a guardrail and date range.")).not.toBeInTheDocument();
    expect(screen.getByText("没有可显示的日志。请调整筛选条件或日期范围。")).toBeInTheDocument();
    expect(screen.queryByText("No logs to display. Adjust filters or date range.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading state and hides the English original", () => {
    renderWithProviders(<LogViewer logs={[]} logsLoading />);

    expect(screen.getByText("加载中…")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("renders the Chinese named title, count, sample and filter labels and hides the English originals", () => {
    renderWithProviders(<LogViewer guardrailName="g-one" logs={[blockedLog, passedLog]} />);

    expect(screen.getByText("日志 — g-one")).toBeInTheDocument();
    expect(screen.queryByText("Logs — g-one")).not.toBeInTheDocument();
    expect(screen.getByText("显示 2 条中的 2 条")).toBeInTheDocument();
    expect(screen.queryByText("Showing 2 of 2 entries")).not.toBeInTheDocument();
    expect(screen.getByText("样本：")).toBeInTheDocument();
    expect(screen.queryByText("Sample:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已拦截" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已标记" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "已放行" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Blocked" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Flagged" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Passed" })).not.toBeInTheDocument();
    expect(screen.getAllByText("已拦截").length).toBeGreaterThan(0);
  });
});
