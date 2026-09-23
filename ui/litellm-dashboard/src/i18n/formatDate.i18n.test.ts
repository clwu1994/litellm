import { describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { formatMonthDay, formatNumericDate, monthName } from "./formatDate";

const date = new Date(2026, 8, 23, 9, 50, 13);
const zh = i18n.getFixedT("zh", "common");
const en = i18n.getFixedT("en", "common");

describe("formatDate Chinese copy", () => {
  it("translates every month name", () => {
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const zhMonths = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    for (let month = 0; month < 12; month += 1) {
      const day = new Date(2026, month, 15);
      expect(monthName(day, zh)).toBe(zhMonths[month]);
      expect(monthName(day, en)).toBe(enMonths[month]);
    }
  });

  it("translates the month name", () => {
    expect(monthName(date, zh)).toBe("9月");
    expect(monthName(date, en)).toBe("Sep");
  });

  it("translates the month-day format used by the savings range labels", () => {
    expect(formatMonthDay(date, zh)).toBe("9月23日");
    expect(formatMonthDay(date, en)).toBe("Sep 23");
  });

  it("translates the numeric format used by the shadow-eval job header", () => {
    expect(formatNumericDate(date, zh)).toBe("2026/9/23");
    expect(formatNumericDate(date, en)).toBe("9/23/2026");
  });
});
