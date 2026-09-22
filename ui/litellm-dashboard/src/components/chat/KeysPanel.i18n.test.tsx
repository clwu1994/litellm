import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import KeysPanel from "./KeysPanel";
import { keyListCall, regenerateKeyCall } from "../networking";

vi.mock("../networking", () => ({
  keyListCall: vi.fn(),
  regenerateKeyCall: vi.fn(),
}));

const mockedKeyListCall = vi.mocked(keyListCall);
const mockedRegenerateKeyCall = vi.mocked(regenerateKeyCall);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const keyRow = (overrides: Record<string, unknown> = {}) => ({
  token: "tok-1",
  key_name: "sk-abcdefghijkl",
  key_alias: "my-key",
  spend: 1.5,
  max_budget: 10,
  expires: null,
  created_at: new Date(Date.now() - 2 * DAY).toISOString(),
  ...overrides,
});

const renderPanel = (token: string, premiumUser = true) =>
  render(<KeysPanel accessToken={token} userId="user-1" premiumUser={premiumUser} />);

describe("KeysPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockedKeyListCall.mockResolvedValue({ keys: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header and empty state while hiding the English originals", async () => {
    renderPanel("keys-empty", false);

    expect(await screen.findByText("你的 API Key")).toBeInTheDocument();
    expect(screen.queryByText("Your API Keys")).not.toBeInTheDocument();
    expect(screen.getByText("查看你的 Virtual Key 和消费")).toBeInTheDocument();
    expect(screen.queryByText("View your virtual keys and spend")).not.toBeInTheDocument();
    expect(await screen.findByText("未找到密钥")).toBeInTheDocument();
    expect(screen.queryByText("No keys found")).not.toBeInTheDocument();
  });

  it("renders the Chinese premium subtitle, columns, relative times and never-expires badge", async () => {
    mockedKeyListCall.mockResolvedValue({
      keys: [
        keyRow({ token: "t-now", created_at: new Date().toISOString() }),
        keyRow({ token: "t-min", created_at: new Date(Date.now() - 5 * MINUTE).toISOString() }),
        keyRow({ token: "t-hr", created_at: new Date(Date.now() - 3 * HOUR).toISOString() }),
        keyRow({ token: "t-day", created_at: new Date(Date.now() - 2 * DAY).toISOString() }),
      ],
    });
    renderPanel("keys-rows");

    expect(
      await screen.findByText("查看你的 Virtual Key 和消费。可轮换密钥以生成新凭证，并可选在宽限期内保持旧密钥有效"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "View your virtual keys and spend. Rotate keys to generate new credentials while optionally keeping the old key valid during a grace period",
      ),
    ).not.toBeInTheDocument();

    expect(await screen.findByText("2 天前")).toBeInTheDocument();
    expect(screen.getByText("密钥")).toBeInTheDocument();
    expect(screen.queryByText("Key")).not.toBeInTheDocument();
    expect(screen.getByText("消费")).toBeInTheDocument();
    expect(screen.queryByText("Spend")).not.toBeInTheDocument();
    expect(screen.getByText("过期时间")).toBeInTheDocument();
    expect(screen.queryByText("Expires")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("Created")).not.toBeInTheDocument();

    expect(screen.getAllByText("永不过期")).toHaveLength(4);
    expect(screen.queryByText("Never")).not.toBeInTheDocument();

    expect(screen.getByText("刚刚")).toBeInTheDocument();
    expect(screen.queryByText("just now")).not.toBeInTheDocument();
    expect(screen.getByText("5 分钟前")).toBeInTheDocument();
    expect(screen.queryByText("5m ago")).not.toBeInTheDocument();
    expect(screen.getByText("3 小时前")).toBeInTheDocument();
    expect(screen.queryByText("3h ago")).not.toBeInTheDocument();
    expect(screen.getByText("2 天前")).toBeInTheDocument();
    expect(screen.queryByText("2d ago")).not.toBeInTheDocument();
  });

  it("renders the Chinese rotate tooltip title and expired badge while hiding the English originals", async () => {
    mockedKeyListCall.mockResolvedValue({
      keys: [keyRow({ expires: new Date(Date.now() - DAY).toISOString() })],
    });
    renderPanel("keys-expired");

    expect(await screen.findByText("已过期")).toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();

    const rotateButton = screen.getAllByRole("button", { name: "轮换" })[0];
    expect(rotateButton).toHaveAttribute("title", "轮换密钥");
    expect(screen.queryByTitle("Rotate key")).not.toBeInTheDocument();
  });

  it("renders the Chinese rotate dialog fields while hiding the English originals", async () => {
    mockedKeyListCall.mockResolvedValue({ keys: [keyRow()] });
    renderPanel("keys-dialog");

    fireEvent.click(await screen.findByRole("button", { name: "轮换" }));

    expect(await screen.findByText("轮换密钥")).toBeInTheDocument();
    expect(screen.queryByText("Rotate Key")).not.toBeInTheDocument();
    expect(screen.getByText("密钥别名")).toBeInTheDocument();
    expect(screen.queryByText("Key Alias")).not.toBeInTheDocument();
    expect(screen.getByText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("TPM 上限")).toBeInTheDocument();
    expect(screen.queryByText("TPM Limit")).not.toBeInTheDocument();
    expect(screen.getByText("RPM 上限")).toBeInTheDocument();
    expect(screen.queryByText("RPM Limit")).not.toBeInTheDocument();
    expect(screen.getByText("密钥过期")).toBeInTheDocument();
    expect(screen.queryByText("Expire Key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 30s、30h、30d")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 30s, 30h, 30d")).not.toBeInTheDocument();
    expect(screen.getByText("当前：永不过期")).toBeInTheDocument();
    expect(screen.queryByText("Current: Never")).not.toBeInTheDocument();
    expect(screen.getByText("宽限期")).toBeInTheDocument();
    expect(screen.queryByText("Grace Period")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 24h、2d")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. 24h, 2d")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese validation errors while hiding the English originals", async () => {
    mockedKeyListCall.mockResolvedValue({
      keys: [keyRow({ expires: new Date(Date.now() - DAY).toISOString() })],
    });
    renderPanel("keys-errors");

    fireEvent.click(await screen.findByRole("button", { name: "轮换" }));
    await screen.findByText("轮换密钥");

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "轮换" }));
    expect(await screen.findByText("已过期的密钥必须设置过期时间")).toBeInTheDocument();
    expect(screen.queryByText("Expiration is required for expired keys")).not.toBeInTheDocument();
    expect(screen.getByText(/^当前：\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}（已过期）$/)).toBeInTheDocument();
    expect(screen.queryByText(/\(expired\)/)).not.toBeInTheDocument();

    const durationInput = screen.getByPlaceholderText("例如 30s、30h、30d");
    fireEvent.change(durationInput, { target: { value: "abc" } });
    fireEvent.change(screen.getByPlaceholderText("例如 24h、2d"), { target: { value: "xyz" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "轮换" }));

    expect(await screen.findByText("时长格式须类似 30s、30m、24h、2d、1w 或 1mo")).toBeInTheDocument();
    expect(screen.queryByText("Must be a duration like 30s, 30m, 24h, 2d, 1w, or 1mo")).not.toBeInTheDocument();
    expect(screen.getByText("时长格式须类似 24h、2d")).toBeInTheDocument();
    expect(screen.queryByText("Must be a duration like 24h, 2d")).not.toBeInTheDocument();
  });

  it("renders the Chinese new-expiry preview while hiding the English original", async () => {
    mockedKeyListCall.mockResolvedValue({ keys: [keyRow()] });
    renderPanel("keys-preview");

    fireEvent.click(await screen.findByRole("button", { name: "轮换" }));
    await screen.findByText("轮换密钥");

    fireEvent.change(screen.getByPlaceholderText("例如 30s、30h、30d"), { target: { value: "30s" } });

    expect(await screen.findByText(/^新过期时间：\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.queryByText(/^New: \d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument();
  });

  it("renders the Chinese regenerated-key dialog and success toast while hiding the English originals", async () => {
    mockedKeyListCall.mockResolvedValue({ keys: [keyRow()] });
    mockedRegenerateKeyCall.mockResolvedValue({ key: "sk-new-secret" });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderPanel("keys-success");

    fireEvent.click(await screen.findByRole("button", { name: "轮换" }));
    await screen.findByText("轮换密钥");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "轮换" }));

    expect(await screen.findByText("请立即保存此密钥；之后将无法再次查看")).toBeInTheDocument();
    expect(screen.queryByText("Save this key now; you will not see it again")).not.toBeInTheDocument();
    expect(screen.getByText("新密钥")).toBeInTheDocument();
    expect(screen.queryByText("New Key")).not.toBeInTheDocument();
    const closeButton = within(dialog).getByRole("button", { name: "关闭" });
    expect(closeButton).toHaveTextContent("关闭");
    expect(closeButton).not.toHaveTextContent("Close");
    expect(screen.getByRole("button", { name: "复制密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Key" })).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("密钥轮换成功");
    expect(toast.success).not.toHaveBeenCalledWith("Key rotated successfully");

    fireEvent.click(screen.getByRole("button", { name: "复制密钥" }));
    expect(await screen.findByRole("button", { name: "已复制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copied" })).not.toBeInTheDocument();
  });

  it("renders the Chinese rotate failure toast", async () => {
    mockedKeyListCall.mockResolvedValue({ keys: [keyRow()] });
    mockedRegenerateKeyCall.mockRejectedValue(new Error("boom"));
    renderPanel("keys-failure");

    fireEvent.click(await screen.findByRole("button", { name: "轮换" }));
    await screen.findByText("轮换密钥");
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "轮换" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("密钥轮换失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to rotate key");
  });
});
