import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPConnect from "./mcp_connect";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

const expectPair = (zh: string, en: string) => {
  expect(screen.getAllByText(zh)[0]).toBeInTheDocument();
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const expectFullText = (zh: string, en: string, tag = "SPAN") => {
  expect(screen.getAllByText((_, el) => el?.tagName === tag && el.textContent === zh)[0]).toBeInTheDocument();
  expect(screen.queryAllByText((_, el) => el?.tagName === tag && el.textContent === en)).toHaveLength(0);
};

describe("MCPConnect Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page heading, tabs and header-toggle copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MCPConnect />);

    expectPair("连接到你的 MCP 客户端", "Connect to your MCP client");
    expectPair(
      "通过 LiteLLM MCP，直接从任何 MCP 客户端使用工具。让你的 AI 助手通过简单、安全的连接执行实际任务。",
      "Use tools directly from any MCP client with LiteLLM MCP. Enable your AI assistant to perform real-world tasks through a simple, secure connection.",
    );
    expect(screen.getByRole("tab", { name: "OpenAI API" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "LiteLLM Proxy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Cursor" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "可流式 HTTP" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Streamable HTTP" })).not.toBeInTheDocument();

    expectFullText(
      "通过传递 x-mcp-servers 请求头，将工具限制到特定的 MCP 服务器或 MCP 组",
      "Limit tools to specific MCP servers or MCP groups by passing the x-mcp-servers header",
      "LABEL",
    );

    await user.click(screen.getAllByRole("switch")[0]);

    expectPair("两种选项", "Two Options");
    expectPair("选项 1：", "Option 1:");
    expectPair("获取特定服务器：", "Get a specific server:");
    expectPair("选项 2：", "Option 2:");
    expectPair("获取一组 MCP：", "Get a group of MCPs:");
    expectPair("你也可以混用两者：", "You can also mix both:");
  });

  it("renders the Chinese LiteLLM Proxy tab copy and hides the English originals", () => {
    renderWithProviders(<MCPConnect />);

    expectPair("LiteLLM Proxy API 集成", "LiteLLM Proxy API Integration");
    expectPair(
      "连接到 LiteLLM Proxy Responses API，与多个模型提供商实现无缝工具集成",
      "Connect to LiteLLM Proxy Responses API for seamless tool integration with multiple model providers",
    );
    expectPair("Virtual Key 设置", "Virtual Key Setup");
    expectPair(
      "配置你的 LiteLLM Proxy Virtual Key 以进行认证",
      "Configure your LiteLLM Proxy Virtual Key for authentication",
    );
    expectPair(
      "从你的 LiteLLM Proxy 管理页面获取 Virtual Key，或联系管理员",
      "Get your Virtual Key from your LiteLLM Proxy dashboard or contact your administrator",
    );
    expectPair(
      "使用 LiteLLM Proxy Responses API 的完整 cURL 示例",
      "Complete cURL example for using the LiteLLM Proxy Responses API",
    );
  });

  it("renders the Chinese OpenAI tab copy and hides the English originals", () => {
    renderWithProviders(<MCPConnect />);

    expectPair("OpenAI Responses API 集成", "OpenAI Responses API Integration");
    expectPair(
      "将 OpenAI Responses API 连接到你的 LiteLLM MCP 服务器，实现无缝工具集成",
      "Connect OpenAI Responses API to your LiteLLM MCP server for seamless tool integration",
    );
    expectPair("API Key 设置", "API Key Setup");
    expectPair("配置你的 OpenAI API key 以进行认证", "Configure your OpenAI API key for authentication");
    expectPair("从", "Get your API key from the");
    expectPair("OpenAI 平台获取你的 API key", "OpenAI platform");
    expectPair("使用 Responses API 的完整 cURL 示例", "Complete cURL example for using the Responses API");
  });

  it("renders the Chinese shared FeatureCard copy and hides the English originals", () => {
    renderWithProviders(<MCPConnect />);

    expectPair("环境变量", "Environment Variable");
    expectPair("服务器 URL", "Server URL");
    expectPair("MCP 服务器信息", "MCP Server Information");
    expectPair("你的 LiteLLM MCP 服务器的连接详情", "Connection details for your LiteLLM MCP server");
    expectPair("实现示例", "Implementation Example");
  });

  it("renders the Chinese Cursor tab copy and hides the English originals", () => {
    renderWithProviders(<MCPConnect />);

    expectPair("Cursor IDE 集成", "Cursor IDE Integration");
    expectPair(
      "通过 LiteLLM MCP 直接从 Cursor IDE 使用工具。让你的 AI 助手无需离开编码环境即可执行实际任务。",
      "Use tools directly from Cursor IDE with LiteLLM MCP. Enable your AI assistant to perform real-world tasks without leaving your coding environment.",
    );
    expectPair("设置说明", "Setup Instructions");
    expectPair("打开 Cursor 设置", "Open Cursor Settings");
    expectFullText(
      "使用快捷键 ⇧+⌘+J（Mac）或 Ctrl+Shift+J（Windows/Linux）",
      "Use the keyboard shortcut ⇧+⌘+J (Mac) or Ctrl+Shift+J (Windows/Linux)",
    );
    expectPair("导航到 MCP 工具", "Navigate to MCP Tools");
    expectPair(
      "转到“MCP 工具”标签页，然后点击“新建 MCP 服务器”",
      'Go to the "MCP Tools" tab and click "New MCP Server"',
    );
    expectPair("添加配置", "Add Configuration");
    expectFullText(
      "复制下面的 JSON 配置并粘贴到 Cursor 中，然后使用 Cmd+S 或 Ctrl+S",
      "Copy the JSON configuration below and paste it into Cursor, then save with Cmd+S or Ctrl+S",
    );
    expectPair("配置", "Configuration");
    expectPair("Cursor MCP 配置", "Cursor MCP configuration");
  });

  it("renders the Chinese Streamable HTTP tab copy and hides the English originals", () => {
    renderWithProviders(<MCPConnect />);

    expectPair("可流式 HTTP 传输", "Streamable HTTP Transport");
    expectPair(
      "使用 HTTP 传输连接到 LiteLLM MCP。兼容任何支持 HTTP 流式传输的 MCP 客户端。",
      "Connect to LiteLLM MCP using HTTP transport. Compatible with any MCP client that supports HTTP streaming.",
    );
    expectPair("通用 MCP 连接", "Universal MCP Connection");
    expectPair(
      "在支持 HTTP 传输的任何 MCP 客户端中使用此 URL",
      "Use this URL with any MCP client that supports HTTP transport",
    );
    expectPair(
      "每个 MCP 客户端支持不同的传输方式。请参阅你的客户端文档以确定合适的传输方法。",
      "Each MCP client supports different transports. Refer to your client documentation to determine the appropriate transport method.",
    );
    expectPair("请求头配置", "Headers Configuration");
    expectPair("进一步了解 MCP 传输", "Learn more about MCP transports");
  });
});
