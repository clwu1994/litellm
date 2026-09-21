"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Eye, EyeOff, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { CellTooltip, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

import type { passThroughItem } from "./PassThroughSettings";

function HeaderWithTooltip({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <CellTooltip content={tooltip} trigger={<Info className="size-3.5 cursor-help text-muted-foreground" />} />
    </div>
  );
}

function HeadersCell({ value }: { value: object }) {
  const { t } = useTranslation("models");
  const [showHeaders, setShowHeaders] = useState(false);
  const headerString = JSON.stringify(value);

  return (
    <div className="flex items-center gap-2">
      <span className="block max-w-60 truncate font-mono text-xs">{showHeaders ? headerString : "••••••••"}</span>
      <button
        type="button"
        onClick={() => setShowHeaders(!showHeaders)}
        aria-label={showHeaders ? t("passThrough.headersToggle.hideAria") : t("passThrough.headersToggle.showAria")}
        className="rounded-sm p-1 hover:bg-muted"
      >
        {showHeaders ? (
          <EyeOff className="size-4 text-muted-foreground" />
        ) : (
          <Eye className="size-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function MethodsCell({ methods }: { methods: string[] | undefined }) {
  const { t } = useTranslation("models");
  if (!methods || methods.length === 0) {
    return <Badge variant="secondary">{t("passThrough.table.allMethods")}</Badge>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((method) => (
        <Badge key={method} variant="outline" className="font-mono text-xs font-normal">
          {method}
        </Badge>
      ))}
    </div>
  );
}

interface EndpointRowActionsProps {
  endpoint: passThroughItem;
  onEndpointClick: (endpointId: string) => void;
  onDeleteClick: (endpointId: string) => void;
}

function EndpointRowActions({ endpoint, onEndpointClick, onDeleteClick }: EndpointRowActionsProps) {
  const { t } = useTranslation("models");
  const endpointId = endpoint.id;
  const isFromConfig = endpoint.is_from_config ?? false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("passThrough.table.openActionsAria")}
        data-testid={`endpoint-actions-${endpointId || endpoint.path}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="endpoint-action-edit"
          disabled={isFromConfig || !endpointId}
          onClick={() => !isFromConfig && endpointId && onEndpointClick(endpointId)}
        >
          <Pencil />
          {t("passThrough.table.edit")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          data-testid="endpoint-action-delete"
          disabled={isFromConfig || !endpointId}
          onClick={() => !isFromConfig && endpointId && onDeleteClick(endpointId)}
        >
          <Trash2 />
          {t("passThrough.delete")}
        </DropdownMenuItem>
        {isFromConfig && (
          <div data-testid="endpoint-config-hint" className="px-2 py-1.5 text-xs text-muted-foreground">
            {t("passThrough.table.configHint")}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PassThroughEndpointsTableColumnsDeps {
  onEndpointClick: (endpointId: string) => void;
  onDeleteClick: (endpointId: string) => void;
}

export const getPassThroughEndpointsTableColumns = (
  { onEndpointClick, onDeleteClick }: PassThroughEndpointsTableColumnsDeps,
  t: TFunction<"models">,
): ColumnDef<passThroughItem>[] => [
  {
    id: "id",
    accessorKey: "id",
    meta: { title: t("passThrough.table.id") },
    header: t("passThrough.table.id"),
    size: 190,
    enableSorting: false,
    cell: ({ row }) => {
      const endpointId = row.original.id;
      if (!endpointId || row.original.is_from_config) {
        return <span className="font-mono text-xs text-muted-foreground">—</span>;
      }
      return (
        <IdentityCell
          title={endpointId}
          titleClassName="font-mono text-xs font-normal"
          onClick={() => onEndpointClick(endpointId)}
        />
      );
    },
  },
  {
    id: "source",
    meta: { title: t("passThrough.table.source"), skeleton: "badge" },
    header: t("passThrough.table.source"),
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const isFromConfig = row.original.is_from_config ?? false;
      return (
        <StatusBadge
          tone={isFromConfig ? "neutral" : "info"}
          label={isFromConfig ? t("passThrough.table.sourceConfig") : t("passThrough.table.sourceDb")}
        />
      );
    },
  },
  {
    id: "path",
    accessorKey: "path",
    meta: { title: t("passThrough.table.path") },
    header: t("passThrough.table.path"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-60 truncate text-sm font-medium" title={row.original.path}>
        {row.original.path}
      </span>
    ),
  },
  {
    id: "target",
    accessorKey: "target",
    meta: { title: t("passThrough.table.target") },
    header: t("passThrough.table.target"),
    size: 240,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm" title={row.original.target}>
        {row.original.target}
      </span>
    ),
  },
  {
    id: "methods",
    meta: { title: t("passThrough.table.methods"), skeleton: "chips" },
    header: () => (
      <HeaderWithTooltip title={t("passThrough.table.methods")} tooltip={t("passThrough.table.methodsTooltip")} />
    ),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <MethodsCell methods={row.original.methods} />,
  },
  {
    id: "auth",
    accessorKey: "auth",
    meta: { title: t("passThrough.table.authentication"), skeleton: "badge" },
    header: () => (
      <HeaderWithTooltip
        title={t("passThrough.table.authentication")}
        tooltip={t("passThrough.table.authenticationTooltip")}
      />
    ),
    size: 140,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.auth ? "success" : "neutral"}
        label={row.original.auth ? t("passThrough.common.yes") : t("passThrough.common.no")}
      />
    ),
  },
  {
    id: "headers",
    meta: { title: t("passThrough.table.headers") },
    header: t("passThrough.table.headers"),
    size: 180,
    enableSorting: false,
    cell: ({ row }) => <HeadersCell value={row.original.headers || {}} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("passThrough.table.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <EndpointRowActions endpoint={row.original} onEndpointClick={onEndpointClick} onDeleteClick={onDeleteClick} />
      </div>
    ),
  },
];
