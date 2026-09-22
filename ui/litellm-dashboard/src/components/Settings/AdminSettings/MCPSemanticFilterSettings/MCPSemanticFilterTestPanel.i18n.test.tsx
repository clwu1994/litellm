import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPSemanticFilterTestPanel from "./MCPSemanticFilterTestPanel";
import type { TestResult } from "./semanticFilterTestUtils";

vi.mock("@/components/common_components/ModelSelector", () => ({
  default: ({ labelText }: { labelText?: string }) => <div>{labelText}</div>,
}));

const buildProps = (overrides: Partial<React.ComponentProps<typeof MCPSemanticFilterTestPanel>> = {}) => ({
  accessToken: "test-token",
  testQuery: "find tools",
  setTestQuery: vi.fn(),
  testModel: "gpt-4o",
  setTestModel: vi.fn(),
  isTesting: false,
  onTest: vi.fn(),
  filterEnabled: true,
  testResult: null as TestResult | null,
  testError: null as string | null,
  curlCommand: "curl --location 'http://localhost:4000/v1/responses'",
  ...overrides,
});

const renderPanel = (overrides = {}) => render(<MCPSemanticFilterTestPanel {...buildProps(overrides)} />);

describe("MCPSemanticFilterTestPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the test tab in Chinese and hides the English originals", () => {
    renderPanel();

    expect(screen.getByText("测试配置")).toBeInTheDocument();
    expect(screen.getByText("测试")).toBeInTheDocument();
    expect(screen.getByText("API 用法")).toBeInTheDocument();
    expect(screen.getByText("测试查询")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入测试查询，查看将选中哪些工具...")).toBeInTheDocument();
    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试筛选" })).toBeInTheDocument();
    expect(screen.queryByText("Test Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
    expect(screen.queryByText("API Usage")).not.toBeInTheDocument();
    expect(screen.queryByText("Test Query")).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter a test query to see which tools would be selected..."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Filter" })).not.toBeInTheDocument();
  });

  it("renders the disabled and failure alerts in Chinese and hides the English originals", () => {
    const { unmount } = renderPanel({ filterEnabled: false });
    expect(screen.getByText("语义筛选已禁用")).toBeInTheDocument();
    expect(screen.getByText("启用语义筛选并保存设置，然后即可测试筛选。")).toBeInTheDocument();
    expect(screen.queryByText("Semantic filtering is disabled")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enable semantic filtering and save settings to test the filter."),
    ).not.toBeInTheDocument();
    unmount();

    renderPanel({ testError: "boom" });
    expect(screen.getByText("语义筛选未运行")).toBeInTheDocument();
    expect(screen.queryByText("Semantic filtering did not run")).not.toBeInTheDocument();
  });

  it("renders the result summary in Chinese and hides the English originals", () => {
    renderPanel({ testResult: { selectedTools: 3, totalTools: 5, tools: ["a"] } });

    expect(screen.getByText("结果")).toBeInTheDocument();
    expect(screen.getByText("已选中 5 个工具中的 3 个")).toBeInTheDocument();
    expect(screen.getByText("已筛除 2 个工具")).toBeInTheDocument();
    expect(screen.getByText("选中的工具：")).toBeInTheDocument();
    expect(screen.getByText("还有 2 个已选中工具未显示")).toBeInTheDocument();
    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.queryByText("3 of 5 tools selected")).not.toBeInTheDocument();
    expect(screen.queryByText("2 tools filtered out")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected Tools:")).not.toBeInTheDocument();
    expect(screen.queryByText("+2 more selected tools not shown")).not.toBeInTheDocument();
  });

  it("renders the API usage tab in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByText("API 用法"));

    expect(screen.getByText("API 用法", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText("API Usage", { selector: "p" })).not.toBeInTheDocument();
    expect(screen.getByText("使用此 curl 命令以当前配置测试语义筛选。")).toBeInTheDocument();
    expect(screen.getByText("需要检查的响应头：")).toBeInTheDocument();
    expect(screen.getByText("x-litellm-semantic-filter：显示工具总数 → 选中的工具")).toBeInTheDocument();
    expect(screen.getByText("示例：10→3")).toBeInTheDocument();
    expect(screen.getByText("x-litellm-semantic-filter-tools：选中工具名称的 CSV")).toBeInTheDocument();
    expect(screen.getByText("示例：wikipedia-fetch,github-search,slack-post")).toBeInTheDocument();
    expect(
      screen.queryByText("Use this curl command to test the semantic filter with your current configuration."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Response headers to check:")).not.toBeInTheDocument();
    expect(screen.queryByText("x-litellm-semantic-filter: shows total tools → selected tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Example: 10→3")).not.toBeInTheDocument();
    expect(screen.queryByText("x-litellm-semantic-filter-tools: CSV of selected tool names")).not.toBeInTheDocument();
    expect(screen.queryByText("Example: wikipedia-fetch,github-search,slack-post")).not.toBeInTheDocument();
  });
});
