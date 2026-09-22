import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders as render } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import MCPConnectPicker from "./MCPConnectPicker";
import { fetchMCPServers, listMCPTools } from "../networking";
import type { MCPServer } from "../mcp_tools/types";

vi.mock("../networking", () => ({
  fetchMCPServers: vi.fn(),
  listMCPTools: vi.fn(),
}));

const servers = [{ server_id: "srv-1", server_name: "github", alias: "github" }] as MCPServer[];

const renderPicker = (onChange = vi.fn()) =>
  render(<MCPConnectPicker accessToken="tok" selectedServers={[]} onChange={onChange} />);

describe("MCPConnectPicker Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state while hiding the English original", async () => {
    vi.mocked(fetchMCPServers).mockResolvedValue([]);
    renderPicker();

    expect(await screen.findByText("尚未配置 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("No MCP servers configured")).not.toBeInTheDocument();
  });

  it("renders the Chinese tool-load warning while hiding the English original", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(fetchMCPServers).mockResolvedValue(servers);
    vi.mocked(listMCPTools).mockRejectedValue(new Error("boom"));
    renderPicker();

    await user.click(await screen.findByRole("switch"));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith("无法加载 github 的工具，该服务器将从本次消息中排除。"),
    );
    expect(toast.warning).not.toHaveBeenCalledWith(
      "Could not load tools for github — it will be excluded from this message.",
    );
  });
});
