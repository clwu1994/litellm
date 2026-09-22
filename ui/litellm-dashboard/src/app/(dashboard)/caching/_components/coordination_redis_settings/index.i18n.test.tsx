import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup } from "@/../tests/test-utils";
import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

import CoordinationRedisSettings from "./index";

vi.mock("@/components/networking", () => ({
  getCoordinationRedisSettingsCall: vi.fn(),
  testCoordinationRedisConnectionCall: vi.fn(),
  updateCoordinationRedisSettingsCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ accessToken: "sk-test" }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { info: vi.fn(), success: vi.fn(), fromError: vi.fn() },
}));

const getSettings = vi.mocked(networking.getCoordinationRedisSettingsCall);
const updateSettings = vi.mocked(networking.updateCoordinationRedisSettingsCall);
const testConnection = vi.mocked(networking.testCoordinationRedisConnectionCall);

const settingsResponse = (
  values: Record<string, unknown>,
  source: "coordination_redis" | "cache_backend" | "environment" | null = null,
) => ({ values, fields: [], source });

const renderSettings = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<CoordinationRedisSettings />, { wrapper });
};

const save = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "保存更改" }));

describe("CoordinationRedisSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getSettings.mockResolvedValue(settingsResponse({}));
    updateSettings.mockResolvedValue(undefined);
    testConnection.mockResolvedValue({ status: "healthy" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, description, restart notice, sections and connection fields", async () => {
    renderSettings();

    expect(await screen.findByText("协调 Redis")).toBeInTheDocument();
    expect(screen.queryByText("Coordination Redis")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "用于在代理 Pod 之间协调工作的 Redis：跨 Pod 速率限制、消费跟踪和 Pod 锁管理器。它独立于响应缓存进行配置。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("保存的更改在代理重启后生效。")).toBeInTheDocument();
    expect(screen.queryByText("Saved changes take effect on proxy restart.")).not.toBeInTheDocument();

    expect(screen.getByText("连接设置")).toBeInTheDocument();
    expect(screen.queryByText("Connection Settings")).not.toBeInTheDocument();
    expect(screen.getByText("SSL 设置")).toBeInTheDocument();
    expect(screen.queryByText("SSL Settings")).not.toBeInTheDocument();

    expect(screen.getByText("Redis URL")).toBeInTheDocument();
    expect(
      screen.getByText(
        "完整的 Redis/Valkey 连接 URL（例如 redis://:password@host:6379/1）。设置后，其优先级高于主机、端口、用户名和密码。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("主机")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器主机名或 IP 地址")).toBeInTheDocument();
    expect(screen.getByText("端口")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器端口号")).toBeInTheDocument();
    expect(screen.getByText("用户名")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器用户名（如需要）")).toBeInTheDocument();
    expect(screen.getByText("密码")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器密码")).toBeInTheDocument();
    expect(screen.getByText("SSL")).toBeInTheDocument();
    expect(screen.getByText("启用 SSL/TLS 连接")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
  });

  it("renders the Chinese cluster startup-nodes field with the coordination-specific help", async () => {
    getSettings.mockResolvedValue(settingsResponse({ startup_nodes: [{ host: "127.0.0.1", port: 7001 }] }));
    renderSettings();

    expect(await screen.findByText("集群配置")).toBeInTheDocument();
    expect(screen.getByText("启动节点")).toBeInTheDocument();
    expect(
      screen.getByText('Redis Cluster 的启动节点列表（例如 [{"host": "127.0.0.1", "port": 7001}]）'),
    ).toBeInTheDocument();
  });

  it("renders the Chinese sentinel fields", async () => {
    getSettings.mockResolvedValue(settingsResponse({ sentinel_nodes: [["localhost", 26379]] }));
    renderSettings();

    expect(await screen.findByText("哨兵配置")).toBeInTheDocument();
    expect(screen.getByText("哨兵节点")).toBeInTheDocument();
    expect(screen.getByText('Sentinel 节点列表（例如 [["localhost", 26379]]）')).toBeInTheDocument();
    expect(screen.getByText("服务名称")).toBeInTheDocument();
    expect(screen.getByText("Redis Sentinel 的主服务名称")).toBeInTheDocument();
    expect(screen.getByText("哨兵密码")).toBeInTheDocument();
    expect(screen.getByText("用于 Redis Sentinel 认证的密码")).toBeInTheDocument();
  });

  it("renders the Chinese already-set secret placeholder", async () => {
    getSettings.mockResolvedValue(settingsResponse({ password: "***REDACTED***" }));
    renderSettings();

    const password = await screen.findByLabelText("密码");
    await waitFor(() => expect(password).toHaveValue(""));
    expect(password).toHaveAttribute("placeholder", "已设置。输入新值以替换。");
    expect(screen.queryByPlaceholderText("Already set. Enter a new value to replace it.")).not.toBeInTheDocument();
  });

  it.each([
    [
      "coordination_redis",
      "已在此处配置",
      "已设置 general_settings.coordination_redis，因此协调功能使用其专属的 Redis 连接。",
    ],
    ["cache_backend", "借用响应缓存", "未配置协调 Redis；代理复用响应缓存的 Redis 连接。"],
    ["environment", "来自 REDIS_* 环境变量", "未配置协调 Redis；代理回退到 REDIS_* 环境变量。"],
  ] as const)("renders the Chinese source badge and tooltip for %s", async (source, label, tooltip) => {
    getSettings.mockResolvedValue(settingsResponse({}, source));
    renderSettings();

    const badge = await screen.findByTestId("coordination-redis-source");
    expect(badge).toHaveTextContent(label);
    expect(screen.getByText(tooltip)).toBeInTheDocument();
  });

  it("renders the Chinese not-configured source badge and tooltip for an unknown source", async () => {
    getSettings.mockResolvedValue(settingsResponse({}, null));
    renderSettings();

    expect(await screen.findByTestId("coordination-redis-source")).toHaveTextContent("未配置");
    expect(screen.getByText("跨 Pod 速率限制、消费跟踪和 Pod 锁管理器没有可用于协调的 Redis。")).toBeInTheDocument();
    expect(screen.queryByText("Not configured")).not.toBeInTheDocument();
  });

  it("surfaces the Chinese inline validation messages", async () => {
    const user = userEvent.setup();
    getSettings.mockResolvedValue(settingsResponse({ sentinel_nodes: [["localhost", 26379]] }));
    renderSettings();

    const port = await screen.findByLabelText("端口");
    await user.clear(port);
    await user.type(port, "99999");
    await save(user);
    expect(await screen.findByText("端口必须是 1 到 65535 之间的整数")).toBeInTheDocument();
    expect(updateSettings).not.toHaveBeenCalled();

    const sentinelNodes = screen.getByLabelText("哨兵节点");
    await user.clear(sentinelNodes);
    await user.type(sentinelNodes, "not json");
    await save(user);
    expect(await screen.findByText("必须是有效的 JSON 数组（使用双引号）")).toBeInTheDocument();
  });

  it("reports the Chinese connection-test and save toasts", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByLabelText("主机");

    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("协调 Redis 连接测试成功！"));

    testConnection.mockResolvedValue({ status: "unhealthy", error: "connection refused" });
    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("连接测试失败：connection refused"));

    testConnection.mockRejectedValue("boom");
    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("连接测试失败：未知错误"));

    await save(user);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("协调 Redis 设置已保存。重启代理以应用这些设置。"));

    updateSettings.mockRejectedValue(new Error("nope"));
    await save(user);
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新协调 Redis 设置失败"));
  });

  it("reports the Chinese load-failure toast when the settings query fails", async () => {
    getSettings.mockRejectedValue(new Error("nope"));
    renderSettings();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载协调 Redis 设置失败"));
  });

  it("renders the Chinese in-flight action labels while a request is pending", async () => {
    const user = userEvent.setup();
    testConnection.mockReturnValue(new Promise(() => {}));
    updateSettings.mockReturnValue(new Promise(() => {}));
    renderSettings();
    await screen.findByLabelText("主机");

    await user.click(screen.getByRole("button", { name: "测试连接" }));
    expect(await screen.findByRole("button", { name: "测试中..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Testing..." })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("button", { name: "保存中..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });
});
