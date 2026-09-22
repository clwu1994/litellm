import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPConnectionStatus from "./mcp_connection_status";

const defaultProps = {
  formValues: { url: "https://example.com/mcp" },
  tools: [] as { name: string }[],
  isLoadingTools: false,
  toolsError: null as string | null,
  toolsErrorStatus: null as number | null,
  toolsErrorStackTrace: null as string | null,
  canFetchTools: false,
  fetchTools: vi.fn(),
};

const renderStatus = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProviders(<MCPConnectionStatus {...defaultProps} {...props} />);

describe("MCPConnectionStatus Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title and incomplete-fields guidance and hides the English originals", () => {
    renderStatus();

    expect(screen.getByText("连接状态")).toBeInTheDocument();
    expect(screen.queryByText("Connection Status")).not.toBeInTheDocument();
    expect(screen.getByText("填写必填字段以测试连接")).toBeInTheDocument();
    expect(screen.queryByText("Complete required fields to test connection")).not.toBeInTheDocument();
    expect(screen.getByText("填写 URL、传输方式和认证信息以测试 MCP 服务器连接")).toBeInTheDocument();
    expect(
      screen.queryByText("Fill in URL, Transport, and Authentication to test MCP server connection"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese connection-success state and hides the English originals", () => {
    renderStatus({ canFetchTools: true, tools: [{ name: "tool1" }] });

    expect(screen.getByText("连接成功")).toBeInTheDocument();
    expect(screen.queryByText("Connection successful")).not.toBeInTheDocument();
    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByText("服务器：https://example.com/mcp")).toBeInTheDocument();
    expect(screen.queryByText("Server: https://example.com/mcp")).not.toBeInTheDocument();
  });

  it("renders the Chinese testing state and hides the English originals", () => {
    renderStatus({ canFetchTools: true, isLoadingTools: true });

    expect(screen.getByText("正在测试与 MCP 服务器的连接…")).toBeInTheDocument();
    expect(screen.queryByText("Testing connection to MCP server...")).not.toBeInTheDocument();
    expect(screen.getByText("正在连接…")).toBeInTheDocument();
    expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
    expect(screen.getByText("正在测试连接并加载工具…")).toBeInTheDocument();
    expect(screen.queryByText("Testing connection and loading tools...")).not.toBeInTheDocument();
  });

  it("renders the Chinese ready-to-submit preview state and hides the English original", () => {
    renderStatus({ canFetchTools: true, toolsError: "preview forbidden", toolsErrorStatus: 403 });

    expect(screen.getByText("可以提交")).toBeInTheDocument();
    expect(screen.queryByText("Ready to submit")).not.toBeInTheDocument();
    expect(screen.getByText("工具预览不可用")).toBeInTheDocument();
    expect(screen.queryByText("Tool preview unavailable")).not.toBeInTheDocument();
  });

  it("renders the Chinese failure state, stack trace control and retry button and hides the English originals", async () => {
    const user = userEvent.setup();
    const fetchTools = vi.fn();
    const failureProps = {
      canFetchTools: true,
      toolsError: "connection refused",
      toolsErrorStackTrace: "stack line",
      fetchTools,
    };
    renderStatus(failureProps);

    expect(screen.getByText("连接已失败")).toBeInTheDocument();
    expect(screen.queryByText("Connection failed")).not.toBeInTheDocument();
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
    expect(screen.getByText("连接失败")).toBeInTheDocument();
    expect(screen.queryByText("Connection Failed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "堆栈跟踪" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stack Trace" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(fetchTools).toHaveBeenCalled();
  });

  it("renders the Chinese empty-tools success state and hides the English originals", () => {
    renderStatus({ canFetchTools: true, tools: [] });

    expect(screen.getByText("可以测试连接")).toBeInTheDocument();
    expect(screen.queryByText("Ready to test connection")).not.toBeInTheDocument();
    expect(screen.getByText("连接成功！")).toBeInTheDocument();
    expect(screen.queryByText("Connection successful!")).not.toBeInTheDocument();
    expect(screen.getByText("此 MCP 服务器未找到任何工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools found for this MCP server")).not.toBeInTheDocument();
  });
});
