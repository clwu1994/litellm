import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import AutoRotationView from "./AutoRotationView";

describe("AutoRotationView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese card heading and description and hides the English originals", () => {
    renderWithProviders(<AutoRotationView autoRotate rotationInterval="7d" />);

    expect(screen.getAllByText("自动轮换").length).toBeGreaterThan(0);
    expect(screen.getByText("此密钥的自动轮换设置和状态")).toBeInTheDocument();
    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.getByText("每 7d")).toBeInTheDocument();
    expect(screen.queryByText("Auto-Rotation")).not.toBeInTheDocument();
    expect(screen.queryByText("Automatic key rotation settings and status for this key")).not.toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
  });

  it("renders the Chinese rotation history labels and hides the English originals", () => {
    renderWithProviders(
      <AutoRotationView
        autoRotate
        lastRotationAt="2025-01-01T00:00:00.000Z"
        nextRotationAt="2025-02-01T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("上次轮换")).toBeInTheDocument();
    expect(screen.getByText("下次计划轮换")).toBeInTheDocument();
    expect(screen.queryByText("Last Rotation")).not.toBeInTheDocument();
    expect(screen.queryByText("Next Scheduled Rotation")).not.toBeInTheDocument();
  });

  it("renders the Chinese disabled and no-history copy and hides the English originals", () => {
    const { unmount } = renderWithProviders(<AutoRotationView />);
    expect(screen.getByText("已禁用")).toBeInTheDocument();
    expect(screen.getByText("此密钥未启用自动轮换")).toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();
    expect(screen.queryByText("Auto-rotation is not enabled for this key")).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<AutoRotationView autoRotate />);
    expect(screen.getByText("暂无轮换历史")).toBeInTheDocument();
    expect(screen.queryByText("No rotation history available")).not.toBeInTheDocument();
  });
});
