import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import DcrBridgeToggle from "./DcrBridgeToggle";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

describe("DcrBridgeToggle Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese toggle label and hides the English original", () => {
    renderInMcpForm(<DcrBridgeToggle authType="true_passthrough" />);

    expectPair("网关托管的登录（DCR bridge）", "Gateway-hosted sign-in (DCR bridge)");
  });

  it("renders the Chinese tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<DcrBridgeToggle authType="true_passthrough" />);

    await expectTooltipPair(
      user,
      "网关托管的登录（DCR bridge）",
      "让 Claude Desktop 等仅支持 OAuth 的客户端通过网关注册并登录。关闭后将改为转发上游服务器自身的 OAuth 元数据（适用于已在上游 IdP 预注册的客户端）。",
      "Lets OAuth-only clients like Claude Desktop register and sign in through the gateway. Turn off to relay the upstream server's own OAuth metadata instead (for clients pre-registered with the upstream IdP).",
    );
  });
});
