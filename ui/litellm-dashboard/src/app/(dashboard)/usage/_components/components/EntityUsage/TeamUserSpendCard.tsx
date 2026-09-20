import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Download } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { teamSpendByUserCall } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Button } from "@/components/ui/button";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";

import {
  buildTeamUserSpendCsv,
  downloadCsv,
  NO_USER_LABEL_KEY,
  sortBySpendDesc,
  teamLabel,
  teamUserSpendCsvFileName,
  teamUserSpendRowId,
  userLabel,
  type TeamUserSpendRow,
} from "./teamUserSpend";

interface TeamUserSpendCardProps {
  accessToken: string | null;
  startTime: Date | null;
  endTime: Date | null;
  teamIds: string[];
}

const getColumns = (t: TFunction<"usage">): ColumnDef<TeamUserSpendRow>[] => [
  {
    header: t("entity.teamUserSpend.table.team"),
    accessorFn: teamLabel,
    id: "team",
    cell: ({ row }) => teamLabel(row.original),
  },
  {
    header: t("entity.teamUserSpend.table.user"),
    accessorFn: (row) => userLabel(row, t(NO_USER_LABEL_KEY)),
    id: "user",
    cell: ({ row }) => userLabel(row.original, t(NO_USER_LABEL_KEY)),
  },
  {
    header: t("entity.teamUserSpend.table.spend"),
    accessorKey: "spend",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    header: t("entity.teamUserSpend.table.requests"),
    accessorKey: "api_requests",
    meta: { numeric: true },
    cell: ({ row }) => row.original.api_requests.toLocaleString(),
  },
  {
    header: t("entity.teamUserSpend.table.successful"),
    accessorKey: "successful_requests",
    meta: { numeric: true, className: "text-success" },
    cell: ({ row }) => row.original.successful_requests.toLocaleString(),
  },
  {
    header: t("entity.teamUserSpend.table.failed"),
    accessorKey: "failed_requests",
    meta: { numeric: true, className: "text-destructive" },
    cell: ({ row }) => row.original.failed_requests.toLocaleString(),
  },
  {
    header: t("entity.teamUserSpend.table.tokens"),
    accessorKey: "total_tokens",
    meta: { numeric: true },
    cell: ({ row }) => row.original.total_tokens.toLocaleString(),
  },
];

const TeamUserSpendCard: React.FC<TeamUserSpendCardProps> = ({ accessToken, startTime, endTime, teamIds }) => {
  const { t } = useTranslation("usage");
  const hasTeams = teamIds.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["teamSpendByUser", startTime?.toISOString(), endTime?.toISOString(), teamIds],
    queryFn: () =>
      accessToken && startTime && endTime ? teamSpendByUserCall(accessToken, startTime, endTime, teamIds) : null,
    enabled: Boolean(accessToken && startTime && endTime) && hasTeams,
  });
  const rows = useMemo(() => sortBySpendDesc(data?.results ?? []), [data]);
  const columns = useMemo(() => getColumns(t), [t]);

  return (
    <ShadcnCard>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-foreground">{t("entity.teamUserSpend.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("entity.teamUserSpend.description")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || rows.length === 0}
            onClick={() =>
              data && downloadCsv(buildTeamUserSpendCsv(data, t(NO_USER_LABEL_KEY)), teamUserSpendCsvFileName(data))
            }
          >
            <Download />
            {t("entity.teamUserSpend.download")}
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={teamUserSpendRowId}
          isLoading={isLoading}
          maxBodyHeight={320}
          noDataMessage={teamIds.length === 0 ? t("empty.selectTeamForUserSpend") : t("empty.noUserSpendInRange")}
          size="compact"
        />
      </CardContent>
    </ShadcnCard>
  );
};

export default TeamUserSpendCard;
