import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { CircleDollarSign } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { CalcPopover, MathTable } from "@/components/GuardrailsMonitor/CalcPopover";
import { MetricCard } from "@/components/GuardrailsMonitor/MetricCard";
import { UnpricedNote } from "@/components/GuardrailsMonitor/UnpricedNote";
import {
  counterLabel,
  counterMathRow,
  formatCost,
  totalUnits,
  unitsMathRows,
  unpricedSummary,
} from "@/components/GuardrailsMonitor/usageUnits";
import { DataTable } from "@/components/shared/DataTable";
import { IdCell } from "@/components/shared/table_cells/id_cell";
import { MoneyCell } from "@/components/shared/table_cells/money_cell";

interface CounterRow {
  counter: string;
  units: number;
  cost: number | null;
  unpriced: number;
}

interface GroupRow {
  id: string;
  units: number;
  cost: number | null;
  unpriced: number;
}

const counterRows = (detail: GuardrailUsageDetail): CounterRow[] =>
  Object.entries(detail.usage_units).map(([counter, units]) => ({
    counter,
    units,
    cost: detail.cost_by_unit[counter] ?? null,
    unpriced: detail.untracked_usage_units[counter] ?? 0,
  }));

const groupRows = (
  unitsByGroup: GuardrailUsageDetail["usage_units_by_team"],
  costByGroup: GuardrailUsageDetail["cost_by_team"],
  untrackedByGroup: GuardrailUsageDetail["untracked_usage_units_by_team"],
): GroupRow[] =>
  Object.entries(unitsByGroup)
    .map(([id, units]) => ({
      id,
      units: totalUnits(units),
      cost: costByGroup[id] ?? null,
      unpriced: totalUnits(untrackedByGroup[id] ?? {}),
    }))
    .sort((a, b) => b.units - a.units);

const UnpricedUnitsCell = ({ unpriced }: { unpriced: number }) =>
  unpriced > 0 ? (
    <span className="text-warning">{unpriced.toLocaleString()}</span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

type BreakdownT = TFunction<"guardrailsMonitor">;

const unpricedColumn = <TRow extends { unpriced: number }>(t: BreakdownT): ColumnDef<TRow> => ({
  header: t("common.unpricedUnits"),
  accessorKey: "unpriced",
  meta: { numeric: true },
  cell: ({ row }) => <UnpricedUnitsCell unpriced={row.original.unpriced} />,
});

const counterColumns = (t: BreakdownT): ColumnDef<CounterRow>[] => [
  { header: t("common.counter"), accessorKey: "counter", cell: ({ row }) => counterLabel(row.original.counter) },
  {
    header: t("common.units"),
    accessorKey: "units",
    meta: { numeric: true },
    cell: ({ row }) => row.original.units.toLocaleString(),
  },
  {
    header: t("common.cost"),
    accessorKey: "cost",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.cost} emptyText="—" showZero />,
  },
  unpricedColumn<CounterRow>(t),
];

const groupColumns = (t: BreakdownT, label: string, emptyLabel: string): ColumnDef<GroupRow>[] => [
  {
    header: label,
    accessorKey: "id",
    cell: ({ row }) =>
      row.original.id ? (
        <IdCell value={row.original.id} variant="plain" copyable />
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      ),
  },
  {
    header: t("common.units"),
    accessorKey: "units",
    meta: { numeric: true },
    cell: ({ row }) => row.original.units.toLocaleString(),
  },
  {
    header: t("common.cost"),
    accessorKey: "cost",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.cost} emptyText="—" showZero />,
  },
  unpricedColumn<GroupRow>(t),
];

const counterCountLabel = (t: BreakdownT, counterCount: number): string =>
  t(counterCount === 1 ? "breakdown.counterCountOne" : "breakdown.counterCountOther", { counterCount });

const CostMath = ({ counters, detail }: { counters: CounterRow[]; detail: GuardrailUsageDetail }) => {
  const { t } = useTranslation("guardrailsMonitor");
  return (
    <CalcPopover title={t("common.costMathTitle")} formula={t("breakdown.costFormula")}>
      <MathTable rows={counters.map(counterMathRow)} total={formatCost(detail.cost)} />
      <p className="text-xs text-muted-foreground">{t("breakdown.costNote")}</p>
      <UnpricedNote unpriced={detail.untracked_usage_units} provider={detail.provider} />
    </CalcPopover>
  );
};

const UnitsMath = ({ units }: { units: GuardrailUsageDetail["usage_units"] }) => {
  const { t } = useTranslation("guardrailsMonitor");
  return (
    <CalcPopover title={t("breakdown.unitsMathTitle")} formula={t("breakdown.unitsFormula")}>
      <MathTable rows={unitsMathRows(units)} total={totalUnits(units).toLocaleString()} />
      <p className="text-xs text-muted-foreground">{t("breakdown.unitsNote")}</p>
    </CalcPopover>
  );
};

const TableHeading = ({ title }: { title: string }) => (
  <h6 className="text-sm font-semibold text-foreground">{title}</h6>
);

export function GuardrailUsageBreakdown({ detail }: { detail: GuardrailUsageDetail }) {
  const { t } = useTranslation("guardrailsMonitor");
  const counters = counterRows(detail);
  const unpriced = unpricedSummary(detail.untracked_usage_units);

  return (
    <section className="space-y-4" aria-label={t("breakdown.regionAria")}>
      <div>
        <h5 className="mb-0 text-base font-semibold text-foreground">{t("breakdown.title")}</h5>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("breakdown.description")}</p>
      </div>

      {counters.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("breakdown.noUnits")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard
              label={t("common.cost")}
              value={formatCost(detail.cost)}
              valueColor={detail.cost != null ? "text-foreground" : "text-muted-foreground"}
              icon={<CircleDollarSign className="size-4" />}
              subtitle={unpriced ?? undefined}
              hint={<CostMath counters={counters} detail={detail} />}
            />
            <MetricCard
              label={t("common.usageUnits")}
              value={totalUnits(detail.usage_units).toLocaleString()}
              subtitle={counterCountLabel(t, counters.length)}
              hint={<UnitsMath units={detail.usage_units} />}
            />
          </div>

          <DataTable
            columns={counterColumns(t)}
            data={counters}
            getRowId={(row) => row.counter}
            size="compact"
            toolbar={() => <TableHeading title={t("breakdown.byCounter")} />}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <DataTable
              columns={groupColumns(t, t("common.team"), t("breakdown.noTeam"))}
              data={groupRows(detail.usage_units_by_team, detail.cost_by_team, detail.untracked_usage_units_by_team)}
              getRowId={(row) => row.id || "no-team"}
              size="compact"
              toolbar={() => <TableHeading title={t("breakdown.byTeam")} />}
            />
            <DataTable
              columns={groupColumns(t, t("common.key"), t("breakdown.noKey"))}
              data={groupRows(detail.usage_units_by_key, detail.cost_by_key, detail.untracked_usage_units_by_key)}
              getRowId={(row) => row.id || "no-key"}
              size="compact"
              toolbar={() => <TableHeading title={t("breakdown.byKey")} />}
            />
          </div>
        </>
      )}
    </section>
  );
}
