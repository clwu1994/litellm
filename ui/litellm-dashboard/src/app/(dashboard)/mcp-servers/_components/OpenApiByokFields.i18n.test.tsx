import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";
import OpenApiByokFields from "./OpenApiByokFields";

describe("OpenApiByokFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese BYOK label and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: false });

    expectPair("BYOK（自带密钥）", "BYOK (Bring Your Own Key)");
  });

  it("renders the Chinese BYOK tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OpenApiByokFields />, { is_byok: false });

    await expectTooltipPair(
      user,
      "BYOK（自带密钥）",
      "启用后，每个用户为此服务提供自己的 API Key。密钥按用户存储，绝不共享。",
      "When enabled, each user provides their own API key for this service. Keys are stored per-user and never shared.",
    );
  });

  it("renders the Chinese sent-as copy and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    expectPair("用户密钥将按以下方式发送：", "User keys will be sent as:");
    expect(screen.getByText("Authorization: Bearer {key}")).toBeInTheDocument();
  });

  it("renders the Chinese authentication-type prompt and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true });

    expect(
      screen.getByText("请在下方设置，以指定用户密钥的发送方式（例如 Bearer Token、API Key 请求头）。"),
    ).toBeInTheDocument();
    expect(screen.getByText("认证类型")).toBeInTheDocument();
    expect(
      screen.queryByText("Set the below to specify how user keys are sent (e.g., Bearer Token, API Key header)."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Authentication Type")).not.toBeInTheDocument();
  });

  it("renders the Chinese access-description label and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    expectPair("访问说明", "Access Description");
  });

  it("renders the Chinese access-description tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    await expectTooltipPair(
      user,
      "访问说明",
      "在连接弹窗中向用户展示的权限列表（例如“创建和管理 Jira 问题”）",
      "List of permissions shown to users in the connection modal (e.g. 'Create and manage Jira issues')",
    );
  });

  it("renders the Chinese access-description placeholder and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    expect(screen.getByPlaceholderText("添加访问说明项（每项输入后按回车）")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Add access description items (press Enter after each)"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese API Key help URL label and hides the English original", () => {
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    expectPair("API Key 帮助 URL", "API Key Help URL");
  });

  it("renders the Chinese API Key help URL tooltip in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<OpenApiByokFields />, { is_byok: true, auth_type: "bearer_token" });

    await expectTooltipPair(
      user,
      "API Key 帮助 URL",
      "向用户展示的可选链接，帮助他们找到自己的 API Key",
      "Optional link shown to users to help them find their API key",
    );
  });
});
