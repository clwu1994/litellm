import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { MCPServer } from "@/components/mcp_tools/types";

import MCPServerCard from "./MCPServerCard";

const baseServer = {
  server_id: "srv-1",
  server_name: "demo_server",
  alias: "demo_server",
  transport: "http",
  url: "https://example.com/mcp",
  auth_type: "api_key",
  status: "healthy",
} as MCPServer;

const renderCard = (overrides: Partial<MCPServer> = {}, props: Partial<ComponentProps<typeof MCPServerCard>> = {}) =>
  renderWithProviders(
    <MCPServerCard server={{ ...baseServer, ...overrides } as MCPServer} onClick={vi.fn()} {...props} />,
  );

describe("MCPServerCard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese server actions label, health chip and visibility badge and hides the English originals", () => {
    renderCard({}, { onRecheckHealth: vi.fn(), onDelete: vi.fn() });

    expect(screen.getByLabelText("服务器操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Server actions")).not.toBeInTheDocument();
    expect(screen.getByText("健康")).toBeInTheDocument();
    expect(screen.queryByText("healthy")).not.toBeInTheDocument();
    expect(screen.getByText("内部")).toBeInTheDocument();
    expect(screen.queryByText("Internal")).not.toBeInTheDocument();
  });

  it("renders the Chinese public visibility badge and hides the English original", () => {
    renderCard({ available_on_public_internet: true });

    expect(screen.getByText("公开")).toBeInTheDocument();
    expect(screen.queryByText("Public")).not.toBeInTheDocument();
  });

  it("renders the Chinese actions menu and hides the English originals", async () => {
    const user = userEvent.setup();
    renderCard({}, { onRecheckHealth: vi.fn(), onDelete: vi.fn() });

    await user.click(screen.getByLabelText("服务器操作"));

    expect(await screen.findByRole("menuitem", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Test Connection" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("renders the Chinese OAuth flow badge and its tooltip in the same open state", async () => {
    const user = userEvent.setup();
    renderCard({ auth_type: "oauth2", oauth2_flow: null });

    expect(screen.getByText("未设置 OAuth 流程")).toBeInTheDocument();
    expect(screen.queryByText("OAuth flow not set")).not.toBeInTheDocument();

    await user.hover(screen.getByText("未设置 OAuth 流程"));

    expect(
      await screen.findByText(
        "此 OAuth 服务器未设置流程（Machine-to-Machine 还是 Interactive）。打开它并选择 OAuth 流程类型，让 LiteLLM 按你的预期进行认证。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/This OAuth server has no flow set/)).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-field count and tooltip for a single field", async () => {
    const user = userEvent.setup();
    renderCard({}, { missingUserFields: ["OPENAI_API_KEY"], onOpenFillFields: vi.fn() });

    expect(screen.getByText("缺少 1 个用户字段")).toBeInTheDocument();
    expect(screen.queryByText("1 user field missing")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set" })).not.toBeInTheDocument();

    await user.hover(screen.getByText("缺少 1 个用户字段"));

    expect(await screen.findByText("缺少的用户字段：")).toBeInTheDocument();
    expect(screen.queryByText("Missing user fields:")).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-field count for multiple fields", () => {
    renderCard({}, { missingUserFields: ["OPENAI_API_KEY", "SLACK_TOKEN"] });

    expect(screen.getByText("缺少 2 个用户字段")).toBeInTheDocument();
    expect(screen.queryByText("2 user fields missing")).not.toBeInTheDocument();
  });

  it("selects the singular English key for one missing field", async () => {
    await i18n.changeLanguage("en");
    renderCard({}, { missingUserFields: ["OPENAI_API_KEY"] });

    expect(screen.getByText("1 user field missing")).toBeInTheDocument();
    expect(screen.queryByText("1 user fields missing")).not.toBeInTheDocument();
  });

  it("renders the Chinese checking chip while health is loading", () => {
    renderCard({}, { isLoadingHealth: true });

    expect(screen.getByText("检查中")).toBeInTheDocument();
    expect(screen.queryByText("Checking")).not.toBeInTheDocument();
  });

  it("renders the Chinese health tooltip with the last check, error and recheck hint", async () => {
    const user = userEvent.setup();
    renderCard(
      { status: "unhealthy", last_health_check: "2024-01-01T00:00:00Z", health_check_error: "connection refused" },
      { onRecheckHealth: vi.fn() },
    );

    await user.hover(screen.getByText("异常"));

    expect(await screen.findByText("健康状态：异常")).toBeInTheDocument();
    expect(screen.getByText(`上次检查：${new Date("2024-01-01T00:00:00Z").toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText("错误")).toBeInTheDocument();
    expect(screen.getByText("点击重新检查")).toBeInTheDocument();
    expect(screen.queryByText("Health: unhealthy")).not.toBeInTheDocument();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
    expect(screen.queryByText("Click to recheck")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-health-data tooltip", async () => {
    const user = userEvent.setup();
    renderCard({ status: "unknown" });

    await user.hover(screen.getByText("未知"));

    expect(await screen.findByText("健康状态：未知")).toBeInTheDocument();
    expect(screen.getByText("暂无健康数据")).toBeInTheDocument();
    expect(screen.queryByText("No health data")).not.toBeInTheDocument();
  });

  it("renders the Chinese connected BYOK row and hides the English originals", () => {
    renderCard({ is_byok: true, has_user_credential: true }, { onByokConnect: vi.fn() });

    expect(screen.getByText("BYOK 凭证")).toBeInTheDocument();
    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    expect(screen.queryByText("BYOK credential")).not.toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
  });

  it("renders the Chinese BYOK connect button and hides the English original", () => {
    renderCard({ is_byok: true, has_user_credential: false }, { onByokConnect: vi.fn() });

    expect(screen.getByRole("button", { name: "连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect" })).not.toBeInTheDocument();
  });
});
