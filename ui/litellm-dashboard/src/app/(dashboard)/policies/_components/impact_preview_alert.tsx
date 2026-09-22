import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";

interface ImpactResult {
  affected_keys_count: number;
  affected_teams_count: number;
  sample_keys: string[];
  sample_teams: string[];
}

interface ImpactPreviewAlertProps {
  impactResult: ImpactResult;
}

interface SampleListProps {
  label: string;
  samples: string[];
  totalCount: number;
}

const SampleList: React.FC<SampleListProps> = ({ label, samples, totalCount }) => {
  const { t } = useTranslation("policies");

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-xs text-muted-foreground">{label} </span>
      {samples.slice(0, 5).map((sample) => (
        <Badge key={sample} variant="outline">
          {sample}
        </Badge>
      ))}
      {totalCount > 5 && (
        <span className="text-xs text-muted-foreground">{t("impact.more", { remainingCount: totalCount - 5 })}</span>
      )}
    </div>
  );
};

const ImpactPreviewAlert: React.FC<ImpactPreviewAlertProps> = ({ impactResult }) => {
  const { t } = useTranslation("policies");
  const isGlobal = impactResult.affected_keys_count === -1;
  const keyWord = impactResult.affected_keys_count !== 1 ? t("impact.keyPlural") : t("impact.keySingular");
  const teamWord = impactResult.affected_teams_count !== 1 ? t("impact.teamPlural") : t("impact.teamSingular");

  return (
    <Alert className="mb-4">
      {isGlobal ? <AlertTriangle /> : <Info />}
      <AlertTitle>{t("impact.previewTitle")}</AlertTitle>
      <AlertDescription>
        {isGlobal ? (
          <span>
            <Trans ns="policies" i18nKey="impact.globalScopeAlert" components={{ strong: <strong /> }} />
          </span>
        ) : (
          <div>
            <span>
              {t("impact.previewLead")}
              <strong>
                {impactResult.affected_keys_count} {keyWord}
              </strong>
              {t("impact.andWord")}
              <strong>
                {impactResult.affected_teams_count} {teamWord}
              </strong>
              {t("impact.sentenceEnd")}
            </span>
            {impactResult.sample_keys.length > 0 && (
              <SampleList
                label={t("impact.keysLabel")}
                samples={impactResult.sample_keys}
                totalCount={impactResult.affected_keys_count}
              />
            )}
            {impactResult.sample_teams.length > 0 && (
              <SampleList
                label={t("impact.teamsLabel")}
                samples={impactResult.sample_teams}
                totalCount={impactResult.affected_teams_count}
              />
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ImpactPreviewAlert;
