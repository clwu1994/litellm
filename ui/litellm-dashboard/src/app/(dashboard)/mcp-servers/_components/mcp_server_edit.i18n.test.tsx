/* eslint-disable testing-library/no-node-access -- The info triggers are icons with no accessible name, so reaching their tooltips needs the DOM */

import { act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import type { MCPServer } from "@/components/mcp_tools/types";

import MCPServerEdit from "./mcp_server_edit";
import {
  buildEditServerPayload,
  editPayloadErrorMessage,
  type EditServerFormValues,
  type EditServerUiState,
} from "./editServerPayload";

vi.mock("@/components/networking", () => ({
  updateMCPServer: vi.fn(),
  listMCPTools: vi.fn().mockResolvedValue({ tools: [], error: null }),
  storeMCPOAuthUserCredential: vi.fn().mockResolvedValue({}),
  testMCPToolsListRequest: vi.fn().mockResolvedValue({ tools: [], error: null }),
}));

const mockOauth = vi.hoisted(() => ({
  tokenResponse: null as Record<string, unknown> | null,
  onTokenReceived: null as ((token: Record<string, unknown> | null) => void) | null,
  reset: vi.fn(),
}));

vi.mock("@/hooks/useMcpOAuthFlow", () => ({
  useMcpOAuthFlow: (opts: { onTokenReceived?: (token: Record<string, unknown> | null) => void }) => {
    mockOauth.onTokenReceived = opts?.onTokenReceived ?? null;
    return {
      startOAuthFlow: vi.fn(),
      status: "idle",
      error: null,
      tokenResponse: mockOauth.tokenResponse,
      reset: mockOauth.reset,
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
  default: ({ externalError }: { externalError?: string | null }) => (
    <div data-testid="mcp-tool-config">{externalError ? <span>{externalError}</span> : null}</div>
  ),
}));

const mockGetToken = vi.fn();
const mockIsTokenValid = vi.fn();
vi.mock("@/utils/mcpTokenStore", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
  isTokenValid: (...args: unknown[]) => mockIsTokenValid(...args),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}));

const baseServer = {
  server_id: "srv-1",
  server_name: "MyServer",
  alias: "my_server",
  description: "desc",
  transport: "http",
  url: "https://example.com/mcp",
  auth_type: "api_key",
  credentials: { auth_value: "existing" },
  mcp_access_groups: [],
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-01T00:00:00Z",
  updated_by: "user-1",
} as unknown as MCPServer;

const renderEdit = (overrides: Partial<MCPServer> = {}) =>
  renderWithProviders(
    <MCPServerEdit
      mcpServer={{ ...baseServer, ...overrides } as MCPServer}
      accessToken="access-token"
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      availableAccessGroups={[]}
    />,
  );

const oauthNoFlowServer: Partial<MCPServer> = {
  auth_type: "oauth2",
  oauth2_flow: null,
  token_url: null,
  authorization_url: null,
};

const oauthDelegateServer: Partial<MCPServer> = {
  auth_type: "oauth2",
  oauth2_flow: "authorization_code",
  token_url: "https://idp/token",
  delegate_auth_to_upstream: true,
};

const expectPair = (zh: string, en: string) => {
  expect(screen.getAllByText(zh)[0]).toBeInTheDocument();
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const expectPresent = (value: string) => {
  expect(screen.getAllByText(value)[0]).toBeInTheDocument();
};

const hoverTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
};

describe("MCPServerEdit Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockOauth.tokenResponse = null;
    mockOauth.onTokenReceived = null;
    mockIsTokenValid.mockReturnValue(false);
    mockGetToken.mockReturnValue(null);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tabs, field labels, placeholders and buttons and hides the English originals", () => {
    renderEdit();

    expect(screen.getByRole("tab", { name: "服务器配置" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "成本配置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Server Configuration" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cost Configuration" })).not.toBeInTheDocument();

    expectPair("MCP 服务器名称", "MCP Server Name");
    expectPair("别名", "Alias");
    expectPair("描述", "Description");
    expectPair("传输类型", "Transport Type");
    expectPair("MCP 服务器 URL", "MCP Server URL");
    expectPair("最大并发请求数（可选）", "Max Concurrent Requests (optional)");
    expectPair("认证值", "Authentication Value");

    expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 Token 或密钥（留空以保留现有值）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter token or secret (leave blank to keep existing)"),
    ).not.toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "保存更改" })[0]).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Save Changes" })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "取消" })[0]).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Cancel" })).toHaveLength(0);
  });

  it("renders the Chinese validation errors for the auth type, URL and server name", async () => {
    const user = userEvent.setup();
    renderEdit({ auth_type: undefined, url: "" });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(await screen.findByText("请输入服务器 URL")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a server URL")).not.toBeInTheDocument();
    expect(screen.getByText("认证为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Authentication is required")).not.toBeInTheDocument();

    fireEvent.change(document.getElementById("server_name") as HTMLInputElement, { target: { value: "bad-name" } });
    expect(await screen.findByText("不能包含 '-'（连字符）或空格。请改用 '_'（下划线）。")).toBeInTheDocument();
  });

  it("renders the Chinese transport-required error and hides the English original", async () => {
    const user = userEvent.setup();
    renderEdit({ transport: undefined });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(await screen.findByText("传输类型为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Transport Type is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese OpenAPI spec URL required error and hides the English original", async () => {
    const user = userEvent.setup();
    renderEdit({ transport: "openapi", spec_path: undefined });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(await screen.findByText("请输入 OpenAPI Spec URL")).toBeInTheDocument();
    expect(screen.queryByText("Please enter an OpenAPI spec URL")).not.toBeInTheDocument();
  });

  it("renders the Chinese OpenAPI spec URL field and tooltip and hides the English originals", async () => {
    const user = userEvent.setup();
    renderEdit({ spec_path: "https://example.com/openapi.json" });

    expectPresent("OpenAPI Spec URL");
    expect(screen.getByPlaceholderText("https://petstore3.swagger.io/api/v3/openapi.json")).toBeInTheDocument();

    await hoverTooltip(user, "OpenAPI Spec URL");
    expect(
      await screen.findByText("OpenAPI 规范（JSON 或 YAML）的 URL。MCP 工具将根据规范中定义的 API Endpoint 自动生成。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "URL to an OpenAPI specification (JSON or YAML). MCP tools will be automatically generated from the API endpoints defined in the spec.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese stdio fields and the Chinese tags empty text and hides the English originals", async () => {
    const user = userEvent.setup();
    renderEdit({ transport: "stdio", url: undefined });

    expectPair(
      "配置用于启动 MCP 服务器进程的 stdio 传输方式。你可以填写下面的字段，或粘贴 JSON 配置。",
      "Configure the stdio transport used to launch the MCP server process. You can either fill in the fields below or paste a JSON configuration.",
    );
    expectPair("命令", "Command");
    expectPair("参数", "Args");
    expectPair("环境变量（JSON 对象）", "Environment (JSON object)");
    expect(screen.getByPlaceholderText("例如 npx")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., npx")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("添加参数（按 Enter 或逗号）"));
    expect(await screen.findByText("输入以添加")).toBeInTheDocument();
    expect(screen.queryByText("Type to add")).not.toBeInTheDocument();
  });

  it("renders the Chinese stdio validation errors and hides the English originals", async () => {
    const user = userEvent.setup();
    renderEdit({ transport: "stdio", url: undefined });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);
    expect(await screen.findByText("请输入 stdio 传输的命令")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a command for stdio transport")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("环境变量（JSON 对象）"), { target: { value: "not json" } });
    expect(await screen.findByText("请输入有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Please enter valid JSON")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("环境变量（JSON 对象）"), { target: { value: "[]" } });
    expect(await screen.findByText("环境变量必须是 JSON 对象")).toBeInTheDocument();
    expect(screen.queryByText("Env must be a JSON object")).not.toBeInTheDocument();
  });

  it("renders the Chinese OAuth-flow-missing warning and hides the English original", () => {
    renderEdit(oauthNoFlowServer);

    expectPair("此服务器未设置 OAuth 流程", "This server has no OAuth flow set");
    expectPair(
      "选择 Machine-to-Machine（M2M）或 Interactive（PKCE），让 LiteLLM 按你的预期进行认证，然后保存。在设置之前，LiteLLM 会回退到交互式按用户认证，并以保守方式处理 machine-to-machine 凭证形态。",
      "Choose Machine-to-Machine (M2M) or Interactive (PKCE) so LiteLLM authenticates it the way you intend, then save. Until it is set, LiteLLM falls back to interactive per-user auth and treats a machine-to-machine credential shape conservatively.",
    );
  });

  it("renders the Chinese AWS SigV4 fields, placeholders and tooltips and hides the English originals", async () => {
    const user = userEvent.setup();
    renderEdit({ auth_type: "aws_sigv4" });

    expectPair(
      "适用于托管在 AWS Bedrock AgentCore 上的 MCP 服务器。",
      "For MCP servers hosted on AWS Bedrock AgentCore.",
    );
    expect(screen.getByRole("link", { name: "查看文档 →" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View docs →" })).not.toBeInTheDocument();

    expectPair("AWS 区域", "AWS Region");
    expectPair("AWS 服务名称", "AWS Service Name");
    expectPresent("AWS Access Key ID");
    expectPresent("AWS Secret Access Key");
    expectPresent("AWS Session Token");
    expectPresent("AWS Role ARN");
    expectPresent("AWS Session Name");

    expect(screen.getByPlaceholderText("us-east-1（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("us-east-1 (leave blank to keep existing)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("bedrock-agentcore（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("bedrock-agentcore (leave blank to keep existing)")).not.toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("留空以保留现有值")[0]).toBeInTheDocument();
    expect(screen.queryAllByPlaceholderText("Leave blank to keep existing")).toHaveLength(0);

    await hoverTooltip(user, "AWS 区域");
    expect(await screen.findByText("用于 SigV4 签名的 AWS 区域（例如 us-east-1）")).toBeInTheDocument();
    expect(screen.queryByText("AWS region for SigV4 signing (e.g., us-east-1)")).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS 服务名称");
    expect(await screen.findByText("用于 SigV4 签名的 AWS 服务名称。默认为 'bedrock-agentcore'。")).toBeInTheDocument();
    expect(
      screen.queryByText("AWS service name for SigV4 signing. Defaults to 'bedrock-agentcore'."),
    ).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS Access Key ID");
    expect(
      await screen.findByText("可选。如果未提供，则回退到 boto3 凭证链（IAM 角色、环境变量等）。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Optional. If not provided, falls back to the boto3 credential chain (IAM role, env vars, etc.).",
      ),
    ).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS Secret Access Key");
    expect(await screen.findByText("可选。如果提供了 AWS Access Key ID，则为必填。")).toBeInTheDocument();
    expect(screen.queryByText("Optional. Required if AWS Access Key ID is provided.")).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS Session Token");
    expect(await screen.findByText("可选。仅在需要临时 STS 凭证时需要。")).toBeInTheDocument();
    expect(screen.queryByText("Optional. Only needed for temporary STS credentials.")).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS Role ARN");
    expect(
      await screen.findByText(
        "可选。签名前通过 STS 代入的 IAM 角色 ARN。如果设置，LiteLLM 会调用 sts:AssumeRole 获取临时凭证。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Optional. IAM role ARN to assume via STS before signing. If set, LiteLLM calls sts:AssumeRole to get temporary credentials.",
      ),
    ).not.toBeInTheDocument();

    await hoverTooltip(user, "AWS Session Name");
    expect(
      await screen.findByText("可选。AssumeRole 调用的会话名称，会显示在 CloudTrail 日志中。省略时自动生成。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Optional. Session name for the AssumeRole call — appears in CloudTrail logs. Auto-generated if omitted.",
      ),
    ).not.toBeInTheDocument();
  });

  it("reports the Chinese update success toast", async () => {
    const { updateMCPServer } = await import("@/components/networking");
    vi.mocked(updateMCPServer).mockResolvedValue({ server_id: "srv-1" } as never);
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(toast.success).toHaveBeenCalledWith("MCP 服务器更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("MCP Server updated successfully");
  });

  it("reports the Chinese update failure toast with the reason", async () => {
    const { updateMCPServer } = await import("@/components/networking");
    vi.mocked(updateMCPServer).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(toast.fromError).toHaveBeenCalledWith("更新 MCP 服务器失败：boom");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update MCP Server: boom");
  });

  it("reports the Chinese browser-held token and OAuth-authorized toasts", async () => {
    renderEdit({ auth_type: "true_passthrough" });
    await act(async () => {
      mockOauth.onTokenReceived?.({ access_token: "tok" });
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Token 已保留在此浏览器会话中。现在可以加载和配置工具；该 Token 不会保存到 LiteLLM。",
    );

    cleanup();
    renderEdit({ auth_type: "oauth2", oauth2_flow: "authorization_code", token_url: "https://idp/token" });
    await act(async () => {
      mockOauth.onTokenReceived?.({ access_token: "tok" });
    });
    expect(toast.success).toHaveBeenCalledWith("OAuth 授权成功！请点击“更新 MCP 服务器”以保存凭证。");
  });

  it("reports the Chinese OAuth token persistence failure toasts", async () => {
    const { updateMCPServer, storeMCPOAuthUserCredential } = await import("@/components/networking");
    vi.mocked(updateMCPServer).mockResolvedValue({ server_id: "srv-1" } as never);
    vi.mocked(storeMCPOAuthUserCredential).mockRejectedValue(new Error("bad"));
    mockOauth.tokenResponse = { access_token: "tok" };
    const user = userEvent.setup();
    renderEdit({ auth_type: "oauth2", oauth2_flow: "authorization_code", token_url: "https://idp/token" });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(toast.fromError).toHaveBeenCalledWith("MCP 服务器已更新，但保存 OAuth Token 失败：bad");

    cleanup();
    vi.mocked(storeMCPOAuthUserCredential).mockRejectedValue(new Error(""));
    renderEdit({ auth_type: "oauth2", oauth2_flow: "authorization_code", token_url: "https://idp/token" });

    await user.click(screen.getAllByRole("button", { name: "保存更改" })[0]);

    expect(toast.fromError).toHaveBeenCalledWith("MCP 服务器已更新，但保存 OAuth Token 失败");
  });

  it("renders the Chinese tool-loading failure message and hides the English original", async () => {
    const { listMCPTools } = await import("@/components/networking");
    vi.mocked(listMCPTools).mockResolvedValue({ tools: [], error: true, message: "" } as never);
    renderEdit();

    expect(await screen.findByText("加载工具失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load tools")).not.toBeInTheDocument();
  });

  it("renders the Chinese incomplete-preview fallback message and hides the English original", async () => {
    renderEdit();

    fireEvent.change(screen.getByLabelText("MCP 服务器 URL"), { target: { value: "not-a-url" } });

    expect(await screen.findByText("请填写 URL、认证和请求头设置以加载工具。")).toBeInTheDocument();
    expect(
      screen.queryByText("Complete the URL, authentication, and header settings to load tools."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese browser-only and tools-tab authorization prompts and hides the English originals", async () => {
    renderEdit({ auth_type: "true_passthrough" });
    expect(
      await screen.findByText("请在认证部分使用上游进行浏览器端授权，以加载和配置此服务器的工具。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Authorize with the upstream (browser-only, in the Authentication section) to load and configure this server's tools.",
      ),
    ).not.toBeInTheDocument();

    cleanup();
    renderEdit(oauthDelegateServer);
    expect(await screen.findByText("请在工具标签页中对此服务器进行认证，以加载和配置其工具。")).toBeInTheDocument();
    expect(
      screen.queryByText("Authenticate with this server in the Tools tab to load and configure its tools."),
    ).not.toBeInTheDocument();
  });

  it("resolves every edit payload error key from the payload builder output", () => {
    const t = i18n.getFixedT("zh", "mcpServers");
    const ui: EditServerUiState = {
      mcpServer: baseServer,
      logoUrl: undefined,
      costConfig: {},
      allowedTools: [],
      hasExistingToolAllowlist: false,
      hasToolAllowlistInteraction: false,
      toolNameToDisplayName: {},
      toolNameToDescription: {},
      removeStoredApp: false,
    };
    const messageFor = (values: EditServerFormValues) => {
      const built = buildEditServerPayload(values, ui);
      if (built.kind === "ok") {
        throw new Error("expected a payload error");
      }
      return editPayloadErrorMessage(built, t);
    };

    expect(messageFor({ transport: "stdio", stdio_config: "{}", command: "npx" })).toBe("Stdio 配置必须包含命令");
    expect(messageFor({ transport: "stdio", stdio_config: "not json" })).toBe("stdio 配置中的 JSON 无效");
    expect(messageFor({ transport: "stdio", env_json: "not json", command: "npx" })).toBe(
      "stdio 环境变量配置中的 JSON 无效",
    );
    expect(messageFor({ transport: "stdio" })).toBe("Stdio 传输需要命令");
    expect(messageFor({ token_validation_json: "not json" })).toBe("Token Validation Rules 中的 JSON 无效");
    expect(
      editPayloadErrorMessage(
        buildEditServerPayload({}, { ...ui, toolNameToDisplayName: { read_user: "Read User" } }) as Exclude<
          ReturnType<typeof buildEditServerPayload>,
          { kind: "ok" }
        >,
        t,
      ),
    ).toBe("工具显示名称“Read User”无效。只允许字母、数字、下划线和连字符（不能有空格）。");
  });
});
