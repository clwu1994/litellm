import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { useUpdateUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner";
import type { UserBanner } from "@/components/networking";
import { cleanup, renderWithProviders, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import UserBannerSettings from "./UserBannerSettings";

vi.mock("@/app/(dashboard)/hooks/userBanner/useUserBanner", () => ({ useUserBanner: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner", () => ({ useUpdateUserBanner: vi.fn() }));

const PUBLISHED_BANNER: UserBanner = {
  enabled: true,
  message: "**Maintenance** tonight.",
  severity: "warning",
  revision: "rev-a",
};

const DISABLED_EMPTY_BANNER: UserBanner = { enabled: false, message: "", severity: "info", revision: "" };

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const mockHooks = (banner: UserBanner | undefined, mutate = vi.fn()) => {
  vi.mocked(useUserBanner).mockReturnValue({
    data: banner,
    isLoading: false,
  } as unknown as ReturnType<typeof useUserBanner>);
  vi.mocked(useUpdateUserBanner).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateUserBanner>);
  return mutate;
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("UserBannerSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    mockHooks(PUBLISHED_BANNER);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the card and form copy in Chinese and hides the English originals", () => {
    renderWithProviders(<UserBannerSettings />);

    expectLocalized("用户横幅", "User Banner");
    expectLocalized(
      "向所有仪表盘用户发布公告。支持 Markdown；在你取消发布之前，横幅会显示在每个页面页眉下方。用户可以关闭它，内容变化时会重新出现。",
      "Publish an announcement to all dashboard users. Markdown is supported; the banner appears below the header on every page until you unpublish it. Users can dismiss it, and it reappears whenever the content changes.",
    );
    expectLocalized("消息", "Message");
    expectLocalized("严重级别", "Severity");
    expectLocalized("预览", "Preview");
    expectLocalized("保存横幅", "Save banner");

    expect(screen.getByRole("switch", { name: "发布用户横幅" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Publish user banner" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "横幅严重级别" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Banner severity" })).not.toBeInTheDocument();
  });

  it("renders the severity options in Chinese while the select is open and hides the English originals", async () => {
    renderWithProviders(<UserBannerSettings />);

    await user().click(screen.getByRole("combobox", { name: "横幅严重级别" }));
    const listbox = await screen.findByRole("listbox");

    for (const [zh, en] of [
      ["信息", "Info"],
      ["警告", "Warning"],
      ["错误", "Error"],
    ] as const) {
      expect(within(listbox).getAllByText(zh).length).toBeGreaterThan(0);
      expect(within(listbox).queryAllByText(en)).toHaveLength(0);
    }
  });

  it("renders the missing-message warning in Chinese and hides the English original", () => {
    mockHooks(DISABLED_EMPTY_BANNER);
    renderWithProviders(<UserBannerSettings />);

    fireEvent.click(screen.getByRole("switch", { name: "发布用户横幅" }));

    expectLocalized("发布前请先添加消息。", "Add a message before publishing.");
  });

  it("reports a successful save in Chinese and not in English", async () => {
    const mutate = mockHooks(
      PUBLISHED_BANNER,
      vi.fn((_banner, options: { onSuccess: () => void }) => options.onSuccess()),
    );
    renderWithProviders(<UserBannerSettings />);

    await user().click(screen.getByRole("button", { name: "保存横幅" }));

    expect(mutate).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("用户横幅更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("User banner updated successfully");
  });

  it("renders the saving state in Chinese and hides the English original", () => {
    mockHooks(PUBLISHED_BANNER);
    vi.mocked(useUpdateUserBanner).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateUserBanner>);
    renderWithProviders(<UserBannerSettings />);

    expectLocalized("保存中...", "Saving...");
  });
});

describe("UserBannerSettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    mockHooks(PUBLISHED_BANNER);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    renderWithProviders(<UserBannerSettings />);

    expect(screen.getByText("User Banner")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Publish user banner" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Banner severity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save banner" })).toBeInTheDocument();

    await user().click(screen.getByRole("combobox", { name: "Banner severity" }));
    const listbox = await screen.findByRole("listbox");
    for (const value of ["Info", "Warning", "Error"]) {
      expect(within(listbox).getAllByText(value).length).toBeGreaterThan(0);
    }
  });
});
