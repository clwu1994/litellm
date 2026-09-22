import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { UserPopoverCell } from "./UserPopoverCell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("UserPopoverCell Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese field labels and copy labels and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserPopoverCell userAlias="Alias" userEmail="a@b.c" userId="u1" width={200} />);

    await user.hover(screen.getByText("Alias"));

    expect(await screen.findByText("用户别名")).toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("复制用户别名")).toBeInTheDocument();
    expect(screen.queryByText("User Alias")).not.toBeInTheDocument();
    expect(screen.queryByText("User Email")).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Copy User Alias")).not.toBeInTheDocument();
  });
});
