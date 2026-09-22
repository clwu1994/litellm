import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import OrganizationDropdown from "./OrganizationDropdown";

describe("OrganizationDropdown Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English default", () => {
    renderWithProviders(<OrganizationDropdown organizations={[]} />);

    expect(screen.getByPlaceholderText("所有组织")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("All Organizations")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationDropdown organizations={[]} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到组织")).toBeInTheDocument();
    expect(screen.queryByText("No organizations found")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OrganizationDropdown organizations={[]} loading />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("正在加载组织…")).toBeInTheDocument();
    expect(screen.queryByText("Loading organizations…")).not.toBeInTheDocument();
  });
});
