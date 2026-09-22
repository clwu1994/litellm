"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentUpload } from "@/components/vector_store_management/types";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

interface StatusConfig {
  tone: StatusTone;
  labelKey?: "documents.status.uploading" | "documents.status.done" | "documents.status.error";
  label?: string;
}

const STATUS_CONFIG: Record<DocumentUpload["status"], StatusConfig> = {
  uploading: { tone: "info", labelKey: "documents.status.uploading" },
  done: { tone: "success", labelKey: "documents.status.done" },
  error: { tone: "error", labelKey: "documents.status.error" },
  removed: { tone: "neutral", label: "Removed" },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function DocumentRowActions({ document, onRemove }: { document: DocumentUpload; onRemove: (uid: string) => void }) {
  const { t } = useTranslation("vectorStores");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("documents.openActionsAria")}
        data-testid={`document-actions-${document.uid}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="document-action-copy"
          onClick={() => void copyToClipboard(document.uid, t("documents.copyIdToast"))}
        >
          <Copy />
          {t("documents.copyId")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="document-action-remove"
          onClick={() => onRemove(document.uid)}
        >
          <Trash2 />
          {t("documents.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DocumentsTableColumnsDeps {
  onRemove: (uid: string) => void;
}

export const getDocumentsTableColumns = (
  { onRemove }: DocumentsTableColumnsDeps,
  t: TFunction<"vectorStores">,
): ColumnDef<DocumentUpload>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("documents.columns.name") },
    header: t("documents.columns.name"),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="block max-w-72 truncate text-sm" title={row.original.name}>
          {row.original.name}
        </span>
        {row.original.size ? (
          <span className="text-xs text-muted-foreground">({formatFileSize(row.original.size)})</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { title: t("documents.columns.status"), skeleton: "badge" },
    header: t("documents.columns.status"),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const config: StatusConfig = STATUS_CONFIG[row.original.status] ?? {
        tone: "neutral",
        label: row.original.status,
      };
      return (
        <StatusBadge
          tone={config.tone}
          label={config.labelKey !== undefined ? t(config.labelKey) : config.label ?? row.original.status}
        />
      );
    },
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("documents.columns.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DocumentRowActions document={row.original} onRemove={onRemove} />
      </div>
    ),
  },
];
