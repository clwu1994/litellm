import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import CompliancePanel from "./CompliancePanel";

const { checkEuAiActCompliance, checkGdprCompliance } = vi.hoisted(() => ({
  checkEuAiActCompliance: vi.fn(),
  checkGdprCompliance: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ checkEuAiActCompliance, checkGdprCompliance }));

const logEntry = { request_id: "req-1", user: "user-1", model: "gpt-4" };

const compliantResponse = { compliant: true, regulation: "eu-ai-act", checks: [] };
const nonCompliantResponse = { compliant: false, regulation: "gdpr", checks: [] };

describe("CompliancePanel", () => {
  beforeEach(() => {
    checkEuAiActCompliance.mockReset();
    checkGdprCompliance.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders both compliance cards and their verdict badges", async () => {
    checkEuAiActCompliance.mockResolvedValue(compliantResponse);
    checkGdprCompliance.mockResolvedValue(nonCompliantResponse);
    render(<CompliancePanel accessToken="token" logEntry={logEntry} />);

    expect(screen.getByText("Regulatory Compliance")).toBeInTheDocument();
    expect(screen.getByText("EU AI Act")).toBeInTheDocument();
    expect(screen.getByText("GDPR")).toBeInTheDocument();
    expect(await screen.findByText("COMPLIANT")).toBeInTheDocument();
    expect(screen.getByText("NON-COMPLIANT")).toBeInTheDocument();
  });

  it("renders an UNAVAILABLE badge and the thrown message when a check fails", async () => {
    checkEuAiActCompliance.mockRejectedValue(new Error("eu endpoint down"));
    checkGdprCompliance.mockRejectedValue(new Error("gdpr endpoint down"));
    render(<CompliancePanel accessToken="token" logEntry={logEntry} />);

    expect(await screen.findAllByText("UNAVAILABLE")).toHaveLength(2);

    const user = userEvent.setup();
    await user.click(screen.getByText("EU AI Act"));
    expect(screen.getByText("eu endpoint down")).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese headings, card titles and verdicts and hides the English ones", async () => {
      checkEuAiActCompliance.mockResolvedValue(compliantResponse);
      checkGdprCompliance.mockResolvedValue(nonCompliantResponse);
      render(<CompliancePanel accessToken="token" logEntry={logEntry} />);

      expect(screen.getByText("法规合规")).toBeInTheDocument();
      expect(screen.getByText("欧盟 AI 法案")).toBeInTheDocument();
      expect(screen.getByText("GDPR")).toBeInTheDocument();
      expect(await screen.findByText("合规")).toBeInTheDocument();
      expect(screen.getByText("不合规")).toBeInTheDocument();

      expect(screen.queryByText("Regulatory Compliance")).not.toBeInTheDocument();
      expect(screen.queryByText("EU AI Act")).not.toBeInTheDocument();
      expect(screen.queryByText("COMPLIANT")).not.toBeInTheDocument();
      expect(screen.queryByText("NON-COMPLIANT")).not.toBeInTheDocument();
    });

    it("renders the Chinese loading copy and hides the English one", async () => {
      const pending = new Promise<never>(() => {});
      checkEuAiActCompliance.mockReturnValue(pending);
      checkGdprCompliance.mockReturnValue(pending);
      const user = userEvent.setup();
      render(<CompliancePanel accessToken="token" logEntry={logEntry} />);

      await user.click(screen.getByText("欧盟 AI 法案"));
      await user.click(screen.getByText("GDPR"));

      expect(screen.getAllByText("正在检查合规性...").length).toBeGreaterThan(0);
      expect(screen.queryByText("Checking compliance...")).not.toBeInTheDocument();
    });

    it("renders the Chinese unavailable badge and failure copy and hides the English ones", async () => {
      checkEuAiActCompliance.mockRejectedValue(new Error(""));
      checkGdprCompliance.mockRejectedValue(new Error(""));
      const user = userEvent.setup();
      render(<CompliancePanel accessToken="token" logEntry={logEntry} />);

      expect(await screen.findAllByText("不可用")).toHaveLength(2);
      expect(screen.queryByText("UNAVAILABLE")).not.toBeInTheDocument();

      await user.click(screen.getByText("欧盟 AI 法案"));
      await user.click(screen.getByText("GDPR"));

      expect(screen.getByText("检查欧盟 AI 法案合规性失败")).toBeInTheDocument();
      expect(screen.getByText("检查 GDPR 合规性失败")).toBeInTheDocument();
      expect(screen.queryByText("Failed to check EU AI Act compliance")).not.toBeInTheDocument();
      expect(screen.queryByText("Failed to check GDPR compliance")).not.toBeInTheDocument();
    });
  });
});
