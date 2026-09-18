"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { MoreHorizontal, UserPlus } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { IdentityCell, ModelsCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

export interface AvailableTeam {
  team_id: string;
  team_alias: string;
  description?: string;
  models: string[];
  members_with_roles: { user_id?: string; user_email?: string; role: string }[];
}

function AvailableTeamRowActions({
  team,
  onJoinTeam,
  t,
}: {
  team: AvailableTeam;
  onJoinTeam: (teamId: string) => void;
  t: TFunction<"teams">;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("availableTeams.aria.openActions")}
        data-testid={`available-team-actions-${team.team_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem data-testid="available-team-action-join" onClick={() => onJoinTeam(team.team_id)}>
          <UserPlus />
          {t("availableTeams.action.join")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AvailableTeamsTableColumnsDeps {
  onJoinTeam: (teamId: string) => void;
  t: TFunction<"teams">;
}

export const getAvailableTeamsTableColumns = ({
  onJoinTeam,
  t,
}: AvailableTeamsTableColumnsDeps): ColumnDef<AvailableTeam>[] => [
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: t("info.field.teamName") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("info.field.teamName")} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell title={row.original.team_alias} className="max-w-72" titleClassName="font-medium" />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    meta: { title: t("availableTeams.table.description") },
    header: t("availableTeams.table.description"),
    size: 280,
    enableSorting: false,
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description || undefined}>
          {description || t("availableTeams.table.noDescription")}
        </span>
      );
    },
  },
  {
    id: "members",
    accessorFn: (team) => team.members_with_roles.length,
    meta: { title: t("availableTeams.table.members") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("availableTeams.table.members")} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {t("availableTeams.table.memberCount", { members: row.original.members_with_roles.length })}
      </span>
    ),
  },
  {
    id: "models",
    meta: { title: t("info.field.models") },
    header: t("info.field.models"),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("availableTeams.table.actions")}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <AvailableTeamRowActions team={row.original} onJoinTeam={onJoinTeam} t={t} />
      </div>
    ),
  },
];
