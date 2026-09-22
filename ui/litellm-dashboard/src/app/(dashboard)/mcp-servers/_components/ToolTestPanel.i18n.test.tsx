import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { ToolTestPanel } from "./ToolTestPanel";
import { openTooltip } from "./mcpI18nTestUtils";

const tool = {
  name: "search_issues",
  description: "Search issues",
  inputSchema: { type: "object", properties: { q: { type: "string", description: "Query" } } },
  mcp_info: { server_name: "slack", logo_url: "https://example.com/logo.png" },
};

const result = [
  { type: "text", text: "hello" },
  { type: "image", url: "https://example.com/a.png" },
  { type: "embedded_resource", resource_type: "doc", url: "https://example.com/doc" },
];

const renderPanel = (overrides: Record<string, unknown> = {}) =>
  render(
    <ToolTestPanel
      tool={tool as never}
      onSubmit={vi.fn()}
      isLoading={false}
      result={null}
      error={null}
      onClose={vi.fn()}
      {...overrides}
    />,
  );

describe("ToolTestPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.fromError).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the header, empty state and close control in Chinese and hides the English originals", () => {
    renderPanel();

    expect(screen.getByText("测试工具：")).toBeInTheDocument();
    expect(screen.getByText("提供商：slack")).toBeInTheDocument();
    expect(screen.getByText("准备调用工具")).toBeInTheDocument();
    expect(screen.getByText("配置输入参数并点击“调用工具”，结果将显示在这里。")).toBeInTheDocument();
    expect(screen.getByAltText("slack 标志")).toBeInTheDocument();
    expect(screen.getByTitle("点击复制工具名称")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByText("Test Tool:")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider: slack")).not.toBeInTheDocument();
    expect(screen.queryByText("Ready to Call Tool")).not.toBeInTheDocument();
    expect(
      screen.queryByText('Configure the input parameters and click "Call Tool" to see the results here.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText("slack logo")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Click to copy tool name")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the column headings in Chinese and hides the English originals", () => {
    renderPanel();

    expect(screen.getByText("输入参数")).toBeInTheDocument();
    expect(screen.getByText("工具结果")).toBeInTheDocument();
    expect(screen.queryByText("Input Parameters")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool Result")).not.toBeInTheDocument();
  });

  it("renders the input-parameter tooltip in Chinese in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderPanel();

    const tooltip = await openTooltip(user, "输入参数");

    expect(tooltip).toHaveTextContent("配置此工具调用的输入参数");
    expect(tooltip).not.toHaveTextContent("Configure the input parameters for this tool call");
  });

  it("renders the loading state in Chinese and hides the English originals", () => {
    renderPanel({ isLoading: true });

    expect(screen.getByText("正在调用工具...")).toBeInTheDocument();
    expect(screen.getByText("请稍候，我们正在处理你的请求")).toBeInTheDocument();
    expect(screen.queryByText("Calling tool...")).not.toBeInTheDocument();
    expect(screen.queryByText("Please wait while we process your request")).not.toBeInTheDocument();
  });

  it("renders the failure state in Chinese and hides the English original", () => {
    renderPanel({ error: new Error("boom") });

    expect(screen.getByText("工具调用失败")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.queryByText("Tool Call Failed")).not.toBeInTheDocument();
  });

  it("renders the result view controls and content sections in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel({ result });

    expect(screen.getByText("工具执行成功")).toBeInTheDocument();
    expect(screen.getByText("格式化")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByTitle("复制响应")).toBeInTheDocument();
    expect(screen.getByText("文本响应")).toBeInTheDocument();
    expect(screen.getByText("图片响应")).toBeInTheDocument();
    expect(screen.getByText("嵌入式资源")).toBeInTheDocument();
    expect(screen.getByText("资源类型：doc")).toBeInTheDocument();
    expect(screen.getByText("查看资源")).toBeInTheDocument();
    expect(screen.getByAltText("工具结果")).toBeInTheDocument();
    expect(screen.queryByText("Tool executed successfully")).not.toBeInTheDocument();
    expect(screen.queryByText("Formatted")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Copy response")).not.toBeInTheDocument();
    expect(screen.queryByText("Text Response")).not.toBeInTheDocument();
    expect(screen.queryByText("Image Response")).not.toBeInTheDocument();
    expect(screen.queryByText("Embedded Resource")).not.toBeInTheDocument();
    expect(screen.queryByText("Resource Type: doc")).not.toBeInTheDocument();
    expect(screen.queryByText("View Resource")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Tool result")).not.toBeInTheDocument();

    await user.click(screen.getByText("JSON"));
    expect(screen.getByText(/"type": "text"/)).toBeInTheDocument();
  });

  it("renders the copy-name toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", { value: { writeText }, configurable: true });
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    renderPanel();

    await user.click(screen.getByTitle("点击复制工具名称"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制工具名称到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Tool name copied to clipboard");

    writeText.mockRejectedValue(new Error("nope"));
    await user.click(screen.getByTitle("点击复制工具名称"));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("复制工具名称失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to copy tool name");
  });

  it("renders the copy-result toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", { value: { writeText }, configurable: true });
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    renderPanel({ result });

    await user.click(screen.getByTitle("复制响应"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制结果到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Result copied to clipboard");

    writeText.mockRejectedValue(new Error("nope"));
    await user.click(screen.getByTitle("复制响应"));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("复制结果失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to copy result");
  });
});
