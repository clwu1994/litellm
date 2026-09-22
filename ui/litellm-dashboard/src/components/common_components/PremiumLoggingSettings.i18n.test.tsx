import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PremiumLoggingSettings from "./PremiumLoggingSettings";

describe("PremiumLoggingSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese enterprise notice and link and hides the English original", () => {
    renderWithProviders(<PremiumLoggingSettings value={[]} onChange={vi.fn()} />);

    const link = screen.getByRole("link", { name: "这里" });
    const notice = link.closest("p");
    expect(notice?.textContent).toBe(
      "设置密钥/团队日志记录是 LiteLLM 企业版功能。全局日志记录设置对所有免费用户可用。获取试用密钥请点击这里。",
    );
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();
    expect(notice?.textContent).not.toContain("Setting Key/Team logging settings");
  });
});
