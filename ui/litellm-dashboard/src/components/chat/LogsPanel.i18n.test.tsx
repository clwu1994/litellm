import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import LogsPanel from "./LogsPanel";
import { uiSpendLogDetailsCall, uiSpendLogsCall } from "../networking";

vi.mock("../networking", () => ({
  uiSpendLogsCall: vi.fn(),
  uiSpendLogDetailsCall: vi.fn(),
}));

const mockedLogsCall = vi.mocked(uiSpendLogsCall);
const mockedDetailsCall = vi.mocked(uiSpendLogDetailsCall);

const row = {
  request_id: "req-abc-123",
  model: "gpt-4o",
  status: "success",
  spend: 0.0123,
  total_tokens: 1500,
  prompt_tokens: 1000,
  completion_tokens: 500,
  startTime: "2026-07-18T10:00:00Z",
  endTime: "2026-07-18T10:00:02Z",
  request_duration_ms: 2000,
};

const page = (rows: unknown[], total: number, totalPages: number) => ({
  data: rows,
  total,
  page: 1,
  page_size: 50,
  total_pages: totalPages,
});

const renderPanel = (token: string) => render(<LogsPanel accessToken={token} userId="user-1" />);

describe("LogsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockedLogsCall.mockResolvedValue(page([row], 1, 1));
    mockedDetailsCall.mockResolvedValue({ messages: [{ role: "user", content: "hi" }], response: { ok: true } });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, columns and success badge while hiding the English originals", async () => {
    renderPanel("tok-header");

    expect(await screen.findByText("你的日志")).toBeInTheDocument();
    expect(screen.queryByText("Your Logs")).not.toBeInTheDocument();
    expect(screen.getByText("仅显示你账户的请求日志")).toBeInTheDocument();
    expect(screen.queryByText("Request logs for your account only")).not.toBeInTheDocument();

    expect(await screen.findByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("时间")).toBeInTheDocument();
    expect(screen.queryByText("Time")).not.toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Model")).not.toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByText("Token")).toBeInTheDocument();
    expect(screen.queryByText("Tokens")).not.toBeInTheDocument();
    expect(screen.getByText("耗时")).toBeInTheDocument();
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
    expect(screen.getByText("消费")).toBeInTheDocument();
    expect(screen.queryByText("Cost")).not.toBeInTheDocument();

    expect(screen.getByText("成功")).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  it("renders the Chinese failure badge while hiding the English original", async () => {
    mockedLogsCall.mockResolvedValue(page([{ ...row, status: "failure" }], 1, 1));
    renderPanel("tok-failure");

    expect(await screen.findByText("失败")).toBeInTheDocument();
    expect(screen.queryByText("Failure")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state while hiding the English original", async () => {
    mockedLogsCall.mockResolvedValue(page([], 0, 0));
    renderPanel("tok-empty");

    expect(await screen.findByText("此时间段没有日志")).toBeInTheDocument();
    expect(screen.queryByText("No logs for this period")).not.toBeInTheDocument();
  });

  it("renders the Chinese error state with its retry action while hiding the English originals", async () => {
    mockedLogsCall.mockRejectedValue(new Error("boom"));
    renderPanel("tok-error");

    expect(await screen.findByText("无法加载你的日志")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load your logs")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("renders the Chinese detail dialog while hiding the English originals", async () => {
    mockedDetailsCall.mockResolvedValue({});
    renderPanel("tok-detail");

    fireEvent.click(await screen.findByText("gpt-4o"));

    expect(await screen.findByText("请求详情")).toBeInTheDocument();
    expect(screen.queryByText("Request details")).not.toBeInTheDocument();
    expect(screen.getByText("1,500（输入 1,000 / 输出 500）")).toBeInTheDocument();
    expect(screen.queryByText("1,500 (1,000 in / 500 out)")).not.toBeInTheDocument();
    expect(screen.getByText("请求")).toBeInTheDocument();
    expect(screen.queryByText("Request")).not.toBeInTheDocument();
    expect(screen.getByText("响应")).toBeInTheDocument();
    expect(screen.queryByText("Response")).not.toBeInTheDocument();
    expect(await screen.findAllByText("不可用")).toHaveLength(2);
    expect(screen.queryByText("Not available")).not.toBeInTheDocument();
  });

  it("renders the Chinese pagination summary and controls while hiding the English originals", async () => {
    mockedLogsCall.mockResolvedValue(page([row], 1, 2));
    renderPanel("tok-page");

    expect(await screen.findByText("1 个请求 · 第 1 / 2 页")).toBeInTheDocument();
    expect(screen.queryByText("1 request · Page 1 of 2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一页" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("resolves the singular and plural request-count branches under English", async () => {
    await i18n.changeLanguage("en");
    mockedLogsCall.mockResolvedValue(page([row], 1, 1));
    const { unmount } = renderPanel("tok-plural-a");

    expect(await screen.findByText("1 request")).toBeInTheDocument();
    unmount();

    mockedLogsCall.mockResolvedValue(page([row, row], 2, 1));
    renderPanel("tok-plural-b");

    expect(await screen.findByText("2 requests")).toBeInTheDocument();
    expect(screen.queryByText("2 request")).not.toBeInTheDocument();
  });
});
