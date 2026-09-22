"use client";

import type { TFunction } from "i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MemoryRow } from "@/components/networking";
import { DateCell, IdCell, IdentityCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { teamDetailHref, userDetailHref } from "@/utils/entityLinks";

interface MemoryRowActionsProps {
  row: MemoryRow;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

function MemoryRowActions({ row, onViewClick, onEditClick, onDeleteClick }: MemoryRowActionsProps) {
  const { t } = useTranslation("memory");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("table.rowActions.open")}
        data-testid={`memory-actions-${row.memory_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem data-testid="memory-action-view" onClick={() => onViewClick(row)}>
          <Eye />
          {t("table.rowActions.view")}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="memory-action-edit" onClick={() => onEditClick(row)}>
          <Pencil />
          {t("table.rowActions.edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" data-testid="memory-action-delete" onClick={() => onDeleteClick(row)}>
          <Trash2 />
          {t("table.rowActions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface MemoryTableColumnsDeps {
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
  t: TFunction<"memory">;
}

export const getMemoryTableColumns = ({
  onViewClick,
  onEditClick,
  onDeleteClick,
  t,
}: MemoryTableColumnsDeps): ColumnDef<MemoryRow>[] => [
  {
    id: "memory_id",
    accessorKey: "memory_id",
    meta: { title: t("table.columns.id") },
    header: t("table.columns.id"),
    size: 180,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.memory_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onViewClick(row.original)}
      />
    ),
  },
  {
    id: "key",
    accessorKey: "key",
    meta: { title: t("table.columns.name") },
    header: t("table.columns.name"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-52 truncate font-mono text-xs" title={row.original.key}>
        {row.original.key}
      </span>
    ),
  },
  {
    id: "value",
    accessorKey: "value",
    meta: { title: t("table.columns.preview") },
    header: t("table.columns.preview"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm text-muted-foreground" title={row.original.value}>
        {row.original.value || "-"}
      </span>
    ),
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: { title: t("table.columns.userId") },
    header: t("table.columns.userId"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const userId = row.original.user_id;
      return <IdCell value={userId} href={userId ? userDetailHref(userId) : undefined} />;
    },
  },
  {
    id: "team_id",
    accessorKey: "team_id",
    meta: { title: t("table.columns.teamId") },
    header: t("table.columns.teamId"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const teamId = row.original.team_id;
      return <IdCell value={teamId} href={teamId ? teamDetailHref(teamId) : undefined} />;
    },
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: { title: t("table.columns.updated") },
    header: t("table.columns.updated"),
    size: 170,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("table.columns.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MemoryRowActions
          row={row.original}
          onViewClick={onViewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      </div>
    ),
  },
];
