import { act, renderHook, waitFor } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import * as networking from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { getSecureItem, setSecureItem } from "@/utils/secureStorage";

import { useMcpOAuthFlow } from "./useMcpOAuthFlow";
import { useToolsOAuthFlow } from "./useToolsOAuthFlow";
import { useUserMcpOAuthFlow } from "./useUserMcpOAuthFlow";

vi.mock("@/components/networking", () => ({
  exchangeMcpOAuthToken: vi.fn(),
  cacheTemporaryMcpServer: vi.fn(),
  registerMcpOAuthClient: vi.fn(),
  buildMcpOAuthAuthorizeUrl: vi.fn(() => "https://idp.example.com/authorize"),
  getProxyBaseUrl: vi.fn(() => ""),
  serverRootPath: "",
  storeMCPOAuthUserCredential: vi.fn(),
}));

vi.mock("@/utils/secureStorage", () => ({
  getSecureItem: vi.fn(),
  setSecureItem: vi.fn(),
}));

vi.mock("@/utils/mcpTokenStore", () => ({ setToken: vi.fn() }));

vi.mock("@/utils/pkce", () => ({
  generateCodeVerifier: () => "verifier-1",
  generateCodeChallenge: async () => "challenge-1",
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    fromError: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const MCP_FLOW_STATE_KEY = "litellm-mcp-oauth-flow-state";
const MCP_RESULT_KEY = "litellm-mcp-oauth-result";
const TOOLS_FLOW_STATE_KEY = "litellm-tools-mcp-oauth-flow-state";
const TOOLS_RESULT_KEY = "litellm-tools-mcp-oauth-result";
const USER_FLOW_STATE_KEY = "litellm-user-mcp-oauth-flow-state";
const USER_RESULT_KEY = "litellm-user-mcp-oauth-result";

let storedItems: Record<string, string> = {};

const seedStoredItems = (items: Record<string, string>) => {
  storedItems = items;
};

const mcpFlowState = {
  state: "state-1",
  codeVerifier: "verifier-1",
  serverId: "server-1",
  flowSource: "create",
};

const toolsFlowState = {
  state: "state-1",
  codeVerifier: "verifier-1",
  serverId: "server-1",
  redirectUri: "https://app.example.com/ui/mcp/oauth/callback",
};

const renderMcpFlow = (accessToken: string | null, temporaryPayload: Record<string, unknown> | null) =>
  renderHook(
    (props: { accessToken: string | null; temporaryPayload: Record<string, unknown> | null }) => {
      const { t } = useTranslation("auth");
      const options = {
        accessToken: props.accessToken,
        t,
        getCredentials: () => ({ client_id: "preconfigured-client" }),
        getTemporaryPayload: () => props.temporaryPayload,
        onTokenReceived: vi.fn(),
        flowSource: "create",
      };
      return useMcpOAuthFlow(options);
    },
    { initialProps: { accessToken, temporaryPayload } },
  );

const renderToolsFlow = () =>
  renderHook(() => {
    const { t } = useTranslation("auth");
    const options = {
      accessToken: "user-token",
      t,
      serverId: "server-1",
      serverAlias: "server one",
      userId: "user-1",
      onSuccess: vi.fn(),
    };
    return useToolsOAuthFlow(options);
  });

const renderUserFlow = () =>
  renderHook(() => {
    const { t } = useTranslation("auth");
    const options = {
      accessToken: "user-token",
      t,
      serverId: "server-1",
      serverAlias: "server one",
      onSuccess: vi.fn(),
    };
    return useUserMcpOAuthFlow(options);
  });

const expectErrorPair = (message: string | null, zh: string, en: string) => {
  expect(message).toBe(zh);
  expect(message).not.toBe(en);
};

describe("OAuth flow Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    storedItems = {};
    vi.mocked(getSecureItem).mockImplementation((key: string) => storedItems[key] ?? null);
    vi.mocked(setSecureItem).mockImplementation((key: string, value: string) => {
      storedItems[key] = value;
    });
    vi.mocked(networking.exchangeMcpOAuthToken).mockResolvedValue({ access_token: "tok-1" });
    vi.mocked(networking.cacheTemporaryMcpServer).mockResolvedValue({ server_id: "server-1" });
    vi.mocked(networking.registerMcpOAuthClient).mockResolvedValue({ client_id: "dcr-client" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("reports the Chinese missing-admin-token error and hides the English original", async () => {
    const { result } = renderMcpFlow(null, { url: "https://server-1.example.com/mcp", transport: "http" });

    await act(async () => {
      await result.current.startOAuthFlow();
    });

    expectErrorPair(result.current.error, "缺少管理员 Token", "Missing admin token");
  });

  it("reports the Chinese access-token-missing toast and hides the English original", async () => {
    const { result } = renderMcpFlow(null, { url: "https://server-1.example.com/mcp", transport: "http" });

    await act(async () => {
      await result.current.startOAuthFlow();
    });

    expect(toast.error).toHaveBeenCalledWith("缺少访问 Token。请重新认证后再试。");
    expect(toast.error).not.toHaveBeenCalledWith("Access token missing. Please re-authenticate and try again.");
  });

  it("reports the Chinese incomplete-server error and hides the English original", async () => {
    const { result } = renderMcpFlow("admin-token", null);

    await act(async () => {
      await result.current.startOAuthFlow();
    });

    expectErrorPair(
      result.current.error,
      "请先填写服务器 URL 和传输方式，再开始 OAuth。",
      "Please complete server URL and transport before starting OAuth.",
    );
    expect(toast.error).toHaveBeenCalledWith("请先填写服务器 URL 和传输方式，再开始 OAuth。");
  });

  it("reports the Chinese missing temporary server id error and hides the English original", async () => {
    vi.mocked(networking.cacheTemporaryMcpServer).mockResolvedValue({});
    const { result } = renderMcpFlow("admin-token", {
      url: "https://server-1.example.com/mcp",
      transport: "http",
    });

    await act(async () => {
      await result.current.startOAuthFlow();
    });

    expectErrorPair(
      result.current.error,
      "缺少临时 MCP 服务器标识符。请重试。",
      "Temporary MCP server identifier missing. Please retry.",
    );
  });

  it("reports the Chinese browser-storage error and hides the English original", async () => {
    vi.mocked(setSecureItem).mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const { result } = renderMcpFlow("admin-token", {
      url: "https://server-1.example.com/mcp",
      transport: "http",
    });

    await act(async () => {
      await result.current.startOAuthFlow();
    });

    expectErrorPair(
      result.current.error,
      "无法访问浏览器存储以完成 OAuth。请启用存储后重试。",
      "Unable to access browser storage for OAuth. Please enable storage and retry.",
    );
  });

  it("reports the Chinese resume failure and hides the English original", async () => {
    seedStoredItems({
      [MCP_RESULT_KEY]: "not-json",
      [MCP_FLOW_STATE_KEY]: JSON.stringify({ flowSource: "create" }),
    });

    const { result } = renderMcpFlow("admin-token", { url: "https://server-1.example.com/mcp", transport: "http" });

    await waitFor(() =>
      expectErrorPair(
        result.current.error,
        "恢复 OAuth 流程失败。请重试。",
        "Failed to resume OAuth flow. Please retry.",
      ),
    );
    expect(toast.error).toHaveBeenCalledWith("恢复 OAuth 流程失败。请重试。");
  });

  it("reports the Chinese lost-session error for strict browser settings and hides the English original", async () => {
    seedStoredItems({
      [MCP_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [MCP_FLOW_STATE_KEY]: JSON.stringify({ flowSource: "create" }),
    });

    const { result } = renderMcpFlow("admin-token", { url: "https://server-1.example.com/mcp", transport: "http" });

    await waitFor(() =>
      expectErrorPair(
        result.current.error,
        "OAuth 会话状态已丢失。如果你启用了严格的浏览器隐私设置，可能会出现这种情况。请重试并确保已启用 Cookie/存储。",
        "OAuth session state was lost. This can happen if you have strict browser privacy settings. Please try again and ensure cookies/storage is enabled.",
      ),
    );
  });

  it("reports the Chinese state-mismatch error and hides the English original", async () => {
    seedStoredItems({
      [MCP_RESULT_KEY]: JSON.stringify({ state: "other-state", code: "code-1" }),
      [MCP_FLOW_STATE_KEY]: JSON.stringify(mcpFlowState),
    });

    const { result } = renderMcpFlow("admin-token", { url: "https://server-1.example.com/mcp", transport: "http" });

    await waitFor(() =>
      expectErrorPair(result.current.error, "OAuth 状态不匹配。请重试。", "OAuth state mismatch. Please retry."),
    );
  });

  it("reports the Chinese missing-authorization-code error and hides the English original", async () => {
    seedStoredItems({
      [MCP_RESULT_KEY]: JSON.stringify({ state: "state-1" }),
      [MCP_FLOW_STATE_KEY]: JSON.stringify(mcpFlowState),
    });

    const { result } = renderMcpFlow("admin-token", { url: "https://server-1.example.com/mcp", transport: "http" });

    await waitFor(() =>
      expectErrorPair(result.current.error, "回调中缺少授权码。", "Authorization code missing in callback."),
    );
  });

  it("reports the Chinese token-retrieved toast and hides the English original", async () => {
    seedStoredItems({
      [MCP_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [MCP_FLOW_STATE_KEY]: JSON.stringify(mcpFlowState),
    });

    const { result } = renderMcpFlow("admin-token", { url: "https://server-1.example.com/mcp", transport: "http" });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(toast.success).toHaveBeenCalledWith("OAuth Token 获取成功");
    expect(toast.success).not.toHaveBeenCalledWith("OAuth token retrieved successfully");
  });

  it("reports the Chinese lost-session error for the tools flow and hides the English original", async () => {
    seedStoredItems({
      [TOOLS_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [TOOLS_FLOW_STATE_KEY]: JSON.stringify({}),
    });

    const { result } = renderToolsFlow();

    await waitFor(() =>
      expectErrorPair(
        result.current.error,
        "OAuth 会话状态已丢失。请重试。",
        "OAuth session state was lost. Please retry.",
      ),
    );
  });

  it("reports the Chinese connected toast and hides the English original", async () => {
    seedStoredItems({
      [TOOLS_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [TOOLS_FLOW_STATE_KEY]: JSON.stringify(toolsFlowState),
    });

    const { result } = renderToolsFlow();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(toast.success).toHaveBeenCalledWith("连接成功");
    expect(toast.success).not.toHaveBeenCalledWith("Connected successfully");
  });

  it("reports the Chinese lost-session error for the user flow and hides the English original", async () => {
    seedStoredItems({
      [USER_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [USER_FLOW_STATE_KEY]: JSON.stringify({}),
    });

    const { result } = renderUserFlow();

    await waitFor(() =>
      expectErrorPair(
        result.current.error,
        "OAuth 会话状态已丢失。请重试。",
        "OAuth session state was lost. Please retry.",
      ),
    );
  });

  it("reports the Chinese state-mismatch error for the user flow and hides the English original", async () => {
    seedStoredItems({
      [USER_RESULT_KEY]: JSON.stringify({ state: "other-state", code: "code-1" }),
      [USER_FLOW_STATE_KEY]: JSON.stringify(toolsFlowState),
    });

    const { result } = renderUserFlow();

    await waitFor(() =>
      expectErrorPair(result.current.error, "OAuth 状态不匹配。请重试。", "OAuth state mismatch. Please retry."),
    );
  });

  it("reports the Chinese missing-authorization-code error for the user flow and hides the English original", async () => {
    seedStoredItems({
      [USER_RESULT_KEY]: JSON.stringify({ state: "state-1" }),
      [USER_FLOW_STATE_KEY]: JSON.stringify(toolsFlowState),
    });

    const { result } = renderUserFlow();

    await waitFor(() =>
      expectErrorPair(result.current.error, "回调中缺少授权码。", "Authorization code missing in callback."),
    );
  });

  it("reports the Chinese connected toast for the user flow and hides the English original", async () => {
    seedStoredItems({
      [USER_RESULT_KEY]: JSON.stringify({ state: "state-1", code: "code-1" }),
      [USER_FLOW_STATE_KEY]: JSON.stringify(toolsFlowState),
    });

    const { result } = renderUserFlow();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(toast.success).toHaveBeenCalledWith("连接成功");
    expect(toast.success).not.toHaveBeenCalledWith("Connected successfully");
  });
});
