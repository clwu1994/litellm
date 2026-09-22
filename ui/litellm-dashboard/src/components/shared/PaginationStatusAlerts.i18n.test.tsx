import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PaginationStatusAlerts from "./PaginationStatusAlerts";

describe("PaginationStatusAlerts Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese fetching copy and hides the English originals", () => {
    renderWithProviders(
      <PaginationStatusAlerts
        isFetchingMore={true}
        cancelled={false}
        progress={{ currentPage: 7, totalPages: 42 }}
        cancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        /当前正在获取花费数据：已获取 7 \/ 42 页。数据加载时图表会定期更新。离开此页面将停止并重置此过程。若要在此期间继续使用 UI，/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /在新标签页中打开/ })).toBeInTheDocument();
    expect(screen.queryByText(/Currently fetching spend data/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
    expect(screen.queryByText("open a new tab")).not.toBeInTheDocument();
  });

  it("renders the Chinese partial notice and hides the English original", () => {
    renderWithProviders(
      <PaginationStatusAlerts
        isFetchingMore={false}
        cancelled={true}
        progress={{ currentPage: 7, totalPages: 42 }}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText("显示部分花费数据（已加载 7/42 页）")).toBeInTheDocument();
    expect(screen.queryByText("Showing partial spend data (7/42 pages loaded)")).not.toBeInTheDocument();
  });
});
