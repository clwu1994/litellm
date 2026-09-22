import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { CacheHealthTab } from "./cache_health";

const healthyResponse = {
  status: "healthy",
  ping_response: true,
  set_cache_response: "success",
  litellm_cache_params: JSON.stringify({ type: "redis", supported_call_types: ["acompletion"] }),
  health_check_cache_params: JSON.stringify({
    redis_version: "7.2.1",
    namespace: "litellm-ns",
    connection_kwargs: { host: "redis.internal", port: 6379 },
  }),
};

const errorPayload = {
  message: "Connection refused",
  traceback: "Traceback (most recent call last): ...",
  litellm_cache_params: { type: "redis" },
  health_check_cache_params: {},
};

const errorResponse = {
  error: {
    message: JSON.stringify(errorPayload),
  },
};

const renderTab = (overrides: Partial<React.ComponentProps<typeof CacheHealthTab>> = {}) =>
  renderWithProviders(
    <CacheHealthTab
      {...{ accessToken: "sk-test", healthCheckResponse: "", runCachingHealthCheck: vi.fn(), ...overrides }}
    />,
  );

describe("CacheHealthTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese health-check control and hides the English one", () => {
    renderTab();

    expect(screen.getByRole("button", { name: "运行健康检查" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run Health Check" })).not.toBeInTheDocument();
  });

  it("renders the Chinese in-flight label while the check runs", async () => {
    const user = userEvent.setup();
    renderTab({ runCachingHealthCheck: vi.fn(() => new Promise<void>(() => {})) });

    await user.click(screen.getByRole("button", { name: "运行健康检查" }));

    expect(await screen.findByRole("button", { name: "正在运行健康检查..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Running Health Check..." })).not.toBeInTheDocument();
  });

  it("renders every Chinese summary label for a healthy cache and hides the English originals", () => {
    renderTab({ healthCheckResponse: healthyResponse });

    expect(screen.getByText("缓存状态：健康")).toBeInTheDocument();
    expect(screen.queryByText("Cache Status: healthy")).not.toBeInTheDocument();
    expect(screen.getByText("摘要")).toBeInTheDocument();
    expect(screen.queryByText("Summary")).not.toBeInTheDocument();
    expect(screen.getByText("原始响应")).toBeInTheDocument();
    expect(screen.queryByText("Raw Response")).not.toBeInTheDocument();
    expect(screen.getByText("缓存详情")).toBeInTheDocument();
    expect(screen.queryByText("Cache Details")).not.toBeInTheDocument();
    expect(screen.getByText("缓存配置")).toBeInTheDocument();
    expect(screen.queryByText("Cache Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("Ping 响应")).toBeInTheDocument();
    expect(screen.queryByText("Ping Response")).not.toBeInTheDocument();
    expect(screen.getByText("设置缓存响应")).toBeInTheDocument();
    expect(screen.queryByText("Set Cache Response")).not.toBeInTheDocument();
    expect(screen.getByText("Redis 详情")).toBeInTheDocument();
    expect(screen.queryByText("Redis Details")).not.toBeInTheDocument();
    expect(screen.getByText("Redis 主机")).toBeInTheDocument();
    expect(screen.queryByText("Redis Host")).not.toBeInTheDocument();
    expect(screen.getByText("Redis 端口")).toBeInTheDocument();
    expect(screen.queryByText("Redis Port")).not.toBeInTheDocument();
    expect(screen.getByText("Redis 版本")).toBeInTheDocument();
    expect(screen.queryByText("Redis Version")).not.toBeInTheDocument();
    expect(screen.getByText("启动节点")).toBeInTheDocument();
    expect(screen.queryByText("Startup Nodes")).not.toBeInTheDocument();
    expect(screen.getByText("Namespace")).toBeInTheDocument();
    expect(screen.getByText("redis.internal")).toBeInTheDocument();
    expect(screen.getByText("7.2.1")).toBeInTheDocument();
  });

  it("renders the Chinese error details, the unhealthy status and the not-available marker", () => {
    renderTab({ healthCheckResponse: errorResponse });

    expect(screen.getByText("缓存状态：异常")).toBeInTheDocument();
    expect(screen.queryByText("Cache Status: unhealthy")).not.toBeInTheDocument();
    expect(screen.getByText("错误详情")).toBeInTheDocument();
    expect(screen.queryByText("Error Details")).not.toBeInTheDocument();
    expect(screen.getByText("错误消息")).toBeInTheDocument();
    expect(screen.queryByText("Error Message")).not.toBeInTheDocument();
    expect(screen.getByText("回溯信息")).toBeInTheDocument();
    expect(screen.queryByText("Traceback")).not.toBeInTheDocument();
    expect(screen.getAllByText("不适用").length).toBeGreaterThan(0);
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown-error fallback when the error payload carries no message", () => {
    renderTab({ healthCheckResponse: { error: { message: JSON.stringify({ traceback: "only a traceback" }) } } });

    expect(screen.getByText("未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-traceback fallback when the error payload carries no traceback", () => {
    renderTab({ healthCheckResponse: { error: { message: JSON.stringify({ message: "boom" }) } } });

    expect(screen.getByText("无可用回溯信息")).toBeInTheDocument();
    expect(screen.queryByText("No traceback available")).not.toBeInTheDocument();
  });

  it("renders the Chinese parsing fallback when the error message is not JSON", () => {
    renderTab({ healthCheckResponse: { error: { message: "not json at all" } } });

    expect(screen.getByText("解析详情时出错")).toBeInTheDocument();
    expect(screen.queryByText("Error parsing details")).not.toBeInTheDocument();
  });

  it("renders the Chinese formatting fallback when the raw response cannot be stringified", () => {
    const circular: Record<string, unknown> = {
      status: "healthy",
      ping_response: true,
      litellm_cache_params: JSON.stringify({ type: "redis" }),
      health_check_cache_params: JSON.stringify({}),
    };
    circular.self = circular;

    renderTab({ healthCheckResponse: circular });

    expect(screen.getByText(/^格式化 JSON 时出错：.+$/)).toBeInTheDocument();
    expect(screen.queryByText(/^Error formatting JSON: .+$/)).not.toBeInTheDocument();
  });
});
