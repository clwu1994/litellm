import React from "react";
import { act, fireEvent } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import type { MCPServer, MCPUserEnvVarsStatus } from "@/components/mcp_tools/types";
import * as networking from "@/components/networking";

import { expectPair } from "./mcpI18nTestUtils";
import UserEnvVarsModal from "./UserEnvVarsModal";

vi.mock("@/components/networking", () => ({
  getMCPUserEnvVars: vi.fn(),
  storeMCPUserEnvVars: vi.fn(),
}));

const server = { server_id: "srv-1", server_name: "Payments", alias: "payments" } as MCPServer;

const statusWith = (required: MCPUserEnvVarsStatus["required"]): MCPUserEnvVarsStatus =>
  ({ required }) as MCPUserEnvVarsStatus;

const renderModal = (status: MCPUserEnvVarsStatus, target: MCPServer = server) => {
  vi.mocked(networking.getMCPUserEnvVars).mockResolvedValue(status);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UserEnvVarsModal server={target} open accessToken="sk-test" onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>,
  );
};

const setup = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

const fillField = async (name: string, value: string) => {
  const input = await screen.findByLabelText(new RegExp(`^${name}`));
  await act(async () => {});
  fireEvent.change(screen.getByLabelText(new RegExp(`^${name}`)), { target: { value } });
};

describe("UserEnvVarsModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog title, per-user badge and buttons and hides the English originals", async () => {
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    expect(await screen.findByText("设置你的凭证")).toBeInTheDocument();
    expect(screen.queryByText("Set your credentials")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "保存凭证" })).toBeInTheDocument();
    expectPair("每用户", "Per-user");
    expectPair("取消", "Cancel");
    expect(screen.queryByRole("button", { name: "Save Credentials" })).not.toBeInTheDocument();
  });

  it("renders the Chinese privacy intro and hides the English original", async () => {
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    expect(
      await screen.findByText(
        "这些值仅你可见。你的管理员将此 MCP 服务器配置为需要这些每用户凭证。已保存的值不会回显；将已设置的字段留空可保持不变，或输入值以设置或更改。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "These values are private to you. Your admin configured this MCP server to require these per-user credentials. Saved values are never shown back; leave an already-set field blank to keep it, or enter a value to set or change it.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese enter-your placeholder and hides the English original", async () => {
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    expect(await screen.findByPlaceholderText("输入你的 API_KEY")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your API_KEY")).not.toBeInTheDocument();
  });

  it("renders the Chinese set badge and overwrite placeholder and hides the English originals", async () => {
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: true }]));

    expect(await screen.findByPlaceholderText("输入新值以覆盖")).toBeInTheDocument();
    expectPair("已设置", "Set");
    expect(screen.queryByPlaceholderText("Enter a new value to overwrite")).not.toBeInTheDocument();
  });

  it("renders the Chinese required error and hides the English original", async () => {
    const user = setup();
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    await screen.findByLabelText(/^API_KEY/);
    await user.click(screen.getByRole("button", { name: "保存凭证" }));

    expect(await screen.findByText("API_KEY 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("API_KEY is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    renderModal(statusWith([]));

    expect(await screen.findByText("此服务器未配置任何每用户字段。")).toBeInTheDocument();
    expect(screen.queryByText("No per-user fields configured for this server.")).not.toBeInTheDocument();
  });

  it("renders the Chinese load-failure message and hides the English original", async () => {
    vi.mocked(networking.getMCPUserEnvVars).mockRejectedValue(new Error("boom"));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    render(
      <QueryClientProvider client={queryClient}>
        <UserEnvVarsModal server={server} open accessToken="sk-test" onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("加载环境变量失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load env vars")).not.toBeInTheDocument();
  });

  it("reports the Chinese saved toast", async () => {
    const user = setup();
    vi.mocked(networking.storeMCPUserEnvVars).mockResolvedValue(statusWith([]));
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    await fillField("API_KEY", "secret");
    await user.click(screen.getByRole("button", { name: "保存凭证" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("凭证已保存"));
  });

  it("reports the Chinese save-failure toast with the error message", async () => {
    const user = setup();
    vi.mocked(networking.storeMCPUserEnvVars).mockRejectedValue(new Error("boom"));
    renderModal(statusWith([{ name: "API_KEY", description: null, is_set: false }]));

    await fillField("API_KEY", "secret");
    await user.click(screen.getByRole("button", { name: "保存凭证" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存环境变量失败：boom"));
  });

  it("renders the Chinese fallback server name and hides the English original", async () => {
    renderModal(statusWith([]), { server_id: "" } as MCPServer);

    expect(await screen.findByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP Server")).not.toBeInTheDocument();
  });
});
