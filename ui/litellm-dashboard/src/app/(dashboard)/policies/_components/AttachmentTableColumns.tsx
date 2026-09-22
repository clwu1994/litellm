"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, StatusBadge } from "@/components/shared/table_cells";
import { PolicyAttachment } from "@/components/policies/types";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

import ImpactPopover from "./impact_popover";

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.slice(0, 2).map((value) => (
        <StatusBadge key={value} tone="neutral" label={value} />
      ))}
      {values.length > 2 && (
        <StatusBadge tone="neutral" label={`+${values.length - 2}`} tooltip={values.slice(2).join(", ")} />
      )}
    </div>
  );
}

interface AttachmentRowActionsProps {
  attachment: PolicyAttachment;
  isAdmin: boolean;
  onDeleteClick: (attachmentId: string) => void;
}

function AttachmentRowActions({ attachment, isAdmin, onDeleteClick }: AttachmentRowActionsProps) {
  const { t } = useTranslation("policies");
  const isConfigAttachment = attachment.definition_location === "config";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("attachments.table.openActionsAria")}
        data-testid={`attachment-actions-${attachment.attachment_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="attachment-action-copy-id"
          onClick={() => void copyToClipboard(attachment.attachment_id, t("attachments.table.copyIdToast"))}
        >
          <Copy />
          {t("attachments.table.copyId")}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="attachment-action-delete"
              disabled={isConfigAttachment}
              title={isConfigAttachment ? t("attachments.table.configHint") : undefined}
              onClick={() => onDeleteClick(attachment.attachment_id)}
            >
              <Trash2 />
              {t("attachments.table.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AttachmentTableColumnsDeps {
  isAdmin: boolean;
  accessToken: string | null;
  onDeleteClick: (attachmentId: string) => void;
}

export const getAttachmentTableColumns = (
  { isAdmin, accessToken, onDeleteClick }: AttachmentTableColumnsDeps,
  t: TFunction<"policies">,
): ColumnDef<PolicyAttachment>[] => [
  {
    id: "attachment_id",
    accessorKey: "attachment_id",
    meta: { title: t("attachments.table.columns.attachmentId") },
    header: t("attachments.table.columns.attachmentId"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.attachment_id} variant="plain" />,
  },
  {
    id: "policy_name",
    accessorKey: "policy_name",
    meta: { title: t("attachments.table.columns.policy"), skeleton: "badge" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("attachments.table.columns.policy")} />,
    size: 180,
    enableSorting: true,
    cell: ({ row }) => <StatusBadge tone="info" label={row.original.policy_name} />,
  },
  {
    id: "scope",
    accessorFn: (row) => row.scope ?? "",
    meta: { title: t("attachments.table.columns.scope"), skeleton: "badge" },
    header: t("attachments.table.columns.scope"),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const scope = row.original.scope;
      if (!scope) {
        return <span className="text-muted-foreground">-</span>;
      }
      if (scope === "*") {
        return <StatusBadge tone="warning" label={t("attachments.scope.global")} />;
      }
      return (
        <span className="block max-w-40 truncate text-xs" title={scope}>
          {scope}
        </span>
      );
    },
  },
  {
    id: "teams",
    meta: { title: t("attachments.table.columns.teams"), skeleton: "chips" },
    header: t("attachments.table.columns.teams"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.teams ?? []} />,
  },
  {
    id: "keys",
    meta: { title: t("attachments.table.columns.keys"), skeleton: "chips" },
    header: t("attachments.table.columns.keys"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.keys ?? []} />,
  },
  {
    id: "models",
    meta: { title: t("attachments.table.columns.models"), skeleton: "chips" },
    header: t("attachments.table.columns.models"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.models ?? []} />,
  },
  {
    id: "tags",
    meta: { title: t("attachments.table.columns.tags"), skeleton: "chips" },
    header: t("attachments.table.columns.tags"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <ChipList values={row.original.tags ?? []} />,
  },
  {
    id: "created_at",
    accessorFn: (row) => row.created_at ?? "",
    meta: { title: t("attachments.table.columns.createdAt") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("attachments.table.columns.createdAt")} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("attachments.table.columns.actions")}</span>,
    size: 88,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <ImpactPopover attachment={row.original} accessToken={accessToken} />
        <AttachmentRowActions attachment={row.original} isAdmin={isAdmin} onDeleteClick={onDeleteClick} />
      </div>
    ),
  },
];
