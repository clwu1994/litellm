import React from "react";
import { CircleHelp } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RateLimitType = "tpm" | "rpm";

interface RateLimitTypeOption {
  value: string;
  label: string;
  description: string;
}

interface RateLimitTypeFormItemProps {
  /** The type of rate limit - either 'tpm' or 'rpm' */
  type: RateLimitType;
  /** The form field name */
  name: string;
  /** Whether to show detailed descriptions (default: true) */
  showDetailedDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
  value?: string | null;
  /** Custom onChange handler */
  onChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: true | undefined;
  "aria-describedby"?: string | undefined;
}

const rateLimitTypeOptions = (type: RateLimitType, t: TFunction<"common">): RateLimitTypeOption[] => {
  const upper = type.toUpperCase();
  const lower = type.toLowerCase();
  return [
    {
      value: "best_effort_throughput",
      label: t("rateLimitType.default"),
      description: t("rateLimitType.defaultDescription", { lower }),
    },
    {
      value: "guaranteed_throughput",
      label: t("rateLimitType.guaranteed"),
      description: t("rateLimitType.guaranteedDescription", { lower }),
    },
    {
      value: "dynamic",
      label: t("rateLimitType.dynamic"),
      description: t("rateLimitType.dynamicDescription", { upper }),
    },
  ];
};

const plainLabel = (value: string, t: TFunction<"common">): string => {
  if (value === "best_effort_throughput") return t("rateLimitType.bestEffortPlain");
  if (value === "guaranteed_throughput") return t("rateLimitType.guaranteed");
  if (value === "dynamic") return t("rateLimitType.dynamic");
  return value;
};

export const RateLimitTypeFormItem: React.FC<RateLimitTypeFormItemProps> = ({
  type,
  name,
  showDetailedDescriptions = true,
  className = "",
  value,
  onChange,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}) => {
  const { t } = useTranslation("common");
  const controlId = id ?? `rate-limit-type-${name}`;
  const options = rateLimitTypeOptions(type, t);
  const labelText = t("rateLimitType.label", { type: type.toUpperCase() });
  const tooltip = t("rateLimitType.tooltip", { type: type.toUpperCase() });

  return (
    <div className={className}>
      <TooltipProvider>
        <label htmlFor={controlId} className="mb-2 flex items-center gap-1 text-sm text-foreground">
          {labelText}
          <Tooltip>
            <TooltipTrigger
              render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />}
              aria-label={tooltip}
            />
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </label>
      </TooltipProvider>
      <Select
        value={value ?? null}
        onValueChange={(next: string | null) => next !== null && onChange?.(next)}
        disabled={disabled}
      >
        <SelectTrigger id={controlId} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
          <SelectValue placeholder={t("rateLimitType.placeholder")}>
            {(selected: string | null) =>
              selected === null ? t("rateLimitType.placeholder") : plainLabel(selected, t)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) =>
            showDetailedDescriptions ? (
              <SelectItem key={option.value} value={option.value} title={option.label}>
                <span className="flex flex-col py-1">
                  <span className="font-medium">{option.label}</span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">{option.description}</span>
                </span>
              </SelectItem>
            ) : (
              <SelectItem key={option.value} value={option.value} title={plainLabel(option.value, t)}>
                {plainLabel(option.value, t)}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RateLimitTypeFormItem;
