"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Copy, ExternalLink, Info, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";
import { Plugin } from "@/components/claude_code_plugins/types";

function getSkillSourceLink(skill: Plugin): { url: string; label: string } | null {
  const src = skill.source;
  if (src?.source === "github" && src.repo) {
    return { url: `https://github.com/${src.repo}`, label: src.repo };
  }
  if (src?.source === "git-subdir" && src.url) {
    const url = src.path ? `${src.url}/tree/main/${src.path}` : src.url;
    return { url, label: url.replace("https://github.com/", "") };
  }
  if ((src?.source === "url" || src?.source === "archive") && src.url) {
    return { url: src.url, label: src.url.replace(/^https?:\/\//, "") };
  }
  return null;
}

interface SkillHubRowActionsProps {
  skill: Plugin;
  onSkillClick: (skill: Plugin) => void;
}

function SkillHubRowActions({ skill, onSkillClick }: SkillHubRowActionsProps) {
  const { t } = useTranslation("modelHub");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("skillColumns.openActions")}
        data-testid={`skill-hub-actions-${skill.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem data-testid="skill-hub-action-details" onClick={() => onSkillClick(skill)}>
          <Info />
          {t("shared.viewDetails")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="skill-hub-action-copy"
          onClick={() => void copyToClipboard(skill.name, t("skillColumns.skillNameCopied"))}
        >
          <Copy />
          {t("skillColumns.copySkillName")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SkillHubTableColumnsDeps {
  onSkillClick: (skill: Plugin) => void;
  t: TFunction<"modelHub">;
}

export const getSkillHubTableColumns = ({ onSkillClick, t }: SkillHubTableColumnsDeps): ColumnDef<Plugin>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("skillColumns.skillName") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("skillColumns.skillName")} />,
    size: 200,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell title={row.original.name} className="max-w-72" onClick={() => onSkillClick(row.original)} />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    meta: { title: t("shared.description") },
    header: t("shared.description"),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-xs" title={row.original.description || undefined}>
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "category",
    accessorKey: "category",
    meta: { title: t("skillColumns.category"), skeleton: "badge" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("skillColumns.category")} />,
    size: 130,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="secondary">{row.original.category}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
  {
    id: "domain",
    accessorKey: "domain",
    meta: { title: t("skillColumns.domain") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("skillColumns.domain")} />,
    size: 130,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => <span className="text-xs">{row.original.domain || "-"}</span>,
  },
  {
    id: "source",
    meta: { title: t("skillColumns.source") },
    header: t("skillColumns.source"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => {
      const link = getSkillSourceLink(row.original);
      if (!link) return <span className="text-xs text-muted-foreground">-</span>;
      return (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex max-w-60 items-center gap-1 text-xs text-primary hover:underline"
          title={link.label}
        >
          <span className="truncate">{link.label}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      );
    },
  },
  {
    id: "enabled",
    accessorKey: "enabled",
    meta: { title: t("shared.status"), skeleton: "badge" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("shared.status")} />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.enabled ? "success" : "neutral"}
        label={row.original.enabled ? t("shared.public") : t("skillColumns.draft")}
      />
    ),
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("shared.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <SkillHubRowActions skill={row.original} onSkillClick={onSkillClick} />
      </div>
    ),
  },
];
