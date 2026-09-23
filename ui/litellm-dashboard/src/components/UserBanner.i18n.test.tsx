import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { UserBanner as UserBannerData } from "./networking";
import { UserBanner } from "./UserBanner";

vi.mock("@/app/(dashboard)/hooks/userBanner/useUserBanner", () => ({
  useUserBanner: vi.fn(),
}));

const banner: UserBannerData = {
  enabled: true,
  message: "Scheduled maintenance",
  severity: "warning",
  revision: "rev-a",
};

describe("UserBanner Chinese copy", () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.mocked(useUserBanner).mockReturnValue({ data: banner } as ReturnType<typeof useUserBanner>);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dismiss label and hides the English original", () => {
    renderWithProviders(<UserBanner accessToken="token" />);

    expect(screen.getByRole("button", { name: "关闭横幅" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss banner" })).not.toBeInTheDocument();
  });
});
