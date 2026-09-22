import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { Agent } from "@/components/agents/types";

import AgentsTable from "./AgentsTable";

const baseProps = {
  isLoading: false,
  isAdmin: true,
  healthCheckEnabled: false,
  isHealthCheckLoading: false,
  onHealthCheckToggle: vi.fn(),
  onAgentClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  agent_id: "agent-1",
  agent_name: "Test Agent",
  litellm_params: { model: "gpt-4" },
  spend: 0,
  keys: [{ token: "hash-1", key_alias: "primary", key_name: "sk-...1" }],
  created_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

describe("AgentsTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading message and hides the English original", () => {
    renderWithProviders(<AgentsTable agents={[]} {...baseProps} isLoading />);

    expect(screen.getByText("正在加载 Agent…")).toBeInTheDocument();
    expect(screen.queryByText("Loading agents…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", () => {
    renderWithProviders(<AgentsTable agents={[]} {...baseProps} />);

    expect(screen.getByText("暂无 Agent")).toBeInTheDocument();
    expect(screen.queryByText("No agents yet")).not.toBeInTheDocument();
    expect(screen.getByText("添加 Agent 后即可在你的组织中使用。")).toBeInTheDocument();
    expect(screen.queryByText("Add an agent to make it available in your organization.")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match state and search chrome and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentsTable agents={[makeAgent()]} {...baseProps} />);

    expect(screen.getByPlaceholderText("按名称、ID 或描述搜索 Agent...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search agents by name, ID, or description...")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("按名称、ID 或描述搜索 Agent..."), "zzzz");

    expect(screen.getByText("没有匹配的 Agent")).toBeInTheDocument();
    expect(screen.queryByText("No matching agents")).not.toBeInTheDocument();
    expect(screen.getByText("调整搜索条件以查看更多 Agent。")).toBeInTheDocument();
    expect(screen.queryByText("Adjust the search to see more agents.")).not.toBeInTheDocument();

    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  it("renders the Chinese health-check label and tooltip and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentsTable agents={[]} {...baseProps} />);

    expect(screen.getByText("健康检查")).toBeInTheDocument();
    expect(screen.queryByText("Health Check")).not.toBeInTheDocument();

    await user.hover(screen.getByText("健康检查"));

    expect(await screen.findByText("启用后仅显示 URL 可访问的 Agent", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("When enabled, only agents with reachable URLs are shown")).not.toBeInTheDocument();
  });
});
