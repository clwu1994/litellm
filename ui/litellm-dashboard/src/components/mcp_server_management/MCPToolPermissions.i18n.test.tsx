import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import * as networking from "../networking";
import MCPToolPermissions from "./MCPToolPermissions";

vi.mock("../networking");

const server = { server_id: "server-123", server_name: "Test MCP Server", alias: "Test MCP Server" };
const serverTools = [
  { name: "list_issues", description: "List issues" },
  { name: "delete_issue", description: "Delete an issue" },
];

const groupServer = {
  server_id: "srv-group-1",
  server_name: "Group Server",
  alias: "Group Server",
  mcp_access_groups: ["production-group"],
};
const toolsetServer = { server_id: "srv-toolset-1", server_name: "Toolset Server", alias: "Toolset Server" };
const supportToolset = {
  toolset_id: "ts-1",
  toolset_name: "Support Toolset",
  tools: [{ server_id: toolsetServer.server_id, tool_name: "list_issues" }],
};

interface CatalogOptions {
  servers?: Array<Record<string, unknown>>;
  accessGroups?: string[];
  toolsets?: Array<Record<string, unknown>>;
  tools?: Array<{ name: string; description: string }>;
}

const mockCatalog = ({
  servers = [server],
  accessGroups = [],
  toolsets = [],
  tools = serverTools,
}: CatalogOptions = {}) => {
  vi.mocked(networking.fetchMCPServers).mockResolvedValue(servers);
  vi.mocked(networking.fetchMCPAccessGroups).mockResolvedValue(accessGroups);
  vi.mocked(networking.fetchMCPToolsets).mockResolvedValue(toolsets);
  vi.mocked(networking.listMCPTools).mockResolvedValue({ tools, error: false });
};

const renderPermissions = (props: Partial<ComponentProps<typeof MCPToolPermissions>> = {}) =>
  renderWithProviders(
    <MCPToolPermissions
      accessToken="test-token"
      selectedServers={[server.server_id]}
      toolPermissions={{}}
      onChange={vi.fn()}
      {...props}
    />,
  );

describe("MCPToolPermissions English singular and plural toolset copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("says one tool stays allowed when the toolset grants exactly one", async () => {
    mockCatalog({ servers: [toolsetServer], toolsets: [supportToolset] });
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(
      await screen.findByText(
        "list_issues is granted by a selected toolset, so it stays allowed here; edit the toolset to revoke it",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "list_issues, delete_issue are granted by a selected toolset, so they stay allowed here; edit the toolset to revoke them",
      ),
    ).not.toBeInTheDocument();
  });

  it("says the tools stay allowed when the toolset grants more than one", async () => {
    const twoToolToolset = {
      ...supportToolset,
      tools: [
        { server_id: toolsetServer.server_id, tool_name: "list_issues" },
        { server_id: toolsetServer.server_id, tool_name: "delete_issue" },
      ],
    };
    mockCatalog({ servers: [toolsetServer], toolsets: [twoToolToolset] });
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(
      await screen.findByText(
        "list_issues, delete_issue are granted by a selected toolset, so they stay allowed here; edit the toolset to revoke them",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "list_issues is granted by a selected toolset, so it stays allowed here; edit the toolset to revoke it",
      ),
    ).not.toBeInTheDocument();
  });
});

