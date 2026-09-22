import { afterEach, beforeEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import { CalcPopover, MathTable } from "./CalcPopover";
import type { MathRow } from "./usageUnits";

const rows: readonly MathRow[] = [{ label: "Content Policy", parts: ["1,000", "× $0.00015"], note: null }];

const renderPopover = () =>
  renderWithProviders(
    <CalcPopover title="Cost math" formula="guardrail + guardrail = cost">
      <MathTable rows={rows} total="$0.1500" />
    </CalcPopover>,
  );

describe("CalcPopover Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese trigger and total row", async () => {
    const user = userEvent.setup();
    renderPopover();

    expect(screen.getByRole("button", { name: "如何计算？" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "How is this calculated?" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "如何计算？" }));

    const dialog = await screen.findByRole("dialog", { name: "Cost math" });
    expect(within(dialog).getByText("总计")).toBeInTheDocument();
    expect(within(dialog).queryByText("Total")).not.toBeInTheDocument();
  });
});
