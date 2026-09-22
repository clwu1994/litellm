import { ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";

interface PaginationStatusAlertsProps {
  isFetchingMore: boolean;
  cancelled: boolean;
  progress: { currentPage: number; totalPages: number };
  cancel: () => void;
  subject?: string;
}

const PaginationStatusAlerts = ({
  isFetchingMore,
  cancelled,
  progress,
  cancel,
  subject,
}: PaginationStatusAlertsProps) => {
  const { t } = useTranslation("common");
  const resolvedSubject = subject ?? t("paginationStatus.subject");
  return (
    <>
      {isFetchingMore && (
        <Alert variant="warning" className="mb-2">
          <AlertDescription className="flex items-center justify-between text-inherit">
            <span>
              <Loader2 className="mr-2 inline size-4 animate-spin align-text-bottom" />
              {t("paginationStatus.fetching", {
                subject: resolvedSubject,
                current: progress.currentPage,
                total: progress.totalPages,
              })}{" "}
              <a href={window.location.href} target="_blank" rel="noopener noreferrer">
                {t("paginationStatus.openNewTab")} <ExternalLink className="inline size-3.5 align-text-bottom" />
              </a>
              .
            </span>
            <Button variant="destructive" onClick={cancel}>
              {t("paginationStatus.stop")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {cancelled && (
        <Alert variant="info" className="mb-2">
          <AlertDescription className="text-inherit">
            {t("paginationStatus.partial", {
              subject: resolvedSubject,
              current: progress.currentPage,
              total: progress.totalPages,
            })}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default PaginationStatusAlerts;
