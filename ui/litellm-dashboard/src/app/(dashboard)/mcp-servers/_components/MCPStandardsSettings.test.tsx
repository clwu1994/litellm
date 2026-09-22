import { describe, it, expect } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { FIELD_GROUPS, MCP_REQUIRED_FIELD_DEFS, SETTINGS_KEY } from "./MCPStandardsSettings";
import { MCPServer } from "@/components/mcp_tools/types";

const en = i18n.getFixedT("en", "mcpServers");
const zh = i18n.getFixedT("zh", "mcpServers");

const makeServer = (overrides: Partial<MCPServer> = {}): MCPServer => ({
  server_id: "s1",
  created_at: "2024-01-01",
  created_by: "user",
  updated_at: "2024-01-01",
  updated_by: "user",
  ...overrides,
});

describe("FIELD_GROUPS", () => {
  it("should contain four groups whose labels resolve in order", () => {
    expect(FIELD_GROUPS).toHaveLength(4);
    expect(FIELD_GROUPS.map((g) => en(g.labelKey))).toEqual(["Documentation", "Source", "Connection", "Security"]);
    expect(FIELD_GROUPS.map((g) => zh(g.labelKey))).toEqual(["文档", "来源", "连接", "安全"]);
  });

  it("should resolve every field label and description from the catalog", () => {
    const labels = MCP_REQUIRED_FIELD_DEFS.map((f) => en(f.labelKey));
    expect(labels).toEqual(["Description", "Alias", "GitHub / Source URL", "Server URL", "Auth configured"]);
    expect(MCP_REQUIRED_FIELD_DEFS.map((f) => en(f.descriptionKey))).toEqual([
      "Must have a non-empty description",
      "Must have a display alias",
      "Must link to a source repository",
      "Must have a URL configured",
      "Must use authentication (not 'none')",
    ]);
    expect(MCP_REQUIRED_FIELD_DEFS.map((f) => zh(f.labelKey))).toEqual([
      "描述",
      "别名",
      "GitHub / 源 URL",
      "服务器 URL",
      "已配置认证",
    ]);
    expect(MCP_REQUIRED_FIELD_DEFS.map((f) => zh(f.descriptionKey))).toEqual([
      "必须有非空描述",
      "必须有显示别名",
      "必须链接到源代码仓库",
      "必须配置 URL",
      "必须使用认证（不能是 'none'）",
    ]);
  });
});

describe("MCP_REQUIRED_FIELD_DEFS", () => {
  it("should flatten all fields from groups", () => {
    const totalFields = FIELD_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);
    expect(MCP_REQUIRED_FIELD_DEFS).toHaveLength(totalFields);
  });
});

describe("field check functions", () => {
  const findCheck = (key: string) => MCP_REQUIRED_FIELD_DEFS.find((f) => f.key === key)!.check;

  it("should pass description check when description is present", () => {
    expect(findCheck("description")(makeServer({ description: "A service" }))).toBe(true);
  });

  it("should fail description check when description is empty", () => {
    expect(findCheck("description")(makeServer({ description: "  " }))).toBe(false);
  });

  it("should pass auth check when auth_type is not none", () => {
    expect(findCheck("auth_type")(makeServer({ auth_type: "oauth2" }))).toBe(true);
  });

  it("should fail auth check when auth_type is none", () => {
    expect(findCheck("auth_type")(makeServer({ auth_type: "none" }))).toBe(false);
  });

  it("should fail auth check when auth_type is missing", () => {
    expect(findCheck("auth_type")(makeServer())).toBe(false);
  });
});

describe("SETTINGS_KEY", () => {
  it("should equal mcp_required_fields", () => {
    expect(SETTINGS_KEY).toBe("mcp_required_fields");
  });
});
