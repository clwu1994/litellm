import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { fetchDiscoverableMCPServers } from "@/components/networking";
import { setServerRootPath } from "@/lib/serverRootPath";
import type { DiscoverableMCPServer } from "@/components/mcp_tools/types";

import MCPDiscovery from "./mcp_discovery";

vi.mock("@/components/networking", () => ({
  fetchDiscoverableMCPServers: vi.fn(),
}));

const githubServer = {
  name: "github",
  title: "GitHub",
  description: "Code hosting",
  category: "Developer Tools",
  icon_url: "",
} as DiscoverableMCPServer;

const uncategorizedServer = {
  name: "custom",
  title: "Custom",
  description: "No category",
  category: "",
  icon_url: "",
} as DiscoverableMCPServer;

const defaultProps = {
  isVisible: true,
  onClose: vi.fn(),
  onSelectServer: vi.fn(),
  onCustomServer: vi.fn(),
  accessToken: "tok",
};

const renderDiscovery = () => renderWithProviders(<MCPDiscovery {...defaultProps} />);

describe("MCPDiscovery Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setServerRootPath("/");
    vi.mocked(fetchDiscoverableMCPServers).mockResolvedValue({
      servers: [githubServer],
      categories: ["Developer Tools"],
    });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    setServerRootPath("/");
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome and hides the English originals", async () => {
    renderDiscovery();

    expect(await screen.findByText("添加 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Add MCP Server")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 自定义服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Custom Server" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索服务器…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search servers...")).not.toBeInTheDocument();
    expect(screen.getByAltText("MCP 标志")).toBeInTheDocument();
    expect(screen.queryByAltText("MCP Logo")).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback category heading for an uncategorized server", async () => {
    vi.mocked(fetchDiscoverableMCPServers).mockResolvedValue({
      servers: [uncategorizedServer],
      categories: [],
    });
    renderDiscovery();

    expect(await screen.findByText("其他")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English originals", async () => {
    vi.mocked(fetchDiscoverableMCPServers).mockResolvedValue({ servers: [], categories: [] });
    renderDiscovery();

    expect(await screen.findByText("未找到服务器。")).toBeInTheDocument();
    expect(screen.queryByText("No servers found.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加自定义服务器" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add a custom server" })).not.toBeInTheDocument();
  });

  it("renders the Chinese load-failure message and hides the English original", async () => {
    vi.mocked(fetchDiscoverableMCPServers).mockRejectedValue(new Error("boom"));
    renderDiscovery();

    expect(await screen.findByText("加载服务器失败：boom")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load servers: boom")).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback load-failure message and hides the English original", async () => {
    vi.mocked(fetchDiscoverableMCPServers).mockRejectedValue(new Error(""));
    renderDiscovery();

    expect(await screen.findByText("加载服务器失败：加载 MCP 服务器失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load servers: Failed to load MCP servers")).not.toBeInTheDocument();
  });
});
