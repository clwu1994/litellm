import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import ContentFilterDetails, { type ContentFilterDetection } from "./ContentFilterDetails";

const detections: ContentFilterDetection[] = [
  { type: "pattern", pattern_name: "ssn", action: "BLOCK" },
  { type: "blocked_word", keyword: "badword", description: "A bad word", action: "MASK" },
  { type: "category_keyword", category: "violence", keyword: "fight", severity: "high", action: "BLOCK" },
];

describe("ContentFilterDetails", () => {
  it("renders the error message when the response is a string", () => {
    render(<ContentFilterDetails response="filter unavailable" />);

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("filter unavailable")).toBeInTheDocument();
  });

  it("renders the empty state when there are no detections", () => {
    render(<ContentFilterDetails response={[]} />);

    expect(screen.getByText("No detections found")).toBeInTheDocument();
  });

  it("groups detections by type and summarises actions", () => {
    render(<ContentFilterDetails response={detections} />);

    expect(screen.getByText("Total Detections:")).toBeInTheDocument();
    expect(screen.getByText("2 blocked")).toBeInTheDocument();
    expect(screen.getByText("1 masked")).toBeInTheDocument();
    expect(screen.getByText("1 patterns")).toBeInTheDocument();
    expect(screen.getByText("Patterns Matched")).toBeInTheDocument();
    expect(screen.getByText("Blocked Words Detected")).toBeInTheDocument();
    expect(screen.getByText("Category Keywords Detected")).toBeInTheDocument();
    expect(screen.getByText("Raw Detection Data")).toBeInTheDocument();
  });

  it("falls back to 'unknown' for detections missing a pattern, keyword or category", () => {
    render(<ContentFilterDetails response={[{ type: "pattern", action: "MASK" }]} />);

    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese error heading and hides the English one", () => {
      render(<ContentFilterDetails response="filter unavailable" />);

      expect(screen.getByText("错误")).toBeInTheDocument();
      expect(screen.queryByText("Error")).not.toBeInTheDocument();
    });

    it("renders the Chinese empty state and hides the English one", () => {
      render(<ContentFilterDetails response={[]} />);

      expect(screen.getByText("未发现检测项")).toBeInTheDocument();
      expect(screen.queryByText("No detections found")).not.toBeInTheDocument();
    });

    it("renders the Chinese summary chrome and hides the English one", () => {
      render(<ContentFilterDetails response={detections} />);

      expect(screen.getByText("检测总数：")).toBeInTheDocument();
      expect(screen.getAllByText("操作：").length).toBeGreaterThan(0);
      expect(screen.getByText("已阻止 2 项")).toBeInTheDocument();
      expect(screen.getByText("已屏蔽 1 项")).toBeInTheDocument();
      expect(screen.getByText("按类型：")).toBeInTheDocument();
      expect(screen.getByText("1 个模式")).toBeInTheDocument();
      expect(screen.getByText("1 个关键词")).toBeInTheDocument();
      expect(screen.getByText("1 个类别")).toBeInTheDocument();

      expect(screen.queryByText("Total Detections:")).not.toBeInTheDocument();
      expect(screen.queryByText("Actions:")).not.toBeInTheDocument();
      expect(screen.queryByText("By Type:")).not.toBeInTheDocument();
      expect(screen.queryByText("2 blocked")).not.toBeInTheDocument();
      expect(screen.queryByText("1 masked")).not.toBeInTheDocument();
    });

    it("renders the Chinese section titles, row labels and fallbacks and hides the English ones", () => {
      render(<ContentFilterDetails response={detections} />);

      expect(screen.getByText("匹配的模式")).toBeInTheDocument();
      expect(screen.getByText("检测到的屏蔽词")).toBeInTheDocument();
      expect(screen.getByText("检测到的类别关键词")).toBeInTheDocument();
      expect(screen.getByText("原始检测数据")).toBeInTheDocument();
      expect(screen.getByText("模式：")).toBeInTheDocument();
      expect(screen.getAllByText("关键词：").length).toBeGreaterThan(0);
      expect(screen.getByText("描述：")).toBeInTheDocument();
      expect(screen.getByText("类别：")).toBeInTheDocument();
      expect(screen.getByText("严重程度：")).toBeInTheDocument();
      expect(screen.getAllByText("操作：").length).toBeGreaterThan(0);

      expect(screen.queryByText("Patterns Matched")).not.toBeInTheDocument();
      expect(screen.queryByText("Blocked Words Detected")).not.toBeInTheDocument();
      expect(screen.queryByText("Category Keywords Detected")).not.toBeInTheDocument();
      expect(screen.queryByText("Raw Detection Data")).not.toBeInTheDocument();
      expect(screen.queryByText("Pattern:")).not.toBeInTheDocument();
      expect(screen.queryByText("Keyword:")).not.toBeInTheDocument();
      expect(screen.queryByText("Description:")).not.toBeInTheDocument();
      expect(screen.queryByText("Category:")).not.toBeInTheDocument();
      expect(screen.queryByText("Severity:")).not.toBeInTheDocument();
    });

    it("renders the Chinese unknown fallback and hides the English one", () => {
      render(<ContentFilterDetails response={[{ type: "pattern", action: "MASK" }]} />);

      expect(screen.getByText("未知")).toBeInTheDocument();
      expect(screen.queryByText("unknown")).not.toBeInTheDocument();
    });
  });
});
