import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";

describe("UpstreamTokenHeaderField Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese field label and hides the English original", () => {
    renderInMcpForm(<UpstreamTokenHeaderField />);

    expectPair("Token 请求头（可选）", "Token Header (optional)");
  });

  it("renders the Chinese tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<UpstreamTokenHeaderField />);

    await expectTooltipPair(
      user,
      "Token 请求头（可选）",
      "LiteLLM 为此服务器解析的 Token 由哪个上游请求头承载。留空则按 'Authorization: Bearer <token>' 发送，这是默认值，也是大多数服务器期望的方式。当上游期望在其他位置接收时，请设置请求头名称；例如某个 API 网关在 'esb-oauth' 上终止自己的凭证，而来自静态请求头的独立 Authorization 会透传到其后的服务器。",
      "Which upstream header carries the token LiteLLM resolves for this server. Leave blank to send it as 'Authorization: Bearer <token>', which is the default and what most servers expect. Set a header name when the upstream expects it elsewhere, for example an API gateway that terminates its own credential on 'esb-oauth' while a separate Authorization from Static Headers passes through to the server behind it.",
    );
  });
});
