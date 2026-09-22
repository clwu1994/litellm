import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import AgentCardDiscovery from "./agent_card_discovery";

/* eslint-disable testing-library/no-node-access -- The discovery info trigger is an icon with no accessible name, so reaching its tooltip needs the DOM */

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return { ...actual, discoverAgentCardCall: vi.fn() };
});

import { discoverAgentCardCall } from "@/components/networking";

const mockDiscover = discoverAgentCardCall as unknown as ReturnType<typeof vi.fn>;

const sampleCard = {
  protocolVersion: "1.0",
  name: "Upstream Agent",
  description: "An upstream agent",
  version: "1.2.3",
  url: "http://internal:9000",
  capabilities: { streaming: true },
  skills: [
    { id: "search", name: "Search", description: "Search the web", tags: ["search"] },
    { id: "summarize", name: "Summarize", description: "Summarize a document", tags: ["llm"] },
  ],
  provider: { organization: "UpstreamCo", url: "https://upstream.example" },
};

const emptySkillsCard = { ...sampleCard, capabilities: {}, skills: [] };

const hoverTitleHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).closest("div")?.querySelector(".lucide-info");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

const discoverCard = async (user: ReturnType<typeof userEvent.setup>) => {
  renderWithProviders(<AgentCardDiscovery accessToken="tok" onApply={vi.fn()} />);
  const input = screen.getByPlaceholderText("https://upstream-agent.example.com");
  await user.clear(input);
  await user.type(input, "https://upstream.example.com");
  await vi.advanceTimersByTimeAsync(500);
  await screen.findByText("已加载上游卡片");
};

describe("AgentCardDiscovery Chinese copy", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockDiscover.mockReset();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese manual-discovery chrome and hides the English originals", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AgentCardDiscovery accessToken="tok" onApply={vi.fn()} />);

    expect(screen.getByText("从 Agent URL 发现")).toBeInTheDocument();
    expect(screen.queryByText("Discover from agent URL")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发现" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Discover" })).not.toBeInTheDocument();
    expect(screen.getByText(/粘贴上游 Agent 的 Base URL。我们将按顺序尝试/)).toBeInTheDocument();
    expect(screen.queryByText(/Paste the upstream agent's base URL/)).not.toBeInTheDocument();

    await hoverTitleHint(user, "从 Agent URL 发现");

    expect(
      await screen.findByText(
        "LiteLLM 会从此 URL 获取 /.well-known/agent-card.json，并让你选择通过代理暴露哪些技能和能力。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "LiteLLM will fetch /.well-known/agent-card.json from this URL and let you pick which skills and capabilities to expose through the proxy.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese parent-driven chrome and the empty display-url fallback", async () => {
    renderWithProviders(
      <AgentCardDiscovery
        accessToken="tok"
        onApply={vi.fn()}
        discoveryRequest={{ url: "", discovery_mode: "langgraph_platform", display_url: "" }}
      />,
    );

    expect(screen.getByText("使用你上方填写的连接信息。我们将获取：")).toBeInTheDocument();
    expect(screen.queryByText("Using the connection details you entered above. We'll fetch:")).not.toBeInTheDocument();
    expect(screen.getByText("请先填写上方字段")).toBeInTheDocument();
    expect(screen.queryByText("Fill in the fields above first")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发现" })).toBeDisabled();
  });

  it("renders the Chinese missing-URL error and hides the English original", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AgentCardDiscovery accessToken="tok" onApply={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "发现" }));

    expect(await screen.findByText("请先输入 Agent 的 Base URL")).toBeInTheDocument();
    expect(screen.queryByText("Enter the agent's base URL first")).not.toBeInTheDocument();
    expect(mockDiscover).not.toHaveBeenCalled();
  });

  it("renders the Chinese no-token error and hides the English original", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AgentCardDiscovery accessToken={null} onApply={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("https://upstream-agent.example.com"), "https://upstream.example.com");
    await user.click(screen.getByRole("button", { name: "发现" }));

    expect(await screen.findByText("没有可用的 access token")).toBeInTheDocument();
    expect(screen.queryByText("No access token available")).not.toBeInTheDocument();
  });

  it("renders the Chinese discovery-failure chrome and the dismiss control", async () => {
    mockDiscover.mockRejectedValueOnce({});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<AgentCardDiscovery accessToken="tok" onApply={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("https://upstream-agent.example.com"), "https://nope.example");
    await vi.advanceTimersByTimeAsync(500);

    expect(await screen.findByText("发现失败")).toBeInTheDocument();
    expect(screen.queryByText("Discovery failed")).not.toBeInTheDocument();
    expect(screen.getByText("发现 Agent 卡片失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to discover agent card")).not.toBeInTheDocument();

    const dismiss = screen.getByRole("button", { name: "关闭错误" });
    expect(dismiss).toBeInTheDocument();
    await user.click(dismiss);

    expect(screen.queryByText("发现失败")).not.toBeInTheDocument();
  });

  it("renders the Chinese loaded-card chrome, skill selection and capability copy", async () => {
    mockDiscover.mockResolvedValue({ url: "https://upstream.example.com", agent_card: sampleCard });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await discoverCard(user);

    expect(screen.getByRole("button", { name: "重新发现" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Re-discover" })).not.toBeInTheDocument();
    expect(screen.getByText("名称（对 API 客户端显示）")).toBeInTheDocument();
    expect(screen.queryByText("Name (shown to API clients)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Agent 名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("此 Agent 的功能")).toBeInTheDocument();
    expect(screen.getByText("已选择 2 / 2")).toBeInTheDocument();
    expect(screen.queryByText("2 / 2 selected")).not.toBeInTheDocument();
    expect(screen.getByText("技能")).toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.getByText("能力")).toBeInTheDocument();
    expect(screen.queryByText("Capabilities")).not.toBeInTheDocument();
    expect(screen.getByText("流式传输")).toBeInTheDocument();
    expect(screen.queryByText(/^streaming$/)).not.toBeInTheDocument();

    await hoverTitleHint(user, "能力");

    expect(
      await screen.findByText(
        "此处仅列出 LiteLLM 目前能忠实代理的能力。其他能力（推送通知、扩展）即将推出。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Only capabilities LiteLLM can faithfully proxy today are listed. Others (push notifications, extensions) are coming soon.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-skills and unadvertised-capability copy", async () => {
    mockDiscover.mockResolvedValue({ url: "https://upstream.example.com", agent_card: emptySkillsCard });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await discoverCard(user);

    expect(screen.getByText("已选择 0 / 0")).toBeInTheDocument();
    expect(screen.getByText("上游卡片没有技能")).toBeInTheDocument();
    expect(screen.queryByText("Upstream card has no skills")).not.toBeInTheDocument();
    expect(screen.getByText("上游未声明")).toBeInTheDocument();
    expect(screen.queryByText("not advertised upstream")).not.toBeInTheDocument();
  });
});
