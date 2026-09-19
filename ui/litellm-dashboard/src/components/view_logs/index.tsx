import { useState } from "react";
import { useTranslation } from "react-i18next";
import useCan from "@/app/(dashboard)/hooks/useCan";
import DeletedKeysPage from "../DeletedKeysPage/DeletedKeysPage";
import DeletedTeamsPage from "../DeletedTeamsPage/DeletedTeamsPage";
import AuditLogsPanel from "./AuditLogsPanel";
import RequestLogsPanel from "./RequestLogsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

interface SpendLogsTableProps {
  accessToken: string | null;
  token: string | null;
  userRole: string | null;
  userID: string | null;
  premiumUser: boolean;
}

type LogsTabId = "request logs" | "audit logs" | "deleted keys" | "deleted teams";

type LogsTabLabelKey = "tabs.requestLogs" | "tabs.auditLogs" | "tabs.deletedKeys" | "tabs.deletedTeams";

interface LogsTab {
  id: LogsTabId;
  labelKey: LogsTabLabelKey;
}

const REQUEST_LOGS_TAB: LogsTab = { id: "request logs", labelKey: "tabs.requestLogs" };
const AUDIT_LOGS_TAB: LogsTab = { id: "audit logs", labelKey: "tabs.auditLogs" };
const DELETED_KEYS_TAB: LogsTab = { id: "deleted keys", labelKey: "tabs.deletedKeys" };
const DELETED_TEAMS_TAB: LogsTab = { id: "deleted teams", labelKey: "tabs.deletedTeams" };

const tabContentClassName = (tabId: LogsTabId): string =>
  tabId === REQUEST_LOGS_TAB.id ? "flex min-h-0 flex-1 flex-col" : "min-h-0 flex-1 overflow-y-auto";

export default function SpendLogsTable({ accessToken, token, userRole, userID, premiumUser }: SpendLogsTableProps) {
  const { t } = useTranslation("logs");
  const [activeTab, setActiveTab] = useState<LogsTabId>(REQUEST_LOGS_TAB.id);
  const canViewAuditLogs = useCan("viewAuditLogs");
  const canViewDeletedTeams = useCan("viewDeletedTeams");

  if (!accessToken || !token || !userRole || !userID) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={t("tabs.loading")}
        className="flex h-64 items-center justify-center"
      >
        <UiLoadingSpinner className="size-8 text-primary" />
      </div>
    );
  }

  const tabs: LogsTab[] = [
    REQUEST_LOGS_TAB,
    ...(canViewAuditLogs ? [AUDIT_LOGS_TAB] : []),
    DELETED_KEYS_TAB,
    ...(canViewDeletedTeams ? [DELETED_TEAMS_TAB] : []),
  ];

  const renderPanel = (tabId: LogsTabId) => {
    switch (tabId) {
      case "request logs":
        return (
          <RequestLogsPanel
            accessToken={accessToken}
            token={token}
            userRole={userRole}
            userID={userID}
            isActive={activeTab === "request logs"}
          />
        );
      case "audit logs":
        return (
          <AuditLogsPanel
            userID={userID}
            userRole={userRole}
            token={token}
            accessToken={accessToken}
            isActive={activeTab === "audit logs"}
            premiumUser={premiumUser}
          />
        );
      case "deleted keys":
        return <DeletedKeysPage />;
      case "deleted teams":
        return <DeletedTeamsPage />;
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogsTabId)} className="min-h-0 flex-1">
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-none">
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} keepMounted className={tabContentClassName(tab.id)}>
            {renderPanel(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
