import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { render } from "../../../../tests/test-utils";
import type { LogEntry } from "../columns";
import { DrawerHeader } from "./DrawerHeader";

const logEntry = (overrides: Partial<LogEntry>): LogEntry =>
  ({
    request_id: "170d64ea-69f0-431a-be72-332f8f78c18a",
    api_key: "key-1",
    team_id: "team-1",
    model: "gpt-4o",
    model_id: "model-1",
    custom_llm_provider: "openai",
    call_type: "acompletion",
    spend: 0.01,
    total_tokens: 10,
    prompt_tokens: 5,
    completion_tokens: 5,
    startTime: "2026-07-07T09:50:13Z",
    endTime: "2026-07-07T09:50:14Z",
    cache_hit: "false",
    messages: [],
    response: {},
    ...overrides,
  }) as LogEntry;

const renderHeader = (log: LogEntry, isSidebarCollapsed: boolean) =>
  render(
    <DrawerHeader
      log={log}
      onClose={vi.fn()}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
      isSidebarCollapsed={isSidebarCollapsed}
      onToggleSidebar={vi.fn()}
      statusLabel="Failure"
      statusColor="error"
      environment="default"
    />,
  );

const expandToggle = () => screen.getByLabelText("Expand trace sidebar");

describe("DrawerHeader sidebar toggle", () => {
  it("stays out of the header while the sidebar owns it", () => {
    renderHeader(logEntry({}), false);

    expect(screen.queryByLabelText("Expand trace sidebar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse trace sidebar")).not.toBeInTheDocument();
  });

  it("shares the model row once the sidebar is collapsed", () => {
    renderHeader(logEntry({}), true);

    const row = expandToggle().parentElement as HTMLElement;
    expect(within(row).getByText("gpt-4o")).toBeInTheDocument();
  });

  it("falls back to the request id row when the log names no model", () => {
    renderHeader(logEntry({ model: "", custom_llm_provider: "" }), true);

    const row = expandToggle().parentElement as HTMLElement;
    expect(within(row).getByText("170d64ea-69f0-431a-be72-332f8f78c18a")).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese sidebar toggle label and hides the English one", () => {
      renderHeader(logEntry({}), true);

      expect(screen.getByLabelText("展开追踪侧栏")).toBeInTheDocument();
      expect(screen.queryByLabelText("Expand trace sidebar")).not.toBeInTheDocument();
    });

    it("renders the Chinese environment badge and hides the English one", () => {
      renderHeader(logEntry({}), false);

      expect(screen.getByText("环境：default")).toBeInTheDocument();
      expect(screen.queryByText("Env: default")).not.toBeInTheDocument();
    });

    it("renders the Chinese request id copy label and hides the English one", () => {
      renderHeader(logEntry({}), false);

      expect(screen.getByLabelText("复制请求 ID")).toBeInTheDocument();
      expect(screen.queryByLabelText("Copy Request ID")).not.toBeInTheDocument();
    });

    it("renders the Chinese copied confirmation and hides the English one", async () => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
      const user = userEvent.setup();
      renderHeader(logEntry({}), false);

      await user.click(screen.getByLabelText("复制请求 ID"));

      expect(await screen.findByLabelText("已复制！")).toBeInTheDocument();
      expect(screen.queryByLabelText("Copied!")).not.toBeInTheDocument();
    });

    it("renders the Chinese close shortcut tooltip and hides the English one", async () => {
      const user = userEvent.setup();
      renderHeader(logEntry({}), false);

      await user.hover(screen.getByRole("button", { name: "" }));

      expect(await screen.findByText("按 ESC 关闭")).toBeInTheDocument();
      expect(screen.queryByText("ESC to close")).not.toBeInTheDocument();
    });
  });
});
