import React from "react";
import { waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import type { Agent } from "@/components/agents/types";
import type { KeyResponse } from "@/components/key_team_helpers/key_list";
import { toast } from "@/lib/toast";

import AgentInfoView from "./agent_info";

/* eslint-disable testing-library/no-node-access -- The allowed-servers hint trigger is an icon with no accessible name, so reaching its tooltip needs the DOM */

const { keysRef } = vi.hoisted(() => ({ keysRef: { current: [] as KeyResponse[] } }));

vi.mock("@/components/networking", () => ({
  getAgentInfo: vi.fn(),
  getAgentCreateMetadata: vi.fn(),
  patchAgentCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useKeys: () => ({ data: { keys: keysRef.current }, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [{ server_id: "srv-1", server_name: "github" }] }),
}));

vi.mock("./agent_card_discovery", () => ({
  default: () => <div data-testid="agent-card-discovery" />,
}));

vi.mock("./agent_form_fields", () => ({
  default: () => <div data-testid="agent-form-fields" />,
  unmountedA2AFieldNames: () => [],
}));

vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  default: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
}));

vi.mock("@/components/mcp_server_management/MCPToolPermissions", () => ({
  default: () => <div data-testid="mcp-tool-permissions" />,
}));

vi.mock("@/components/templates/key_info_view", () => ({
  default: ({ backButtonText }: { backButtonText?: string }) => <div>{backButtonText}</div>,
}));

const FULL_AGENT = {
  agent_id: "agent-1",
  agent_name: "support-agent",
  agent_card_params: {
    name: "Support Agent",
    description: "Answers support questions",
    url: "http://localhost:9999/",
    version: "1.0.0",
    protocolVersion: "1.0",
    capabilities: { streaming: true },
    iconUrl: "https://example.com/icon.png",
    documentationUrl: "https://example.com/docs",
    skills: [{ id: "chat", description: "chat skill", tags: ["a"], examples: ["ex1"] }],
  },
  litellm_params: { model: "gpt-4o", make_public: false },
  tpm_limit: 100,
  rpm_limit: 200,
  session_tpm_limit: 300,
  session_rpm_limit: 400,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  object_permission: {
    mcp_servers: ["srv-1"],
    mcp_access_groups: ["grp-a"],
    mcp_toolsets: ["ts-1"],
    mcp_tool_permissions: { "srv-1": ["tool_x"] },
  },
} as unknown as Agent;

const CAPABILITY_AGENT = {
  ...FULL_AGENT,
  agent_card_params: {
    ...FULL_AGENT.agent_card_params,
    capabilities: { pushNotifications: true, stateTransitionHistory: true },
  },
} as unknown as Agent;

const MINIMAL_AGENT = {
  agent_id: "agent-2",
  agent_name: "",
  agent_card_params: { name: "", description: "", url: "", version: "", protocolVersion: "", skills: [] },
  litellm_params: {},
  rpm_limit: 20,
  session_tpm_limit: 30,
  session_rpm_limit: 40,
} as unknown as Agent;

const SETTINGS_AGENT = {
  agent_id: "agent-3",
  agent_name: "settings-agent",
  agent_card_params: { name: "Settings Agent", description: "d", url: "http://x/", version: "1.0.0", skills: [] },
  litellm_params: { model: "gpt-4o" },
  tpm_limit: 10,
  rpm_limit: 20,
  session_tpm_limit: 30,
  session_rpm_limit: 40,
} as unknown as Agent;

const KEY = {
  token: "hash-abcdef123456",
  key_alias: "primary",
  key_name: "sk-...abcd",
} as unknown as KeyResponse;

const renderView = (isAdmin = true) =>
  renderWithProviders(<AgentInfoView agentId="agent-1" onClose={vi.fn()} accessToken="sk-test" isAdmin={isAdmin} />);

const hoverLabelHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("tab", { name: "设置" }));
  await user.click(await screen.findByRole("button", { name: "编辑设置" }));
  await screen.findByRole("button", { name: "保存更改" });
};

