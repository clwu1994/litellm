"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import { ToolRow } from "@/components/networking";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell } from "@/components/shared/table_cells";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { PolicySelect } from "./PolicySelect";

interface ToolPoliciesTableColumnsDeps {
  t: TFunction<"policies">;
  onSelectTool: (toolName: string) => void;
  savingInput: ReadonlySet<string>;
  savingOutput: ReadonlySet<string>;
  onInputPolicyChange: (toolName: string, policy: string) => void;
  onOutputPolicyChange: (toolName: string, policy: string) => void;
}

function TruncatedText({ value, className }: { value: string | undefined; className?: string }) {
  const text = value ?? "-";
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className={className}>{text}</span>} />
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const getToolPoliciesTableColumns = ({
  t,
  onSelectTool,
  savingInput,
  savingOutput,
  onInputPolicyChange,
  onOutputPolicyChange,
}: ToolPoliciesTableColumnsDeps): ColumnDef<ToolRow>[] => [
  {
    id: "created_at",
    accessorFn: (row) => row.created_at ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.discovered")} />,
    size: 170,
    enableGlobalFilter: false,
    cell: ({ row }) => <DateCell value={row.original.created_at} />,
  },
  {
    id: "tool_name",
    accessorFn: (row) => row.tool_name,
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.toolName")} />,
    minSize: 200,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.tool_name}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-60"
        onClick={() => onSelectTool(row.original.tool_name)}
      />
    ),
  },
  {
    id: "input_policy",
    accessorFn: (row) => row.input_policy,
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.inputPolicy")} />,
    size: 140,
    filterFn: "equalsString",
    meta: { title: t("toolPolicies.table.inputPolicy"), skeleton: "badge" },
    cell: ({ row }) => (
      <PolicySelect
        value={row.original.input_policy}
        toolName={row.original.tool_name}
        saving={savingInput.has(row.original.tool_name)}
        onChange={onInputPolicyChange}
        policyType="input"
      />
    ),
  },
  {
    id: "output_policy",
    accessorFn: (row) => row.output_policy,
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.outputPolicy")} />,
    size: 140,
    filterFn: "equalsString",
    meta: { title: t("toolPolicies.table.outputPolicy"), skeleton: "badge" },
    cell: ({ row }) => (
      <PolicySelect
        value={row.original.output_policy}
        toolName={row.original.tool_name}
        saving={savingOutput.has(row.original.tool_name)}
        onChange={onOutputPolicyChange}
        policyType="output"
      />
    ),
  },
  {
    id: "call_count",
    accessorFn: (row) => row.call_count ?? 0,
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.calls")} />,
    size: 100,
    enableGlobalFilter: false,
    meta: { numeric: true },
    cell: ({ row }) => <span className="font-mono">{(row.original.call_count ?? 0).toLocaleString()}</span>,
  },
  {
    id: "team_id",
    accessorFn: (row) => row.team_id ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.teamName")} />,
    size: 160,
    filterFn: "equalsString",
    meta: { title: t("toolPolicies.table.teamName") },
    cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
  },
  {
    id: "key_hash",
    accessorFn: (row) => row.key_hash ?? "",
    header: t("toolPolicies.table.keyHash"),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.key_hash} />,
  },
  {
    id: "key_alias",
    accessorFn: (row) => row.key_alias ?? "",
    header: ({ column }) => <DataTableSortHeader column={column} title={t("toolPolicies.table.keyName")} />,
    size: 150,
    filterFn: "equalsString",
    meta: { title: t("toolPolicies.table.keyName") },
    cell: ({ row }) => <TruncatedText value={row.original.key_alias} className="block max-w-32 truncate" />,
  },
  {
    id: "user_agent",
    accessorFn: (row) => row.user_agent ?? "",
    header: t("toolPolicies.table.userAgent"),
    size: 180,
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <TruncatedText
        value={row.original.user_agent}
        className="block max-w-40 truncate font-mono text-muted-foreground"
      />
    ),
  },
];
