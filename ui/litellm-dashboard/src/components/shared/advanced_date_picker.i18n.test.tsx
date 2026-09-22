import { fireEvent } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import AdvancedDatePicker from "./advanced_date_picker";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.requestIdleCallback) {
    window.requestIdleCallback = ((callback: IdleRequestCallback) =>
      setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1) as unknown as number) as never;
  }
});

const defaultValue = {
  from: new Date("2025-01-01T12:00:00.000Z"),
  to: new Date("2025-01-31T12:00:00.000Z"),
};

describe("AdvancedDatePicker Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  const open = () => fireEvent.click(screen.getByRole("button", { expanded: false }));

  it("renders the Chinese default label and date-range fallback and hides the English originals", () => {
    renderWithProviders(<AdvancedDatePicker value={{}} onValueChange={vi.fn()} />);

    expect(screen.getByText("选择时间范围")).toBeInTheDocument();
    expect(screen.getByText("选择日期范围")).toBeInTheDocument();
    expect(screen.queryByText("Select Time Range")).not.toBeInTheDocument();
    expect(screen.queryByText("Select date range")).not.toBeInTheDocument();
  });

  it("keeps a caller-supplied label verbatim", () => {
    renderWithProviders(<AdvancedDatePicker value={defaultValue} onValueChange={vi.fn()} label="Custom Label" />);

    expect(screen.getByText("Custom Label")).toBeInTheDocument();
    expect(screen.queryByText("选择时间范围")).not.toBeInTheDocument();
  });

  it("renders the Chinese panel headings and presets and hides the English originals", () => {
    renderWithProviders(<AdvancedDatePicker value={defaultValue} onValueChange={vi.fn()} />);

    open();

    expect(screen.getByText("相对时间")).toBeInTheDocument();
    expect(screen.getByText("今天")).toBeInTheDocument();
    expect(screen.getByText("最近 7 天")).toBeInTheDocument();
    expect(screen.getByText("最近 30 天")).toBeInTheDocument();
    expect(screen.getByText("本月至今")).toBeInTheDocument();
    expect(screen.getByText("本年至今")).toBeInTheDocument();
    expect(screen.getByText("开始和结束日期")).toBeInTheDocument();
    expect(screen.getByText("开始日期")).toBeInTheDocument();
    expect(screen.getByText("结束日期")).toBeInTheDocument();
    expect(screen.getByText("从：")).toBeInTheDocument();
    expect(screen.getByText("到：")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "应用" })).toBeInTheDocument();

    expect(screen.queryByText("Relative time")).not.toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Start and end dates")).not.toBeInTheDocument();
    expect(screen.queryByText("From:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("renders the Chinese validation error and hides the English original", async () => {
    renderWithProviders(<AdvancedDatePicker value={defaultValue} onValueChange={vi.fn()} />);

    open();

    fireEvent.change(screen.getByDisplayValue("2025-01-01"), { target: { value: "2025-12-01" } });
    fireEvent.change(screen.getByDisplayValue("2025-01-31"), { target: { value: "2025-01-01" } });

    expect(await screen.findByText("结束日期不能早于开始日期")).toBeInTheDocument();
    expect(screen.queryByText("End date cannot be before start date")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-format error and hides the English original", async () => {
    const invalid = { from: new Date("not-a-date"), to: new Date("not-a-date") };
    renderWithProviders(<AdvancedDatePicker value={invalid} onValueChange={vi.fn()} />);

    open();

    expect(await screen.findByText("日期格式无效")).toBeInTheDocument();
    expect(screen.queryByText("Invalid date format")).not.toBeInTheDocument();
  });
});
