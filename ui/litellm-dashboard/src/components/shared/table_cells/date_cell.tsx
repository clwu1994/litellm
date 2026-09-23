"use client";

import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { monthName } from "@/i18n/formatDate";

import { CellTooltip } from "./cell_tooltip";

export type DatePrecision = "datetime" | "date";

interface DateCellProps {
  value: string | null | undefined;
  precision?: DatePrecision;
  fallback?: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export const formatCellDate = (date: Date, precision: DatePrecision, t: TFunction<"common">): string => {
  const month = monthName(date, t);
  const day = date.getDate();
  if (precision === "date") {
    return t("dates.monthDayYear", { month, day, year: date.getFullYear() });
  }
  const time = {
    hour: pad(date.getHours()),
    minute: pad(date.getMinutes()),
    second: pad(date.getSeconds()),
  };
  return t("dates.monthDayTime", { month, day, ...time });
};

export const formatFullTimestamp = (date: Date, t: TFunction<"common">): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const day = t("dates.monthDayYear", {
    month: monthName(date, t),
    day: date.getDate(),
    year: date.getFullYear(),
  });
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return t("dates.fullTimestamp", { date: day, time, timeZone });
};

export function DateCell({ value, precision = "datetime", fallback = "-" }: DateCellProps) {
  const { t } = useTranslation();
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  return (
    <CellTooltip
      content={formatFullTimestamp(date, t)}
      trigger={<span className="whitespace-nowrap">{formatCellDate(date, precision, t)}</span>}
    />
  );
}
