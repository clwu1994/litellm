import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import OAuthFormFields from "./OAuthFormFields";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

const flow = (overrides: Record<string, unknown> = {}) => ({
  startOAuthFlow: vi.fn(),
  status: "idle",
  error: null,
  tokenResponse: null,
  ...overrides,
});

const clearField = async (placeholder: string) => {
  const field = screen.getByPlaceholderText(placeholder);
  fireEvent.change(field, { target: { value: "value" } });
  fireEvent.change(field, { target: { value: "" } });
  return field;
};

describe("OAuthFormFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese M2M field label and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M />);

    expectPair("OAuth 流程类型", "OAuth Flow Type");
    expectPair("客户端 ID", "Client ID");
    expectPair("客户端密钥", "Client Secret");
    expect(screen.getByText("Token URL")).toBeInTheDocument();
    expectPair("作用域（可选）", "Scopes (optional)");
    expectPair("Resource Indicator（可选）", "Resource Indicator (optional)");
  });

  it("renders the Chinese OAuth flow type tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "OAuth 流程类型",
      "选择代理与此 MCP 服务器的认证方式。M2M 使用客户端凭证进行服务器到服务器通信。Interactive（PKCE）用于需要浏览器授权的面向用户流程。",
      "Choose how the proxy authenticates with this MCP server. M2M is for server-to-server communication using client credentials. Interactive (PKCE) is for user-facing flows that require browser-based authorization.",
    );
  });

  it("renders the Chinese M2M client ID tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "客户端 ID",
      "用于 client_credentials 授权的 OAuth2 客户端 ID。",
      "OAuth2 client ID for the client_credentials grant.",
    );
  });

  it("renders the Chinese M2M client secret tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "客户端密钥",
      "用于 client_credentials 授权的 OAuth2 客户端密钥。",
      "OAuth2 client secret for the client_credentials grant.",
    );
  });

  it("renders the Chinese M2M token URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "Token URL",
      "用于 client_credentials 授权的 Token Endpoint URL。",
      "Token endpoint URL for the client_credentials grant.",
    );
  });

  it("renders the Chinese M2M scopes tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "作用域（可选）",
      "使用 client_credentials 授权时请求的可选作用域。",
      "Optional scopes to request with the client_credentials grant.",
    );
  });

  it("renders the Chinese resource indicator tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    await expectTooltipPair(
      user,
      "Resource Indicator（可选）",
      "发送给授权服务器的 RFC 8707 resource indicator，使其签发面向此 MCP 服务器的 Token。留空则不发送，这是默认行为，也是大多数提供商期望的方式。使用 'auto' 发送此服务器自身的 URL。当授权服务器要求特定标识符时，请设置精确值。部分提供商会拒绝此参数，改为从作用域中获取受众；如果遇到 AADSTS901002，请留空。如果遇到 invalid_target，则授权服务器需要设置此参数。",
      "RFC 8707 resource indicator sent to the authorization server so it mints a token audienced for this MCP server. Leave blank to send nothing, which is the default and what most providers expect. Use 'auto' to send this server's own URL. Set an exact identifier when the authorization server expects a specific one. Some providers reject this parameter and take the audience from scopes instead; if you see AADSTS901002, leave it blank. If you see invalid_target, the authorization server needs it set.",
    );
  });

  it("renders the Chinese flow placeholder and options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M />);

    expectPair("选择 OAuth 流程", "Select OAuth flow");

    await user.click(screen.getByLabelText("OAuth 流程类型"));

    expectPair("Machine-to-Machine（M2M）", "Machine-to-Machine (M2M)");
    expectPair("Interactive（PKCE）", "Interactive (PKCE)");
    expectPair("服务器到服务器，无用户交互", "server-to-server, no user interaction");
    expectPair("基于浏览器的用户授权", "browser-based user authorization");
  });

  it("renders the Chinese M2M create placeholders and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加作用域")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auto，或 https://mcp.example.com/mcp")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client ID")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client secret")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add scopes")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("auto, or https://mcp.example.com/mcp")).not.toBeInTheDocument();
  });

  it("renders the Chinese M2M edit placeholders and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M isEditing />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥（留空以保留现有值）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client ID (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client secret (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese M2M client ID required error once emptied and hides the English original", async () => {
    renderInMcpForm(<OAuthFormFields isM2M />);

    await clearField("输入 OAuth 客户端 ID");

    expect(await screen.findByText("M2M OAuth 需要 Client ID")).toBeInTheDocument();
    expect(screen.queryByText("Client ID is required for M2M OAuth")).not.toBeInTheDocument();
  });

  it("renders the Chinese M2M client secret required error once emptied and hides the English original", async () => {
    renderInMcpForm(<OAuthFormFields isM2M />);

    await clearField("输入 OAuth 客户端密钥");

    expect(await screen.findByText("M2M OAuth 需要 Client Secret")).toBeInTheDocument();
    expect(screen.queryByText("Client Secret is required for M2M OAuth")).not.toBeInTheDocument();
  });

  it("renders the Chinese M2M token URL required error once emptied and hides the English original", async () => {
    renderInMcpForm(<OAuthFormFields isM2M />);
    const tokenUrl = screen.getByPlaceholderText("https://auth.example.com/oauth/token");

    fireEvent.change(tokenUrl, { target: { value: "https://auth.example.com/oauth/token" } });
    fireEvent.change(tokenUrl, { target: { value: "" } });

    expect(await screen.findByText("M2M OAuth 需要 Token URL")).toBeInTheDocument();
    expect(screen.queryByText("Token URL is required for M2M OAuth")).not.toBeInTheDocument();
  });

  it("renders every Chinese interactive field label and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    expectPair("客户端 ID（可选）", "Client ID (optional)");
    expectPair("客户端密钥（可选）", "Client Secret (optional)");
    expectPair("作用域（可选）", "Scopes (optional)");
    expectPair("签发方（可选）", "Issuer (optional)");
    expectPair("Authorization URL（可选）", "Authorization URL (optional)");
    expectPair("Token URL（可选）", "Token URL (optional)");
    expectPair("Registration URL（可选）", "Registration URL (optional)");
    expectPair("Token Validation Rules（可选）", "Token Validation Rules (optional)");
    expectPair("Token 存储 TTL（秒，可选）", "Token Storage TTL (seconds, optional)");
  });

  it("renders the Chinese interactive client ID tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "客户端 ID（可选）",
      "仅当你的 MCP 服务器无法处理动态客户端注册时才提供。",
      "Provide only if your MCP server cannot handle dynamic client registration.",
    );
  });

  it("renders the Chinese interactive scopes tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "作用域（可选）",
      "Token 交换期间请求的可选作用域。使用回车或逗号分隔多个作用域。",
      "Optional scopes requested during token exchange. Separate multiple scopes with enter or commas.",
    );
  });

  it("renders the Chinese issuer tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "签发方（可选）",
      "OAuth 2.0 授权服务器签发方（RFC 8414）。留空则从上游资源发现 Endpoint；设置后会固定信任锚点，使该签发方的文档成为唯一的 Endpoint 来源（RFC 8414 §3.3），覆盖上面的 Authorization/Token/Registration URL，并在无法获取其元数据时按失败关闭处理。",
      "OAuth 2.0 authorization server issuer (RFC 8414). Leave empty to discover endpoints from the upstream resource; set it to pin the trust anchor, which makes this issuer's document the only endpoint source (RFC 8414 §3.3), overriding the Authorization/Token/Registration URLs above and failing closed if its metadata cannot be fetched.",
    );
  });

  it("renders the Chinese authorization URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "Authorization URL（可选）",
      "可选的授权 Endpoint 覆盖值。",
      "Optional override for the authorization endpoint.",
    );
  });

  it("renders the Chinese interactive token URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "Token URL（可选）",
      "可选的 Token Endpoint 覆盖值。",
      "Optional override for the token endpoint.",
    );
  });

  it("renders the Chinese registration URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "Registration URL（可选）",
      "可选的动态客户端注册 Endpoint 覆盖值。",
      "Optional override for the dynamic client registration endpoint.",
    );
  });

  it("renders the Chinese token validation tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "Token Validation Rules（可选）",
      '在存储前针对 OAuth Token 响应校验的键值规则 JSON 对象。支持嵌套字段的点号表示法（例如 {"organization": "my-org", "team.id": "123"}）。未通过校验的 Token 会被拒绝并返回 HTTP 403。',
      'JSON object of key-value rules checked against the OAuth token response before storing. Supports dot-notation for nested fields (e.g. {"organization": "my-org", "team.id": "123"}). Tokens that fail validation are rejected with HTTP 403.',
    );
  });

  it("renders the Chinese token storage TTL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    await expectTooltipPair(
      user,
      "Token 存储 TTL（秒，可选）",
      "在 Redis 中缓存每个用户 OAuth 访问 Token 的时长（不会超过 Token 自身的 expires_in）。留空则根据 Token 的 expires_in 推导 TTL，或回退到 12 小时的默认值。",
      "How long to cache each user's OAuth access token in Redis before evicting it (never longer than the token's own expires_in). Leave blank to derive the TTL from the token's expires_in, or fall back to the 12-hour default.",
    );
  });

  it("renders the Chinese create-OAuth-app link and hides the English original", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} docsUrl="https://github.com/settings/apps/new" />);

    expectPair("创建 OAuth 应用 →", "Create OAuth App →");
  });

  it("renders the Chinese interactive create placeholders and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} />);

    expect(screen.getByPlaceholderText("输入客户端 ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入客户端密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加作用域")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 3600")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auto，或 https://mcp.example.com/mcp")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter client ID")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter client secret")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add scopes")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 3600")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("auto, or https://mcp.example.com/mcp")).not.toBeInTheDocument();
  });

  it("renders the Chinese interactive edit placeholders and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} isEditing />);

    expect(screen.getByPlaceholderText("输入客户端 ID（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入客户端密钥（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter client ID (leave blank to keep existing)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter client secret (leave blank to keep existing)")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-JSON error once invalid JSON is entered and hides the English original", async () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} />);
    const textarea = screen.getByPlaceholderText(/organization/);

    fireEvent.change(textarea, { target: { value: "not json" } });

    expect(await screen.findByText("必须是有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Must be valid JSON")).not.toBeInTheDocument();
  });

  it("renders the Chinese authorize intro and idle button and hides the English originals", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} oauthFlow={flow()} />);

    expectPair(
      "使用 OAuth 获取新的访问 Token，并临时将其保存为会话中的认证值。",
      "Use OAuth to fetch a fresh access token and temporarily save it in the session as the authentication value.",
    );
    expectPair("授权并获取 Token", "Authorize & Fetch Token");
  });

  it("renders the Chinese authorizing button label and hides the English original", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} oauthFlow={flow({ status: "authorizing" })} />);

    expectPair("正在等待授权...", "Waiting for authorization...");
  });

  it("renders the Chinese exchanging button label and hides the English original", () => {
    renderInMcpForm(<OAuthFormFields isM2M={false} oauthFlow={flow({ status: "exchanging" })} />);

    expectPair("正在交换授权码...", "Exchanging authorization code...");
  });

  it("renders the Chinese fetched-token message with its interpolation and hides the English original", () => {
    renderInMcpForm(
      <OAuthFormFields
        isM2M={false}
        oauthFlow={flow({ status: "success", tokenResponse: { access_token: "tok", expires_in: 42 } })}
      />,
    );

    expectPair("Token 已获取。将在 42 秒后过期。", "Token fetched. Expires in 42 seconds.");
  });
});