describe("AgentInfoView Chinese copy", () => {
  beforeEach(async () => {
    keysRef.current = [];
    vi.clearAllMocks();
    vi.mocked(networking.getAgentInfo).mockReset().mockResolvedValue(FULL_AGENT);
    vi.mocked(networking.getAgentCreateMetadata).mockReset().mockResolvedValue([]);
    vi.mocked(networking.patchAgentCall).mockReset().mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese overview label and hides the English originals", async () => {
    renderView();
    await screen.findByRole("heading", { name: "support-agent" });

    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Settings" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "返回 Agents" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Agents" })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["Agent 名称", "Agent Name"],
      ["显示名称", "Display Name"],
      ["描述", "Description"],
      ["版本", "Version"],
      ["协议版本", "Protocol Version"],
      ["流式传输", "Streaming"],
      ["模型", "Model"],
      ["设为公开", "Make Public"],
      ["图标 URL", "Icon URL"],
      ["文档 URL", "Documentation URL"],
      ["TPM 限制", "TPM Limit"],
      ["RPM 限制", "RPM Limit"],
      ["会话 TPM 限制", "Session TPM Limit"],
      ["会话 RPM 限制", "Session RPM Limit"],
      ["创建时间", "Created At"],
      ["更新时间", "Updated At"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    // "Agent ID" and "URL" keep their identifier acronyms, so both locales share the same value.
    expect(screen.getByText("Agent ID")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();

    expect(screen.getByText("是")).toBeInTheDocument();
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();
    expect(screen.getByText("否")).toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();

    expect(screen.getByText("MCP 工具权限")).toBeInTheDocument();
    expect(screen.queryByText("MCP Tool Permissions")).not.toBeInTheDocument();
    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("MCP 访问组")).toBeInTheDocument();
    expect(screen.queryByText("MCP Access Groups")).not.toBeInTheDocument();
    expect(screen.getByText("MCP 工具集")).toBeInTheDocument();
    expect(screen.queryByText("MCP Toolsets")).not.toBeInTheDocument();
    expect(screen.getByText("每服务器的工具权限")).toBeInTheDocument();
    expect(screen.queryByText("Tool permissions per server")).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "技能" })).toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.getByText("已配置 1 个")).toBeInTheDocument();
    expect(screen.queryByText("1 configured")).not.toBeInTheDocument();
    expect(screen.getByText("技能 1")).toBeInTheDocument();
    expect(screen.queryByText("Skill 1")).not.toBeInTheDocument();
    expect(screen.getByText("ID：")).toBeInTheDocument();
    expect(screen.queryByText("ID:")).not.toBeInTheDocument();
    expect(screen.getByText("描述：")).toBeInTheDocument();
    expect(screen.queryByText("Description:")).not.toBeInTheDocument();
    expect(screen.getByText("标签：")).toBeInTheDocument();
    expect(screen.queryByText("Tags:")).not.toBeInTheDocument();
    expect(screen.getByText("示例：")).toBeInTheDocument();
    expect(screen.queryByText("Examples:")).not.toBeInTheDocument();
  });

  it("renders the Chinese push-notification and state-history labels and hides the English originals", async () => {
    vi.mocked(networking.getAgentInfo).mockResolvedValue(CAPABILITY_AGENT);
    renderView();
    await screen.findByRole("heading", { name: "support-agent" });

    expect(screen.getByText("推送通知")).toBeInTheDocument();
    expect(screen.queryByText("Push Notifications")).not.toBeInTheDocument();
    expect(screen.getByText("状态转换历史")).toBeInTheDocument();
    expect(screen.queryByText("State Transition History")).not.toBeInTheDocument();
  });

  it("renders the Chinese unnamed-agent and unlimited fallbacks and hides the English originals", async () => {
    vi.mocked(networking.getAgentInfo).mockResolvedValue(MINIMAL_AGENT);
    renderView();

    expect(await screen.findByRole("heading", { name: "未命名 Agent" })).toBeInTheDocument();
    expect(screen.queryByText("Unnamed Agent")).not.toBeInTheDocument();

    expect(screen.getByText("否")).toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
    expect(screen.getByText("不限")).toBeInTheDocument();
    expect(screen.queryByText("Unlimited")).not.toBeInTheDocument();
  });

  it("renders the Chinese settings panel and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    vi.mocked(networking.getAgentInfo).mockResolvedValue(SETTINGS_AGENT);
    renderView();
    await screen.findByRole("heading", { name: "settings-agent" });

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(screen.getByText("Agent 设置")).toBeInTheDocument();
    expect(screen.queryByText("Agent Settings")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();
    expect(screen.getByText("点击“编辑设置”以修改 Agent 配置。")).toBeInTheDocument();
    expect(screen.queryByText('Click "Edit Settings" to modify agent configuration.')).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑设置" }));

    expect(screen.getByText("速率限制")).toBeInTheDocument();
    expect(screen.queryByText("Rate Limits")).not.toBeInTheDocument();
    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("允许的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Allowed MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 MCP 服务器或访问组（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers or access groups (optional)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("TPM 限制")).toHaveAttribute("placeholder", "不限");
    expect(screen.getByLabelText("TPM 限制")).not.toHaveAttribute("placeholder", "Unlimited");
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();

    await hoverLabelHint(user, "允许的 MCP 服务器");

    expect(
      await screen.findByText(
        "选择此 Agent 可以访问的 MCP 服务器或访问组。绑定到此 Agent 的密钥只能访问此处授予的服务器。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select which MCP servers or access groups this agent can access. Keys bound to this agent can only reach servers granted here.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found state and reports the Chinese load failure", async () => {
    vi.mocked(networking.getAgentInfo).mockRejectedValue(new Error("boom"));
    renderView();

    expect(await screen.findByText("未找到 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Agent not found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回 Agent 列表" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Agents List" })).not.toBeInTheDocument();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("加载 Agent 信息失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to load agent information");
  });

  it("renders the Chinese back button when a key is selected", async () => {
    const user = userEvent.setup();
    keysRef.current = [KEY];
    renderView();
    await screen.findByRole("heading", { name: "support-agent" });

    await user.click(screen.getByRole("button", { name: "hash-abcdef1..." }));

    expect(await screen.findByText("返回 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Back to Agent")).not.toBeInTheDocument();
  });

  it("reports the Chinese update success toast", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    vi.mocked(networking.getAgentInfo).mockResolvedValue(SETTINGS_AGENT);
    renderView();
    await openEditor(user);

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Agent 更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Agent updated successfully");
  });

  it("reports the Chinese update failure toast", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    vi.mocked(networking.getAgentInfo).mockResolvedValue(SETTINGS_AGENT);
    vi.mocked(networking.patchAgentCall).mockRejectedValue(new Error("boom"));
    renderView();
    await openEditor(user);

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("更新 Agent 失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to update agent");
  });
});
