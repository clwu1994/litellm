import { CircleHelp } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Display: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-1 rounded-sm bg-muted p-2">{children}</div>
);

const FIELD_LABEL_CLASS = "text-sm font-medium text-foreground";

export const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode }> = ({ htmlFor, children }) =>
  htmlFor === undefined ? (
    <p className={FIELD_LABEL_CLASS}>{children}</p>
  ) : (
    <label htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
      {children}
    </label>
  );

export const Hint: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip>
    <TooltipTrigger
      render={<CircleHelp className="ml-1 inline size-3.5 shrink-0 cursor-help text-muted-foreground" />}
    />
    <TooltipContent className="max-w-xs">{text}</TooltipContent>
  </Tooltip>
);

export const DocsHint: React.FC<{ text: string; href: string }> = ({ text, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
    <Hint text={text} />
  </a>
);

export const ChipList: React.FC<{ values: unknown; emptyLabel: string }> = ({ values, emptyLabel }) => {
  const { t } = useTranslation("models");
  if (!values) {
    return <>{t("delete.notSet")}</>;
  }
  if (!Array.isArray(values)) {
    return <>{String(values)}</>;
  }
  if (values.length === 0) {
    return <>{emptyLabel}</>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((entry: string, index: number) => (
        <Badge key={index} variant="secondary">
          {entry}
        </Badge>
      ))}
    </div>
  );
};
