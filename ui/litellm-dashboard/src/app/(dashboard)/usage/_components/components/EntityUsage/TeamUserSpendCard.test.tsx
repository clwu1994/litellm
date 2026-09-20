import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import TeamUserSpendCard from "./TeamUserSpendCard";

vi.mock("@/components/networking", () => ({
  teamSpendByUserCall: vi.fn(),
}));

const row = (overrides: Partial<networking.TeamUserSpendResponse["results"][number]>) => ({
  team_id: "team-alpha",
  team_alias: "Team Alpha",
  user_id: "alice@example.com",
  user_email: "alice@example.com",
  user_alias: null,
  spend: 0.5,
  prompt_tokens: 10,
  completion_tokens: 5,
  total_tokens: 15,
  api_requests: 3,
  successful_requests: 2,
  failed_requests: 1,
  ...overrides,
});

const defaultProps = {
  accessToken: "test-token",
  startTime: new Date("2026-09-01T00:00:00Z"),
  endTime: new Date("2026-09-04T00:00:00Z"),
  teamIds: ["team-alpha"],
};

describe("TeamUserSpendCard", () => {
  const mockCall = vi.mocked(networking.teamSpendByUserCall);

  beforeEach(() => {
    mockCall.mockReset();
    testQueryClient.clear();
    mockCall.mockResolvedValue({
      start_date: "2026-09-01",
      end_date: "2026-09-04",
      results: [row({})],
    });
  });

  it("renders the English chrome", async () => {
    renderWithProviders(<TeamUserSpendCard {...defaultProps} />);

    expect(await screen.findByText("Spend Per User Within Team")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Attributed per request from spend logs, so it includes JWT/SSO traffic that does not use a virtual key",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese title, description, download button and table headers and hides the English ones", async () => {
      renderWithProviders(<TeamUserSpendCard {...defaultProps} />);

      expect(await screen.findByText("团队内按用户统计支出")).toBeInTheDocument();
      expect(screen.getByText("按请求从支出日志归属，因此包含不使用 Virtual Key 的 JWT/SSO 流量")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "下载 CSV" })).toBeInTheDocument();
      for (const header of ["团队", "用户", "支出", "请求数", "成功", "失败", "Token 数"]) {
        expect(screen.getByText(header)).toBeInTheDocument();
      }

      expect(screen.queryByText("Spend Per User Within Team")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Download CSV" })).not.toBeInTheDocument();
      expect(screen.queryByText("Team")).not.toBeInTheDocument();
      expect(screen.queryByText("User")).not.toBeInTheDocument();
      expect(screen.queryByText("Requests")).not.toBeInTheDocument();
      expect(screen.queryByText("Successful")).not.toBeInTheDocument();
      expect(screen.queryByText("Failed")).not.toBeInTheDocument();
      expect(screen.queryByText("Tokens")).not.toBeInTheDocument();
    });

    it("renders the Chinese no-user placeholder for a row with no identity and hides the English one", async () => {
      mockCall.mockResolvedValue({
        start_date: "2026-09-01",
        end_date: "2026-09-04",
        results: [row({ user_id: "", user_email: null, user_alias: null })],
      });

      renderWithProviders(<TeamUserSpendCard {...defaultProps} />);

      expect(await screen.findByText("（无用户）")).toBeInTheDocument();
      expect(screen.queryByText("(no user)")).not.toBeInTheDocument();
    });

    it("renders the Chinese prompt to pick a team and hides the English one", async () => {
      renderWithProviders(<TeamUserSpendCard {...defaultProps} teamIds={[]} />);

      expect(await screen.findByText("选择团队以查看按用户统计的支出")).toBeInTheDocument();
      expect(screen.queryByText("Select a team to see spend per user")).not.toBeInTheDocument();
    });

    it("renders the Chinese empty-range state and hides the English one", async () => {
      mockCall.mockResolvedValue({ start_date: "2026-09-01", end_date: "2026-09-04", results: [] });

      renderWithProviders(<TeamUserSpendCard {...defaultProps} />);

      expect(await screen.findByText("此时间范围内没有用户支出")).toBeInTheDocument();
      expect(screen.queryByText("No user spend in this range")).not.toBeInTheDocument();
    });
  });
});