describe("MCPToolPermissions Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    mockCatalog();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese MCP server loading message and hides the English original", async () => {
    vi.mocked(networking.fetchMCPServers).mockReturnValue(new Promise<never>(() => {}));
    renderPermissions();

    expect(await screen.findByText("正在加载 MCP 服务器…")).toBeInTheDocument();
    expect(screen.queryByText("Loading MCP servers...")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool loading message and hides the English original", async () => {
    vi.mocked(networking.listMCPTools).mockReturnValue(new Promise<never>(() => {}));
    renderPermissions();

    expect(await screen.findByText("正在加载工具...")).toBeInTheDocument();
    expect(screen.queryByText("Loading tools...")).not.toBeInTheDocument();
  });

  it("renders the Chinese access-group badge with its group name and hides the English original", async () => {
    mockCatalog({ servers: [groupServer] });
    renderPermissions({ selectedServers: [], selectedAccessGroups: ["production-group"] });

    expect(await screen.findByText("通过访问组：production-group")).toBeInTheDocument();
    expect(screen.queryByText("Via access group: production-group")).not.toBeInTheDocument();
  });

  it("renders the Chinese toolset badge with its toolset name and hides the English original", async () => {
    mockCatalog({ servers: [toolsetServer], toolsets: [supportToolset] });
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(await screen.findByText("通过工具集：Support Toolset")).toBeInTheDocument();
    expect(screen.queryByText("Via toolset: Support Toolset")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool-permission badge and hides the English original", async () => {
    mockCatalog({ servers: [groupServer] });
    renderPermissions({ selectedServers: [], toolPermissions: { [groupServer.server_id]: ["list_issues"] } });

    expect(await screen.findByText("通过工具权限")).toBeInTheDocument();
    expect(screen.queryByText("Via tool permissions")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-group heading and body and hides the English originals", async () => {
    mockCatalog({ servers: [groupServer] });
    renderPermissions({ selectedServers: [], selectedAccessGroups: ["production-group", "ops_readonly"] });

    expect(await screen.findByText("访问组“ops_readonly”没有服务器")).toBeInTheDocument();
    expect(screen.queryByText('Access group "ops_readonly" has 0 servers')).not.toBeInTheDocument();

    const body = screen.getByText(
      (_content, element) =>
        element?.tagName === "P" &&
        element.textContent ===
          "没有 MCP 服务器列出该组，因此它不会授予任何权限。在 config.yaml 中定义的服务器通过其 access_groups 键加入组；其中的 mcp_access_groups 会被忽略",
    );
    expect(body).toBeInTheDocument();
    expect(body).not.toHaveTextContent(
      "No MCP server lists this group, so it grants nothing. A server defined in config.yaml joins a group through its access_groups key; mcp_access_groups is ignored there",
    );
  });

  it("renders the Chinese server load failure heading and body and hides the English originals", async () => {
    vi.mocked(networking.fetchMCPServers).mockRejectedValue(new Error("boom"));
    renderPermissions({ selectedServers: [], selectedAccessGroups: ["production-group"] });

    expect(await screen.findByText("无法加载 MCP 服务器")).toBeInTheDocument();
    expect(
      screen.getByText("此列表不完整；直接授予或通过访问组授予的服务器可能缺失。更改工具权限前请重新加载"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unable to load MCP servers")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "This list is incomplete; servers granted directly or through an access group may be missing. Reload before changing tool permissions",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese toolset load failure heading and body and hides the English originals", async () => {
    vi.mocked(networking.fetchMCPToolsets).mockRejectedValue(new Error("boom"));
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(await screen.findByText("无法加载工具集")).toBeInTheDocument();
    expect(screen.getByText("通过所选工具集访问的服务器未在下方列出")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load toolsets")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Servers reached through the selected toolsets are not listed below"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese shared-name warning with the key and hides the English original", async () => {
    const namedServer = { server_id: "srv-named-1", server_name: "github_mcp", alias: "GitHub" };
    const twin = { server_id: "srv-named-2", server_name: "github_mcp", alias: "Twin" };
    mockCatalog({ servers: [namedServer, twin] });
    renderPermissions({
      selectedServers: [namedServer.server_id],
      toolPermissions: { [namedServer.server_id]: ["list_issues"], github_mcp: ["delete_issue"] },
    });

    const warnings = await screen.findAllByText(
      '也由 "github_mcp" 授予，但该键还指向另一个服务器。在这些服务器不再共享该名称之前，这些工具在此仍保持允许',
    );
    expect(warnings).toHaveLength(2);
    expect(
      screen.queryByText(
        'Also granted by "github_mcp", which names another server too. Those tools stay allowed here until the servers no longer share that name',
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese locked-toolset note for a single tool and hides the English original", async () => {
    mockCatalog({ servers: [toolsetServer], toolsets: [supportToolset] });
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(
      await screen.findByText("list_issues 由所选工具集授予，因此在此保持允许；请编辑该工具集以撤销"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "list_issues is granted by a selected toolset, so it stays allowed here; edit the toolset to revoke it",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese locked-toolset note for several tools and hides the English original", async () => {
    const twoToolToolset = {
      ...supportToolset,
      tools: [
        { server_id: toolsetServer.server_id, tool_name: "list_issues" },
        { server_id: toolsetServer.server_id, tool_name: "delete_issue" },
      ],
    };
    mockCatalog({ servers: [toolsetServer], toolsets: [twoToolToolset] });
    renderPermissions({ selectedServers: [], selectedToolsets: ["ts-1"] });

    expect(
      await screen.findByText("list_issues, delete_issue 由所选工具集授予，因此在此保持允许；请编辑该工具集以撤销"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "list_issues, delete_issue are granted by a selected toolset, so they stay allowed here; edit the toolset to revoke them",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese Select All and Deselect All buttons and hides the English originals", async () => {
    renderPermissions();

    expect(await screen.findByRole("button", { name: "全选" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消全选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select All" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deselect All" })).not.toBeInTheDocument();
  });

  it("renders the Chinese view-mode labels and hides the English originals", async () => {
    renderPermissions();

    expect(await screen.findByRole("radio", { name: "风险分组" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "平铺列表" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Risk Groups" })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Flat List" })).not.toBeInTheDocument();
  });

  it("renders the Chinese tool load failure and hides the English originals", async () => {
    vi.mocked(networking.listMCPTools).mockRejectedValue(new Error("boom"));
    renderPermissions();

    expect(await screen.findByText("获取工具失败")).toBeInTheDocument();
    expect(screen.getByText("无法加载工具")).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to load tools")).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-description fallback and hides the English original", async () => {
    const user = userEvent.setup();
    mockCatalog({ tools: [{ name: "list_issues", description: "" }] });
    renderPermissions();

    await user.click(await screen.findByText("平铺列表"));

    expect(await screen.findByText("- 无描述")).toBeInTheDocument();
    expect(screen.queryByText("- No description")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty tool list and hides the English original", async () => {
    mockCatalog({ tools: [] });
    renderPermissions();

    expect(await screen.findByText("无可用工具")).toBeInTheDocument();
    expect(screen.queryByText("No tools available")).not.toBeInTheDocument();
  });
});
