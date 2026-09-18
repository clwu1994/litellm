import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { renderWithProviders, screen } from "../../../tests/test-utils";
import MyUserTab from "./MyUserTab";
import { useMyTeamMember } from "./useMyTeamMember";

vi.mock("./useMyTeamMember", () => ({
  useMyTeamMember: vi.fn(),
}));

describe("MyUserTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render", () => {
    vi.mocked(useMyTeamMember).mockReturnValue({ isLoading: true } as ReturnType<typeof useMyTeamMember>);

    renderWithProviders(<MyUserTab teamId="team-1" />);

    expect(screen.getByText("Loading your membership info…")).toBeInTheDocument();
  });

  it("should display the current member budget and model scope", () => {
    vi.mocked(useMyTeamMember).mockReturnValue({
      data: {
        user_id: "user-1",
        user_email: "member@example.com",
        team_id: "team-1",
        role: "admin",
        spend: 12.5,
        total_spend: 30,
        litellm_budget_table: {
          max_budget: 100,
          tpm_limit: 1000,
          rpm_limit: 10,
          allowed_models: ["model-one"],
        },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMyTeamMember>);

    renderWithProviders(<MyUserTab teamId="team-1" />);

    expect(screen.getByText("member@example.com")).toBeInTheDocument();
    expect(screen.getByText("model-one")).toBeInTheDocument();
    expect(screen.getByText("TPM: 1,000")).toBeInTheDocument();
  });
});

describe("MyUserTab localization", () => {
  const renderMember = () => {
    vi.mocked(useMyTeamMember).mockReturnValue({
      data: {
        user_id: "user-1",
        user_email: "member@example.com",
        team_id: "team-1",
        role: "admin",
        spend: 12.5,
        total_spend: 30,
        litellm_budget_table: {
          max_budget: 100,
          tpm_limit: 1000,
          rpm_limit: 10,
          allowed_models: ["model-one"],
        },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useMyTeamMember>);
    return renderWithProviders(<MyUserTab teamId="team-1" />);
  };

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese membership labels under zh", async () => {
    await i18n.changeLanguage("zh");
    renderMember();

    expect(screen.getByText("用户")).toBeInTheDocument();
    expect(screen.getByText("团队角色")).toBeInTheDocument();
    expect(screen.getByText("当前周期消费（USD）")).toBeInTheDocument();
    expect(screen.getByText("累计消费（USD）")).toBeInTheDocument();

    expect(screen.queryByText("Current Cycle Spend (USD)")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Spend (USD)")).not.toBeInTheDocument();
  });

  it("renders the English membership labels under en", async () => {
    await i18n.changeLanguage("en");
    renderMember();

    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Team Role")).toBeInTheDocument();
    expect(screen.getByText("Current Cycle Spend (USD)")).toBeInTheDocument();

    expect(screen.queryByText("用户")).not.toBeInTheDocument();
    expect(screen.queryByText("当前周期消费（USD）")).not.toBeInTheDocument();
  });
});
