import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import AgentPermissions from "./permissions/AgentPermissions";
import { inheritedGrantTooltip } from "./permissions/inheritedGrants";
import MCPServerPermissions from "./permissions/MCPServerPermissions";
import VectorStorePermissions from "./permissions/VectorStorePermissions";
import GuardrailSettingsView from "./GuardrailSettingsView";
import ObjectPermissionsView from "./object_permissions_view";

vi.mock("./networking");

import * as networking from "./networking";

describe("Permissions and guardrail views Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.getAgentsList).mockResolvedValue({ agents: [] });
    vi.mocked(networking.vectorStoreListCall).mockResolvedValue({ data: [] });
    vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
    vi.mocked(networking.fetchMCPToolsets).mockResolvedValue([]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the agent permissions copy in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AgentPermissions
        agents={["agent-1"]}
        agentAccessGroups={["platform-tools"]}
        inheritedAgents={[{ id: "agent-2", accessGroupNames: ["support"] }]}
        accessToken="tok"
      />,
    );

    expect(await screen.findByText("Agent")).toBeInTheDocument();
    expect(screen.queryByText("Agents")).not.toBeInTheDocument();
    expect(screen.getAllByText("访问组").length).toBeGreaterThan(0);
    expect(screen.queryByText("Group")).not.toBeInTheDocument();

    await user.hover(screen.getByText("agent-2"));

    expect(await screen.findByText("授予来源：访问组 support。完整 ID：agent-2")).toBeInTheDocument();
    expect(screen.queryByText("Granted via access group support. Full ID: agent-2")).not.toBeInTheDocument();
  });

  it("renders the agent permissions empty state in Chinese", () => {
    renderWithProviders(<AgentPermissions agents={[]} accessToken="tok" />);

    expect(screen.getByText("未配置 Agent 或访问组")).toBeInTheDocument();
    expect(screen.queryByText("No agents or access groups configured")).not.toBeInTheDocument();
  });

  it("renders the vector store permissions copy in Chinese", () => {
    renderWithProviders(<VectorStorePermissions vectorStores={[]} accessToken="tok" />);

    expect(screen.getByText("向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Vector Stores")).not.toBeInTheDocument();
    expect(screen.getByText("未配置向量存储")).toBeInTheDocument();
    expect(screen.queryByText("No vector stores configured")).not.toBeInTheDocument();
  });

  it("renders the blocked MCP server state in Chinese", () => {
    renderWithProviders(<MCPServerPermissions mcpServers={["no-mcp-servers"]} accessToken="tok" />);

    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("已阻止")).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
    expect(screen.getByText("无 MCP 服务器：此密钥被阻止访问所有 MCP 服务器，包括其团队的服务器")).toBeInTheDocument();
    expect(
      screen.queryByText("No MCP servers — this key is blocked from all MCP servers, including its team's servers"),
    ).not.toBeInTheDocument();
  });

  it("renders the all-proxy MCP server state in Chinese", () => {
    renderWithProviders(<MCPServerPermissions mcpServers={["all-proxy-mcpservers"]} accessToken="tok" />);

    expect(screen.getByText("全部")).toBeInTheDocument();
    expect(screen.queryByText("All")).not.toBeInTheDocument();
    expect(screen.getByText("所有代理 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("All Proxy MCP Servers")).not.toBeInTheDocument();
  });

  it("renders the MCP server tool counts and toolset badge in Chinese", () => {
    renderWithProviders(
      <MCPServerPermissions
        mcpServers={["srv-1", "srv-2"]}
        mcpToolPermissions={{ "srv-1": ["a"], "srv-2": ["a", "b"] }}
        mcpToolsets={["ts-1"]}
        accessToken="tok"
      />,
    );

    expect(screen.getAllByText("个工具").length).toBeGreaterThan(0);
    expect(screen.queryByText("tools")).not.toBeInTheDocument();
    expect(screen.queryByText("tool")).not.toBeInTheDocument();
    expect(screen.getByText("工具集")).toBeInTheDocument();
    expect(screen.queryByText("Toolset")).not.toBeInTheDocument();
  });

  it("renders the MCP server empty state in Chinese", () => {
    renderWithProviders(<MCPServerPermissions mcpServers={[]} accessToken="tok" />);

    expect(screen.getByText("未配置 MCP 服务器、访问组或工具集")).toBeInTheDocument();
    expect(screen.queryByText("No MCP servers, access groups, or toolsets configured")).not.toBeInTheDocument();
  });

  it("renders the guardrail settings view in Chinese", () => {
    renderWithProviders(
      <GuardrailSettingsView
        globalGuardrailNames={new Set(["pii"])}
        teamGuardrails={["custom"]}
        killSwitchOn={false}
      />,
    );

    expect(screen.getByText("Guardrail 设置")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails Settings")).not.toBeInTheDocument();
    expect(screen.getByText("应用于此团队的全局和团队专属 guardrail")).toBeInTheDocument();
    expect(screen.queryByText("Global and team-specific guardrails applied to this team")).not.toBeInTheDocument();
    expect(screen.getByLabelText("全局 guardrail")).toBeInTheDocument();
    expect(screen.queryByLabelText("Global guardrail")).not.toBeInTheDocument();
    expect(screen.getByText("全局")).toBeInTheDocument();
    expect(screen.queryByText("Global")).not.toBeInTheDocument();
    expect(screen.getByText("团队专属")).toBeInTheDocument();
    expect(screen.queryByText("Team-specific")).not.toBeInTheDocument();
  });

  it("renders the guardrail empty and bypassed states in Chinese", () => {
    renderWithProviders(<GuardrailSettingsView globalGuardrailNames={new Set()} />);

    expect(screen.getByText("未配置 guardrail")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails configured")).not.toBeInTheDocument();

    cleanup();
    renderWithProviders(<GuardrailSettingsView globalGuardrailNames={new Set()} killSwitchOn />);

    expect(screen.getByText("已为此团队绕过")).toBeInTheDocument();
    expect(screen.queryByText("Bypassed for this team")).not.toBeInTheDocument();
    expect(screen.getAllByText("未配置").length).toBeGreaterThan(0);
    expect(screen.queryByText("None configured")).not.toBeInTheDocument();
  });

  it("renders the object permissions view in Chinese", () => {
    renderWithProviders(<ObjectPermissionsView objectPermission={null} accessToken="tok" />);

    expect(screen.getByText("对象权限")).toBeInTheDocument();
    expect(screen.queryByText("Object Permissions")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储和 MCP 服务器的访问控制")).toBeInTheDocument();
    expect(screen.queryByText("Access control for Vector Stores and MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("搜索工具")).toBeInTheDocument();
    expect(screen.queryByText("Search tools")).not.toBeInTheDocument();
    expect(screen.getByText("无限制，此团队允许使用所有已配置的搜索工具。")).toBeInTheDocument();
    expect(
      screen.queryByText("No restriction — all configured search tools are allowed for this team."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("技能")).toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.getByText("未授予私有技能。仅可见已启用（公开）的 Claude Code 插件。")).toBeInTheDocument();
  });

  it("translates the inherited grant tooltip through the passed t", () => {
    const t = i18n.getFixedT("zh", "teams");
    expect(inheritedGrantTooltip({ id: "mcp-1", accessGroupNames: [] }, t)).toBe(
      "授予来源：一个访问组。完整 ID：mcp-1",
    );
  });
});
