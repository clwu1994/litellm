import React from "react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import PresidioDetectedEntities from "@/components/view_logs/GuardrailViewer/PresidioDetectedEntities";
import { cleanup, renderWithProviders, screen } from "../../../../tests/test-utils";
import { makeEntity } from "@/components/view_logs/GuardrailViewer/__tests__/fixtures";
import i18n from "@/i18n/bootstrapI18n";

describe("PresidioDetectedEntities", () => {
  it("renders null when entities empty", () => {
    const { container } = renderWithProviders(<PresidioDetectedEntities entities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders per-entity header info including score color and position", async () => {
    const user = userEvent.setup();
    const e = makeEntity({ start: 10, end: 20, score: 0.92, entity_type: "EMAIL_ADDRESS" });
    renderWithProviders(<PresidioDetectedEntities entities={[e]} />);

    // Header row values
    expect(screen.getByText("EMAIL_ADDRESS")).toBeInTheDocument();
    expect(screen.getByText(/Score: 0\.92/)).toBeInTheDocument();
    expect(screen.getByText("Position: 10-20")).toBeInTheDocument();

    // Expand details
    await user.click(screen.getByText("EMAIL_ADDRESS"));
    expect(screen.getByText("Entity Type:")).toBeInTheDocument();
    expect(screen.getByText("Characters 10-20")).toBeInTheDocument();
    expect(screen.getByText("Confidence:")).toBeInTheDocument();
    // Recognizer details
    expect(screen.getByText("EmailRecognizer")).toBeInTheDocument();
    expect(screen.getByText("email_v1")).toBeInTheDocument();
    // Explanation
    expect(screen.getByText("Matched via pattern")).toBeInTheDocument();
  });

  it("handles missing metadata & low scores gracefully", async () => {
    const user = userEvent.setup();
    const e = makeEntity({
      score: 0.3,
      recognition_metadata: undefined as any,
      analysis_explanation: null,
      entity_type: "NAME",
      start: 0,
      end: 0,
    });
    renderWithProviders(<PresidioDetectedEntities entities={[e]} />);

    await user.click(screen.getByText("NAME"));
    // No recognizer/explanation rows
    expect(screen.queryByText("Recognizer:")).not.toBeInTheDocument();
    expect(screen.queryByText("Explanation:")).not.toBeInTheDocument();
    // Position still renders
    expect(screen.getByText("Characters 0-0")).toBeInTheDocument();
  });
});

describe("PresidioDetectedEntities Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese entity header and detail chrome and hides the English one", async () => {
    const user = userEvent.setup();
    const entityOverrides = { start: 10, end: 20, score: 0.92, entity_type: "EMAIL_ADDRESS" };
    const entity = makeEntity(entityOverrides);
    renderWithProviders(<PresidioDetectedEntities entities={[entity]} />);

    expect(screen.getByText("检测到的实体（1）")).toBeInTheDocument();
    expect(screen.getByText("得分：0.92")).toBeInTheDocument();
    expect(screen.getByText("位置：10-20")).toBeInTheDocument();

    await user.click(screen.getByText("EMAIL_ADDRESS"));

    expect(screen.getByText("实体类型：")).toBeInTheDocument();
    expect(screen.getByText("位置：")).toBeInTheDocument();
    expect(screen.getByText("字符 10-20")).toBeInTheDocument();
    expect(screen.getByText("置信度：")).toBeInTheDocument();
    expect(screen.getByText("识别器：")).toBeInTheDocument();
    expect(screen.getByText("标识符：")).toBeInTheDocument();
    expect(screen.getByText("说明：")).toBeInTheDocument();

    expect(screen.queryByText(/Detected Entities/)).not.toBeInTheDocument();
    expect(screen.queryByText("Score: 0.92")).not.toBeInTheDocument();
    expect(screen.queryByText("Position: 10-20")).not.toBeInTheDocument();
    expect(screen.queryByText("Entity Type:")).not.toBeInTheDocument();
    expect(screen.queryByText("Characters 10-20")).not.toBeInTheDocument();
    expect(screen.queryByText("Confidence:")).not.toBeInTheDocument();
    expect(screen.queryByText("Recognizer:")).not.toBeInTheDocument();
    expect(screen.queryByText("Identifier:")).not.toBeInTheDocument();
    expect(screen.queryByText("Explanation:")).not.toBeInTheDocument();
  });
});
