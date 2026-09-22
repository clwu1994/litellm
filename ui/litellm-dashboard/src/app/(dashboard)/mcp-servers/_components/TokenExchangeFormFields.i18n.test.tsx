import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";
import TokenExchangeFormFields from "./TokenExchangeFormFields";

describe("TokenExchangeFormFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese field label and hides the English originals", () => {
    renderInMcpForm(<TokenExchangeFormFields />);

    expectPair("配置方案", "Profile");
    expectPair("Token Exchange Endpoint（可选）", "Token Exchange Endpoint (optional)");
    expectPair("客户端 ID", "Client ID");
    expectPair("客户端密钥", "Client Secret");
    expectPair("受众（可选）", "Audience (optional)");
    expectPair("Subject Token Type（可选）", "Subject Token Type (optional)");
    expectPair("作用域（可选）", "Scopes (optional)");
  });

  it("renders the Chinese profile tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "配置方案",
      "Token 交换的线上协议方言。RFC 8693 是标准的 Token 交换授权。Microsoft Entra OBO 使用 Entra 的 On-Behalf-Of 方言（RFC 7523 jwt-bearer 授权，requested_token_use=on_behalf_of），并通过类似 api://<app-id>/.default 的作用域携带目标资源。",
      "Token-exchange wire dialect. RFC 8693 is the standard token-exchange grant. Microsoft Entra OBO uses Entra's On-Behalf-Of dialect (the RFC 7523 jwt-bearer grant with requested_token_use=on_behalf_of) and carries the target resource in a scope like api://<app-id>/.default.",
    );
  });

  it("renders the Chinese endpoint tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "Token Exchange Endpoint（可选）",
      "RFC 8693 Token Endpoint。代理在此将用户的传入 Token 交换为用于调用上游 MCP 服务器的限定作用域 Token。留空则从上游的受保护资源元数据自动发现（先 RFC 9728，再 RFC 8414）。",
      "RFC 8693 token endpoint. The proxy exchanges the user's incoming token here for a scoped token used to call the upstream MCP server. Leave blank to auto-discover it from the upstream's protected-resource metadata (RFC 9728 then RFC 8414).",
    );
  });

  it("renders the Chinese client ID tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "客户端 ID",
      "用于向 Token Exchange Endpoint 认证的 OAuth2 客户端 ID。",
      "OAuth2 client ID used to authenticate to the token exchange endpoint.",
    );
  });

  it("renders the Chinese client secret tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "客户端密钥",
      "用于向 Token Exchange Endpoint 认证的 OAuth2 客户端密钥。",
      "OAuth2 client secret used to authenticate to the token exchange endpoint.",
    );
  });

  it("renders the Chinese audience tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "受众（可选）",
      "交换所得 Token 的目标受众（RFC 8693 audience）。标识该 Token 面向的上游 MCP 服务器。",
      "Target audience for the exchanged token (RFC 8693 audience). Identifies the upstream MCP server the token is for.",
    );
  });

  it("renders the Chinese subject token type tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "Subject Token Type（可选）",
      "用户传入 Token 的类型（RFC 8693 subject_token_type）。默认为 urn:ietf:params:oauth:token-type:access_token。",
      "Type of the user's incoming token (RFC 8693 subject_token_type). Defaults to urn:ietf:params:oauth:token-type:access_token.",
    );
  });

  it("renders the Chinese scopes tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await expectTooltipPair(
      user,
      "作用域（可选）",
      "Token 交换期间请求的可选作用域。",
      "Optional scopes to request during the token exchange.",
    );
  });

  it("renders the Chinese profile options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />);

    await user.click(screen.getByLabelText("配置方案"));

    expect(await screen.findByRole("option", { name: "RFC 8693（标准）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "RFC 8693 (standard)" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Microsoft Entra OBO" })).toBeInTheDocument();
  });

  it("renders the Chinese create placeholders and hides the English originals", () => {
    renderInMcpForm(<TokenExchangeFormFields />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加作用域")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client ID")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter OAuth client secret")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Add scopes")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit placeholders and hides the English originals", () => {
    renderInMcpForm(<TokenExchangeFormFields isEditing />);

    expect(screen.getByPlaceholderText("输入 OAuth 客户端 ID（留空以保留现有值）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 OAuth 客户端密钥（留空以保留现有值）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client ID (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Enter OAuth client secret (leave blank to keep existing)"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese client ID required error once emptied and hides the English original", async () => {
    renderInMcpForm(<TokenExchangeFormFields />);
    const clientId = screen.getByPlaceholderText("输入 OAuth 客户端 ID");

    fireEvent.change(clientId, { target: { value: "client-1" } });
    fireEvent.change(clientId, { target: { value: "" } });

    expect(await screen.findByText("Token 交换需要 Client ID")).toBeInTheDocument();
    expect(screen.queryByText("Client ID is required for token exchange")).not.toBeInTheDocument();
  });

  it("renders the Chinese client secret required error once emptied and hides the English original", async () => {
    renderInMcpForm(<TokenExchangeFormFields />);
    const clientSecret = screen.getByPlaceholderText("输入 OAuth 客户端密钥");

    fireEvent.change(clientSecret, { target: { value: "secret" } });
    fireEvent.change(clientSecret, { target: { value: "" } });

    expect(await screen.findByText("Token 交换需要 Client Secret")).toBeInTheDocument();
    expect(screen.queryByText("Client Secret is required for token exchange")).not.toBeInTheDocument();
  });

  it("renders the Chinese Entra OBO scopes label, tooltip, placeholder and required error", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenExchangeFormFields />, {
      token_exchange_profile: "entra_obo",
      credentials: { scopes: ["api://app/.default"] },
    });

    expectPair("作用域", "Scopes");
    expect(screen.getByPlaceholderText("api://<app-id>/.default")).toBeInTheDocument();
    await expectTooltipPair(
      user,
      "作用域",
      "Microsoft Entra OBO 通过作用域携带目标资源，因此至少需要一个作用域（例如 api://<app-id>/.default）。",
      "Microsoft Entra OBO carries the target resource in the scope, so at least one is required (e.g. api://<app-id>/.default).",
    );

    await user.click(screen.getByRole("button", { name: "清除全部" }));

    expect(
      await screen.findByText("Microsoft Entra OBO 需要一个作用域，例如 api://<app-id>/.default"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Microsoft Entra OBO requires a scope, e.g. api://<app-id>/.default"),
    ).not.toBeInTheDocument();
  });
});
