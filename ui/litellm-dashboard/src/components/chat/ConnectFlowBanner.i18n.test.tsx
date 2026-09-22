import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import ConnectFlowBanner from "./ConnectFlowBanner";
import type { ConnectFlowStatus } from "@/components/networking";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "https://gateway.example.com",
}));

vi.mock("@/hooks/useUserMcpOAuthFlow", () => ({
  useUserMcpOAuthFlow: () => ({ startOAuthFlow: vi.fn(), status: "idle" }),
}));

const flow = (overrides: Partial<ConnectFlowStatus>): ConnectFlowStatus => ({
  state: "unscoped",
  client_origin: "https://claude.ai",
  server_id: null,
  server_name: null,
  connected: null,
  ...overrides,
});

const renderBanner = (props: Partial<React.ComponentProps<typeof ConnectFlowBanner>> = {}) =>
  render(
    <ConnectFlowBanner
      flowHandle="flow-handle-123"
      flow={flow({})}
      accessToken="tok"
      onConnected={vi.fn()}
      failed={false}
      {...props}
    />,
  );

describe("ConnectFlowBanner Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese stale copy with the application fallback while hiding the English originals", () => {
    renderBanner({ flow: undefined, failed: true });

    expect(screen.getByText("无法继续此连接")).toBeInTheDocument();
    expect(screen.queryByText("The connection cannot continue")).not.toBeInTheDocument();
    expect(screen.getByText("网关无法验证此连接。取消以返回 该应用。")).toBeInTheDocument();
    expect(
      screen.queryByText("The gateway could not validate this connection. Cancel to return to the application."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "完成连接" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese unscoped copy while hiding the English originals", () => {
    renderBanner();

    expect(screen.getByText("将你的 MCP 服务器连接到 https://claude.ai")).toBeInTheDocument();
    expect(screen.queryByText("Connect your MCP servers to https://claude.ai")).not.toBeInTheDocument();
    expect(
      screen.getByText("在下方授权你要使用的服务器，然后点击完成连接以返回 https://claude.ai。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Authorize the servers you want to use below, then click Finish connecting to return to https://claude.ai.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finish connecting" })).not.toBeInTheDocument();
  });

  it("renders the Chinese interactive copy while hiding the English originals", () => {
    const interactiveOverrides = {
      state: "interactive" as const,
      server_id: "s-design",
      server_name: "design_tool",
      connected: false,
    };
    const interactiveFlow = flow(interactiveOverrides);
    renderBanner({ flow: interactiveFlow });

    expect(screen.getByText("允许 https://claude.ai 使用 design_tool")).toBeInTheDocument();
    expect(screen.queryByText("Allow https://claude.ai to use design_tool")).not.toBeInTheDocument();
    expect(screen.getByText("在下方授权 design_tool 以继续，或取消以让 https://claude.ai 离开。")).toBeInTheDocument();
    expect(
      screen.queryByText("Authorize design_tool below to continue, or cancel to send https://claude.ai away."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese finish copy and the requested-server fallback while hiding the English originals", () => {
    const finishedOverrides = {
      state: "interactive" as const,
      server_id: "s-design",
      server_name: null,
      connected: true,
    };
    const finishedFlow = flow(finishedOverrides);
    renderBanner({ flow: finishedFlow });

    expect(screen.getByText("允许 https://claude.ai 使用 所请求的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Allow https://claude.ai to use the requested MCP server")).not.toBeInTheDocument();
    expect(
      screen.getByText("点击完成连接，以你的身份授予 https://claude.ai 访问 所请求的 MCP 服务器 的权限。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Click Finish connecting to give https://claude.ai access to the requested MCP server as you.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese manual-delivery label while hiding the English original", () => {
    renderBanner({ flow: flow({ client_origin: "http://localhost:3118" }) });

    expect(screen.getByText("我的客户端位于远程或 SSH 机器上")).toBeInTheDocument();
    expect(screen.queryByText("My client is on a remote or SSH machine")).not.toBeInTheDocument();
  });
});
