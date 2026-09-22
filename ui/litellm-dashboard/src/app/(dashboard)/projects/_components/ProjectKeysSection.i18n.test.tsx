import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ProjectKeysSection } from "./ProjectKeysSection";

const mockUseKeys = vi.fn();
vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useKeys: (...args: unknown[]) => mockUseKeys(...args),
}));

vi.mock("@/components/common_components/DefaultProxyAdminTag", () => ({
  default: ({ userId }: { userId: string }) => <span data-testid="owner-tag">{userId}</span>,
}));

const emptyKeysResponse = {
  data: { keys: [], total_count: 0, current_page: 1, total_pages: 1 },
  isLoading: false,
};

describe("ProjectKeysSection Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseKeys.mockReturnValue(emptyKeysResponse);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese card title and filter placeholder", () => {
    renderWithProviders(<ProjectKeysSection projectId="proj-1" />);

    expect(screen.getByText("密钥")).toBeInTheDocument();
    expect(screen.queryByText("Keys")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("按密钥名称筛选...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Filter by key name...")).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-filter control only once a filter is typed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectKeysSection projectId="proj-1" />);

    expect(screen.queryByLabelText("清除密钥筛选")).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("按密钥名称筛选..."), "sk-");

    expect(screen.getByLabelText("清除密钥筛选")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear key filter")).not.toBeInTheDocument();
  });
});
