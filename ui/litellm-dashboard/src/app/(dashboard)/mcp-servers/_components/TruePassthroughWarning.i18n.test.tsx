import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, render, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { AUTH_TYPE } from "@/components/mcp_tools/types";

import TruePassthroughWarning from "./TruePassthroughWarning";

const ZH_TITLE = "True Passthrough 会为此服务器禁用 LiteLLM 认证";
const EN_TITLE = "True Passthrough disables LiteLLM authentication for this server";
const ZH_DESCRIPTION =
  "任何能访问网关的人都可以在没有 LiteLLM 密钥的情况下调用此服务器。调用方的 Authorization 请求头会原样转发到上游，按密钥和按团队的速率限制以及支出跟踪均不适用，上游完全负责对调用方进行认证。如果调用方仍应通过 LiteLLM 认证，请改为选择 OAuth Delegate。";
const EN_DESCRIPTION =
  "Anyone who can reach the gateway can call this server without a LiteLLM key. The caller's Authorization header is forwarded to the upstream verbatim, per-key and per-team rate limits and spend tracking do not apply, and the upstream is fully responsible for authenticating callers. Choose OAuth Delegate instead if callers should still authenticate to LiteLLM.";

describe("TruePassthroughWarning Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title and hides the English original", () => {
    render(<TruePassthroughWarning authType={AUTH_TYPE.TRUE_PASSTHROUGH} />);

    expect(screen.getByText(ZH_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(EN_TITLE)).not.toBeInTheDocument();
  });

  it("renders the Chinese description and hides the English original", () => {
    render(<TruePassthroughWarning authType={AUTH_TYPE.TRUE_PASSTHROUGH} />);

    expect(screen.getByText(ZH_DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(EN_DESCRIPTION)).not.toBeInTheDocument();
  });
});
