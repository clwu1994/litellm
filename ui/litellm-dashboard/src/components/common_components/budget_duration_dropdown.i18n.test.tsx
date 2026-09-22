import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import BudgetDurationDropdown, { getBudgetDurationLabel } from "./budget_duration_dropdown";

function LabelHarness({ value }: { value: string | null | undefined }) {
  const { t } = useTranslation("common");
  return <span data-testid="duration-label">{getBudgetDurationLabel(value, t)}</span>;
}

describe("BudgetDurationDropdown Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese duration options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetDurationDropdown showNeverResets />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "永不重置" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每小时" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每天" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每周" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每月" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "无" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Never resets" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "hourly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "daily" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "weekly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "monthly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "n/a" })).not.toBeInTheDocument();
  });

  it("renders the Chinese n/a placeholder on the closed trigger", () => {
    renderWithProviders(<BudgetDurationDropdown />);

    expect(screen.getByRole("combobox")).toHaveTextContent("无");
    expect(screen.queryByText("n/a")).not.toBeInTheDocument();
  });

  it.each([
    ["1h", "每小时"],
    ["24h", "每天"],
    ["7d", "每周"],
    ["30d", "每月"],
  ])("resolves %s to %s under zh", (value, expected) => {
    renderWithProviders(<LabelHarness value={value} />);

    expect(screen.getByTestId("duration-label")).toHaveTextContent(expected);
  });

  it("resolves an unset duration to the Chinese not-set label", () => {
    renderWithProviders(<LabelHarness value={null} />);

    expect(screen.getByTestId("duration-label")).toHaveTextContent("未设置");
    expect(screen.getByTestId("duration-label")).not.toHaveTextContent("Not set");
  });

  it("passes an unmapped duration through unchanged", () => {
    renderWithProviders(<LabelHarness value="3d" />);

    expect(screen.getByTestId("duration-label")).toHaveTextContent("3d");
  });
});
