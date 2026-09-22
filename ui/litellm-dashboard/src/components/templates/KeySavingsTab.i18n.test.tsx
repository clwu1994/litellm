import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as useScopedDailyActivityRangeModule from "@/app/(dashboard)/cost-optimization/_components/useDailyActivityRange";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import KeySavingsTab from "./KeySavingsTab";

const scopedRange = () => vi.spyOn(useScopedDailyActivityRangeModule, "useScopedDailyActivityRange");

const idleRange = () => ({
  dateValue: { from: new Date("2025-01-01"), to: new Date("2025-01-31") },
  onDateChange: vi.fn(),
  results: [],
  loading: false,
  isFetchingMore: false,
});

const loadingRange = () => ({ ...idleRange(), loading: true });

const activity = {
  dateValue: { from: new Date(2025, 0, 1), to: new Date(2025, 0, 31) },
  onDateChange: vi.fn(),
};

const renderTab = (overrides: Record<string, unknown> = {}) =>
  renderWithProviders(
    <KeySavingsTab
      accessToken="test-token"
      keyToken="key-abc123"
      userId="user-123"
      userRole="Internal User"
      activity={activity}
      {...overrides}
    />,
  );

describe("KeySavingsTab Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.restoreAllMocks();
  });

  it("renders the notes, tabs and empty state in Chinese and hides the English originals", () => {
    scopedRange().mockReturnValue(idleRange());

    renderTab();

    expect(screen.getByText("消费按 UTC 日期分桶")).toBeInTheDocument();
    expect(screen.queryByText("Spend is bucketed by UTC day")).not.toBeInTheDocument();
    expect(
      screen.getByText("显示的是你自己在该密钥上的请求。团队共享的密钥还会包含其他成员的消费，此处未计入。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Showing your own requests on this key. A key shared across a team will have spend from other members that is not counted here.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("节省")).toBeInTheDocument();
    expect(screen.queryByText("Savings")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "累计" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Cumulative" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "每天" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Per day" })).not.toBeInTheDocument();
    expect(screen.getByText("该密钥在此范围内没有使用记录。")).toBeInTheDocument();
    expect(screen.queryByText("No usage recorded for this key in this range.")).not.toBeInTheDocument();
  });

  it("renders the cumulative subtitle in Chinese and hides the English original", () => {
    scopedRange().mockReturnValue(idleRange());

    renderTab();

    expect(screen.getByText(/累计节省/)).toBeInTheDocument();
    expect(screen.queryByText(/Running total saved/)).not.toBeInTheDocument();
    expect(screen.getByText(/（UTC）/)).toBeInTheDocument();
  });

  it("renders the per-day subtitle in Chinese and hides the English original", async () => {
    const user = userEvent.setup();
    scopedRange().mockReturnValue(idleRange());

    renderTab();
    await user.click(screen.getByRole("tab", { name: "每天" }));

    expect(screen.getByText(/每天节省/)).toBeInTheDocument();
    expect(screen.queryByText(/Saved per day/)).not.toBeInTheDocument();
  });

  it("renders the loading state in Chinese and hides the English original", () => {
    scopedRange().mockReturnValue(loadingRange());

    renderTab();

    expect(screen.getByText("正在加载节省数据...")).toBeInTheDocument();
    expect(screen.queryByText("Loading savings...")).not.toBeInTheDocument();
  });
});
