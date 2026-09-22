import React from "react";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

import AgentsPanel from "./AgentsPanel";

vi.mock("@/components/networking", () => ({
  getAgentsList: vi.fn(),
  deleteAgentCall: vi.fn(),
}));

vi.mock("./add_agent_form", () => ({
  default: () => <div data-testid="add-agent-form" />,
}));

vi.mock("./agent_info", () => ({
  default: () => <div data-testid="agent-info" />,
}));

const AGENT = {
  agent_id: "agent-9",
  agent_name: "Doomed Agent",
  litellm_params: { model: "gpt-4" },
  spend: 0,
  keys: [],
};

describe("AgentsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.getAgentsList)
      .mockReset()
      .mockResolvedValue({ agents: [AGENT] });
    vi.mocked(networking.deleteAgentCall).mockReset().mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese list chrome and hides the English originals", async () => {
    renderWithProviders(<AgentsPanel accessToken="test-token" userRole="Admin" />);
    await screen.findByText("Doomed Agent");

    // "Agents" is kept in English to match the navigation label, so both locales share the same value.
    expect(screen.getByRole("heading", { name: "Agents" })).toBeInTheDocument();
    expect(
      screen.getByText("可在你的组织中使用的 A2A 规范 Agent 列表。前往 AI Hub 可将 Agent 设为公开。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "List of A2A-spec agents that are available to be used in your organization. Go to AI Hub, to make agents public.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("为什么 Agent 需要密钥？")).toBeInTheDocument();
    expect(screen.queryByText("Why do agents need keys?")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "密钥用于限定对 Agent 的访问，并允许 Agent 调用 MCP 工具。你可以在创建 Agent 时分配密钥，或在 Virtual Keys 页面分配。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Keys scope access to an agent and allow it to call MCP tools. Assign a key when creating an agent or from the Virtual Keys page.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加新 Agent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add New Agent" })).not.toBeInTheDocument();
  });

  it("renders the Chinese delete dialog and reports the Chinese delete toast", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentsPanel accessToken="test-token" userRole="Admin" />);
    await screen.findByText("Doomed Agent");

    await user.click(screen.getByTestId("agent-actions-agent-9"));
    await user.click(await screen.findByTestId("agent-action-delete"));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("删除 Agent")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Agent")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除 Agent：Doomed Agent 吗？此操作无法撤销。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Are you sure you want to delete agent: Doomed Agent? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Agent “Doomed Agent” 删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith('Agent "Doomed Agent" deleted successfully');
  });

  it("reports the Chinese delete failure toast", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.deleteAgentCall).mockRejectedValue(new Error("boom"));
    renderWithProviders(<AgentsPanel accessToken="test-token" userRole="Admin" />);
    await screen.findByText("Doomed Agent");

    await user.click(screen.getByTestId("agent-actions-agent-9"));
    await user.click(await screen.findByTestId("agent-action-delete"));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除 Agent 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete agent");
  });
});
