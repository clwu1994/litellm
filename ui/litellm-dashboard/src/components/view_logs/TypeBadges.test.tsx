import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { LlmBadge, McpBadge, AgentBadge, BatchBadge } from "./TypeBadges";

describe("TypeBadges", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  describe("LlmBadge", () => {
    it("should render with default 'LLM' text when no count is provided", () => {
      render(<LlmBadge />);
      expect(screen.getByText("LLM")).toBeInTheDocument();
    });

    it("should render the count when provided", () => {
      render(<LlmBadge count={5} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should render count of 0 instead of default text", () => {
      render(<LlmBadge count={0} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("keeps the LLM label under zh", async () => {
      await i18n.changeLanguage("zh");
      render(<LlmBadge />);
      expect(screen.getByText("LLM")).toBeInTheDocument();
    });
  });

  describe("McpBadge", () => {
    it("should render with default 'MCP' text when no count is provided", () => {
      render(<McpBadge />);
      expect(screen.getByText("MCP")).toBeInTheDocument();
    });

    it("should render the count when provided", () => {
      render(<McpBadge count={3} />);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("keeps the MCP label under zh", async () => {
      await i18n.changeLanguage("zh");
      render(<McpBadge />);
      expect(screen.getByText("MCP")).toBeInTheDocument();
    });
  });

  describe("AgentBadge", () => {
    it("should render with default 'Agent' text when no count is provided", () => {
      render(<AgentBadge />);
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });

    it("should render the count when provided", () => {
      render(<AgentBadge count={12} />);
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("keeps the Agent label under zh", async () => {
      await i18n.changeLanguage("zh");
      render(<AgentBadge />);
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });
  });

  describe("BatchBadge", () => {
    it("should render 'Batch'", () => {
      render(<BatchBadge />);
      expect(screen.getByText("Batch")).toBeInTheDocument();
    });

    it("renders the Chinese batch label and hides the English one under zh", async () => {
      await i18n.changeLanguage("zh");
      render(<BatchBadge />);
      expect(screen.getByText("批处理")).toBeInTheDocument();
      expect(screen.queryByText("Batch")).not.toBeInTheDocument();
    });
  });
});
