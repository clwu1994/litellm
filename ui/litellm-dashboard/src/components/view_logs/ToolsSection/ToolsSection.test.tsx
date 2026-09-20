/**
 * Core tests for Tools section
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { parseToolsFromLog } from "./utils";
import { ToolsSection } from "./ToolsSection";
import { LogEntry } from "../columns";
import i18n from "@/i18n/bootstrapI18n";

const logWithTools = (toolNames: string[], calledName?: string): LogEntry => ({
  request_id: "render-1",
  api_key: "key",
  team_id: "team",
  model: "gpt-4",
  model_id: "gpt-4",
  call_type: "completion",
  spend: 0.01,
  total_tokens: 100,
  prompt_tokens: 50,
  completion_tokens: 50,
  startTime: "2024-01-01T00:00:00Z",
  endTime: "2024-01-01T00:00:01Z",
  cache_hit: "none",
  messages: JSON.stringify({
    model: "gpt-4",
    messages: [{ role: "user", content: "hi" }],
    tools: toolNames.map((name) => ({
      type: "function",
      function: { name, description: `${name} description`, parameters: { type: "object", properties: {} } },
    })),
  }),
  response: JSON.stringify({
    choices: [
      {
        message: calledName
          ? { tool_calls: [{ id: "call_1", type: "function", function: { name: calledName, arguments: "{}" } }] }
          : { content: "done" },
      },
    ],
  }),
});

describe("ToolsSection", () => {
  it("should parse tools from request and match with response tool calls", () => {
    const mockLog: LogEntry = {
      request_id: "test-123",
      api_key: "key",
      team_id: "team",
      model: "gpt-4",
      model_id: "gpt-4",
      call_type: "completion",
      spend: 0.01,
      total_tokens: 100,
      prompt_tokens: 50,
      completion_tokens: 50,
      startTime: "2024-01-01T00:00:00Z",
      endTime: "2024-01-01T00:00:01Z",
      cache_hit: "none",
      messages: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "What's the weather?" }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get the current weather",
              parameters: {
                type: "object",
                required: ["location"],
                properties: {
                  location: { type: "string", description: "City name" },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "search_web",
              description: "Search the web",
              parameters: {
                type: "object",
                required: ["query"],
                properties: {
                  query: { type: "string", description: "Search query" },
                },
              },
            },
          },
        ],
      }),
      response: JSON.stringify({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: {
                    name: "get_weather",
                    arguments: '{"location": "San Francisco"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    };

    const tools = parseToolsFromLog(mockLog);

    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe("get_weather");
    expect(tools[0].called).toBe(true);
    expect(tools[0].callData?.arguments).toEqual({ location: "San Francisco" });
    expect(tools[1].name).toBe("search_web");
    expect(tools[1].called).toBe(false);
  });

  it("should return empty array when no tools in request", () => {
    const mockLog: LogEntry = {
      request_id: "test-456",
      api_key: "key",
      team_id: "team",
      model: "gpt-4",
      model_id: "gpt-4",
      call_type: "completion",
      spend: 0.01,
      total_tokens: 100,
      prompt_tokens: 50,
      completion_tokens: 50,
      startTime: "2024-01-01T00:00:00Z",
      endTime: "2024-01-01T00:00:01Z",
      cache_hit: "none",
      messages: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello" }],
      }),
      response: JSON.stringify({
        choices: [{ message: { content: "Hi there!" } }],
      }),
    };

    const tools = parseToolsFromLog(mockLog);

    expect(tools).toHaveLength(0);
  });
});

const isShown = (text: string) => screen.queryAllByText(text).some((el) => el.closest("[hidden]") === null);

describe("ToolsSection rendering", () => {
  it("summarises how many tools were provided and called", () => {
    render(<ToolsSection log={logWithTools(["get_weather", "search_web"], "get_weather")} />);

    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("2 provided, 1 called")).toBeInTheDocument();
  });

  it("previews the first two tool names", () => {
    render(<ToolsSection log={logWithTools(["alpha", "beta", "gamma"])} />);

    expect(screen.getByText(/alpha, beta/)).toBeInTheDocument();
  });

  it("renders nothing when the log has no tools", () => {
    const { container } = render(<ToolsSection log={logWithTools([])} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("reveals the tool list only after the section is expanded", async () => {
    render(<ToolsSection log={logWithTools(["get_weather", "search_web"], "get_weather")} />);

    expect(isShown("called")).toBe(false);
    expect(isShown("not called")).toBe(false);

    await userEvent.click(screen.getByText("Tools"));

    await waitFor(() => expect(isShown("called")).toBe(true));
    expect(isShown("not called")).toBe(true);
  });

  it("keeps a tool's expanded detail across a close and reopen", async () => {
    render(<ToolsSection log={logWithTools(["get_weather", "search_web"], "get_weather")} />);

    await userEvent.click(screen.getByText("Tools"));
    await userEvent.click(await screen.findByText(/1\. get_weather/));
    expect(isShown("Description")).toBe(true);

    await userEvent.click(screen.getByText("Tools"));
    await userEvent.click(screen.getByText("Tools"));

    await waitFor(() => expect(isShown("Description")).toBe(true));
  });
});

const logWithParameterizedTool = (): LogEntry => ({
  ...logWithTools(["get_weather"], "get_weather"),
  messages: JSON.stringify({
    model: "gpt-4",
    messages: [{ role: "user", content: "hi" }],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather",
          parameters: {
            type: "object",
            required: ["location"],
            properties: { location: { type: "string", description: "City name" } },
          },
        },
      },
    ],
  }),
});

describe("ToolsSection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese summary and call badges and hides the English ones", async () => {
    render(<ToolsSection log={logWithTools(["get_weather", "search_web"], "get_weather")} />);

    expect(screen.getByText("工具")).toBeInTheDocument();
    expect(screen.getByText("提供 2 个，调用 1 个")).toBeInTheDocument();

    await userEvent.click(screen.getByText("工具"));

    expect(isShown("已调用")).toBe(true);
    expect(isShown("未调用")).toBe(true);
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
    expect(screen.queryByText("2 provided, 1 called")).not.toBeInTheDocument();
    expect(screen.queryByText("called")).not.toBeInTheDocument();
    expect(screen.queryByText("not called")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool detail chrome and hides the English one", async () => {
    render(<ToolsSection log={logWithParameterizedTool()} />);

    await userEvent.click(screen.getByText("工具"));
    await userEvent.click(await screen.findByText(/1\. get_weather/));

    expect(isShown("描述")).toBe(true);
    expect(isShown("格式化")).toBe(true);
    expect(isShown("JSON")).toBe(true);
    expect(isShown("参数")).toBe(true);
    expect(isShown("类型")).toBe(true);
    expect(isShown("调用参数")).toBe(true);

    expect(screen.queryByText("Description")).not.toBeInTheDocument();
    expect(screen.queryByText("Formatted")).not.toBeInTheDocument();
    expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
    expect(screen.queryByText("Parameter")).not.toBeInTheDocument();
    expect(screen.queryByText("Called With")).not.toBeInTheDocument();
  });
});
