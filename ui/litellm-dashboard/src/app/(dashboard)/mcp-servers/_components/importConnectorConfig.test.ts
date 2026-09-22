import { describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { parseConnectorConfig as parseConnectorConfigWithT } from "./importConnectorConfig";

const en = i18n.getFixedT("en", "mcpServers");
const zh = i18n.getFixedT("zh", "mcpServers");

// The parser takes the translation function so it never reaches for the global singleton. This
// wrapper keeps every existing assertion on the English copy; the last case pins the Chinese.
const parseConnectorConfig = (text: string) => parseConnectorConfigWithT(text, en);

describe("parseConnectorConfig", () => {
  it("accepts a Claude Desktop mcpServers mapping", () => {
    const result = parseConnectorConfig(
      JSON.stringify({
        mcpServers: {
          github: { url: "https://api.example.com/mcp", authorization_token: "tok" },
          local: { command: "npx", args: ["-y", "@example/server"] },
        },
      }),
    );
    expect(result).toEqual({
      ok: true,
      payload: {
        mcpServers: {
          github: { url: "https://api.example.com/mcp", authorization_token: "tok" },
          local: { command: "npx", args: ["-y", "@example/server"] },
        },
      },
      connectorCount: 2,
    });
  });

  it("accepts an Anthropic Messages API mcp_servers array", () => {
    const result = parseConnectorConfig(
      JSON.stringify({
        mcp_servers: [{ type: "url", url: "https://mcp.example.com/sse", name: "deepwiki" }],
      }),
    );
    expect(result).toEqual({
      ok: true,
      payload: { mcp_servers: [{ type: "url", url: "https://mcp.example.com/sse", name: "deepwiki" }] },
      connectorCount: 1,
    });
  });

  it("rejects empty input", () => {
    const result = parseConnectorConfig("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Paste your connector JSON");
  });

  it("rejects malformed JSON", () => {
    const result = parseConnectorConfig("{ not json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid JSON");
  });

  it("rejects objects without a recognized key", () => {
    const result = parseConnectorConfig(JSON.stringify({ servers: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("mcpServers or mcp_servers");
  });

  it("rejects an empty mcpServers mapping", () => {
    const result = parseConnectorConfig(JSON.stringify({ mcpServers: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("no connectors");
  });

  it("rejects a non-array mcp_servers", () => {
    const result = parseConnectorConfig(JSON.stringify({ mcp_servers: { a: 1 } }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("must be an array");
  });

  it("rejects an array mcpServers", () => {
    const result = parseConnectorConfig(JSON.stringify({ mcpServers: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("must be an object");
  });

  it("renders every parse error in Chinese through the passed translation function", () => {
    const errorFor = (text: string): string => {
      const result = parseConnectorConfigWithT(text, zh);
      expect(result.ok).toBe(false);
      return result.ok ? "" : result.error;
    };

    expect(errorFor("   ")).toBe("导入前请先粘贴连接器 JSON。");
    expect(errorFor("{ not json")).toBe("JSON 无效。请检查缺失的引号、逗号或括号。");
    expect(errorFor(JSON.stringify({ servers: {} }))).toBe("需要一个包含 mcpServers 或 mcp_servers 键的 JSON 对象。");
    expect(errorFor(JSON.stringify({ mcpServers: [] }))).toBe("mcpServers 必须是连接器名称到定义的映射对象。");
    expect(errorFor(JSON.stringify({ mcpServers: {} }))).toBe("mcpServers 不包含任何连接器。");
    expect(errorFor(JSON.stringify({ mcp_servers: { a: 1 } }))).toBe("mcp_servers 必须是连接器定义数组。");
    expect(errorFor(JSON.stringify({ mcp_servers: [] }))).toBe("mcp_servers 不包含任何连接器。");
  });
});
