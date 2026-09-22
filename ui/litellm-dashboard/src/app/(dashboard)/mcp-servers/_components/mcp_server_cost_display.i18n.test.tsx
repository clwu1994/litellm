import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPServerCostDisplay from "./mcp_server_cost_display";

describe("MCPServerCostDisplay Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the unconfigured state in Chinese and hides the English original", () => {
    render(<MCPServerCostDisplay costConfig={null} />);

    expect(screen.getByText("此服务器未设置成本配置。工具调用将按每次调用 $0.00 收费。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No cost configuration set for this server. Tool calls will be charged at $0.00 per tool call.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the default and per-tool sections and the summary in Chinese and hides the English originals", () => {
    render(
      <MCPServerCostDisplay
        costConfig={{ default_cost_per_query: 0.0125, tool_name_to_cost_per_query: { search: 0.5, fetch: 0.25 } }}
      />,
    );

    expect(screen.getByText("每次查询的默认成本")).toBeInTheDocument();
    expect(screen.getByText("特定工具的成本")).toBeInTheDocument();
    expect(screen.getByText("成本摘要：")).toBeInTheDocument();
    expect(screen.getByText("• 默认成本：每次查询 $0.0125")).toBeInTheDocument();
    expect(screen.getByText("每次查询 $0.5000")).toBeInTheDocument();
    expect(screen.getByText("每次查询 $0.2500")).toBeInTheDocument();
    expect(screen.getByText("• 2 个工具使用自定义价格")).toBeInTheDocument();
    expect(screen.queryByText("Default Cost per Query")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool-Specific Costs")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost Summary:")).not.toBeInTheDocument();
    expect(screen.queryByText("• Default cost: $0.0125 per query")).not.toBeInTheDocument();
    expect(screen.queryByText("• 2 tool(s) with custom pricing")).not.toBeInTheDocument();
    expect(screen.queryByText("$0.5000 per query")).not.toBeInTheDocument();
    expect(screen.queryByText("$0.2500 per query")).not.toBeInTheDocument();
  });
});
