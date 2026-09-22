import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SidebarUsageCard from "./SidebarUsageCard";
import type { LicenseInfo } from "./networking";

vi.mock("./networking", () => ({ getRemainingUsers: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/license/useLicenseInfo", () => ({
  useLicenseInfo: vi.fn(),
}));

import { getRemainingUsers } from "./networking";
import { useLicenseInfo } from "@/app/(dashboard)/hooks/license/useLicenseInfo";

const mockGetRemainingUsers = vi.mocked(getRemainingUsers);
const mockUseLicenseInfo = vi.mocked(useLicenseInfo);

const licenseResult = (data: LicenseInfo | null) => ({ data }) as unknown as ReturnType<typeof useLicenseInfo>;
const ACTIVE_LICENSE: LicenseInfo = {
  has_license: true,
  license_type: null,
  expiration_date: null,
  allowed_features: [],
  limits: { max_users: null, max_teams: null },
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const SEATS_DATA = {
  total_users: 100,
  total_users_used: 20,
  total_users_remaining: 80,
  total_teams: null,
  total_teams_used: 0,
  total_teams_remaining: null,
};

const OVER_LIMIT_DATA = {
  total_users: 100,
  total_users_used: 130,
  total_users_remaining: -30,
  total_teams: null,
  total_teams_used: 0,
  total_teams_remaining: null,
};

const NO_LIMITS_DATA = {
  total_users: null,
  total_users_used: 186,
  total_users_remaining: null,
  total_teams: null,
  total_teams_used: 125,
  total_teams_remaining: null,
};

describe("SidebarUsageCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRemainingUsers.mockResolvedValue(SEATS_DATA);
    mockUseLicenseInfo.mockReturnValue(licenseResult(ACTIVE_LICENSE));
  });

  it("renders an expanded seat meter reporting value and range when data loads", async () => {
    const { container } = renderWithClient(
      <SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />,
    );

    await screen.findByText("Enterprise usage");
    const meter = await screen.findByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "20");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("Seats")).toBeInTheDocument();

    const indicator = container.querySelector('[data-slot="meter-indicator"]');
    expect(indicator).toHaveStyle({ width: "20%" });
  });

  it("collapses the meter panel when the trigger is toggled", async () => {
    const user = userEvent.setup();
    renderWithClient(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    await screen.findByRole("meter");
    await user.click(screen.getByRole("button", { name: /Enterprise usage/i }));

    await waitFor(() => expect(screen.queryByRole("meter")).not.toBeInTheDocument());
  });

  it("flags over-limit usage with a destructive, capped indicator", async () => {
    mockGetRemainingUsers.mockResolvedValue(OVER_LIMIT_DATA);

    const { container } = renderWithClient(
      <SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />,
    );

    await screen.findByRole("meter");
    const indicator = container.querySelector('[data-slot="meter-indicator"]');
    expect(indicator).toHaveClass("bg-destructive");
    expect(indicator).toHaveStyle({ width: "100%" });
  });

  it("renders nothing when neither seat nor team limits are set", async () => {
    mockGetRemainingUsers.mockResolvedValue(NO_LIMITS_DATA);

    renderWithClient(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    await waitFor(() => expect(screen.queryByText("Enterprise usage")).not.toBeInTheDocument());
  });

  it("renders nothing without an enterprise license even when seat limits exist", async () => {
    mockUseLicenseInfo.mockReturnValue(licenseResult(null));

    const { container } = renderWithClient(
      <SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />,
    );

    await waitFor(() => expect(mockGetRemainingUsers).toHaveBeenCalled());
    expect(screen.queryByText("Enterprise usage")).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="meter"]')).toBeNull();
  });

  it("shows the exact license expiration date as the subtitle instead of time remaining", async () => {
    mockUseLicenseInfo.mockReturnValue(licenseResult({ ...ACTIVE_LICENSE, expiration_date: "2099-12-31" }));

    renderWithClient(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    expect(await screen.findByText("Expires Dec 31, 2099")).toBeInTheDocument();
    expect(screen.queryByText(/(day|days|month|months) remaining/)).not.toBeInTheDocument();
  });

  it("shows the exact date as the subtitle when the license is expired", async () => {
    mockUseLicenseInfo.mockReturnValue(licenseResult({ ...ACTIVE_LICENSE, expiration_date: "2020-01-01" }));

    renderWithClient(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    expect(await screen.findByText("Expired Jan 1, 2020")).toBeInTheDocument();
  });

  it("falls back to Active plan when the license has no expiration date", async () => {
    renderWithClient(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    expect(await screen.findByText("Active plan")).toBeInTheDocument();
  });

  it("shows a collapsed rail button that expands the sidebar", async () => {
    const onExpandRail = vi.fn();
    const user = userEvent.setup();
    renderWithClient(<SidebarUsageCard accessToken="token" collapsed onExpandRail={onExpandRail} />);

    const rail = await screen.findByTitle("Enterprise usage");
    await user.click(rail);
    expect(onExpandRail).toHaveBeenCalledOnce();
  });

  it("keeps the collapsed rail tinted on hover instead of the outline variant's foreground", async () => {
    renderWithClient(<SidebarUsageCard accessToken="token" collapsed onExpandRail={vi.fn()} />);

    const rail = await screen.findByTitle("Enterprise usage");
    expect(rail).toHaveClass("hover:text-sidebar-primary/80");
    expect(rail).not.toHaveClass("hover:text-foreground");
  });
});

const BOTH_LIMITS_DATA = {
  total_users: 100,
  total_users_used: 20,
  total_users_remaining: 80,
  total_teams: 10,
  total_teams_used: 3,
  total_teams_remaining: 7,
};

describe("SidebarUsageCard Chinese copy", () => {
  const renderWithClientZh = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetRemainingUsers.mockResolvedValue(BOTH_LIMITS_DATA);
    mockUseLicenseInfo.mockReturnValue(licenseResult(ACTIVE_LICENSE));
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the title, seat and team meters and the meter range in Chinese", async () => {
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    expect(await screen.findByText("企业版用量")).toBeInTheDocument();
    expect(screen.queryByText("Enterprise usage")).not.toBeInTheDocument();

    const meters = await screen.findAllByRole("meter");
    expect(meters[0]).toHaveAttribute("aria-valuetext", "20 / 100");
    expect(meters[0]).not.toHaveAttribute("aria-valuetext", "20 of 100");
    expect(screen.getByText("席位")).toBeInTheDocument();
    expect(screen.queryByText("Seats")).not.toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.queryByText("Teams")).not.toBeInTheDocument();
  });

  it("renders the active-plan and expiration subtitles in Chinese", async () => {
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);
    expect(await screen.findByText("有效方案")).toBeInTheDocument();
    expect(screen.queryByText("Active plan")).not.toBeInTheDocument();

    cleanup();
    mockUseLicenseInfo.mockReturnValue(licenseResult({ ...ACTIVE_LICENSE, expiration_date: "2099-12-31" }));
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);
    expect(await screen.findByText("Dec 31, 2099 到期")).toBeInTheDocument();
    expect(screen.queryByText(/Expires Dec 31, 2099/)).not.toBeInTheDocument();

    cleanup();
    mockUseLicenseInfo.mockReturnValue(licenseResult({ ...ACTIVE_LICENSE, expiration_date: "2020-01-01" }));
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);
    expect(await screen.findByText("已于 Jan 1, 2020 到期")).toBeInTheDocument();
    expect(screen.queryByText(/Expired Jan 1, 2020/)).not.toBeInTheDocument();

    cleanup();
    mockUseLicenseInfo.mockReturnValue(licenseResult({ ...ACTIVE_LICENSE, expiration_date: "not-a-date" }));
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);
    expect(await screen.findByText("无到期时间")).toBeInTheDocument();
    expect(screen.queryByText("No expiration")).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese", async () => {
    mockGetRemainingUsers.mockReturnValue(new Promise(() => {}));
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed={false} onExpandRail={() => {}} />);

    expect(await screen.findByText("正在加载…")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("renders the collapsed rail title in Chinese", async () => {
    renderWithClientZh(<SidebarUsageCard accessToken="token" collapsed onExpandRail={vi.fn()} />);

    expect(await screen.findByTitle("企业版用量")).toBeInTheDocument();
    expect(screen.queryByTitle("Enterprise usage")).not.toBeInTheDocument();
  });
});
