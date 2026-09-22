import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPEventsDisplay from "./MCPEventsDisplay";
import type { MCPEvent } from "@/components/mcp_tools/types";

const events: MCPEvent[] = [
  {
    type: "response.output_item.done",
    item: { type: "mcp_list_tools", tools: [{ name: "list_repos" }] },
  },
  {
    type: "response.output_item.done",
    item: { type: "mcp_call", name: "", arguments: '{"query":"repos"}', output: "ok" },
  },
] as unknown as MCPEvent[];

describe("MCPEventsDisplay Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese list-tools and tool-call panel titles while hiding the English originals", () => {
    render(<MCPEventsDisplay events={events} />);

    expect(screen.getByText("列出工具")).toBeInTheDocument();
    expect(screen.queryByText("List tools")).not.toBeInTheDocument();
    expect(screen.getByText("工具调用")).toBeInTheDocument();
    expect(screen.queryByText("Tool call")).not.toBeInTheDocument();
  });

  it("renders the Chinese request, approved and response labels while hiding the English originals", () => {
    render(<MCPEventsDisplay events={events} />);

    fireEvent.click(screen.getByText("工具调用"));

    expect(screen.getByText("请求")).toBeInTheDocument();
    expect(screen.queryByText("Request")).not.toBeInTheDocument();
    expect(screen.getByText("已批准")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    expect(screen.getByText("响应")).toBeInTheDocument();
    expect(screen.queryByText("Response")).not.toBeInTheDocument();
  });
});
