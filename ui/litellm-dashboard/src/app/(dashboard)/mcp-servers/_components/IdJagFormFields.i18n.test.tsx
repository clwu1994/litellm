import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import IdJagFormFields from "./IdJagFormFields";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

describe("IdJagFormFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese field label and hides the English originals", () => {
    renderInMcpForm(<IdJagFormFields />);

    expectPair("组织 Token Endpoint（第 1 段）", "Org Token Endpoint (leg 1)");
    expectPair("资源 Token Endpoint（第 2 段）", "Resource Token Endpoint (leg 2)");
    expectPair("客户端 ID", "Client ID");
    expectPair("客户端密钥", "Client Secret");
    expectPair("客户端私钥（PEM）", "Client Private Key (PEM)");
    expectPair("私钥 ID（可选）", "Private Key ID (optional)");
    expectPair("客户端断言签名算法（可选）", "Client Assertion Signing Algorithm (optional)");
    expectPair("受众（可选）", "Audience (optional)");
    expectPair("Resource Indicator（可选）", "Resource Indicator (optional)");
    expectPair("Subject Token Type（可选）", "Subject Token Type (optional)");
    expectPair("作用域（可选）", "Scopes (optional)");
  });

  it("renders the Chinese org token endpoint tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "组织 Token Endpoint（第 1 段）",
      "你的 IdP 组织授权服务器的 Token Endpoint。LiteLLM 在此将用户身份断言交换为 ID-JAG 断言（RFC 8693，requested_token_type=urn:ietf:params:oauth:token-type:id-jag）。",
      "Your IdP org authorization server's token endpoint. LiteLLM exchanges the user's identity assertion here for an ID-JAG assertion (RFC 8693 with requested_token_type=urn:ietf:params:oauth:token-type:id-jag).",
    );
  });

  it("renders the Chinese resource token endpoint tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "资源 Token Endpoint（第 2 段）",
      "上游资源授权服务器的 Token Endpoint。LiteLLM 在此以 RFC 7523 jwt-bearer 授权提交 ID-JAG 断言，以获取 MCP 服务器接受的访问 Token。",
      "The upstream resource authorization server's token endpoint. LiteLLM posts the ID-JAG assertion here as an RFC 7523 jwt-bearer grant to get the access token the MCP server accepts.",
    );
  });

  it("renders the Chinese client ID tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "客户端 ID",
      "LiteLLM 在两段流程中用于认证的 OAuth2 客户端 ID。",
      "OAuth2 client ID LiteLLM authenticates as on both legs.",
    );
  });

  it("renders the Chinese client secret tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "客户端密钥",
      "通过 client_secret_post 将 LiteLLM 认证为 OAuth 客户端。改用私钥时请留空；私钥优先于此密钥。",
      "Authenticates LiteLLM as the OAuth client via client_secret_post. Leave blank when using a private key instead; a private key takes precedence over this secret.",
    );
  });

  it("renders the Chinese private key tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "客户端私钥（PEM）",
      "用于签署 RFC 7523 private_key_jwt 客户端断言的 PEM 私钥。Okta Cross App Access 通常需要此项。设置后将优先于客户端密钥。",
      "PEM private key signing the RFC 7523 private_key_jwt client assertion. Okta Cross App Access normally requires this. When set it takes precedence over the client secret.",
    );
  });

  it("renders the Chinese private key ID tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "私钥 ID（可选）",
      "在客户端断言 JWT 请求头中声明的 kid，以便 IdP 选择正确的已注册密钥。",
      "The kid advertised in the client assertion JWT header, so the IdP can select the right registered key.",
    );
  });

  it("renders the Chinese signing algorithm tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "客户端断言签名算法（可选）",
      "用于签署客户端断言 JWT 的算法。默认为 RS256。",
      "Algorithm signing the client assertion JWT. Defaults to RS256.",
    );
  });

  it("renders the Chinese audience tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "受众（可选）",
      "第 1 段发送的 RFC 8693 受众，标识 ID-JAG 断言所面向的上游。",
      "RFC 8693 audience sent on leg 1, identifying the upstream the ID-JAG assertion is minted for.",
    );
  });

  it("renders the Chinese resource indicator tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "Resource Indicator（可选）",
      "第 1 段发送的 RFC 8707 resource indicator。它与 Audience（RFC 8693 参数）不同。",
      "RFC 8707 resource indicator sent on leg 1. Separate from Audience, which is the RFC 8693 parameter.",
    );
  });

  it("renders the Chinese subject token type tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "Subject Token Type（可选）",
      "第 1 段交换的身份断言类型。默认为 urn:ietf:params:oauth:token-type:id_token。",
      "Type of the identity assertion exchanged on leg 1. Defaults to urn:ietf:params:oauth:token-type:id_token.",
    );
  });

  it("renders the Chinese scopes tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<IdJagFormFields />);

    await expectTooltipPair(
      user,
      "作用域（可选）",
      "交换第 1 段请求的作用域。",
      "Scopes requested on leg 1 of the exchange.",
    );
  });

  it("renders the Chinese create placeholders and hides the English originals", () => {
    renderInMcpForm(<IdJagFormFields />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("-----BEGIN PRIVATE KEY-----")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加作用域")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client ID")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client secret")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add scopes")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit placeholders and hides the English originals", () => {
    renderInMcpForm(<IdJagFormFields isEditing />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("-----BEGIN PRIVATE KEY-----（留空以保留现有值）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client ID (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client secret (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("-----BEGIN PRIVATE KEY----- (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese org token endpoint required error once emptied and hides the English original", async () => {
    renderInMcpForm(<IdJagFormFields />);
    const endpoint = screen.getByPlaceholderText("https://your-org.okta.com/oauth2/v1/token");

    fireEvent.change(endpoint, { target: { value: "https://your-org.okta.com/oauth2/v1/token" } });
    fireEvent.change(endpoint, { target: { value: "" } });

    expect(await screen.findByText("ID-JAG 需要组织 Token Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("The org token endpoint is required for ID-JAG")).not.toBeInTheDocument();
  });

  it("renders the Chinese resource token endpoint required error once emptied and hides the English original", async () => {
    renderInMcpForm(<IdJagFormFields />);
    const endpoint = screen.getByPlaceholderText("https://upstream.example.com/oauth2/token");

    fireEvent.change(endpoint, { target: { value: "https://upstream.example.com/oauth2/token" } });
    fireEvent.change(endpoint, { target: { value: "" } });

    expect(await screen.findByText("ID-JAG 需要资源 Token Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("The resource token endpoint is required for ID-JAG")).not.toBeInTheDocument();
  });

  it("renders the Chinese client ID required error once emptied and hides the English original", async () => {
    renderInMcpForm(<IdJagFormFields />);
    const clientId = screen.getByPlaceholderText("输入 OAuth 客户端 ID");

    fireEvent.change(clientId, { target: { value: "client-1" } });
    fireEvent.change(clientId, { target: { value: "" } });

    expect(await screen.findByText("ID-JAG 需要 Client ID")).toBeInTheDocument();
    expect(screen.queryByText("Client ID is required for ID-JAG")).not.toBeInTheDocument();
  });

  it("renders the Chinese secret-or-private-key error once the secret is emptied and hides the English original", async () => {
    renderInMcpForm(<IdJagFormFields />);
    const clientSecret = screen.getByPlaceholderText("输入 OAuth 客户端密钥");

    fireEvent.change(clientSecret, { target: { value: "secret" } });
    fireEvent.change(clientSecret, { target: { value: "" } });

    expect(await screen.findByText("请提供客户端密钥或客户端私钥")).toBeInTheDocument();
    expect(screen.queryByText("Provide either a client secret or a client private key")).not.toBeInTheDocument();
  });
});
