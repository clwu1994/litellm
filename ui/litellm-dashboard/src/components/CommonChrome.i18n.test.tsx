import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { DeprecationBanner } from "./DeprecationBanner";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

describe("Common chrome Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog close label in Chinese", () => {
    renderWithProviders(
      <Dialog open>
        <DialogContent>
          <DialogTitle>面板</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText("关闭")).toBeInTheDocument();
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the deprecation banner in Chinese and hides the English original", () => {
    renderWithProviders(<DeprecationBanner featureName="Widgets" />);

    expect(screen.getByText("Widgets 在草拟的弃用列表中")).toBeInTheDocument();
    expect(screen.queryByText("Widgets is on a draft deprecation list")).not.toBeInTheDocument();

    const paragraph = screen.getByText(/Widgets 是我们正在考虑移除/);
    expect(paragraph).toHaveTextContent(
      "Widgets 是我们正在考虑移除的若干实验性功能之一，最早可能在 2026 年 9 月 1 日。此列表为草稿，并非最终决定。如果你依赖此功能，请在 弃用讨论 中提供反馈。",
    );
    expect(paragraph).not.toHaveTextContent("is one of several experimental features");
    expect(paragraph).not.toHaveTextContent("September 1, 2026");

    expect(screen.getByRole("link", { name: "弃用讨论" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "deprecation discussion" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("hides the deprecation banner after the Chinese close control is used", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeprecationBanner featureName="Widgets" />);

    await user.click(screen.getByRole("button", { name: "关闭" }));

    expect(screen.queryByText("Widgets 在草拟的弃用列表中")).not.toBeInTheDocument();
    expect(within(document.body).queryByText("Widgets is on a draft deprecation list")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
