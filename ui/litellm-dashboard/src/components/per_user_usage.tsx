import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { BarChart } from "@/components/shared/charts";
import { DataTable } from "@/components/shared/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { perUserAnalyticsCall } from "./networking";

interface PerUserMetrics {
  user_id: string;
  user_email: string | null;
  user_agent: string | null;
  successful_requests: number;
  failed_requests: number;
  total_requests: number;
  total_tokens: number;
  spend: number;
}

interface PerUserAnalyticsResponse {
  results: PerUserMetrics[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface PerUserUsageProps {
  accessToken: string | null;
  selectedTags: string[];
  formatAbbreviatedNumber: (value: number, decimalPlaces?: number) => string;
}

const PerUserUsage: React.FC<PerUserUsageProps> = ({ accessToken, selectedTags, formatAbbreviatedNumber }) => {
  const { t } = useTranslation("usage");
  // Maximum number of user agent categories to show in charts to prevent color palette overflow
  const MAX_USER_AGENTS = 8;
  const [perUserData, setPerUserData] = useState<PerUserAnalyticsResponse>({
    results: [],
    total_count: 0,
    page: 1,
    page_size: 50,
    total_pages: 0,
  });

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [pagedTags, setPagedTags] = useState(selectedTags);

  if (pagedTags !== selectedTags) {
    setPagedTags(selectedTags);
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }

  useEffect(() => {
    if (!accessToken) return;

    let stale = false;
    perUserAnalyticsCall(
      accessToken,
      pagination.pageIndex + 1,
      pagination.pageSize,
      pagedTags.length > 0 ? pagedTags : undefined,
    )
      .then((response) => {
        if (stale) return;
        setPerUserData(response);
      })
      .catch((error) => console.error("Failed to fetch per-user data:", error));

    return () => {
      stale = true;
    };
  }, [accessToken, pagedTags, pagination]);

  const handlePaginationChange = useCallback<OnChangeFn<PaginationState>>((updaterOrValue) => {
    setPagination((prev) => {
      const next = typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;
      return next.pageSize === prev.pageSize ? next : { pageIndex: 0, pageSize: next.pageSize };
    });
  }, []);

  const columns: ColumnDef<PerUserMetrics>[] = [
    {
      header: t("perUserUsage.tableUserId"),
      accessorKey: "user_id",
      cell: ({ row }) => <span className="font-medium">{row.original.user_id}</span>,
    },
    {
      header: t("perUserUsage.tableUserEmail"),
      accessorKey: "user_email",
      cell: ({ row }) => row.original.user_email || t("perUserUsage.notAvailable"),
    },
    {
      header: t("perUserUsage.tableUserAgent"),
      accessorKey: "user_agent",
      cell: ({ row }) => row.original.user_agent || t("perUserUsage.unknown"),
    },
    {
      header: t("perUserUsage.tableSuccessGenerations"),
      accessorKey: "successful_requests",
      meta: { numeric: true },
      cell: ({ row }) => formatAbbreviatedNumber(row.original.successful_requests),
    },
    {
      header: t("perUserUsage.tableTotalTokens"),
      accessorKey: "total_tokens",
      meta: { numeric: true },
      cell: ({ row }) => formatAbbreviatedNumber(row.original.total_tokens),
    },
    {
      header: t("perUserUsage.tableFailedRequests"),
      accessorKey: "failed_requests",
      meta: { numeric: true },
      cell: ({ row }) => formatAbbreviatedNumber(row.original.failed_requests),
    },
    {
      header: t("perUserUsage.tableTotalCost"),
      accessorKey: "spend",
      meta: { numeric: true },
      cell: ({ row }) => `$${formatAbbreviatedNumber(row.original.spend, 4)}`,
    },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-foreground">{t("perUserUsage.title")}</h3>
      <p className="text-sm text-muted-foreground">{t("perUserUsage.description")}</p>

      <Tabs defaultValue="details">
        <TabsList variant="line" className="mb-6 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="details" className="flex-none rounded-none px-4 py-2">
            {t("perUserUsage.tabDetails")}
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex-none rounded-none px-4 py-2">
            {t("perUserUsage.tabDistribution")}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Existing User Details Table */}
        <TabsContent value="details" keepMounted>
          <DataTable
            columns={columns}
            data={perUserData.results}
            getRowId={(row) => row.user_id}
            paginationMode="server"
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            rowCount={perUserData.total_count}
            noDataMessage={t("perUserUsage.noData")}
            size="compact"
          />
        </TabsContent>

        {/* Tab 2: Usage Distribution Histogram */}
        <TabsContent value="distribution" keepMounted>
          <div className="mb-4">
            <h4 className="text-lg font-medium text-foreground">{t("perUserUsage.distributionTitle")}</h4>
            <p className="text-sm text-muted-foreground">{t("perUserUsage.distributionDescription")}</p>
          </div>

          <BarChart
            data={(() => {
              // Get top user agents by frequency first
              const userAgentCounts = new Map<string, number>();
              perUserData.results.forEach((item: PerUserMetrics) => {
                const agent = item.user_agent || t("perUserUsage.unknown");
                userAgentCounts.set(agent, (userAgentCounts.get(agent) || 0) + 1);
              });

              const topUserAgents = Array.from(userAgentCounts.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, MAX_USER_AGENTS)
                .map(([agent]) => agent);

              // Categorize users by successful request count and user agent
              const categories = {
                [t("perUserUsage.category1to9")]: { range: [1, 9], agents: {} as Record<string, number> },
                [t("perUserUsage.category10to99")]: { range: [10, 99], agents: {} as Record<string, number> },
                [t("perUserUsage.category100to999")]: { range: [100, 999], agents: {} as Record<string, number> },
                [t("perUserUsage.category1kTo99k")]: { range: [1000, 9999], agents: {} as Record<string, number> },
                [t("perUserUsage.category10kTo999k")]: { range: [10000, 99999], agents: {} as Record<string, number> },
                [t("perUserUsage.category100kPlus")]: {
                  range: [100000, Infinity],
                  agents: {} as Record<string, number>,
                },
              };

              // Count users in each category by user agent (only for top user agents)
              perUserData.results.forEach((item: PerUserMetrics) => {
                const successCount = item.successful_requests;
                const userAgent = item.user_agent || t("perUserUsage.unknown");

                // Only process if this is one of the top user agents
                if (topUserAgents.includes(userAgent)) {
                  Object.entries(categories).forEach(([categoryName, category]) => {
                    if (successCount >= category.range[0] && successCount <= category.range[1]) {
                      if (!category.agents[userAgent]) {
                        category.agents[userAgent] = 0;
                      }
                      category.agents[userAgent]++;
                    }
                  });
                }
              });

              // Convert to chart data format for stacked bar chart
              return Object.entries(categories).map(([categoryName, category]) => {
                const dataPoint: Record<string, any> = { category: categoryName };

                // Add count for each top user agent
                topUserAgents.forEach((agent) => {
                  dataPoint[agent] = category.agents[agent] || 0;
                });

                return dataPoint;
              });
            })()}
            index="category"
            categories={(() => {
              // Count user agents by frequency and get top ones
              const userAgentCounts = new Map<string, number>();
              perUserData.results.forEach((item: PerUserMetrics) => {
                const agent = item.user_agent || t("perUserUsage.unknown");
                userAgentCounts.set(agent, (userAgentCounts.get(agent) || 0) + 1);
              });

              // Sort by frequency (most common first) and limit to top MAX_USER_AGENTS
              return Array.from(userAgentCounts.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, MAX_USER_AGENTS)
                .map(([agent]) => agent);
            })()}
            colors={["blue", "green", "orange", "red", "purple", "yellow", "pink", "indigo"]}
            valueFormatter={(value: number) => t("perUserUsage.usersValue", { users: value })}
            yAxisWidth={80}
            showLegend={true}
            stack={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerUserUsage;
