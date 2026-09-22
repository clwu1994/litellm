import type { TFunction } from "i18next";

export interface MCPConnectorImportResult {
  name: string;
  server_id: string;
  alias: string;
}

export interface MCPConnectorImportSkipped {
  name: string;
  reason: string;
}

export interface MCPConnectorImportFailure {
  name: string;
  error: string;
}

export interface MCPConnectorImportResponse {
  imported: MCPConnectorImportResult[];
  skipped: MCPConnectorImportSkipped[];
  errors: MCPConnectorImportFailure[];
}

export type ParsedConnectorConfig =
  | { ok: true; payload: Record<string, unknown>; connectorCount: number }
  | { ok: false; error: string };

export const parseConnectorConfig = (text: string, t: TFunction<"mcpServers">): ParsedConnectorConfig => {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: t("importParse.emptyInput") };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: t("importParse.invalidJson") };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: t("importParse.expectedKey") };
  }
  const record = parsed as Record<string, unknown>;
  const mapping = record.mcpServers;
  if (mapping !== undefined) {
    if (typeof mapping !== "object" || mapping === null || Array.isArray(mapping)) {
      return { ok: false, error: t("importParse.mcpServersMustBeObject") };
    }
    const connectorCount = Object.keys(mapping).length;
    if (connectorCount === 0) {
      return { ok: false, error: t("importParse.mcpServersEmpty") };
    }
    return { ok: true, payload: { mcpServers: mapping }, connectorCount };
  }
  const list = record.mcp_servers;
  if (list !== undefined) {
    if (!Array.isArray(list)) {
      return { ok: false, error: t("importParse.mcpServersMustBeArray") };
    }
    if (list.length === 0) {
      return { ok: false, error: t("importParse.mcpServersArrayEmpty") };
    }
    return { ok: true, payload: { mcp_servers: list }, connectorCount: list.length };
  }
  return { ok: false, error: t("importParse.expectedKey") };
};
