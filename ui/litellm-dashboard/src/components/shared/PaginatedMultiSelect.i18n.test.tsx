import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { PaginatedMultiSelect } from "./PaginatedMultiSelect";

const renderSelect = (overrides: Partial<React.ComponentProps<typeof PaginatedMultiSelect>> = {}) =>
  renderWithProviders(
    <PaginatedMultiSelect
      options={[]}
      onValueChange={vi.fn()}
      onSearchChange={vi.fn()}
      onLoadMore={vi.fn()}
      {...overrides}
    />,
  );

describe("PaginatedMultiSelect Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese search placeholder and hides the English default", () => {
    renderSelect();

    expect(screen.getByPlaceholderText("搜索…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English default", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("无结果")).toBeInTheDocument();
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading text and hides the English default", async () => {
    const user = userEvent.setup();
    renderSelect({ isLoading: true });

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("加载中…")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
