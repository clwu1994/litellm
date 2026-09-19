import type { TFunction } from "i18next";
import moment from "moment";
import { describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { getTimeRangeDisplay } from "./logs_utils";

const enT: TFunction<"logs"> = i18n.getFixedT("en", "logs");
const zhT: TFunction<"logs"> = i18n.getFixedT("zh", "logs");

// startTime built relative to "now"; getTimeRangeDisplay computes now() internally.
const ago = (amount: number, unit: moment.unitOfTime.DurationConstructor) =>
  moment().subtract(amount, unit).toISOString();

describe("getTimeRangeDisplay", () => {
  it("labels a ~1-minute window as 'Last 1 Minute'", () => {
    expect(getTimeRangeDisplay(false, ago(1, "minutes"), "", enT)).toBe("Last 1 Minute");
  });

  it("labels a ~10-minute window as 'Last 15 Minutes'", () => {
    expect(getTimeRangeDisplay(false, ago(10, "minutes"), "", enT)).toBe("Last 15 Minutes");
  });

  it("labels a ~30-minute window as 'Last Hour'", () => {
    expect(getTimeRangeDisplay(false, ago(30, "minutes"), "", enT)).toBe("Last Hour");
  });

  it("labels a ~2-hour window as 'Last 4 Hours'", () => {
    expect(getTimeRangeDisplay(false, ago(2, "hours"), "", enT)).toBe("Last 4 Hours");
  });

  it("labels a ~10-hour window as 'Last 24 Hours'", () => {
    expect(getTimeRangeDisplay(false, ago(10, "hours"), "", enT)).toBe("Last 24 Hours");
  });

  it("labels a ~3-day window as 'Last 7 Days'", () => {
    expect(getTimeRangeDisplay(false, ago(3, "days"), "", enT)).toBe("Last 7 Days");
  });

  it("falls back to a 'MMM D - MMM D' range beyond 7 days", () => {
    const label = getTimeRangeDisplay(false, ago(30, "days"), "", enT);
    expect(label).toMatch(/^[A-Z][a-z]{2} \d{1,2} - [A-Z][a-z]{2} \d{1,2}$/);
  });

  it("renders an explicit start - end range when isCustomDate is true", () => {
    const start = "2025-01-02T03:04:00Z";
    const end = "2025-01-05T06:07:00Z";
    const expected = `${moment(start).format("MMM D, h:mm A")} - ${moment(end).format("MMM D, h:mm A")}`;
    expect(getTimeRangeDisplay(true, start, end, enT)).toBe(expected);
  });

  it("renders the Chinese relative labels and hides the English ones under zh", () => {
    expect(getTimeRangeDisplay(false, ago(1, "minutes"), "", zhT)).toBe("最近 1 分钟");
    expect(getTimeRangeDisplay(false, ago(10, "minutes"), "", zhT)).toBe("最近 15 分钟");
    expect(getTimeRangeDisplay(false, ago(30, "minutes"), "", zhT)).toBe("最近 1 小时");
    expect(getTimeRangeDisplay(false, ago(2, "hours"), "", zhT)).toBe("最近 4 小时");
    expect(getTimeRangeDisplay(false, ago(10, "hours"), "", zhT)).toBe("最近 24 小时");
    expect(getTimeRangeDisplay(false, ago(3, "days"), "", zhT)).toBe("最近 7 天");
  });

  it("keeps the explicit start - end range locale-independent under zh", () => {
    const start = "2025-01-02T03:04:00Z";
    const end = "2025-01-05T06:07:00Z";
    const expected = `${moment(start).format("MMM D, h:mm A")} - ${moment(end).format("MMM D, h:mm A")}`;
    expect(getTimeRangeDisplay(true, start, end, zhT)).toBe(expected);
  });
});
