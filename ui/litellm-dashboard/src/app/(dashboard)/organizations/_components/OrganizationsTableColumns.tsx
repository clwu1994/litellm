"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { Organization } from "@/components/networking";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface OrganizationBudget {
  max_budget?: number | null;
  tpm_limit?: number | null;
  rpm_limit?: number | null;
}

const getOrganizationBudget = (organization: Organization): OrganizationBudget =>
  (organization.litellm_budget_table ?? {}) as OrganizationBudget;

function OrganizationLimitsCell({ organization, t }: { organization: Organization; t: TFunction<"organizations"> }) {
  const { tpm_limit, rpm_limit } = getOrganizationBudget(organization);
  return (
    <div className="flex flex-col text-xs text-muted-foreground">
      <span>{t("table.summary.tpm", { value: tpm_limit ?? t("table.value.unlimited") })}</span>
      <span>{t("table.summary.rpm", { value: rpm_limit ?? t("table.value.unlimited") })}</span>
    </div>
  );
}

interface OrganizationRowActionsProps {
  organization: Organization;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
  t: TFunction<"organizations">;
}

function OrganizationRowActions({ organization, onEditClick, onDeleteClick, t }: OrganizationRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("table.aria.openActions")}
        data-testid={`organization-actions-${organization.organization_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="organization-action-edit"
          onClick={() => onEditClick(organization.organization_id)}
        >
          <Pencil />
          {t("actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="organization-action-delete"
          onClick={() => onDeleteClick(organization.organization_id)}
        >
          <Trash2 />
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface OrganizationsTableColumnsDeps {
  userRole: string;
  onOrganizationClick: (organizationId: string) => void;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
}

export const getOrganizationsTableColumns = (
  { userRole, onOrganizationClick, onEditClick, onDeleteClick }: OrganizationsTableColumnsDeps,
  t: TFunction<"organizations">,
): ColumnDef<Organization>[] => [
  {
    id: "organization_id",
    accessorKey: "organization_id",
    meta: { title: t("table.header.organizationId") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("table.header.organizationId")} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.organization_id}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-56"
        onClick={() => onOrganizationClick(row.original.organization_id)}
      />
    ),
  },
  {
    id: "organization_alias",
    accessorKey: "organization_alias",
    meta: { title: t("table.header.organizationName") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("table.header.organizationName")} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const alias = row.original.organization_alias;
      return (
        <span className="block max-w-56 truncate text-sm font-medium" title={alias ?? undefined}>
          {alias || "-"}
        </span>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: { title: t("table.header.created") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("table.header.created")} />,
    size: 130,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: t("table.header.spend") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("table.header.spend")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    meta: { title: t("table.header.budget") },
    header: t("table.header.budget"),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell
        value={getOrganizationBudget(row.original).max_budget}
        decimals={2}
        emptyText={t("table.value.unlimited")}
        showZero
      />
    ),
  },
  {
    id: "models",
    meta: { title: t("table.header.models"), skeleton: "chips" },
    header: t("table.header.models"),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "limits",
    meta: { title: t("table.header.limits") },
    header: t("table.header.limits"),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <OrganizationLimitsCell organization={row.original} t={t} />,
  },
  {
    id: "members",
    meta: { title: t("table.header.members") },
    header: t("table.header.members"),
    size: 100,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{t("table.summary.members", { members: row.original.members?.length ?? 0 })}</span>
    ),
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("table.header.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) =>
      userRole === "Admin" ? (
        <div className="flex justify-end">
          <OrganizationRowActions
            organization={row.original}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            t={t}
          />
        </div>
      ) : null,
  },
];
