import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPNetworkSettings from "./MCPNetworkSettings";

vi.mock("@/components/networking", () => ({
  getGeneralSettingsCall: vi.fn(),
  updateConfigFieldSetting: vi.fn(),
  deleteConfigFieldSetting: vi.fn(),
  fetchMCPClientIp: vi.fn(),
}));

import {
  deleteConfigFieldSetting,
  fetchMCPClientIp,
  getGeneralSettingsCall,
  updateConfigFieldSetting,
} from "@/components/networking";

describe("MCPNetworkSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getGeneralSettingsCall).mockResolvedValue([]);
    vi.mocked(fetchMCPClientIp).mockResolvedValue("203.0.113.45");
    vi.mocked(updateConfigFieldSetting).mockResolvedValue(undefined);
    vi.mocked(deleteConfigFieldSetting).mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, description and range list chrome and hides the English originals", async () => {
    vi.mocked(getGeneralSettingsCall).mockResolvedValue([
      { field_name: "mcp_internal_ip_ranges", field_value: ["10.0.0.0/8"] },
    ]);

    renderWithProviders(<MCPNetworkSettings accessToken="tok" />);

    expect(await screen.findByText("私有 IP 范围")).toBeInTheDocument();
    expect(screen.queryByText("Private IP Ranges")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "定义哪些 IP 范围属于你的私有网络。来自这些 IP 的调用方可以看到所有 MCP 服务器。来自其他任何 IP 的调用方只能看到标记为“可在公共互联网访问”的服务器。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Define which IP ranges are part of your private network. Callers from these IPs can see all MCP servers. Callers from any other IP can only see servers marked "Available on Public Internet".',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("你的私有网络范围")).toBeInTheDocument();
    expect(screen.queryByText("Your Private Network Ranges")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除 10.0.0.0/8" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove 10.0.0.0/8" })).not.toBeInTheDocument();
  });

  it("renders the Chinese current-IP and suggested-range copy and hides the English originals", async () => {
    renderWithProviders(<MCPNetworkSettings accessToken="tok" />);

    expect(await screen.findByText("你当前的 IP：")).toBeInTheDocument();
    expect(screen.queryByText("Your current IP:")).not.toBeInTheDocument();
    expect(screen.getByText("建议范围：")).toBeInTheDocument();
    expect(screen.queryByText("Suggested range:")).not.toBeInTheDocument();
  });

  it("renders the Chinese range placeholder, hint and save button and hides the English originals", async () => {
    renderWithProviders(<MCPNetworkSettings accessToken="tok" />);

    expect(
      await screen.findByPlaceholderText("留空以使用默认值：10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        "Leave empty to use defaults: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("输入 CIDR 范围（例如 10.0.0.0/8）。为空时，将使用标准私有 IP 范围。")).toBeInTheDocument();
    expect(
      screen.queryByText("Enter CIDR ranges (e.g., 10.0.0.0/8). When empty, standard private IP ranges are used."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Save$/ })).not.toBeInTheDocument();
  });

  it("removes a range through the Chinese aria-label", async () => {
    vi.mocked(getGeneralSettingsCall).mockResolvedValue([
      { field_name: "mcp_internal_ip_ranges", field_value: ["10.0.0.0/8"] },
    ]);
    const user = userEvent.setup();

    renderWithProviders(<MCPNetworkSettings accessToken="tok" />);
    await user.click(await screen.findByRole("button", { name: "移除 10.0.0.0/8" }));

    expect(screen.queryByText("10.0.0.0/8")).not.toBeInTheDocument();
  });
});
