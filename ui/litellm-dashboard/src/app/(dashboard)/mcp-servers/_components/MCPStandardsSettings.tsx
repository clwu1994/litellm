"use client";

import type { ParseKeys } from "i18next";

import { MCPServer } from "@/components/mcp_tools/types";

export interface RequiredFieldDef {
  key: string;
  labelKey: ParseKeys<"mcpServers">;
  descriptionKey: ParseKeys<"mcpServers">;
  check: (server: MCPServer) => boolean;
}

export interface FieldGroup {
  labelKey: ParseKeys<"mcpServers">;
  fields: RequiredFieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    labelKey: "standards.groupDocumentation",
    fields: [
      {
        key: "description",
        labelKey: "view.fields.description",
        descriptionKey: "standards.descriptionRequired",
        check: (s) => !!s.description?.trim(),
      },
      {
        key: "alias",
        labelKey: "view.fields.alias",
        descriptionKey: "standards.aliasRequired",
        check: (s) => !!s.alias?.trim(),
      },
    ],
  },
  {
    labelKey: "standards.groupSource",
    fields: [
      {
        key: "source_url",
        labelKey: "form.sourceUrl.label",
        descriptionKey: "standards.sourceUrlRequired",
        check: (s) => !!s.source_url?.trim(),
      },
    ],
  },
  {
    labelKey: "standards.groupConnection",
    fields: [
      {
        key: "url",
        labelKey: "standards.serverUrlLabel",
        descriptionKey: "standards.serverUrlRequired",
        check: (s) => !!s.url?.trim(),
      },
    ],
  },
  {
    labelKey: "standards.groupSecurity",
    fields: [
      {
        key: "auth_type",
        labelKey: "standards.authConfiguredLabel",
        descriptionKey: "standards.authConfiguredRequired",
        check: (s) => !!s.auth_type && s.auth_type !== "none",
      },
    ],
  },
];

export const MCP_REQUIRED_FIELD_DEFS: RequiredFieldDef[] = FIELD_GROUPS.flatMap((g) => g.fields);

export const SETTINGS_KEY = "mcp_required_fields";
