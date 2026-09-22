import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface routingStrategyArgs {
  ttl?: number;
  lowest_latency_buffer?: number;
}

const defaultLowestLatencyArgs: routingStrategyArgs = {
  ttl: 3600,
  lowest_latency_buffer: 0,
};

const PARAM_EXPLANATION_KEYS = {
  ttl: "routerForm.ttlExplanation",
  lowest_latency_buffer: "routerForm.lowestLatencyBufferExplanation",
} as const;

interface LatencyBasedConfigurationProps {
  routingStrategyArgs: { [key: string]: any };
}

const LatencyBasedConfiguration: React.FC<LatencyBasedConfigurationProps> = ({ routingStrategyArgs }) => {
  const { t } = useTranslation("routerSettings");

  return (
    <>
      <div className="space-y-6">
        <div className="max-w-3xl">
          <h3 className="text-sm font-medium text-foreground">{t("routerForm.latencyTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("routerForm.latencyDescription")}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Object.entries(routingStrategyArgs || defaultLowestLatencyArgs).map(([param, value]) => {
            const explanationKey = PARAM_EXPLANATION_KEYS[param as keyof typeof PARAM_EXPLANATION_KEYS];
            return (
              <div key={param} className="space-y-2">
                <label className="block">
                  <span className="text-xs font-medium text-foreground uppercase tracking-wide">
                    {param.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    {explanationKey === undefined ? "" : t(explanationKey)}
                  </p>
                  <Input
                    name={param}
                    defaultValue={typeof value === "object" ? JSON.stringify(value, null, 2) : value?.toString()}
                    className="font-mono text-sm w-full"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border" />
    </>
  );
};

export default LatencyBasedConfiguration;
