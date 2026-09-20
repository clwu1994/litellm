import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actionItems } from "./action_options";

interface Pattern {
  id: string;
  type: "prebuilt" | "custom";
  name: string;
  display_name?: string;
  pattern?: string;
  action: "BLOCK" | "MASK";
}

interface PatternTableProps {
  patterns: Pattern[];
  onActionChange: (id: string, action: "BLOCK" | "MASK") => void;
  onRemove: (id: string) => void;
}

const PatternTable: React.FC<PatternTableProps> = ({ patterns, onActionChange, onRemove }) => {
  const { t } = useTranslation("guardrails");
  const items = useMemo(() => actionItems(t), [t]);
  const columns: ColumnDef<Pattern>[] = [
    {
      header: t("contentFilter.tables.type"),
      accessorKey: "type",
      size: 100,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.type === "prebuilt" ? t("contentFilter.tables.prebuilt") : t("contentFilter.tables.custom")}
        </Badge>
      ),
    },
    {
      header: t("contentFilter.tables.patternName"),
      accessorKey: "name",
      cell: ({ row }) => row.original.display_name || row.original.name,
    },
    {
      header: t("contentFilter.tables.regexPattern"),
      accessorKey: "pattern",
      cell: ({ row }) =>
        row.original.pattern ? (
          <code className="rounded-sm bg-muted px-1 py-0.5 text-xs">{row.original.pattern.substring(0, 40)}...</code>
        ) : (
          "-"
        ),
    },
    {
      header: t("contentFilter.tables.action"),
      accessorKey: "action",
      size: 150,
      cell: ({ row }) => (
        <Select
          items={items}
          value={row.original.action}
          onValueChange={(value: string | null) => value && onActionChange(row.original.id, value as "BLOCK" | "MASK")}
        >
          <SelectTrigger size="sm" className="w-[120px]" aria-label={t("contentFilter.tables.action")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: "",
      id: "actions",
      size: 100,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onRemove(row.original.id)}>
          <Trash2 />
          {t("contentFilter.tables.delete")}
        </Button>
      ),
    },
  ];

  if (patterns.length === 0) {
    return <div className="py-10 text-center text-muted-foreground">{t("contentFilter.tables.emptyPatterns")}</div>;
  }

  return <DataTable data={patterns} columns={columns} getRowId={(row) => row.id} size="compact" />;
};

export default PatternTable;
