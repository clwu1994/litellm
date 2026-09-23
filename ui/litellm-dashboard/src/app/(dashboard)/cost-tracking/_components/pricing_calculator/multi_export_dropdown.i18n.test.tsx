import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MultiExportDropdown from "./multi_export_dropdown";
import type { MultiModelResult } from "./types";

vi.mock("./multi_export_utils", () => ({
  exportMultiToPDF: vi.fn(),
  exportMultiToCSV: vi.fn(),
}));

const multiResult: MultiModelResult = {
  entries: [
    {
      entry: { id: "e1", model: "gpt-4", input_tokens: 1000, output_tokens: 500 },
      result: {
        model: "gpt-4",
        input_tokens: 1000,
        output_tokens: 500,
        num_requests_per_day: null,
        num_requests_per_month: null,
        cost_per_request: 0.05,
        input_cost_per_request: 0.03,
        output_cost_per_request: 0.02,
        margin_cost_per_request: 0,
        daily_cost: null,
        daily_input_cost: null,
        daily_output_cost: null,
        daily_margin_cost: null,
        monthly_cost: null,
        monthly_input_cost: null,
        monthly_output_cost: null,
        monthly_margin_cost: null,
        input_cost_per_token: null,
        output_cost_per_token: null,
        provider: "openai",
      },
      loading: false,
      error: null,
    },
  ],
  totals: {
    cost_per_request: 0.05,
    daily_cost: null,
    monthly_cost: null,
    margin_per_request: 0,
    daily_margin: null,
    monthly_margin: null,
  },
};

describe("MultiExportDropdown Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese trigger and menu items", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MultiExportDropdown multiResult={multiResult} />);

    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出" }));

    expect(await screen.findByRole("menuitem", { name: "导出为 PDF" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "导出为 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Export as PDF" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Export as CSV" })).not.toBeInTheDocument();
  });
});
