import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { useMCPAccessGroups } from "@/app/(dashboard)/hooks/mcpServers/useMCPAccessGroups";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcpServers/useMCPToolsets";

import MCPServerSelector from "./MCPServerSelector";

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({ useMCPServers: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPAccessGroups", () => ({ useMCPAccessGroups: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({ useMCPToolsets: vi.fn() }));

const mockCatalog = (
  servers: Array<{ server_id: string; server_name?: string }> = [{ server_id: "srv-1", server_name: "Server One" }],
  accessGroups: string[] = ["production-group"],
  toolsets: Array<{ toolset_id: string; toolset_name: string }> = [
    { toolset_id: "ts-1", toolset_name: "Support Toolset" },
  ],
) => {
  vi.mocked(useMCPServers).mockReturnValue({ data: servers, isLoading: false } as unknown as ReturnType<
    typeof useMCPServers
  >);
  vi.mocked(useMCPAccessGroups).mockReturnValue({ data: accessGroups, isLoading: false } as unknown as ReturnType<
    typeof useMCPAccessGroups
  >);
  vi.mocked(useMCPToolsets).mockReturnValue({ data: toolsets, isLoading: false } as unknown as ReturnType<
    typeof useMCPToolsets
  >);
};

const renderSelector = (props: Partial<ComponentProps<typeof MCPServerSelector>> = {}) => {
  mockCatalog();
  return renderWithProviders(
    <MCPServerSelector accessToken="tok" onChange={vi.fn()} value={{ servers: [], accessGroups: [] }} {...props} />,
  );
};

const openSelector = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("combobox"));
  await screen.findAllByRole("option");
};

describe("MCPServerSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the default placeholder in Chinese and hides the English original", () => {
    renderSelector();

    expect(screen.getByPlaceholderText("选择 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers")).not.toBeInTheDocument();
  });

  it("renders the Chinese option type descriptions and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSelector();

    await openSelector(user);

    expect(screen.getByText("访问组")).toBeInTheDocument();
    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("工具集")).toBeInTheDocument();
    expect(screen.queryByText("Access Group")).not.toBeInTheDocument();
    expect(screen.queryByText("MCP Server")).not.toBeInTheDocument();
    expect(screen.queryByText("Toolset")).not.toBeInTheDocument();
  });

  it("renders the Chinese All Proxy MCP Servers option and hides the English original", async () => {
    const user = userEvent.setup();
    renderSelector({ allowAllProxyMcpServers: true });

    await openSelector(user);

    expect(screen.getByText("所有代理 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("All Proxy MCP Servers")).not.toBeInTheDocument();
  });

  it("renders the Chinese No MCP Servers option and its Block all description and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSelector({ allowNoMcpServers: true });

    await openSelector(user);

    expect(screen.getByText("无 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("全部阻止")).toBeInTheDocument();
    expect(screen.queryByText("No MCP Servers")).not.toBeInTheDocument();
    expect(screen.queryByText("Block all")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    const user = userEvent.setup();
    mockCatalog([], [], []);
    renderWithProviders(
      <MCPServerSelector accessToken="tok" onChange={vi.fn()} value={{ servers: [], accessGroups: [] }} />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("No MCP servers found")).not.toBeInTheDocument();
  });
});
