import { describe, expect, it } from "vitest";
import { parseConnectorConfig } from "./importConnectorConfig";

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

  it("returns the language-neutral key for every rejection", () => {
    const errorKeyFor = (text: string): string => {
      const result = parseConnectorConfig(text);
      expect(result.ok).toBe(false);
      return result.ok ? "" : result.errorKey;
    };

    expect(errorKeyFor("   ")).toBe("importParse.emptyInput");
    expect(errorKeyFor("{ not json")).toBe("importParse.invalidJson");
    expect(errorKeyFor(JSON.stringify({ servers: {} }))).toBe("importParse.expectedKey");
    expect(errorKeyFor(JSON.stringify({ mcpServers: [] }))).toBe("importParse.mcpServersMustBeObject");
    expect(errorKeyFor(JSON.stringify({ mcpServers: {} }))).toBe("importParse.mcpServersEmpty");
    expect(errorKeyFor(JSON.stringify({ mcp_servers: { a: 1 } }))).toBe("importParse.mcpServersMustBeArray");
    expect(errorKeyFor(JSON.stringify({ mcp_servers: [] }))).toBe("importParse.mcpServersArrayEmpty");
  });
});
