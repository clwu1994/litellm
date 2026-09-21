import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import CostOptimizationFeedbackBanner from "./cost_optimization_feedback_banner";

const STORAGE_KEY = "hideCostOptimizationFeedbackBanner";

describe("CostOptimizationFeedbackBanner Chinese copy", () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese banner copy", () => {
    render(<CostOptimizationFeedbackBanner />);

    expect(screen.getByText("帮助改进成本优化")).toBeInTheDocument();
    expect(screen.queryByText("Help shape cost optimization")).not.toBeInTheDocument();
    expect(
      screen.getByText("我们正在收集关于路由、预算等方面成本优化改进的建议。告诉我们你希望看到什么。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /分享反馈/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Share Feedback/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText("关闭横幅")).toBeInTheDocument();
    expect(screen.queryByLabelText("Dismiss banner")).not.toBeInTheDocument();
  });

  it("hides the banner when the Chinese dismiss control is used", async () => {
    const user = userEvent.setup();
    render(<CostOptimizationFeedbackBanner />);

    await user.click(screen.getByLabelText("关闭横幅"));

    expect(screen.queryByText("帮助改进成本优化")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });
});
