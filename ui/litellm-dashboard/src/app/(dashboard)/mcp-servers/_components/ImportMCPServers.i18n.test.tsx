import { act, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { importMCPServers } from "@/components/networking";
import { toast } from "@/lib/toast";

import ImportMCPServers from "./ImportMCPServers";

vi.mock("@/components/networking", () => ({
  importMCPServers: vi.fn(),
}));

const CONNECTOR_JSON = JSON.stringify({ mcpServers: { a: { url: "https://example.com/mcp" } } });

const renderImport = () =>
  renderWithProviders(<ImportMCPServers accessToken="tok" open onClose={vi.fn()} onImported={vi.fn()} />);

const fillAndImport = async (user: ReturnType<typeof userEvent.setup>) => {
  fireEvent.change(screen.getByLabelText("连接器 JSON"), { target: { value: CONNECTOR_JSON } });
  await user.click(screen.getByRole("button", { name: "导入" }));
};

describe("ImportMCPServers Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome and hides the English originals", () => {
    renderImport();

    expect(screen.getByText("导入 MCP 连接器")).toBeInTheDocument();
    expect(screen.queryByText("Import MCP Connectors")).not.toBeInTheDocument();
    expect(screen.getByLabelText("连接器 JSON")).toBeInTheDocument();
    expect(screen.queryByLabelText("Connector JSON")).not.toBeInTheDocument();
    // Both the dialog's own close control and the shared DialogContent's sr-only close
    // render "关闭" now, so assert both are localized and no English "Close" survives.
    expect(screen.getAllByRole("button", { name: "关闭" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导入" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Import" })).not.toBeInTheDocument();
  });

  it("renders the Chinese connector description with the inline code samples and hides the English original", () => {
    renderImport();

    const description = screen.getByText(/粘贴 Anthropic 连接器配置/);
    expect(description).toHaveTextContent(
      "粘贴 Anthropic 连接器配置：来自 Claude Desktop / Claude Code 配置文件的 mcpServers 映射，或来自 Anthropic Messages API 的 mcp_servers 数组。",
    );
    expect(screen.queryByText(/Paste an Anthropic connector configuration/)).not.toBeInTheDocument();
  });

  it("renders the Chinese importing button label while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveImport: (value: unknown) => void = () => {};
    vi.mocked(importMCPServers).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );
    renderImport();

    await fillAndImport(user);

    expect(await screen.findByRole("button", { name: "正在导入…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Importing..." })).not.toBeInTheDocument();

    resolveImport({ imported: [], skipped: [], errors: [] });
  });

  it("renders the Chinese request-failure message and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(importMCPServers).mockRejectedValue(new Error("boom"));
    renderImport();

    await fillAndImport(user);

    expect(await screen.findByText("导入请求失败。请查看 Proxy 日志了解详情。")).toBeInTheDocument();
    expect(screen.queryByText("Import request failed. Check the proxy logs for details.")).not.toBeInTheDocument();
  });

  it("re-renders a stored parse error in the new language", async () => {
    const user = userEvent.setup();
    renderImport();

    fireEvent.change(screen.getByLabelText("连接器 JSON"), { target: { value: "{ not json" } });
    await user.click(screen.getByRole("button", { name: "导入" }));

    expect(await screen.findByText("JSON 无效。请检查缺失的引号、逗号或括号。")).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("en");
    });

    expect(screen.getByText("Invalid JSON. Check for missing quotes, commas, or brackets.")).toBeInTheDocument();
    expect(screen.queryByText("JSON 无效。请检查缺失的引号、逗号或括号。")).not.toBeInTheDocument();
  });

  it.each([
    ["   ", "导入前请先粘贴连接器 JSON。", "Paste your connector JSON before importing."],
    [
      "{ not json",
      "JSON 无效。请检查缺失的引号、逗号或括号。",
      "Invalid JSON. Check for missing quotes, commas, or brackets.",
    ],
    [
      JSON.stringify({ servers: {} }),
      "需要一个包含 mcpServers 或 mcp_servers 键的 JSON 对象。",
      "Expected a JSON object with an mcpServers or mcp_servers key.",
    ],
    [
      JSON.stringify({ mcpServers: [] }),
      "mcpServers 必须是连接器名称到定义的映射对象。",
      "mcpServers must be an object mapping connector names to definitions.",
    ],
    [JSON.stringify({ mcpServers: {} }), "mcpServers 不包含任何连接器。", "mcpServers contains no connectors."],
    [
      JSON.stringify({ mcp_servers: { a: 1 } }),
      "mcp_servers 必须是连接器定义数组。",
      "mcp_servers must be an array of connector definitions.",
    ],
    [JSON.stringify({ mcp_servers: [] }), "mcp_servers 不包含任何连接器。", "mcp_servers contains no connectors."],
  ])("renders the Chinese parse error for %s and hides the English original", async (input, zh, en) => {
    const user = userEvent.setup();
    renderImport();

    fireEvent.change(screen.getByLabelText("连接器 JSON"), { target: { value: input } });
    await user.click(screen.getByRole("button", { name: "导入" }));

    expect(await screen.findByText(zh)).toBeInTheDocument();
    expect(screen.queryByText(en)).not.toBeInTheDocument();
  });

  it("renders the Chinese imported, skipped and failed result labels and hides the English originals", async () => {
    const user = userEvent.setup();
    vi.mocked(importMCPServers).mockResolvedValue({
      imported: [{ name: "a", server_id: "srv-a", alias: "alpha" }],
      skipped: [{ name: "b", reason: "duplicate" }],
      errors: [{ name: "c", error: "invalid" }],
    });
    renderImport();

    await fillAndImport(user);

    expect(await screen.findByText("已导入：")).toBeInTheDocument();
    expect(screen.getByText("已跳过：")).toBeInTheDocument();
    expect(screen.getByText("失败：")).toBeInTheDocument();
    expect(screen.queryByText("Imported:")).not.toBeInTheDocument();
    expect(screen.queryByText("Skipped:")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed:")).not.toBeInTheDocument();
  });

  it("reports the Chinese import toast for a single imported server", async () => {
    const user = userEvent.setup();
    vi.mocked(importMCPServers).mockResolvedValue({
      imported: [{ name: "a", server_id: "srv-a", alias: "alpha" }],
      skipped: [],
      errors: [],
    });
    renderImport();

    await fillAndImport(user);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已导入 1 个 MCP 服务器"));
    expect(toast.success).not.toHaveBeenCalledWith("Imported 1 MCP server");
  });

  it("reports the Chinese import toast for multiple imported servers", async () => {
    const user = userEvent.setup();
    vi.mocked(importMCPServers).mockResolvedValue({
      imported: [
        { name: "a", server_id: "srv-a", alias: "alpha" },
        { name: "b", server_id: "srv-b", alias: "beta" },
      ],
      skipped: [],
      errors: [],
    });
    renderImport();

    await fillAndImport(user);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已导入 2 个 MCP 服务器"));
    expect(toast.success).not.toHaveBeenCalledWith("Imported 2 MCP servers");
  });

  it("keeps the English parse error byte-identical", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    renderImport();

    fireEvent.change(screen.getByLabelText("Connector JSON"), { target: { value: "{ not json" } });
    await user.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByText("Invalid JSON. Check for missing quotes, commas, or brackets.")).toBeInTheDocument();
  });

  it("selects the singular English toast key for a single imported server", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup();
    vi.mocked(importMCPServers).mockResolvedValue({
      imported: [{ name: "a", server_id: "srv-a", alias: "alpha" }],
      skipped: [],
      errors: [],
    });
    renderImport();

    fireEvent.change(screen.getByLabelText("Connector JSON"), { target: { value: CONNECTOR_JSON } });
    await user.click(screen.getByRole("button", { name: "Import" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Imported 1 MCP server"));
    expect(toast.success).not.toHaveBeenCalledWith("Imported 1 MCP servers");
  });
});
