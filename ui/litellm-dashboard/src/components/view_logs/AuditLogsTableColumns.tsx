"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import { DateCell, IdCell, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";

import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";

export type AuditLogEntry = {
  id: string;
  updated_at: string;
  changed_by: string;
  changed_by_api_key: string;
  action: string;
  table_name: string;
  object_id: string;
  before_value: Record<string, unknown>;
  updated_values: Record<string, unknown>;
};

type AuditTableNameKey =
  | "audit.table.name.keys"
  | "audit.table.name.teams"
  | "audit.table.name.users"
  | "audit.table.name.organizations"
  | "audit.table.name.models";

const AUDIT_TABLE_NAME_LABEL_KEYS: Record<string, AuditTableNameKey | undefined> = {
  LiteLLM_VerificationToken: "audit.table.name.keys",
  LiteLLM_TeamTable: "audit.table.name.teams",
  LiteLLM_UserTable: "audit.table.name.users",
  LiteLLM_OrganizationTable: "audit.table.name.organizations",
  LiteLLM_ProxyModelTable: "audit.table.name.models",
};

export const getAuditTableNameDisplay = (tableName: string, t: TFunction<"logs">): string => {
  const labelKey = AUDIT_TABLE_NAME_LABEL_KEYS[tableName];
  return labelKey ? t(labelKey) : tableName;
};

const ACTION_TONE: Record<string, StatusTone> = {
  created: "success",
  updated: "info",
  deleted: "error",
  rotated: "warning",
};

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

interface AuditLogsTableColumnsDeps {
  onViewLog: (log: AuditLogEntry) => void;
}

export const getAuditLogsTableColumns = (
  { onViewLog }: AuditLogsTableColumnsDeps,
  t: TFunction<"logs">,
): ColumnDef<AuditLogEntry>[] => [
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: t("audit.table.header.timestamp"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "action",
    accessorKey: "action",
    header: t("audit.table.header.action"),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={ACTION_TONE[row.original.action] ?? "neutral"} label={capitalize(row.original.action)} />
    ),
  },
  {
    id: "table_name",
    accessorKey: "table_name",
    header: t("audit.table.header.table"),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm">{getAuditTableNameDisplay(row.original.table_name, t)}</span>,
  },
  {
    id: "object_id",
    accessorKey: "object_id",
    header: t("audit.table.header.objectId"),
    minSize: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.object_id}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-72"
        onClick={() => onViewLog(row.original)}
      />
    ),
  },
  {
    id: "changed_by",
    accessorKey: "changed_by",
    header: t("audit.table.header.changedBy"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DefaultProxyAdminTag userId={row.original.changed_by} />,
  },
  {
    id: "changed_by_api_key",
    accessorKey: "changed_by_api_key",
    header: t("audit.table.header.apiKeyHash"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.changed_by_api_key} variant="plain" />,
  },
];
