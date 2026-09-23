import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { findTooltipTriggerBeside } from "@/../tests/i18nTooltip";
import i18n from "@/i18n/bootstrapI18n";

import { DateCell } from "./date_cell";

const localDate = new Date(2026, 8, 23, 9, 50, 13);
const localIso = localDate.toISOString();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe("DateCell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese month name for date precision and hides the English", () => {
    renderWithProviders(<DateCell value={localIso} precision="date" />);

    expect(screen.getByText("2026年9月23日")).toBeInTheDocument();
    expect(screen.queryByText("Sep 23, 2026")).not.toBeInTheDocument();
  });

  it("renders the Chinese month name for datetime precision and hides the English", () => {
    renderWithProviders(<DateCell value={localIso} />);

    expect(screen.getByText("9月23日 09:50:13")).toBeInTheDocument();
    expect(screen.queryByText("Sep 23, 09:50:13")).not.toBeInTheDocument();
  });

  it("renders the Chinese full timestamp inside the open tooltip", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    renderWithProviders(<DateCell value={localIso} precision="date" />);

    await user.hover(findTooltipTriggerBeside(screen.getByText("2026年9月23日")));

    expect(await screen.findByText(`2026年9月23日 09:50:13（${timeZone}）`)).toBeInTheDocument();
    expect(screen.queryByText(`Sep 23, 2026, 09:50:13 (${timeZone})`)).not.toBeInTheDocument();
  });
});
