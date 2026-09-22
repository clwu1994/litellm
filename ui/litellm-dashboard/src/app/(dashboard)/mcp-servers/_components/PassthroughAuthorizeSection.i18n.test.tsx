import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair } from "./mcpI18nTestUtils";
import PassthroughAuthorizeSection from "./PassthroughAuthorizeSection";

const noopFlow = { startOAuthFlow: vi.fn(), status: "idle", error: null, tokenResponse: null };

describe("PassthroughAuthorizeSection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese intro and hides the English original", () => {
    renderInMcpForm(<PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={noopFlow} />);

    expectPair(
      "对于此认证类型，调用方自带上游 Token，因此 LiteLLM 绝不存储 Token。要预览工具并配置工具允许列表，请在此向上游授权：该 Token 仅保留在此浏览器会话中，绝不会保存到 LiteLLM。下方配置的 OAuth 应用会随服务器一起保存，因此从工具页面授权的内部用户会通过它进行。",
      "Callers bring their own upstream token for this auth type, so LiteLLM never stores tokens. To preview tools and configure the tool allowlist, authorize against the upstream here: the token stays in this browser session only and is never saved to LiteLLM. An OAuth app configured below IS saved with the server, so internal users who authorize from the Tools page go through it.",
    );
  });

  it("renders the Chinese client field labels and hides the English originals", () => {
    renderInMcpForm(<PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={noopFlow} />);

    expectPair("OAuth Client ID（可选）", "OAuth Client ID (optional)");
    expectPair("OAuth Client Secret（可选）", "OAuth Client Secret (optional)");
  });

  it("renders the Chinese dynamic-registration placeholders and help and hides the English originals", () => {
    renderInMcpForm(<PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={noopFlow} />);

    expect(screen.getByPlaceholderText("留空以使用动态客户端注册")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("公共客户端 / PKCE 请留空")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave blank to use dynamic client registration")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave blank for public clients / PKCE")).not.toBeInTheDocument();
    expectPair(
      "切换认证类型会丢弃之前保存的应用；请在此输入客户端 ID，或留空以使用动态客户端注册。",
      "Switching the auth type discards the previously saved app; enter a client ID here or leave blank to use dynamic client registration.",
    );
  });

  it("renders the Chinese authorize button and hides the English original", () => {
    renderInMcpForm(<PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={noopFlow} />);

    expectPair("授权并获取工具（仅浏览器）", "Authorize & Fetch Tools (browser-only)");
  });

  it("renders the Chinese authorizing button label and hides the English original", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={{ ...noopFlow, status: "authorizing" }} />,
    );

    expectPair("正在等待授权...", "Waiting for authorization...");
  });

  it("renders the Chinese exchanging button label and hides the English original", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={{ ...noopFlow, status: "exchanging" }} />,
    );

    expectPair("正在交换授权码...", "Exchanging authorization code...");
  });

  it("renders the Chinese held-token message and hides the English original", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection
        authType="true_passthrough"
        oauthFlow={{ ...noopFlow, status: "success", tokenResponse: { access_token: "tok" } }}
      />,
    );

    expectPair(
      "Token 已保留在此浏览器会话中。现在可以预览和配置工具；该 Token 未保存到 LiteLLM。",
      "Token held for this browser session. Tools can now be previewed and configured; the token was not saved to LiteLLM.",
    );
  });

  it("renders the Chinese keep-existing placeholders and help and hides the English originals", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection
        authType="oauth_delegate"
        oauthFlow={noopFlow}
        isEditing
        savedAuthType="true_passthrough"
      />,
    );

    expect(screen.getByPlaceholderText("留空以保留当前保存的应用（如有）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("留空以保留当前保存的密钥（如有）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Leave blank to keep the currently saved app (if any)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Leave blank to keep the currently saved secret (if any)"),
    ).not.toBeInTheDocument();
    expectPair(
      "设置此项可让所有人通过特定应用授权；对于不支持动态客户端注册的上游（例如预先注册的 Slack 应用）为必填。",
      "Set this to make everyone authorize through a specific app; required for upstreams without dynamic client registration (e.g. a pre-registered Slack app).",
    );
  });

  it("renders the Chinese remove-saved-app checkbox label and hides the English original", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection
        authType="true_passthrough"
        oauthFlow={noopFlow}
        isEditing
        onRemoveStoredAppChange={vi.fn()}
      />,
    );

    expectPair(
      "保存时移除已保存的 OAuth 应用（服务器将回到动态客户端注册）",
      "Remove the saved OAuth app on save (the server goes back to dynamic client registration)",
    );
  });

  it("renders the Chinese upstream-changed warning and hides the English original", () => {
    renderInMcpForm(
      <PassthroughAuthorizeSection authType="true_passthrough" oauthFlow={noopFlow} appMayNotMatchUpstream />,
    );

    expectPair(
      "你更改了上游 URL 或 Endpoint；此处输入的 OAuth 应用是为之前的上游注册的，可能无效。请更新客户端 ID，或清除它以使用动态客户端注册。",
      "You changed the upstream URL or endpoints; the OAuth app entered here was registered for the previous upstream and may not be valid. Update the client ID, or clear it to use dynamic client registration.",
    );
  });
});
