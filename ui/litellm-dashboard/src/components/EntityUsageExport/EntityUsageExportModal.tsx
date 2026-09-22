import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/lib/toast";
import ExportFormatSelector from "./ExportFormatSelector";
import ExportSummary from "./ExportSummary";
import ExportTypeSelector from "./ExportTypeSelector";
import type { EntityType, EntityUsageExportModalProps, ExportFormat, ExportScope } from "./types";
import { handleExportCSV, handleExportJSON } from "./utils";

const ENTITY_TYPE_KEYS = {
  tag: "entity.type.tag",
  team: "entity.type.team",
  organization: "entity.type.organization",
  customer: "entity.type.customer",
  agent: "entity.type.agent",
  user: "entity.type.user",
} as const satisfies Record<EntityType, string>;

const EntityUsageExportModal: React.FC<EntityUsageExportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  spendData,
  dateRange,
  selectedFilters,
  customTitle,
}) => {
  const { t } = useTranslation("usage");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportScope, setExportScope] = useState<ExportScope>("daily");
  const [isExporting, setIsExporting] = useState(false);
  const { data: teams, isLoading: isLoadingTeams } = useTeams();

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const entityDisplay = t(ENTITY_TYPE_KEYS[entityType]);
  const modalTitle = customTitle || t("entityUsage.modalTitle", { entity: entityDisplay });

  // Cache team alias map using useMemo
  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);
  const handleExport = async (format?: ExportFormat) => {
    const formatToUse = format || exportFormat;
    setIsExporting(true);
    try {
      if (formatToUse === "csv") {
        handleExportCSV(spendData, exportScope, entityLabel, entityType, teamAliasMap);
        toast.success(t("entityUsage.exportSuccessCsv", { entity: entityDisplay }));
      } else {
        handleExportJSON(spendData, exportScope, entityLabel, entityType, dateRange, selectedFilters, teamAliasMap);
        toast.success(t("entityUsage.exportSuccessJson", { entity: entityDisplay }));
      }
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.fromError(t("entityUsage.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{modalTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {isLoadingTeams ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <>
              <ExportSummary dateRange={dateRange} selectedFilters={selectedFilters} />
              <ExportTypeSelector value={exportScope} onChange={setExportScope} entityType={entityType} />
              <ExportFormatSelector value={exportFormat} onChange={setExportFormat} />
            </>
          )}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {isLoadingTeams ? (
              <>
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-28" />
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={isExporting}>
                  {t("entityUsage.cancel")}
                </Button>
                <Button onClick={() => handleExport()} disabled={isExporting}>
                  {isExporting && <Loader2 className="animate-spin" />}
                  {t("entityUsage.exportFormat", { format: exportFormat.toUpperCase() })}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityUsageExportModal;
