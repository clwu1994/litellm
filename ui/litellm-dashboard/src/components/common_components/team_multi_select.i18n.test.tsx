import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useInfiniteTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import TeamMultiSelect from "./team_multi_select";

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useInfiniteTeams: vi.fn(),
}));

const team = (id: string, alias: string) => ({ team_id: id, team_alias: alias });

const mockTeamsResult = (
  overrides: Partial<{
    pages: { teams: ReturnType<typeof team>[] }[];
    isLoading: boolean;
  }> = {},
) => {
  const { pages = [{ teams: [team("team-1", "Alpha Team")] }], ...rest } = overrides;
  return {
    data: { pages },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    ...rest,
  };
};

describe("TeamMultiSelect Chinese copy", () => {
  const mockUseInfiniteTeams = vi.mocked(useInfiniteTeams);

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseInfiniteTeams.mockReturnValue(mockTeamsResult() as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese search placeholder and hides the English default", () => {
    renderWithProviders(<TeamMultiSelect />);

    expect(screen.getByPlaceholderText("按别名搜索团队...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search teams by alias...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    mockUseInfiniteTeams.mockReturnValue(mockTeamsResult({ pages: [] }) as never);
    renderWithProviders(<TeamMultiSelect />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到团队")).toBeInTheDocument();
    expect(screen.queryByText("No teams found")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading text and hides the English original", async () => {
    const user = userEvent.setup();
    mockUseInfiniteTeams.mockReturnValue(mockTeamsResult({ pages: [], isLoading: true }) as never);
    renderWithProviders(<TeamMultiSelect />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("正在加载团队...")).toBeInTheDocument();
    expect(screen.queryByText("Loading teams...")).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-all label and hides the English original", () => {
    renderWithProviders(<TeamMultiSelect value={["team-1"]} />);

    expect(screen.getByLabelText("清除所有团队")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear all teams")).not.toBeInTheDocument();
  });
});
