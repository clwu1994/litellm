import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { LoggingCallbacksTable } from "./LoggingCallbacksTable";

const baseVars = {
  SLACK_WEBHOOK_URL: null,
  LANGFUSE_PUBLIC_KEY: null,
  LANGFUSE_SECRET_KEY: null,
  LANGFUSE_HOST: null,
  OPENMETER_API_KEY: null,
};

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

describe("LoggingCallbacksTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the heading, add button, column headers and empty state in Chinese and hides the English originals", () => {
    renderWithProviders(<LoggingCallbacksTable callbacks={[]} availableCallbacks={{}} />);

    expect(screen.getByText("活动日志回调")).toBeInTheDocument();
    expect(screen.queryByText("Active Logging Callbacks")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加回调" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Callback" })).not.toBeInTheDocument();
    expect(screen.getByText("回调名称")).toBeInTheDocument();
    expect(screen.queryByText("Callback Name")).not.toBeInTheDocument();
    expect(screen.getByText("模式")).toBeInTheDocument();
    expect(screen.queryByText("Mode")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.getByText("未配置回调")).toBeInTheDocument();
    expect(screen.queryByText("No callbacks configured")).not.toBeInTheDocument();
    expect(screen.getByText("添加您的第一个回调，开始将数据记录到外部服务。")).toBeInTheDocument();
    expect(
      screen.queryByText("Add your first callback to start logging data to external services."),
    ).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese while loading and hides the English original", () => {
    renderWithProviders(<LoggingCallbacksTable callbacks={[]} availableCallbacks={{}} isLoading />);

    expect(screen.getByText("正在加载回调…")).toBeInTheDocument();
    expect(screen.queryByText("Loading callbacks…")).not.toBeInTheDocument();
  });

  it("renders every callback mode badge in Chinese and hides the English originals", () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[
          { name: "success_cb", type: "success", variables: baseVars },
          { name: "failure_cb", type: "failure", variables: baseVars },
          { name: "both_cb", type: "success_and_failure", variables: baseVars },
        ]}
        availableCallbacks={{}}
      />,
    );

    expect(screen.getByText("成功")).toBeInTheDocument();
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.getByText("成功和失败")).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
    expect(screen.queryByText("Failure")).not.toBeInTheDocument();
    expect(screen.queryByText("Success & Failure")).not.toBeInTheDocument();
  });

  it("renders the read-only label and its title in Chinese and hides the English originals", () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[{ name: "datadog", type: "success", variables: baseVars, read_only: true }]}
        availableCallbacks={{}}
      />,
    );

    const readOnly = screen.getByText("只读");
    expect(readOnly).toHaveAttribute("title", "通过仪表板之外的方式添加的活动回调。请在配置它的位置进行编辑。");
    expect(screen.queryByText("Read only")).not.toBeInTheDocument();
    expect(readOnly).not.toHaveAttribute(
      "title",
      "Active callback that was not added through the dashboard. Edit it where it was configured.",
    );
  });

  it("renders the actions trigger and its open menu in Chinese and hides the English originals", async () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[{ name: "langfuse", type: "success", variables: baseVars }]}
        availableCallbacks={{}}
        onTest={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const trigger = screen.getByTestId("callback-actions-langfuse-success");
    expect(trigger).toHaveAttribute("aria-label", "打开回调操作");
    expect(trigger).not.toHaveAttribute("aria-label", "Open callback actions");

    await user().click(trigger);

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("测试")).toBeInTheDocument();
    expect(within(menu).getByText("编辑")).toBeInTheDocument();
    expect(within(menu).getByText("删除")).toBeInTheDocument();
    expect(within(menu).queryByText("Test")).not.toBeInTheDocument();
    expect(within(menu).queryByText("Edit")).not.toBeInTheDocument();
    expect(within(menu).queryByText("Delete")).not.toBeInTheDocument();
  });
});

describe("LoggingCallbacksTable English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the heading, columns, empty state and add button byte-identical", () => {
    renderWithProviders(<LoggingCallbacksTable callbacks={[]} availableCallbacks={{}} />);

    expect(screen.getByText("Active Logging Callbacks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Callback" })).toBeInTheDocument();
    expect(screen.getByText("Callback Name")).toBeInTheDocument();
    expect(screen.getByText("Mode")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("No callbacks configured")).toBeInTheDocument();
    expect(screen.getByText("Add your first callback to start logging data to external services.")).toBeInTheDocument();
  });

  it("keeps the loading message byte-identical", () => {
    renderWithProviders(<LoggingCallbacksTable callbacks={[]} availableCallbacks={{}} isLoading />);

    expect(screen.getByText("Loading callbacks…")).toBeInTheDocument();
  });

  it("keeps every callback mode badge byte-identical", () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[
          { name: "success_cb", type: "success", variables: baseVars },
          { name: "failure_cb", type: "failure", variables: baseVars },
          { name: "both_cb", type: "success_and_failure", variables: baseVars },
        ]}
        availableCallbacks={{}}
      />,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failure")).toBeInTheDocument();
    expect(screen.getByText("Success & Failure")).toBeInTheDocument();
  });

  it("keeps the read-only label and title byte-identical", () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[{ name: "datadog", type: "success", variables: baseVars, read_only: true }]}
        availableCallbacks={{}}
      />,
    );

    expect(screen.getByText("Read only")).toHaveAttribute(
      "title",
      "Active callback that was not added through the dashboard. Edit it where it was configured.",
    );
  });

  it("keeps the actions trigger and its menu byte-identical", async () => {
    renderWithProviders(
      <LoggingCallbacksTable
        callbacks={[{ name: "langfuse", type: "success", variables: baseVars }]}
        availableCallbacks={{}}
        onTest={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const trigger = screen.getByTestId("callback-actions-langfuse-success");
    expect(trigger).toHaveAttribute("aria-label", "Open callback actions");
    await user().click(trigger);

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Test")).toBeInTheDocument();
    expect(within(menu).getByText("Edit")).toBeInTheDocument();
    expect(within(menu).getByText("Delete")).toBeInTheDocument();
  });
});
