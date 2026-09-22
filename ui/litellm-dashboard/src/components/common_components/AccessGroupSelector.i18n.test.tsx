import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccessGroups } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import AccessGroupSelector from "./AccessGroupSelector";

vi.mock("@/app/(dashboard)/hooks/accessGroups/useAccessGroups", () => ({
  useAccessGroups: vi.fn(),
}));

const mockUseAccessGroups = vi.mocked(useAccessGroups);

describe("AccessGroupSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseAccessGroups.mockReturnValue({ data: [], isLoading: false, isError: false } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English default", () => {
    renderWithProviders(<AccessGroupSelector />);

    expect(screen.getByPlaceholderText("选择访问组")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select access groups")).not.toBeInTheDocument();
  });

  it("renders the Chinese label and hides the English default", () => {
    renderWithProviders(<AccessGroupSelector showLabel />);

    expect(screen.getByText("访问组")).toBeInTheDocument();
    expect(screen.queryByText("Access Group")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccessGroupSelector />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到访问组")).toBeInTheDocument();
    expect(screen.queryByText("No access groups found")).not.toBeInTheDocument();
  });

  it("renders the Chinese error text and hides the English original", async () => {
    const user = userEvent.setup();
    mockUseAccessGroups.mockReturnValue({ data: [], isLoading: false, isError: true } as never);
    renderWithProviders(<AccessGroupSelector />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("加载访问组失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load access groups")).not.toBeInTheDocument();
  });
});
