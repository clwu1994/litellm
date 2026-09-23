import type { TFunction } from "i18next";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export const monthName = (date: Date, t: TFunction<"common">): string =>
  t(`dates.months.${MONTH_KEYS[date.getMonth()]}`);

export const formatMonthDay = (date: Date, t: TFunction<"common">): string =>
  t("dates.monthDay", { month: monthName(date, t), day: date.getDate() });

export const formatNumericDate = (date: Date, t: TFunction<"common">): string =>
  t("dates.numeric", { month: date.getMonth() + 1, day: date.getDate(), year: date.getFullYear() });
