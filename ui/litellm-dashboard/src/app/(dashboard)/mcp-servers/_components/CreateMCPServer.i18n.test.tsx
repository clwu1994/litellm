/* eslint-disable testing-library/no-node-access -- The info triggers are icons with no accessible name, so reaching their tooltips needs the DOM */

import { act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import CreateMCPServer, { payloadErrorMessage } from "./CreateMCPServer";
import { buildCreateServerPayload, type CreateServerUiState } from "./createServerPayload";
import { selectOption } from "./testUtils";

vi.mock("@/components/networking", () => ({
  createMCPServer: vi.fn(),
  fetchOpenAPIRegistry: vi.fn().mockResolvedValue({ apis: [] }),
  registerMCPServer: vi.fn(),
  storeMCPOAuthUserCredential: vi.fn().mockResolvedValue({}),
  testMCPToolsListRequest: vi.fn().mockResolvedValue({ tools: [], error: null }),
}));

vi.mock("@/utils/mcpTokenStore", () => ({
  setToken: vi.fn(),
}));

vi.mock("./OpenAPIQuickPicker", () => ({
  default: () => null,
}));

const oauthHook = vi.hoisted(() => ({
  tokenResponse: null as Record<string, unknown> | null,
  reset: vi.fn(),
  onTokenReceived: null as ((token: Record<string, unknown> | null) => void) | null,
}));

vi.mock("@/hooks/useMcpOAuthFlow", () => ({
  useMcpOAuthFlow: (opts: { onTokenReceived: (token: Record<string, unknown> | null) => void }) => {
    oauthHook.onTokenReceived = opts.onTokenReceived;
    return {
      startOAuthFlow: vi.fn(),
      status: "idle",
      error: null,
      tokenResponse: oauthHook.tokenResponse,
      reset: oauthHook.reset,
    };
  },
}));

vi.mock("./mcp_server_cost_config", () => ({
  default: () => <div data-testid="mcp-cost-config" />,
}));

vi.mock("./MCPPermissionManagement", () => ({
  default: () => <div data-testid="mcp-permissions" />,
}));

vi.mock("./mcp_tool_configuration", () => ({
  default: ({
    onToolNameToDisplayNameChange,
  }: {
    onToolNameToDisplayNameChange?: (v: Record<string, string>) => void;
  }) => (
    <div data-testid="mcp-tool-config">
      <button type="button" onClick={() => onToolNameToDisplayNameChange?.({ read_user: "Read User" })}>
        Set invalid tool override
      </button>
    </div>
  ),
}));

vi.mock("./mcp_connection_status", () => ({
  default: () => <div data-testid="mcp-connection-status" />,
}));

vi.mock("./StdioConfiguration", () => ({
  default: () => <div data-testid="stdio-config" />,
}));

const defaultProps = {
  userRole: "Admin",
  accessToken: "test-token",
  onCreateSuccess: vi.fn(),
  isModalVisible: true,
  setModalVisible: vi.fn(),
  availableAccessGroups: ["group-a"],
};

const renderCreate = (props: Record<string, unknown> = {}) =>
  renderWithProviders(<CreateMCPServer {...defaultProps} {...props} />);

const fillMinimalHttpForm = async (user: ReturnType<typeof userEvent.setup>) => {
  fireEvent.change(document.getElementById("server_name") as HTMLInputElement, {
    target: { value: "My_Server" },
  });
  await selectOption("传输类型", "可流式 HTTP");
  fireEvent.change(screen.getByLabelText("MCP 服务器 URL"), {
    target: { value: "https://example.com/mcp" },
  });
  await selectOption("认证", "无");
};

const expectPair = (zh: string, en: string) => {
  expect(screen.getAllByText(zh)[0]).toBeInTheDocument();
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("CreateMCPServer Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    oauthHook.tokenResponse = null;
    oauthHook.onTokenReceived = null;
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog title, field labels, placeholders and buttons and hides the English originals", () => {
    renderCreate();

    expectPair("添加新 MCP 服务器", "Add New MCP Server");
    expectPair("MCP 服务器名称", "MCP Server Name");
    expectPair("别名", "Alias");
    expectPair("描述", "Description");
    expectPair("GitHub / 源 URL", "GitHub / Source URL");
    expectPair("传输类型", "Transport Type");
    expectPair("最大并发请求数（可选）", "Max Concurrent Requests (optional)");

    expect(screen.getAllByPlaceholderText("例如 GitHub_MCP、Zapier_MCP 等")[0]).toBeInTheDocument();
    expect(screen.queryAllByPlaceholderText("e.g., GitHub_MCP, Zapier_MCP, etc.")).toHaveLength(0);
    expect(screen.getByPlaceholderText("简要描述此服务器的用途")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Brief description of what this server does")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://github.com/org/mcp-server")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 10")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 10")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "添加 MCP 服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add MCP Server" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese non-admin title and submission notice and hides the English originals", () => {
    renderCreate({ userRole: "Internal User" });

    expectPair("提交 MCP 服务器以供审核", "Submit MCP Server for Review");
    expectPair(
      "你的提交将发送给管理员审核。审核通过后，该服务器将出现在你的 MCP 服务器列表中。请求必须使用团队范围的 API Key。",
      "Your submission will be sent for admin review. Once approved, the server will appear in your MCP Servers list. The request must be made with a team-scoped API key.",
    );
  });

  it.each([
    [
      "MCP 服务器名称",
      "最佳实践：使用能表明服务器用途的描述性名称（例如 'GitHub_MCP'、'Email_Service'）。不能包含空格或连字符；请改用下划线。名称必须符合 SEP-986，无效的名称将被拒绝（https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tool-names）。",
      "Best practice: Use a descriptive name that indicates the server's purpose (e.g., 'GitHub_MCP', 'Email_Service'). Cannot contain spaces or hyphens; use underscores instead. Names must comply with SEP-986 and will be rejected if invalid (https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tool-names).",
    ],
    [
      "别名",
      "此服务器的简短唯一标识符。未提供时默认使用服务器名称。不能包含空格或连字符；请改用下划线。",
      "A short, unique identifier for this server. Defaults to the server name if not provided. Cannot contain spaces or hyphens; use underscores instead.",
    ],
    [
      "最大并发请求数（可选）",
      "LiteLLM 将同时针对此服务器运行的工具调用最大数量。额外的调用会等待空闲槽位。留空表示不限制。",
      "Maximum number of tool calls LiteLLM will run against this server at the same time. Additional calls wait for a free slot. Leave blank for no limit.",
    ],
  ])("renders the Chinese tooltip for %s in the same open state", async (label, zh, en) => {
    const user = userEvent.setup();
    renderCreate();

    const trigger = screen.getByText(label).parentElement?.querySelector("svg");
    await user.hover(trigger as Element);

    expect(await screen.findByText(zh)).toBeInTheDocument();
    expect(screen.queryByText(en)).not.toBeInTheDocument();
  });

  it("renders the Chinese transport and auth option labels and hides the English originals", async () => {
    const user = userEvent.setup();
    renderCreate();

    expect(screen.getByText("选择传输方式")).toBeInTheDocument();
    expect(screen.queryByText("Select transport")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("传输类型"));
    for (const [zh, en] of [
      ["可流式 HTTP（推荐）", "Streamable HTTP (Recommended)"],
      ["Server-Sent Events (SSE)", "Server-Sent Events (SSE)"],
      ["标准输入/输出（stdio）", "Standard Input/Output (stdio)"],
      ["OpenAPI Spec", "OpenAPI Spec"],
    ] as const) {
      expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
      if (zh !== en) {
        expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
      }
    }
    await user.click(screen.getByRole("option", { name: "可流式 HTTP（推荐）" }));

    expectPair("认证设置", "Authentication settings");
    expect(screen.getByLabelText("认证")).toBeInTheDocument();
    expect(screen.queryByLabelText("Authentication")).not.toBeInTheDocument();
    expect(screen.getByText("选择认证类型")).toBeInTheDocument();
    expect(screen.queryByText("Select auth type")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("认证"));
    for (const [zh, en] of [
      ["无", "None"],
      ["API Key", "API Key"],
      ["Bearer Token", "Bearer Token"],
      ["Token", "Token"],
      ["Basic Auth", "Basic Auth"],
      ["OAuth", "OAuth"],
      ["OAuth Token Exchange（OBO）", "OAuth Token Exchange (OBO)"],
      ["ID-JAG（Okta Cross App Access）", "ID-JAG (Okta Cross App Access)"],
      ["AWS SigV4（Bedrock AgentCore MCP）", "AWS SigV4 (Bedrock AgentCore MCPs)"],
      ["True Passthrough（无 LiteLLM 认证）", "True Passthrough (no LiteLLM auth)"],
      ["OAuth Delegate（客户端提供的上游 Token）", "OAuth Delegate (client-supplied upstream token)"],
    ] as const) {
      expect(await screen.findByRole("option", { name: zh })).toBeInTheDocument();
      if (zh !== en) {
        expect(screen.queryByRole("option", { name: en })).not.toBeInTheDocument();
      }
    }
  });

  it("renders the Chinese auth value label, placeholder and tooltip once an auth value type is selected", async () => {
    const user = userEvent.setup();
    renderCreate();

    await selectOption("传输类型", "可流式 HTTP");
    await selectOption("认证", "API Key");

    expectPair("认证值", "Authentication Value");
    expect(screen.getByPlaceholderText("输入 Token 或密钥")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter token or secret")).not.toBeInTheDocument();

    const trigger = screen.getByText("认证值").parentElement?.querySelector("svg");
    await user.hover(trigger as Element);
    expect(await screen.findByText("针对所选认证类型，随每个请求发送的 Token、密码或请求头的值。")).toBeInTheDocument();
    expect(
      screen.queryByText("Token, password, or header value to send with each request for the selected auth type."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese validation errors for the transport, URL, auth type and server name", async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));
    expect(await screen.findByText("请选择传输类型")).toBeInTheDocument();
    expect(screen.queryByText("Please select a transport type")).not.toBeInTheDocument();

    await selectOption("传输类型", "可流式 HTTP");
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));
    expect(await screen.findByText("请输入服务器 URL")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a server URL")).not.toBeInTheDocument();
    expect(screen.getByText("请选择认证类型")).toBeInTheDocument();
    expect(screen.queryByText("Please select an auth type")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("MCP 服务器 URL"), { target: { value: "not-a-url" } });
    expect(
      await screen.findByText("请输入有效的 URL（例如 http://service-name.domain:1234/path 或 https://example.com）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Please enter a valid URL (e.g., http://service-name.domain:1234/path or https://example.com)",
      ),
    ).not.toBeInTheDocument();

    fireEvent.change(document.getElementById("server_name") as HTMLInputElement, {
      target: { value: "bad-name" },
    });
    expect(await screen.findByText("不能包含 '-'（连字符）或空格。请改用 '_'（下划线）。")).toBeInTheDocument();
    expect(
      screen.queryByText("Cannot contain '-' (hyphen) or spaces. Please use '_' (underscore) instead."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese whitespace validation error for the auth value", async () => {
    renderCreate();

    await selectOption("传输类型", "可流式 HTTP");
    await selectOption("认证", "API Key");
    fireEvent.change(screen.getByPlaceholderText("输入 Token 或密钥"), { target: { value: "   " } });

    expect(await screen.findByText("认证值不能为空白")).toBeInTheDocument();
    expect(screen.queryByText("Authentication value cannot be empty whitespace")).not.toBeInTheDocument();
  });

  it("renders the Chinese submitting button label while the create request is in flight", async () => {
    const { createMCPServer } = await import("@/components/networking");
    vi.mocked(createMCPServer).mockReturnValue(new Promise(() => {}) as never);
    const user = userEvent.setup();
    renderCreate();

    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(await screen.findByRole("button", { name: "正在创建…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating..." })).not.toBeInTheDocument();
  });

  it("reports the Chinese create success toast", async () => {
    const { createMCPServer } = await import("@/components/networking");
    vi.mocked(createMCPServer).mockResolvedValue({ server_id: "s1" } as never);
    const user = userEvent.setup();
    renderCreate();

    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(toast.success).toHaveBeenCalledWith("MCP 服务器创建成功");
    expect(toast.success).not.toHaveBeenCalledWith("MCP Server created successfully");
  });

  it("reports the Chinese create failure toast", async () => {
    const { createMCPServer } = await import("@/components/networking");
    vi.mocked(createMCPServer).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderCreate();

    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(toast.fromError).toHaveBeenCalledWith("创建 MCP 服务器时出错：boom");
    expect(toast.fromError).not.toHaveBeenCalledWith("Error creating MCP Server: boom");
  });

  it("reports the Chinese submission and review-notice toasts for a non-admin", async () => {
    const { registerMCPServer } = await import("@/components/networking");
    vi.mocked(registerMCPServer).mockResolvedValue({ server_id: "s1" } as never);
    const user = userEvent.setup();
    renderCreate({ userRole: "Internal User" });

    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(toast.success).toHaveBeenCalledWith("MCP 服务器已提交供管理员审核", {
      description: "管理员批准后，该服务器将出现在你的 MCP 服务器列表中。",
    });
    expect(toast.success).not.toHaveBeenCalledWith("MCP Server submitted for admin review", {
      description: "Once an admin approves it, the server will appear in your MCP Servers list.",
    });
  });

  it("reports the Chinese submission failure toast for a non-admin", async () => {
    const { registerMCPServer } = await import("@/components/networking");
    vi.mocked(registerMCPServer).mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    renderCreate({ userRole: "Internal User" });

    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(toast.fromError).toHaveBeenCalledWith("提交 MCP 服务器时出错：nope");
    expect(toast.fromError).not.toHaveBeenCalledWith("Error submitting MCP Server: nope");
  });

  it("reports the Chinese browser-held token toast for a client-forwarded auth mode", async () => {
    const user = userEvent.setup();
    renderCreate();

    await selectOption("传输类型", "可流式 HTTP");
    await selectOption("认证", "True Passthrough（无 LiteLLM 认证）");
    await act(async () => {
      oauthHook.onTokenReceived?.({ access_token: "tok" });
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Token 已保留在此浏览器会话中。现在可以预览和配置工具；该 Token 不会保存到 LiteLLM。",
    );
    expect(toast.success).not.toHaveBeenCalledWith(
      "Token held for this browser session. Tools can now be previewed and configured; the token is not saved to LiteLLM.",
    );
  });

  it("reports the Chinese OAuth-authorized toast for the oauth2 mode", async () => {
    const user = userEvent.setup();
    renderCreate();

    await selectOption("传输类型", "可流式 HTTP");
    await selectOption("认证", "OAuth");
    await act(async () => {
      oauthHook.onTokenReceived?.({ access_token: "tok" });
    });

    expect(toast.success).toHaveBeenCalledWith("OAuth 授权成功！请点击“创建 MCP 服务器”以保存配置。");
    expect(toast.success).not.toHaveBeenCalledWith(
      "OAuth authorization successful! Please click 'Create MCP Server' to save the configuration.",
    );
  });

  it("reports the Chinese invalid-tool-display-name payload error", async () => {
    const user = userEvent.setup();
    renderCreate();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Set invalid tool override" }));
    });
    await fillMinimalHttpForm(user);
    await user.click(screen.getByRole("button", { name: "添加 MCP 服务器" }));

    expect(toast.fromError).toHaveBeenCalledWith(
      "工具显示名称“Read User”无效。只允许字母、数字、下划线和连字符（不能有空格）。",
    );
  });

  it("resolves every create payload error key from the payload builder output", async () => {
    const t = i18n.getFixedT("zh", "mcpServers");
    const ui: CreateServerUiState = {
      transportType: "http",
      costConfig: {},
      allowedTools: [],
      hasToolAllowlistInteraction: false,
      toolNameToDisplayName: {},
      toolNameToDescription: {},
      logoUrl: undefined,
      dcrClient: null,
    };

    const displayName = buildCreateServerPayload({}, { ...ui, toolNameToDisplayName: { read_user: "Read User" } });
    expect(payloadErrorMessage(displayName as Exclude<typeof displayName, { kind: "ok" }>, t)).toBe(
      "工具显示名称“Read User”无效。只允许字母、数字、下划线和连字符（不能有空格）。",
    );

    const stdioJson = buildCreateServerPayload(
      { transport: "stdio", stdio_config: "not json" },
      { ...ui, transportType: "stdio" },
    );
    expect(payloadErrorMessage(stdioJson as Exclude<typeof stdioJson, { kind: "ok" }>, t)).toBe(
      "stdio 配置中的 JSON 无效",
    );

    const tokenValidation = buildCreateServerPayload({ token_validation_json: "not json" }, ui);
    expect(payloadErrorMessage(tokenValidation as Exclude<typeof tokenValidation, { kind: "ok" }>, t)).toBe(
      "Token Validation Rules 中的 JSON 无效",
    );
  });
});
