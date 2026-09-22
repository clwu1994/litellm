import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MCPCredentialsTab from "./MCPCredentialsTab";
import { deleteMCPOAuthUserCredential, listMCPUserCredentials } from "../networking";

vi.mock("../networking", () => ({
  listMCPUserCredentials: vi.fn(),
  deleteMCPOAuthUserCredential: vi.fn(),
}));

const mockedList = vi.mocked(listMCPUserCredentials);
const mockedDelete = vi.mocked(deleteMCPOAuthUserCredential);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MINUTE = 60 * 1000;

const credential = (overrides: Record<string, unknown> = {}) => ({
  server_id: "srv-1",
  alias: "github",
  server_name: "github-mcp",
  connected_at: new Date().toISOString(),
  expires_at: null,
  ...overrides,
});

const renderTab = (token: string) => render(<MCPCredentialsTab accessToken={token} />);

describe("MCPCredentialsTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header and empty state while hiding the English originals", async () => {
    mockedList.mockResolvedValue([]);
    renderTab("cred-empty");

    expect(await screen.findByText("应用凭证")).toBeInTheDocument();
    expect(screen.queryByText("App Credentials")).not.toBeInTheDocument();
    expect(screen.getByText("你已保存的 OAuth 连接；会在对话中自动使用")).toBeInTheDocument();
    expect(screen.queryByText("Your stored OAuth connections; used automatically in chat")).not.toBeInTheDocument();
    expect(await screen.findByText("还没有连接")).toBeInTheDocument();
    expect(screen.queryByText("No connections yet")).not.toBeInTheDocument();
    expect(
      screen.getByText((_content, element) => element?.textContent === "前往集成并点击连接以授权 MCP 服务器", {
        selector: "p",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        (_content, element) =>
          element?.textContent === "Go to Integrations and click Connect to authorize an MCP server",
        { selector: "p" },
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese columns, relative time and every expiry badge while hiding the English originals", async () => {
    mockedList.mockResolvedValue([
      credential({ server_id: "srv-never" }),
      credential({ server_id: "srv-expired", expires_at: new Date(Date.now() - HOUR).toISOString() }),
      credential({ server_id: "srv-days", expires_at: new Date(Date.now() + 2 * DAY + MINUTE).toISOString() }),
      credential({ server_id: "srv-hours", expires_at: new Date(Date.now() + 3 * HOUR + MINUTE).toISOString() }),
      credential({ server_id: "srv-minutes", expires_at: new Date(Date.now() + 5 * MINUTE + 1000).toISOString() }),
    ] as never);
    renderTab("cred-rows");

    expect(await screen.findAllByText("github")).toHaveLength(5);
    expect(screen.getByText("应用")).toBeInTheDocument();
    expect(screen.queryByText("App")).not.toBeInTheDocument();
    expect(screen.getByText("连接时间")).toBeInTheDocument();
    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();

    expect(screen.getAllByText("刚刚")).toHaveLength(5);
    expect(screen.queryByText("just now")).not.toBeInTheDocument();

    expect(screen.getByText("不过期")).toBeInTheDocument();
    expect(screen.queryByText("Does not expire")).not.toBeInTheDocument();
    expect(screen.getByText("已过期")).toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
    expect(screen.getByText("2 天后过期")).toBeInTheDocument();
    expect(screen.queryByText("Expires in 2d")).not.toBeInTheDocument();
    expect(screen.getByText("3 小时后过期")).toBeInTheDocument();
    expect(screen.queryByText("Expires in 3h")).not.toBeInTheDocument();
    expect(screen.getByText("5 分钟后过期")).toBeInTheDocument();
    expect(screen.queryByText("Expires in 5m")).not.toBeInTheDocument();
  });

  it("renders the Chinese revoke dialog while hiding the English originals", async () => {
    mockedList.mockResolvedValue([credential()] as never);
    mockedDelete.mockResolvedValue(undefined as never);
    renderTab("cred-revoke");

    const revokeButton = await screen.findByRole("button", { name: "撤销连接" });
    expect(revokeButton).toHaveAttribute("title", "撤销连接");
    expect(screen.queryByTitle("Revoke connection")).not.toBeInTheDocument();

    fireEvent.click(revokeButton);

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("撤销连接？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Revoke connection?")).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("这将删除 github 已保存的 OAuth 凭证。你需要重新连接才能在对话中再次使用。"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "This removes the stored OAuth credential for github. You'll need to reconnect to use it in chat again.",
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "撤销" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();
  });

  it("renders the Chinese revoke failure toast while hiding the English original", async () => {
    mockedList.mockResolvedValue([credential()] as never);
    mockedDelete.mockRejectedValue(new Error("boom"));
    renderTab("cred-failure");

    fireEvent.click(await screen.findByRole("button", { name: "撤销连接" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "撤销" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("撤销连接失败。请重试。"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to revoke connection. Please try again.");
  });
});
