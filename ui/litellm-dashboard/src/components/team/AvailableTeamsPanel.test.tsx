import * as networking from "@/components/networking";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../tests/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import AvailableTeamsPanel from "./AvailableTeamsPanel";
import type { AvailableTeam } from "./AvailableTeamsTableColumns";

vi.mock("@/components/networking", () => ({
  availableTeamListCall: vi.fn(),
  teamMemberAddCall: vi.fn(),
}));

const team = (overrides: Partial<AvailableTeam> = {}): AvailableTeam => ({
  team_id: "team-1",
  team_alias: "Test Team 1",
  description: "Test Description 1",
  models: ["gpt-4"],
  members_with_roles: [{ user_id: "user-1", user_email: "user1@test.com", role: "admin" }],
  ...overrides,
});

describe("AvailableTeamsPanel", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render the column headers", async () => {
    vi.mocked(networking.availableTeamListCall).mockResolvedValue([team()]);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("Team Name")).toBeInTheDocument();
    });
    expect(screen.getByText("Models")).toBeInTheDocument();
  });

  it("should display teams when available", async () => {
    const mockTeams = [
      team({ team_id: "team-1", team_alias: "Test Team 1" }),
      team({ team_id: "team-2", team_alias: "Test Team 2", models: [] }),
    ];

    vi.mocked(networking.availableTeamListCall).mockResolvedValue(mockTeams);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("Test Team 2")).toBeInTheDocument();
    });
  });

  it("should display the empty state when no teams are available", async () => {
    vi.mocked(networking.availableTeamListCall).mockResolvedValue([]);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(/No available teams to join/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/See how to set available teams/i)).toBeInTheDocument();
  });

  it("should call teamMemberAddCall when the Join team menu item is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.availableTeamListCall).mockResolvedValue([team({ team_id: "team-1" })]);
    vi.mocked(networking.teamMemberAddCall).mockResolvedValue({});

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await user.click(await screen.findByTestId("available-team-actions-team-1"));
    await user.click(await screen.findByTestId("available-team-action-join"));

    await waitFor(() => {
      expect(networking.teamMemberAddCall).toHaveBeenCalledWith("token-123", "team-1", {
        user_id: "user-123",
        role: "user",
      });
    });
  });

  it("should show the All Proxy Models badge when a team has no models", async () => {
    vi.mocked(networking.availableTeamListCall).mockResolvedValue([team({ models: [] })]);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("All Proxy Models")).toBeInTheDocument();
    });
  });

  it("should show model badges when a team has models", async () => {
    vi.mocked(networking.availableTeamListCall).mockResolvedValue([team({ models: ["gpt-4", "gpt-3.5-turbo"] })]);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText("gpt-4")).toBeInTheDocument();
      expect(screen.getByText("gpt-3.5-turbo")).toBeInTheDocument();
    });
  });

  it("should resolve to the empty state without fetching when there is no access token", async () => {
    renderWithProviders(<AvailableTeamsPanel accessToken={null} userID="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(/No available teams to join/i)).toBeInTheDocument();
    });
    expect(networking.availableTeamListCall).not.toHaveBeenCalled();
  });

  it("should hold the loading skeleton until the fetch settles", async () => {
    let resolveFetch: (teams: AvailableTeam[]) => void = () => {};
    const pending = new Promise<AvailableTeam[]>((resolve) => {
      resolveFetch = resolve;
    });
    vi.mocked(networking.availableTeamListCall).mockReturnValue(pending);

    renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

    expect(screen.queryByText(/No available teams to join/i)).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch([]);
    });

    await waitFor(() => {
      expect(screen.getByText(/No available teams to join/i)).toBeInTheDocument();
    });
  });

  describe("localization", () => {
    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese available-team labels under zh", async () => {
      vi.mocked(networking.availableTeamListCall).mockResolvedValue([team()]);
      await i18n.changeLanguage("zh");

      renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

      expect(await screen.findByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("团队名称")).toBeInTheDocument();
      expect(screen.getByText("描述")).toBeInTheDocument();
      expect(screen.getByText("成员")).toBeInTheDocument();
      expect(screen.getByText("1 名成员")).toBeInTheDocument();

      expect(screen.queryByText("Team Name")).not.toBeInTheDocument();
      expect(screen.queryByText("Description")).not.toBeInTheDocument();
      expect(screen.queryByText("1 members")).not.toBeInTheDocument();
    });

    it("renders the Chinese empty state under zh", async () => {
      vi.mocked(networking.availableTeamListCall).mockResolvedValue([]);
      await i18n.changeLanguage("zh");

      renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

      expect(await screen.findByText("没有可加入的团队")).toBeInTheDocument();
      expect(screen.queryByText(/No available teams to join/i)).not.toBeInTheDocument();
    });

    it("renders the English available-team labels under en", async () => {
      vi.mocked(networking.availableTeamListCall).mockResolvedValue([team()]);
      await i18n.changeLanguage("en");

      renderWithProviders(<AvailableTeamsPanel accessToken="token-123" userID="user-123" />);

      expect(await screen.findByText("Test Team 1")).toBeInTheDocument();
      expect(screen.getByText("Team Name")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("1 members")).toBeInTheDocument();

      expect(screen.queryByText("团队名称")).not.toBeInTheDocument();
      expect(screen.queryByText("1 名成员")).not.toBeInTheDocument();
    });
  });
});
