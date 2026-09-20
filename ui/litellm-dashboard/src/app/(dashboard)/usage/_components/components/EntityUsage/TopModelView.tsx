import { BarChart } from "@/components/shared/charts";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatNumberWithCommas } from "@/utils/dataUtils";

type TopModel = {
  key: string;
  spend: number;
  successful_requests: number;
  failed_requests: number;
  tokens: number;
};

interface TopModelViewProps {
  topModels: TopModel[];
  topModelsLimit: number;
  setTopModelsLimit: (limit: number) => void;
}

export const TOP_MODEL_LIMITS = [5, 10, 25, 50];

export default function TopModelView({ topModels, topModelsLimit, setTopModelsLimit }: TopModelViewProps) {
  const { t } = useTranslation("usage");
  const [modelViewMode, setModelViewMode] = useState<"chart" | "table">("table");

  const columns = [
    {
      header: t("entity.topModels.table.model"),
      accessorKey: "key",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      header: t("entity.topModels.table.spendUsd"),
      accessorKey: "spend",
      meta: { numeric: true },
      cell: (info: any) => <MoneyCell value={info.getValue()} decimals={2} />,
    },
    {
      header: t("entity.topModels.table.successful"),
      accessorKey: "successful_requests",
      meta: { numeric: true },
      cell: (info: any) => <span className="text-success">{info.getValue()?.toLocaleString() || 0}</span>,
    },
    {
      header: t("entity.topModels.table.failed"),
      accessorKey: "failed_requests",
      meta: { numeric: true },
      cell: (info: any) => <span className="text-destructive">{info.getValue()?.toLocaleString() || 0}</span>,
    },
    {
      header: t("entity.topModels.table.tokens"),
      accessorKey: "tokens",
      meta: { numeric: true },
      cell: (info: any) => info.getValue()?.toLocaleString() || 0,
    },
  ];
  const processedTopModels = topModels.slice(0, topModelsLimit);

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Tabs value={String(topModelsLimit)} onValueChange={(value: string) => setTopModelsLimit(Number(value))}>
          <TabsList aria-label={t("entity.topModels.limitAria")}>
            {TOP_MODEL_LIMITS.map((limit) => (
              <TabsTrigger key={limit} value={String(limit)} className="flex-none px-3">
                {limit}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={modelViewMode} onValueChange={(value: string) => setModelViewMode(value as "chart" | "table")}>
          <TabsList aria-label={t("entity.topModels.viewModeAria")}>
            <TabsTrigger value="table" className="flex-none px-3">
              {t("entity.topModels.tableView")}
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex-none px-3">
              {t("entity.topModels.chartView")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {modelViewMode === "chart" ? (
        <div className="relative max-h-[600px] overflow-y-auto">
          <BarChart
            className="mt-4 cursor-pointer hover:opacity-90"
            style={{ height: Math.min(processedTopModels.length, topModelsLimit) * 52 }}
            data={processedTopModels}
            index="key"
            categories={["spend"]}
            colors={["cyan"]}
            valueFormatter={(value) => `$${formatNumberWithCommas(value, 2)}`}
            layout="vertical"
            yAxisWidth={200}
            tickGap={5}
            showLegend={false}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={processedTopModels} isLoading={false} maxBodyHeight={600} size="compact" />
      )}
    </>
  );
}
