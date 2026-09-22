import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import TokenEndpointAuthMethodField from "./TokenEndpointAuthMethodField";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

describe("TokenEndpointAuthMethodField Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese field label and hides the English original", () => {
    renderInMcpForm(<TokenEndpointAuthMethodField />);

    expectPair("Token Endpoint 认证方式（可选）", "Token Endpoint Auth Method (optional)");
  });

  it("renders the Chinese tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenEndpointAuthMethodField />);

    await expectTooltipPair(
      user,
      "Token Endpoint 认证方式（可选）",
      "代理向上游 OAuth Token Endpoint 进行认证的方式。Client Secret Basic 通过 HTTP Basic Authorization 请求头发送客户端凭证；留空则使用默认的 Client Secret Post，它在请求体中发送这些凭证。",
      "How the proxy authenticates to the upstream OAuth token endpoint. Client Secret Basic sends the client credentials in an HTTP Basic Authorization header; leave blank to use the default, Client Secret Post, which sends them in the request body.",
    );
  });

  it("renders the Chinese create placeholder and hides the English original", () => {
    renderInMcpForm(<TokenEndpointAuthMethodField />);

    expectPair("默认（Client Secret Post）", "Default (Client Secret Post)");
  });

  it("renders the Chinese edit placeholder and hides the English original", () => {
    renderInMcpForm(<TokenEndpointAuthMethodField isEditing />);

    expectPair(
      "留空以保留现有值（默认 Client Secret Post）",
      "Leave blank to keep existing (default Client Secret Post)",
    );
  });

  it("offers the English auth-method identifiers, which the glossary keeps raw", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<TokenEndpointAuthMethodField />);

    await user.click(screen.getByLabelText("Token Endpoint 认证方式（可选）"));

    expect(await screen.findByRole("option", { name: "Client Secret Basic" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Client Secret Post" })).toBeInTheDocument();
  });
});
