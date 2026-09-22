import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";

import CacheDashboard from "./cache_dashboard";

const { useCacheActivity, cachingHealthCheckCall } = vi.hoisted(() => ({
  useCacheActivity: vi.fn(),
  cachingHealthCheckCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  cachingHealthCheckCall,
}));

vi.mock("@/app/(dashboard)/hooks/caching/useCacheActivity", () => ({
  useCacheActivity,
}));

vi.mock("@/lib/toast", () => ({
  toast: { info: vi.fn(), success: vi.fn(), fromError: vi.fn() },
}));

const cacheActivity = {
  groups: [
    {
      call_type: "acompletion",
      api_requests: 1000,
      cache_hits: 300,
      failed_requests: 200,
      cached_completion_tokens: 12000,
      generated_completion_tokens: 48000,
    },
  ],
  totals: {
    api_requests: 1000,
    cache_hits: 400,
    failed_requests: 200,
    cached_completion_tokens: 14000,
    cache_hit_ratio: 40,
  },
  filter_options: {
    key_aliases: ["my-key"],
    models: ["gpt-5.1"],
  },
  error_breakdown: [],
};

const emptyActivity = {
  ...cacheActivity,
  filter_options: { key_aliases: [], models: [] },
};

const renderDashboard = () =>
  renderWithProviders(
    <CacheDashboard accessToken="sk-test" token="tok" userRole="Admin" userID="u1" premiumUser={false} />,
  );

describe("CacheDashboard Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useCacheActivity.mockReturnValue({ data: cacheActivity, refetch: vi.fn() });
    cachingHealthCheckCall.mockResolvedValue({ status: "healthy" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tabs, analytics description, refresh control and stat labels", async () => {
    renderDashboard();

    expect(await screen.findByText("缓存命中与 API 请求对比")).toBeInTheDocument();
    expect(screen.queryByText("Cache Hits vs API Requests")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "缓存分析" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cache Analytics" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "缓存健康" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cache Health" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "缓存设置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cache Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "协调 Redis" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Coordination Redis" })).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "响应缓存" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "提示词缓存" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "response cache" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "prompt caching" })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent ===
          "用于 LiteLLM 的 响应缓存（例如 Redis / 内存缓存）：这些请求由缓存直接应答，无需调用 LLM 提供商。提供商侧的 提示词缓存（来自 Anthropic、OpenAI 等的缓存输入 Token）不在此处显示；请查看 Usage 页面上的 “Prompt Caching Metrics” 或 Logs 页面中的单个请求。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/is not shown here/)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.getByText(/^上次刷新：.+$/)).toBeInTheDocument();
    expect(screen.queryByText(/^Last Refreshed: .+$/)).not.toBeInTheDocument();

    expect(screen.getByText("缓存命中率")).toBeInTheDocument();
    expect(screen.queryByText("Cache Hit Ratio")).not.toBeInTheDocument();
    expect(screen.getByText("缓存命中")).toBeInTheDocument();
    expect(screen.queryByText("Cache Hits")).not.toBeInTheDocument();
    expect(screen.getAllByText("缓存补全 Token").length).toBeGreaterThan(0);
    expect(screen.getByText("40.00%")).toBeInTheDocument();

    expect(screen.getByText("缓存补全 Token 与生成的补全 Token 对比")).toBeInTheDocument();
    expect(screen.queryByText("Cached Completion Tokens vs Generated Completion Tokens")).not.toBeInTheDocument();
    expect(screen.getByText("点击红色的失败请求分段，查看哪些错误码导致了这些失败。")).toBeInTheDocument();
    expect(
      screen.queryByText("Click a red failed-requests segment to see which error codes caused those failures."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese chart series labels in the legends and hides the English originals", async () => {
    renderDashboard();

    expect(await screen.findByText("LLM API 请求")).toBeInTheDocument();
    expect(screen.getByText("缓存命中请求")).toBeInTheDocument();
    expect(screen.getByText("失败请求")).toBeInTheDocument();
    expect(screen.getByText("生成的补全 Token")).toBeInTheDocument();
    expect(screen.getByText("缓存的补全 Token")).toBeInTheDocument();

    expect(screen.queryByText("LLM API requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Cache hit")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed requests")).not.toBeInTheDocument();
    expect(screen.queryByText("Generated Completion Tokens")).not.toBeInTheDocument();
    expect(screen.queryByText("Cached Completion Tokens")).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown-bucket explanation only when a group has no recorded endpoint", async () => {
    useCacheActivity.mockReturnValue({
      data: {
        ...cacheActivity,
        groups: [
          ...cacheActivity.groups,
          { ...cacheActivity.groups[0], call_type: "Unknown", failed_requests: 121000 },
        ],
      },
      refetch: vi.fn(),
    });
    renderDashboard();

    await screen.findByText("缓存命中与 API 请求对比");

    expect(
      screen.getByText(
        "Unknown 分组来自未记录 Endpoint 的消费日志。旧版代理会在请求被路由前拒绝时写入这些记录，因此它们不一定是 LLM API 请求。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Unknown groups spend logs that recorded no endpoint. Older proxy versions wrote those for requests rejected before routing, so they are not necessarily LLM API requests.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese empty combobox states when there are no filter options", async () => {
    const user = userEvent.setup();
    useCacheActivity.mockReturnValue({ data: emptyActivity, refetch: vi.fn() });
    renderDashboard();

    expect(screen.getByPlaceholderText("选择 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select Virtual Keys")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select Models")).not.toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择 Virtual Key"));
    expect(await screen.findByText("未找到 Virtual Key")).toBeInTheDocument();
    expect(screen.queryByText("No virtual keys found")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(screen.getByPlaceholderText("选择模型"));
    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the Chinese running-health-check toast and the unknown-error fallback", async () => {
    const user = userEvent.setup();
    cachingHealthCheckCall.mockRejectedValue(new Error());
    renderDashboard();

    await user.click(screen.getByRole("tab", { name: "缓存健康" }));
    await user.click(screen.getByRole("button", { name: "运行健康检查" }));

    expect(toast.info).toHaveBeenCalledWith("正在运行缓存健康检查...");
    expect(await screen.findByText("发生未知错误")).toBeInTheDocument();
    expect(screen.queryByText("Unknown error occurred")).not.toBeInTheDocument();
  });
});
