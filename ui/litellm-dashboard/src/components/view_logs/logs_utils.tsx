import type { TFunction } from "i18next";
import moment from "moment";

// Add this function to format the time range display
export const getTimeRangeDisplay = (
  isCustomDate: boolean,
  startTime: string,
  endTime: string,
  t: TFunction<"logs">,
) => {
  if (isCustomDate) {
    return `${moment(startTime).format("MMM D, h:mm A")} - ${moment(endTime).format("MMM D, h:mm A")}`;
  }

  const now = moment();
  const start = moment(startTime);
  const diffMinutes = now.diff(start, "minutes");

  // Use exact ranges to prevent drift
  if (diffMinutes >= 0 && diffMinutes < 2) return t("request.toolbar.relative.lastMinute");
  if (diffMinutes >= 2 && diffMinutes < 16) return t("request.toolbar.relative.last15Minutes");
  if (diffMinutes >= 16 && diffMinutes < 61) return t("request.toolbar.relative.lastHour");

  const diffHours = now.diff(start, "hours");
  if (diffHours >= 1 && diffHours < 5) return t("request.toolbar.relative.last4Hours");
  if (diffHours >= 5 && diffHours < 25) return t("request.toolbar.relative.last24Hours");
  if (diffHours >= 25 && diffHours < 169) return t("request.toolbar.relative.last7Days");
  return `${start.format("MMM D")} - ${now.format("MMM D")}`;
};
