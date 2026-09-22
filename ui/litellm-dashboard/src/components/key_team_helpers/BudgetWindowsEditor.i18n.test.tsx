import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { BudgetWindowsEditor } from "./BudgetWindowsEditor";

describe("BudgetWindowsEditor Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  const cases = [
    { duration: "1h", zhLabel: "每小时", enLabel: "Hourly", zhHint: "每小时重置", enHint: "Resets every hour" },
    {
      duration: "24h",
      zhLabel: "每天",
      enLabel: "Daily",
      zhHint: "每天 UTC 午夜重置",
      enHint: "Resets daily at midnight UTC",
    },
    {
      duration: "7d",
      zhLabel: "每周",
      enLabel: "Weekly",
      zhHint: "每周日 UTC 午夜重置",
      enHint: "Resets every Sunday at midnight UTC",
    },
    {
      duration: "30d",
      zhLabel: "每月",
      enLabel: "Monthly",
      zhHint: "每月 1 日 UTC 午夜重置",
      enHint: "Resets on the 1st of every month at midnight UTC",
    },
  ];

  it.each(cases)(
    "renders the $zhLabel window label and hint in Chinese and hides the English originals",
    ({ duration, zhLabel, enLabel, zhHint, enHint }) => {
      renderWithProviders(
        <BudgetWindowsEditor value={[{ budget_duration: duration, max_budget: null }]} onChange={vi.fn()} />,
      );

      expect(screen.getAllByText(zhLabel).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(enLabel)).toHaveLength(0);
      expect(screen.getByText(`↻ ${zhHint}`)).toBeInTheDocument();
      expect(screen.queryByText(`↻ ${enHint}`)).not.toBeInTheDocument();
    },
  );

  it("renders the add-window action and spend placeholder in Chinese and hides the English originals", () => {
    renderWithProviders(
      <BudgetWindowsEditor value={[{ budget_duration: "24h", max_budget: null }]} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "+ 添加预算窗口" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Budget Window" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("最大消费（$）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Max spend ($)")).not.toBeInTheDocument();
  });
});
