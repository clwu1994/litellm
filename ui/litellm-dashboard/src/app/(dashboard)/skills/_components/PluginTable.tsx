"use client";

import { SortingState } from "@tanstack/react-table";
import { Inbox } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/shared/DataTable";
import { Plugin } from "@/components/claude_code_plugins/types";

import { getPluginTableColumns } from "./PluginTableColumns";

interface PluginTableProps {
  pluginsList: Plugin[];
  isLoading: boolean;
  onDeleteClick: (pluginName: string, displayName: string) => void;
  isAdmin: boolean;
  onPluginClick: (pluginId: string) => void;
}

const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

function EmptyState() {
  const { t } = useTranslation("skills");
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">{t("table.empty.title")}</div>
      <div className="text-sm text-muted-foreground">{t("table.empty.body")}</div>
    </div>
  );
}

const PluginTable: React.FC<PluginTableProps> = ({ pluginsList, isLoading, onDeleteClick, isAdmin, onPluginClick }) => {
  const { t } = useTranslation("skills");
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const columns = useMemo(() => {
    const deps = { isAdmin, onPluginClick, onDeleteClick, t };
    return getPluginTableColumns(deps);
  }, [isAdmin, onPluginClick, onDeleteClick, t]);

  return (
    <DataTable
      data={pluginsList}
      paginationMode="client"
      columns={columns}
      getRowId={(plugin, index) => plugin.id || String(index)}
      sortingMode="client"
      sorting={sorting}
      onSortingChange={setSorting}
      isLoading={isLoading}
      loadingMessage={t("table.loading")}
      noDataMessage={<EmptyState />}
      size="compact"
    />
  );
};

export default PluginTable;
