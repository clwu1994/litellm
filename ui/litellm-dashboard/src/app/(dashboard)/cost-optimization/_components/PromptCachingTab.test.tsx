import { cleanup, render, waitFor, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

const mockGetGeneralSettingsCall = vi.fn();

vi.mock("@/components/networking", () => ({
  getGeneralSettingsCall: (...args: unknown[]) => mockGetGeneralSettingsCall(...args),
}));

vi.mock("@/app/(dashboard)/router-settings/_components/general_settings", () => ({
  PromptCachingPanel: () => <div data-testid="caching-settings" />,
}));

const mockCacheLeakageCard = vi.fn();

vi.mock("./CacheLeakageCard", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockCacheLeakageCard(props);
    return <div data-testid="cache-leakage-card" />;
  },
}));

import PromptCachingTab from "./PromptCachingTab";

const activity = {
  dateValue: {},
  onDateChange: vi.fn(),
  results: [],
  loading: false,
  isFetchingMore: false,
  progress: { currentPage: 1, totalPages: 1 },
  cancelled: false,
  cancel: vi.fn(),
};

describe("PromptCachingTab", () => {
  it("renders the cache leakage table alongside the caching settings", async () => {
    mockGetGeneralSettingsCall.mockResolvedValue([]);

    render(<PromptCachingTab accessToken="test-token" activity={activity} />);

    expect(screen.getByTestId("caching-settings")).toBeInTheDocument();
    expect(screen.getByTestId("cache-leakage-card")).toBeInTheDocument();
    await waitFor(() => expect(mockCacheLeakageCard).toHaveBeenCalledWith(expect.objectContaining({ activity })));
  });
});

describe("PromptCachingTab Chinese copy", () => {
  beforeEach(async () => {
    mockGetGeneralSettingsCall.mockReset();
    vi.mocked(toast.fromError).mockClear();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("reports a Chinese load failure toast and hides the English message", async () => {
    mockGetGeneralSettingsCall.mockRejectedValue(new Error("boom"));
    render(<PromptCachingTab accessToken="test-token" activity={activity} />);

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载提示词缓存设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load prompt caching settings");
  });
});
