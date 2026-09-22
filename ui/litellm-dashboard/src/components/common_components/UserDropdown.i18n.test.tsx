import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useInfiniteUsers, useUserLookup } from "@/app/(dashboard)/hooks/users/useUsers";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import UserDropdown from "./UserDropdown";

vi.mock("@/app/(dashboard)/hooks/users/useUsers", () => ({
  useInfiniteUsers: vi.fn(),
  useUserLookup: vi.fn(),
}));

const mockUseInfiniteUsers = vi.mocked(useInfiniteUsers);
const mockUseUserLookup = vi.mocked(useUserLookup);

const usersResult = (overrides: Record<string, unknown> = {}) =>
  ({
    data: { pages: [{ users: [] }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    ...overrides,
  }) as unknown as ReturnType<typeof useInfiniteUsers>;

describe("UserDropdown Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseInfiniteUsers.mockReturnValue(usersResult());
    mockUseUserLookup.mockReturnValue({ data: null } as unknown as ReturnType<typeof useUserLookup>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", () => {
    renderWithProviders(<UserDropdown onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("按邮箱搜索用户…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search users by email…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserDropdown onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "nobody" } });

    expect(await screen.findByText("未找到用户")).toBeInTheDocument();
    expect(screen.queryByText("No users found")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading text and hides the English original", async () => {
    const user = userEvent.setup();
    mockUseInfiniteUsers.mockReturnValue(usersResult({ isLoading: true }));
    renderWithProviders(<UserDropdown onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("正在加载用户…")).toBeInTheDocument();
    expect(screen.queryByText("Loading users…")).not.toBeInTheDocument();
  });
});
