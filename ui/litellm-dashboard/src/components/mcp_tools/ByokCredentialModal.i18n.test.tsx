import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { registerAuthHeaderNameGetter, registerAuthTokenGetter, registerBaseUrlGetter } from "@/lib/http/runtime";
import { toast } from "@/lib/toast";

import { ByokCredentialModal } from "./ByokCredentialModal";
import type { MCPServer } from "./types";

const fetchSpy = vi.hoisted(() => {
  const spy = vi.fn<(request: Request) => Promise<Response>>();
  vi.stubGlobal("fetch", spy);
  return spy;
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const SERVER = {
  server_id: "srv-1",
  alias: "Linear",
  server_name: "Linear",
  byok_description: ["Read your issues", "Create issues"],
  byok_api_key_help_url: "https://linear.app/settings/api",
} as MCPServer;

const renderModal = (server: MCPServer = SERVER) =>
  render(<ByokCredentialModal server={server} open onClose={() => {}} onSuccess={vi.fn()} />);

const toStepTwo = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "继续认证" }));
};

describe("ByokCredentialModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    fetchSpy.mockReset();
    registerBaseUrlGetter(() => "");
    registerAuthTokenGetter(() => "sk-session");
    registerAuthHeaderNameGetter(() => "Authorization");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the connect step in Chinese and hides the English originals", () => {
    renderModal();

    expect(screen.getByText("连接 Linear")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 需要访问 Linear 才能完成你的请求。")).toBeInTheDocument();
    expect(screen.getByText("工作原理")).toBeInTheDocument();
    expect(
      screen.getByText("LiteLLM 充当安全桥梁。你的请求通过我们的 MCP 客户端直接路由到 Linear 的 API。"),
    ).toBeInTheDocument();
    expect(screen.getByText("请求的访问权限")).toBeInTheDocument();
    expect(screen.getByText("Read your issues")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续认证" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByText("Connect Linear")).not.toBeInTheDocument();
    expect(screen.queryByText("LiteLLM needs access to Linear to complete your request.")).not.toBeInTheDocument();
    expect(screen.queryByText("How it works")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "LiteLLM acts as a secure bridge. Your requests are routed through our MCP client directly to Linear's API.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Requested Access")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the fallback server name in Chinese and hides the English original", () => {
    renderModal({ server_id: "srv-2" } as MCPServer);

    expect(screen.getByText("连接 服务")).toBeInTheDocument();
    expect(screen.queryByText("Connect Service")).not.toBeInTheDocument();
  });

  it("renders the credential step in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderModal();
    await toStepTwo(user);

    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.getByText("提供 API Key")).toBeInTheDocument();
    expect(screen.getByText("输入你的 Linear API Key 以授权此连接。")).toBeInTheDocument();
    expect(screen.getByText("Linear API Key")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 API Key")).toBeInTheDocument();
    expect(screen.getByText("在哪里可以找到我的 API Key？")).toBeInTheDocument();
    expect(screen.getByText("保存 Key 以供将来使用")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "保存 Key 以供将来使用" })).toBeInTheDocument();
    expect(screen.getByText("你的 Key 会被安全存储并通过 HTTPS 传输。绝不会与第三方共享。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "连接并授权" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.queryByText("Provide API Key")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter your Linear API key to authorize this connection.")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your API key")).not.toBeInTheDocument();
    expect(screen.queryByText("Where do I find my API key?")).not.toBeInTheDocument();
    expect(screen.queryByText("Save key for future use")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your key is stored securely and transmitted over HTTPS. It is never shared with third parties.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Connect & Authorize/ })).not.toBeInTheDocument();
  });

  it("renders the empty-key and success toasts in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    fetchSpy.mockResolvedValue(jsonResponse({ server_id: "srv-1", has_credential: true }));
    renderModal();
    await toStepTwo(user);

    await user.click(screen.getByRole("button", { name: "连接并授权" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("请输入你的 API Key"));
    expect(toast.error).not.toHaveBeenCalledWith("Please enter your API key");

    await user.type(screen.getByPlaceholderText("输入你的 API Key"), "linear-key");
    await user.click(screen.getByRole("button", { name: "连接并授权" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已连接到 Linear"));
    expect(toast.success).not.toHaveBeenCalledWith("Connected to Linear");
  });

  it("renders the connection-failure toast in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    fetchSpy.mockRejectedValue("nope");
    renderModal();
    await toStepTwo(user);

    await user.type(screen.getByPlaceholderText("输入你的 API Key"), "linear-key");
    await user.click(screen.getByRole("button", { name: "连接并授权" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("连接失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to connect");
  });
});
