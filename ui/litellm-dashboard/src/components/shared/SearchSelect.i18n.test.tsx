import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { SearchSelect } from "./SearchSelect";

describe("SearchSelect Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese select placeholder and hides the English default", () => {
    renderWithProviders(<SearchSelect options={[]} onValueChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("请选择…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English default", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchSelect options={[]} onValueChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("无结果")).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });
});
