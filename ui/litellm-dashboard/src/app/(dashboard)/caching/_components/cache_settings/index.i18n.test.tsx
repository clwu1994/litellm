import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";

import CacheSettings from "./index";

const { getCacheSettingsCall, testCacheConnectionCall, updateCacheSettingsCall } = vi.hoisted(() => ({
  getCacheSettingsCall: vi.fn(),
  testCacheConnectionCall: vi.fn(),
  updateCacheSettingsCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getCacheSettingsCall,
  testCacheConnectionCall,
  updateCacheSettingsCall,
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/toast", () => ({
  toast: { info: vi.fn(), success: vi.fn(), fromError: vi.fn() },
}));

const renderSettings = () => renderWithProviders(<CacheSettings accessToken="sk-test" userRole="Admin" userID="u1" />);

const save = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "保存更改" }));

describe("CacheSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    getCacheSettingsCall.mockResolvedValue({ current_values: {} });
    updateCacheSettingsCall.mockResolvedValue({ status: "success" });
    testCacheConnectionCall.mockResolvedValue({ status: "success" });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, subtitle, actions and connection section", async () => {
    renderSettings();

    expect(await screen.findByText("缓存设置")).toBeInTheDocument();
    expect(screen.queryByText("Cache Settings")).not.toBeInTheDocument();
    expect(screen.getByText("为 LiteLLM 配置 Redis 缓存")).toBeInTheDocument();
    expect(screen.queryByText("Configure Redis cache for LiteLLM")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Connection" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();

    expect(screen.getByText("连接设置")).toBeInTheDocument();
    expect(screen.queryByText("Connection Settings")).not.toBeInTheDocument();
    expect(screen.getByText("Redis URL")).toBeInTheDocument();
    expect(
      screen.getByText(
        "完整的 Redis/Valkey 连接 URL（例如 redis://:password@host:6379/1）。设置后，其优先级高于主机、端口、密码和数据库索引。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("主机")).toBeInTheDocument();
    expect(screen.queryByText("Host")).not.toBeInTheDocument();
    expect(screen.getByText("Redis 服务器主机名或 IP 地址")).toBeInTheDocument();
    expect(screen.getByText("端口")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器端口号")).toBeInTheDocument();
    expect(screen.getByText("数据库索引")).toBeInTheDocument();
    expect(screen.getByText("用于隔离缓存的逻辑数据库索引（例如 redis://host:6379/1 中的 1）")).toBeInTheDocument();
    expect(screen.getByText("密码")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器密码")).toBeInTheDocument();
    expect(screen.getByText("用户名")).toBeInTheDocument();
    expect(screen.getByText("Redis 服务器用户名（如需要）")).toBeInTheDocument();
  });

  it("renders the Chinese advanced sections and their fields once expanded", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("连接设置");

    await user.click(screen.getByRole("button", { name: "高级设置" }));
    expect(screen.queryByRole("button", { name: "Advanced Settings" })).not.toBeInTheDocument();

    expect(await screen.findByText("SSL 设置")).toBeInTheDocument();
    expect(screen.queryByText("SSL Settings")).not.toBeInTheDocument();
    expect(screen.getByText("缓存管理")).toBeInTheDocument();
    expect(screen.queryByText("Cache Management")).not.toBeInTheDocument();
    expect(screen.getByText("GCP 认证")).toBeInTheDocument();
    expect(screen.queryByText("GCP Authentication")).not.toBeInTheDocument();

    expect(screen.getByText("SSL")).toBeInTheDocument();
    expect(screen.getByText("启用 SSL/TLS 连接")).toBeInTheDocument();
    expect(screen.getByText("SSL 证书要求")).toBeInTheDocument();
    expect(screen.getByText("SSL 证书要求（None、CERT_REQUIRED、CERT_OPTIONAL）")).toBeInTheDocument();
    expect(screen.getByText("SSL 主机名校验")).toBeInTheDocument();
    expect(screen.getByText("启用 SSL 主机名验证")).toBeInTheDocument();
    expect(screen.getByText("Namespace")).toBeInTheDocument();
    expect(screen.getByText("缓存键的 Namespace 前缀")).toBeInTheDocument();
    expect(screen.getByText("TTL（秒）")).toBeInTheDocument();
    expect(screen.getByText("缓存项的生存时间（秒）")).toBeInTheDocument();
    expect(screen.getByText("最大连接数")).toBeInTheDocument();
    expect(screen.getByText("连接池中的最大连接数")).toBeInTheDocument();
    expect(screen.getByText("GCP 服务账号")).toBeInTheDocument();
    expect(
      screen.getByText(
        "用于 IAM 认证的 GCP 服务账号（例如 projects/-/serviceAccounts/your-sa@project.iam.gserviceaccount.com）",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("GCP SSL CA 证书")).toBeInTheDocument();
    expect(screen.getByText("GCP Memorystore Redis 的 SSL CA 证书文件路径")).toBeInTheDocument();
  });

  it("renders the Chinese cluster section and its startup-nodes field", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "cluster" } });
    renderSettings();

    expect(await screen.findByText("集群配置")).toBeInTheDocument();
    expect(screen.queryByText("Cluster Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("启动节点")).toBeInTheDocument();
    expect(
      screen.getByText('Redis Cluster 的启动节点列表（例如 [{"host": "127.0.0.1", "port": "7001"}]）'),
    ).toBeInTheDocument();
  });

  it("renders the Chinese sentinel section and its fields", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "sentinel" } });
    renderSettings();

    expect(await screen.findByText("哨兵配置")).toBeInTheDocument();
    expect(screen.queryByText("Sentinel Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("哨兵节点")).toBeInTheDocument();
    expect(screen.getByText('Sentinel 节点列表（例如 [["localhost", 26379]]）')).toBeInTheDocument();
    expect(screen.getByText("服务名称")).toBeInTheDocument();
    expect(screen.getByText("Redis Sentinel 的主服务名称")).toBeInTheDocument();
    expect(screen.getByText("哨兵密码")).toBeInTheDocument();
    expect(screen.getByText("用于 Redis Sentinel 认证的密码")).toBeInTheDocument();
  });

  it("renders the Chinese semantic section, its scope options and the already-set secret placeholder", async () => {
    const user = userEvent.setup();
    getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "semantic", password: "***REDACTED***" } });
    renderSettings();

    expect(await screen.findByText("语义配置")).toBeInTheDocument();
    expect(screen.queryByText("Semantic Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("相似度阈值")).toBeInTheDocument();
    expect(screen.getByText("语义缓存的相似度阈值")).toBeInTheDocument();
    expect(screen.getByText("嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("用于语义缓存的嵌入模型")).toBeInTheDocument();
    expect(screen.getByText("语义缓存范围")).toBeInTheDocument();
    expect(
      screen.getByText(
        "谁可以共享语义缓存命中。Key 范围会在某个 Key/团队/组织的所有最终用户之间共享命中；End user 范围还会按最终用户隔离，没有最终用户的请求回退到 Key 范围。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Key（由该 Key/团队/组织的所有最终用户共享）")).toBeInTheDocument();
    expect(screen.queryByText("Key (shared by all end users of the key/team/org)")).not.toBeInTheDocument();

    const password = screen.getByLabelText("密码");
    expect(password).toHaveAttribute("placeholder", "已设置。输入新值以替换。");
    expect(screen.queryByPlaceholderText("Already set. Enter a new value to replace it.")).not.toBeInTheDocument();

    expect(screen.getByPlaceholderText("搜索并选择模型...")).toBeInTheDocument();
    await user.click(screen.getByPlaceholderText("搜索并选择模型..."));
    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    await user.click(screen.getByLabelText("语义缓存范围"));
    expect(await screen.findByRole("option", { name: "End user（按最终用户隔离）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "End user (isolated per end user)" })).not.toBeInTheDocument();
  });

  it("renders the Chinese select placeholder when the semantic cache scope has no value", async () => {
    getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "semantic", semantic_cache_scope: "" } });
    renderSettings();

    expect(await screen.findByText("选择一个选项")).toBeInTheDocument();
    expect(screen.queryByText("Select an option")).not.toBeInTheDocument();
  });

  it("surfaces every Chinese inline validation message", async () => {
    const user = userEvent.setup();
    getCacheSettingsCall.mockResolvedValue({ current_values: { redis_type: "cluster" } });
    renderSettings();

    fireEvent.change(await screen.findByLabelText("端口"), { target: { value: "99999" } });
    await save(user);
    expect(await screen.findByText("端口必须是 1 到 65535 之间的整数")).toBeInTheDocument();
    expect(screen.queryByText(/Port must be an integer between 1 and 65535/)).not.toBeInTheDocument();
    expect(updateCacheSettingsCall).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("启动节点"), { target: { value: "not json" } });
    await save(user);
    expect(await screen.findByText("必须是有效的 JSON 数组（使用双引号）")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("启动节点"), { target: { value: "123" } });
    await save(user);
    expect(await screen.findByText("必须是 JSON 数组")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("数据库索引"), { target: { value: "-1" } });
    await save(user);
    expect(await screen.findByText("必须是非负整数")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "高级设置" }));
    fireEvent.change(await screen.findByLabelText("TTL（秒）"), { target: { value: "abc" } });
    await save(user);
    expect(await screen.findByText("必须是数字")).toBeInTheDocument();
  });

  it("reports the Chinese save and connection-test toasts", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("连接设置");

    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("缓存连接测试成功！"));

    await save(user);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("缓存设置更新成功"));

    testCacheConnectionCall.mockResolvedValue({ status: "failed", message: "boom" });
    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("连接测试失败：boom"));

    testCacheConnectionCall.mockRejectedValue("boom");
    await user.click(screen.getByRole("button", { name: "测试连接" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("连接测试失败：未知错误"));

    updateCacheSettingsCall.mockRejectedValue(new Error("nope"));
    await save(user);
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新缓存设置失败"));

    getCacheSettingsCall.mockRejectedValue(new Error("nope"));
    cleanup();
    renderSettings();
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载缓存设置失败"));
  });

  it("renders the Chinese in-flight action labels while a request is pending", async () => {
    const user = userEvent.setup();
    testCacheConnectionCall.mockReturnValue(new Promise(() => {}));
    updateCacheSettingsCall.mockReturnValue(new Promise(() => {}));
    renderSettings();
    await screen.findByText("连接设置");

    await user.click(screen.getByRole("button", { name: "测试连接" }));
    expect(await screen.findByRole("button", { name: "测试中..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Testing..." })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("button", { name: "保存中..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });
});
