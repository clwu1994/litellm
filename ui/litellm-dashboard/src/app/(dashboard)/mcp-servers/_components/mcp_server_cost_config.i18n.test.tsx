/* eslint-disable testing-library/no-node-access -- The info triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPServerCostConfig from "./mcp_server_cost_config";

const tools = [
  { name: "search", description: "Search the index" },
  { name: "fetch", description: "Fetch a document" },
];

const openLabeledTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.hover(screen.getByLabelText(label));
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

describe("MCPServerCostConfig Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the field labels and hints in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    render(<MCPServerCostConfig value={{ default_cost_per_query: 0.02 }} tools={tools} />);

    expect(screen.getByText("成本配置")).toBeInTheDocument();
    expect(screen.getByText("每次查询的默认成本（$）")).toBeInTheDocument();
    expect(screen.getByText("为此服务器的所有工具调用设置默认成本")).toBeInTheDocument();
    expect(screen.getByText("特定工具的成本（$）")).toBeInTheDocument();
    expect(screen.getByText("可用工具")).toBeInTheDocument();
    expect(screen.queryByText("Cost Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Default Cost per Query ($)")).not.toBeInTheDocument();
    expect(screen.queryByText("Set a default cost for all tool calls to this server")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool-Specific Costs ($)")).not.toBeInTheDocument();
    expect(screen.queryByText("Available Tools")).not.toBeInTheDocument();

    await user.click(screen.getByText("可用工具"));

    expect(screen.getAllByPlaceholderText("使用默认值")).toHaveLength(2);
    expect(screen.queryByPlaceholderText("Use default")).not.toBeInTheDocument();
  });

  it("renders the labelled info tooltips in Chinese in the same open state and hides the English originals", async () => {
    const user = userEvent.setup();
    render(<MCPServerCostConfig value={{ default_cost_per_query: 0.02 }} tools={tools} />);

    expect(screen.getByLabelText("关于成本配置")).toBeInTheDocument();
    expect(screen.getByLabelText("关于默认成本")).toBeInTheDocument();
    expect(screen.getByLabelText("关于按工具的成本")).toBeInTheDocument();
    expect(screen.queryByLabelText("About cost configuration")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("About the default cost")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("About per-tool costs")).not.toBeInTheDocument();

    const about = await openLabeledTooltip(user, "关于成本配置");
    expect(about).toHaveTextContent("为此 MCP 服务器的工具调用配置成本。设置默认费率和按工具的覆盖值。");
    expect(about).not.toHaveTextContent(
      "Configure costs for this MCP server's tool calls. Set a default rate and per-tool overrides.",
    );

    const defaultHint = await openLabeledTooltip(user, "关于默认成本");
    expect(defaultHint).toHaveTextContent("对此服务器的每次工具调用收取的默认成本。");
    expect(defaultHint).not.toHaveTextContent("Default cost charged for each tool call to this server.");

    const perToolHint = await openLabeledTooltip(user, "关于按工具的成本");
    expect(perToolHint).toHaveTextContent("覆盖特定工具的默认成本。留空则使用默认费率。");
    expect(perToolHint).not.toHaveTextContent(
      "Override the default cost for specific tools. Leave blank to use the default rate.",
    );
  });

  it("renders the cost summary in Chinese and hides the English originals", () => {
    render(
      <MCPServerCostConfig
        value={{ default_cost_per_query: 0.01, tool_name_to_cost_per_query: { search: 0.25 } }}
        tools={tools}
      />,
    );

    expect(screen.getByText("成本摘要：")).toBeInTheDocument();
    expect(screen.getByText("• 默认成本：每次查询 $0.0100")).toBeInTheDocument();
    expect(screen.getByText("• search：每次查询 $0.2500")).toBeInTheDocument();
    expect(screen.queryByText("Cost Summary:")).not.toBeInTheDocument();
    expect(screen.queryByText("• Default cost: $0.0100 per query")).not.toBeInTheDocument();
    expect(screen.queryByText("• search: $0.2500 per query")).not.toBeInTheDocument();
  });
});
