"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ParseKeys, TFunction } from "i18next";
import { MoreHorizontal, Trash2, Wallet } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { ModelsCell, SpendBudgetCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { ModelAccessGroup } from "@/app/(dashboard)/hooks/modelAccessGroups/useModelAccessGroups";

const budgetDecimals = (maxBudget: number | null | undefined): number =>
  maxBudget != null && maxBudget > 0 && maxBudget < 0.01 ? 5 : 2;

const DURATION_LABEL_KEYS: Record<string, ParseKeys<"models">> = {
  "1h": "accessGroupBudgets.duration.hourly",
  "24h": "accessGroupBudgets.duration.daily",
  "7d": "accessGroupBudgets.duration.weekly",
  "30d": "accessGroupBudgets.duration.monthly",
};

const durationLabel = (value: string | null | undefined, t: TFunction<"models">): string => {
  if (!value) return t("accessGroupBudgets.duration.notSet");
  const labelKey = DURATION_LABEL_KEYS[value];
  return labelKey ? t(labelKey) : value;
};

/**
 * A group name is a free-text path segment on the budget routes, so a `/` in it splits the path and
 * no encoding recovers it. Such a group is listed but its budget is unreachable.
 */
export const isBudgetAddressable = (accessGroup: string): boolean => !accessGroup.includes("/");

const writeBlockedReason = (
  accessGroup: ModelAccessGroup,
  canWrite: boolean,
  t: TFunction<"models">,
): string | undefined => {
  if (!canWrite) return t("accessGroupBudgets.columns.writeBlockedAdmin");
  if (!isBudgetAddressable(accessGroup.access_group)) {
    return t("accessGroupBudgets.columns.writeBlockedSlash");
  }
  return undefined;
};

interface AccessGroupRowActionsProps {
  accessGroup: ModelAccessGroup;
  canWrite: boolean;
  onSetBudget: (accessGroup: ModelAccessGroup) => void;
  onClearBudget: (accessGroup: ModelAccessGroup) => void;
  t: TFunction<"models">;
}

function AccessGroupRowActions({ accessGroup, canWrite, onSetBudget, onClearBudget, t }: AccessGroupRowActionsProps) {
  const hasBudget = accessGroup.budget != null;
  const blocked = writeBlockedReason(accessGroup, canWrite, t);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("accessGroupBudgets.columns.openActionsAria", { name: accessGroup.access_group })}
        data-testid={`access-group-actions-${accessGroup.access_group}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={blocked !== undefined}
          title={blocked}
          data-testid="access-group-action-set-budget"
          onClick={() => onSetBudget(accessGroup)}
        >
          <Wallet />
          {hasBudget ? t("accessGroupBudgets.columns.editBudget") : t("accessGroupBudgets.columns.setBudget")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={blocked !== undefined || !hasBudget}
          data-testid="access-group-action-clear-budget"
          title={blocked ?? (hasBudget ? undefined : t("accessGroupBudgets.columns.noBudgetToClear"))}
          onClick={() => onClearBudget(accessGroup)}
        >
          <Trash2 />
          {t("accessGroupBudgets.columns.clearBudget")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AccessGroupBudgetColumnsDeps {
  canWrite: boolean;
  onSetBudget: (accessGroup: ModelAccessGroup) => void;
  onClearBudget: (accessGroup: ModelAccessGroup) => void;
}

export const getAccessGroupBudgetColumns = (
  { canWrite, onSetBudget, onClearBudget }: AccessGroupBudgetColumnsDeps,
  t: TFunction<"models">,
): ColumnDef<ModelAccessGroup>[] => [
  {
    id: "access_group",
    accessorKey: "access_group",
    meta: { title: t("accessGroupBudgets.columns.accessGroup") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("accessGroupBudgets.columns.accessGroup")} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="block max-w-56 truncate font-mono text-xs" title={row.original.access_group}>
        {row.original.access_group}
      </span>
    ),
  },
  {
    id: "models",
    meta: { title: t("accessGroupBudgets.columns.models"), skeleton: "chips" },
    header: t("accessGroupBudgets.columns.models"),
    size: 280,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.model_names} />,
  },
  {
    id: "deployment_count",
    accessorKey: "deployment_count",
    meta: { title: t("accessGroupBudgets.columns.deployments"), numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("accessGroupBudgets.columns.deployments")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => row.original.deployment_count,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: t("accessGroupBudgets.columns.sharedSpend") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("accessGroupBudgets.columns.sharedSpend")} />,
    size: 180,
    enableSorting: true,
    cell: ({ row }) => (
      <SpendBudgetCell
        spend={row.original.spend}
        maxBudget={row.original.budget?.max_budget}
        budgetDecimals={budgetDecimals(row.original.budget?.max_budget)}
      />
    ),
  },
  {
    id: "budget_duration",
    meta: { title: t("accessGroupBudgets.columns.resets") },
    header: t("accessGroupBudgets.columns.resets"),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{durationLabel(row.original.budget?.budget_duration, t)}</span>
    ),
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("accessGroupBudgets.columns.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <AccessGroupRowActions
          accessGroup={row.original}
          canWrite={canWrite}
          onSetBudget={onSetBudget}
          onClearBudget={onClearBudget}
          t={t}
        />
      </div>
    ),
  },
];
