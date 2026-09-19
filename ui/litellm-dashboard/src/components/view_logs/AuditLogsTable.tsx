"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { ScrollText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AuditLogEntry, getAuditLogsTableColumns, getAuditTableNameDisplay } from "./AuditLogsTableColumns";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh: () => void;
  onViewLog: (log: AuditLogEntry) => void;
}

const ALL_VALUE = "all";

const ACTION_OPTIONS = [
  { label: "Created", value: "created" },
  { label: "Updated", value: "updated" },
  { label: "Deleted", value: "deleted" },
  { label: "Rotated", value: "rotated" },
] as const;

const TABLE_OPTIONS = [
  { labelKey: "audit.table.name.keys", value: "LiteLLM_VerificationToken" },
  { labelKey: "audit.table.name.teams", value: "LiteLLM_TeamTable" },
  { labelKey: "audit.table.name.users", value: "LiteLLM_UserTable" },
  { labelKey: "audit.table.name.organizations", value: "LiteLLM_OrganizationTable" },
  { labelKey: "audit.table.name.models", value: "LiteLLM_ProxyModelTable" },
] as const;

const FILTER_LABEL_KEYS = {
  object_id: "audit.filters.objectId",
  changed_by: "audit.filters.changedBy",
  team_id: "audit.filters.teamId",
  key_hash: "audit.filters.keyHash",
  action: "audit.filters.action",
  table_name: "audit.filters.table",
} as const;

const formatFilterValue = (t: TFunction<"logs">, columnId: string, value: unknown): string => {
  const raw = String(value);
  if (columnId === "action") {
    return ACTION_OPTIONS.find((option) => option.value === raw)?.label ?? raw;
  }
  if (columnId === "table_name") {
    return getAuditTableNameDisplay(raw, t);
  }
  return raw;
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation("logs");
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered ? t("empty.noMatchingAuditLogs") : t("empty.noAuditLogs")}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered ? t("empty.noMatchingAuditLogsHint") : t("empty.noAuditLogsHint")}
      </div>
    </div>
  );
}

export function AuditLogsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  searchValue,
  onSearchChange,
  onRefresh,
  onViewLog,
}: AuditLogsTableProps) {
  const { t } = useTranslation("logs");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog }, t), [onViewLog, t]);
  const hasActiveSearch = Boolean(searchValue?.trim());

  const actionFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("audit.filters.allActions") },
      ...ACTION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    ],
    [t],
  );

  const tableFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("audit.filters.allTables") },
      ...TABLE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    ],
    [t],
  );

  const filterLabels = useMemo(
    () => Object.fromEntries(Object.entries(FILTER_LABEL_KEYS).map(([columnId, key]) => [columnId, t(key)])),
    [t],
  );

  const resolveFilterValue = useCallback(
    (columnId: string, value: unknown) => formatFilterValue(t, columnId, value),
    [t],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      isLoading={isLoading}
      loadingMessage={t("audit.table.loading")}
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0 || hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={t("audit.table.searchPlaceholder")}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={filterLabels}
            formatFilterValue={resolveFilterValue}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("audit.filters.title")}
            description={t("audit.filters.description")}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={t("audit.filters.objectId")}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={t("audit.filters.objectIdPlaceholder")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("audit.filters.changedBy")}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={t("audit.filters.changedByPlaceholder")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("audit.filters.teamId")}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={t("audit.filters.teamIdPlaceholder")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("audit.filters.keyHash")}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={t("audit.filters.keyHashPlaceholder")}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("audit.filters.action")}>
                  <Select
                    items={actionFilterItems}
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("audit.filters.allActions")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("audit.filters.allActions")}</SelectItem>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("audit.filters.table")}>
                  <Select
                    items={tableFilterItems}
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("audit.filters.allTables")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("audit.filters.allTables")}</SelectItem>
                      {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
