import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import EvalViewer from "./EvalViewer";

const passedEntry = {
  eval_id: "eval-1",
  eval_name: "quality-eval",
  overall_score: 85,
  passed: true,
  judge_model: "gpt-4o",
  iteration: 0,
  threshold: 70,
  verdicts: [
    { criterion_name: "clarity", score: 90, reasoning: "clear", passed: true, weight: 60 },
    { criterion_name: "accuracy", score: 80, reasoning: "ok", passed: true, weight: 40 },
  ],
};

describe("EvalViewer", () => {
  it("renders the judge summary, score and per-criterion table", () => {
    render(<EvalViewer data={passedEntry} />);

    expect(screen.getByText("LLM Judge Results")).toBeInTheDocument();
    expect(screen.getByText("PASSED")).toBeInTheDocument();
    expect(screen.getByText("quality-eval")).toBeInTheDocument();
    expect(screen.getByText("Judge: gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("Iter: 1")).toBeInTheDocument();
    expect(screen.getByText("Criterion")).toBeInTheDocument();
    expect(screen.getByText("Weighted")).toBeInTheDocument();
    expect(screen.getByText("Comment")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("falls back to the overall score line when there is no criterion breakdown", () => {
    render(<EvalViewer data={{ ...passedEntry, verdicts: undefined }} />);

    expect(screen.getByText("Score: 85.0 — no per-criterion breakdown available.")).toBeInTheDocument();
  });

  it("renders the judge error when the eval failed", () => {
    render(<EvalViewer data={{ ...passedEntry, passed: false, eval_error: "judge timed out" }} />);

    expect(screen.getByText("FAILED")).toBeInTheDocument();
    expect(screen.getByText("Judge error: judge timed out")).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese title, verdict, score chrome and table headers and hides the English ones", () => {
      render(<EvalViewer data={passedEntry} />);

      expect(screen.getByText("LLM 裁判结果")).toBeInTheDocument();
      expect(screen.getByText("通过")).toBeInTheDocument();
      expect(screen.getByText(/85 \/ 100（阈值：70）/)).toBeInTheDocument();
      expect(screen.getByText("裁判：gpt-4o")).toBeInTheDocument();
      expect(screen.getByText("第 1 轮")).toBeInTheDocument();
      expect(screen.getByText("评分标准")).toBeInTheDocument();
      expect(screen.getByText("权重")).toBeInTheDocument();
      expect(screen.getByText("得分")).toBeInTheDocument();
      expect(screen.getByText("加权得分")).toBeInTheDocument();
      expect(screen.getByText("评语")).toBeInTheDocument();
      expect(screen.getByText("总计")).toBeInTheDocument();

      expect(screen.queryByText("LLM Judge Results")).not.toBeInTheDocument();
      expect(screen.queryByText("PASSED")).not.toBeInTheDocument();
      expect(screen.queryByText("Judge: gpt-4o")).not.toBeInTheDocument();
      expect(screen.queryByText("Iter: 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Criterion")).not.toBeInTheDocument();
      expect(screen.queryByText("Weight")).not.toBeInTheDocument();
      expect(screen.queryByText("Weighted")).not.toBeInTheDocument();
      expect(screen.queryByText("Comment")).not.toBeInTheDocument();
      expect(screen.queryByText("Total")).not.toBeInTheDocument();
    });

    it("renders the Chinese failed badge and judge error and hides the English ones", () => {
      render(<EvalViewer data={{ ...passedEntry, passed: false, eval_error: "judge timed out" }} />);

      expect(screen.getByText("未通过")).toBeInTheDocument();
      expect(screen.getByText("裁判错误：judge timed out")).toBeInTheDocument();
      expect(screen.queryByText("FAILED")).not.toBeInTheDocument();
      expect(screen.queryByText("Judge error: judge timed out")).not.toBeInTheDocument();
    });

    it("renders the Chinese no-breakdown line and hides the English one", () => {
      render(<EvalViewer data={{ ...passedEntry, verdicts: undefined }} />);

      expect(screen.getByText("得分：85.0，没有按标准拆分的明细。")).toBeInTheDocument();
      expect(screen.queryByText("Score: 85.0 — no per-criterion breakdown available.")).not.toBeInTheDocument();
    });

    it("renders the Chinese score and weighted tooltips and hides the English ones", async () => {
      const user = userEvent.setup();
      render(<EvalViewer data={passedEntry} />);

      await user.hover(screen.getByText(/85 \/ 100/));
      expect(await screen.findByText(/所有评分标准的加权平均值/)).toBeInTheDocument();
      expect(screen.queryByText(/Weighted average of all criterion scores/)).not.toBeInTheDocument();

      await user.unhover(screen.getByText(/85 \/ 100/));
      await user.hover(screen.getByText("加权得分"));
      expect(await screen.findByText(/得分 × 权重/)).toBeInTheDocument();
      expect(screen.queryByText(/how much each criterion contributes to the final score/)).not.toBeInTheDocument();
    });
  });
});
