import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { RoutingDecisionCard, type RoutingDecision } from "./RoutingDecisionCard";

const heuristic: RoutingDecision = {
  router_model_name: "smart-router",
  router_type: "complexity",
  routed_model: "claude-sonnet",
  cause: "heuristic_scorer",
  tier: "REASONING",
  score: 0.82,
  signals: ["long (900 tokens)", "code (python, function)"],
  tier_boundaries: { simple_medium: 0.15, medium_complex: 0.35, complex_reasoning: 0.6 },
};

describe("RoutingDecisionCard", () => {
  it("renders nothing when the request carried no routing decision", () => {
    const { container } = render(<RoutingDecisionCard decision={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("explains a heuristic score against the boundaries that were in effect", () => {
    render(<RoutingDecisionCard decision={heuristic} />);
    expect(screen.getByText("smart-router")).toBeInTheDocument();
    expect(screen.getByText("(Auto-Router v2)")).toBeInTheDocument();
    expect(screen.getByText("REASONING")).toBeInTheDocument();
    expect(screen.getByText("Heuristic scorer")).toBeInTheDocument();
    expect(screen.getByText("0.82")).toBeInTheDocument();
    expect(screen.getByText("(at or above 0.6, REASONING)")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet")).toBeInTheDocument();
    expect(screen.getByText("long (900 tokens)")).toBeInTheDocument();
  });

  it("uses the persisted boundary snapshot, not today's defaults", () => {
    // Same score, boundaries the operator had configured lower: it lands in a
    // different band, and the card must say so.
    render(
      <RoutingDecisionCard
        decision={{
          ...heuristic,
          score: 0.4,
          tier: "REASONING",
          tier_boundaries: { simple_medium: 0.1, medium_complex: 0.2, complex_reasoning: 0.3 },
        }}
      />,
    );
    expect(screen.getByText("(at or above 0.3, REASONING)")).toBeInTheDocument();
  });

  it("labels a reasoning override and does not claim the score met a boundary", () => {
    render(
      <RoutingDecisionCard
        decision={{
          ...heuristic,
          cause: "reasoning_override",
          score: 0.2,
          signals: ["reasoning (prove, step-by-step)"],
        }}
      />,
    );
    expect(
      screen.getByText(
        "Heuristic, REASONING override (2 or more reasoning markers, score of at least the Simple to Medium boundary)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("0.20")).toBeInTheDocument();
    // The score did not decide this tier, so NO band explanation may render at all.
    // Asserting the absence of one specific band would pass vacuously: 0.20 sits in
    // the MEDIUM band, so the REASONING wording is absent either way.
    expect(screen.queryByText(/SIMPLE|MEDIUM|COMPLEX|at or above/)).not.toBeInTheDocument();
  });

  it("names the judge model on the LLM classifier path and shows no score", () => {
    render(
      <RoutingDecisionCard
        decision={{
          router_model_name: "llm-router",
          router_type: "complexity",
          routed_model: "claude-sonnet",
          cause: "llm_classifier",
          tier: "REASONING",
          classifier_model: "claude-haiku",
          signals: ["llm-classifier:REASONING"],
        }}
      />,
    );
    expect(screen.getByText("LLM classifier (claude-haiku)")).toBeInTheDocument();
    expect(screen.queryByText("Score")).not.toBeInTheDocument();
  });

  it("explains a route that fell back to the default model after the classifier failed", () => {
    // No tier is recorded on this path, so the card must not show a Tier row: nothing
    // about the request produced one, the classifier never answered.
    render(
      <RoutingDecisionCard
        decision={{
          router_model_name: "llm-router",
          router_type: "complexity",
          routed_model: "gpt-4o",
          cause: "default_model_fallback",
          signals: ["classifier-failed:default-model"],
        }}
      />,
    );
    expect(screen.getByText("Default model, LLM classifier failed")).toBeInTheDocument();
    expect(screen.queryByText("Tier")).not.toBeInTheDocument();
  });

  it("explains a route that fell back to the configured fallback tier after the classifier failed", () => {
    render(
      <RoutingDecisionCard
        decision={{
          router_model_name: "custom-tier-router",
          router_type: "complexity",
          routed_model: "claude-sonnet",
          cause: "classifier_fallback",
          tier: "SECURITY_REVIEW",
          signals: ["classifier-fallback:SECURITY_REVIEW"],
        }}
      />,
    );
    expect(screen.getByText("Fallback tier, LLM classifier failed")).toBeInTheDocument();
    expect(screen.getByText("SECURITY_REVIEW")).toBeInTheDocument();
  });

  it("shows the keyword that fired a tier rule", () => {
    render(
      <RoutingDecisionCard
        decision={{ ...heuristic, cause: "literal_keyword_match", matched_keyword: "deploy to k8s", score: undefined }}
      />,
    );
    expect(screen.getByText('Keyword match: "deploy to k8s"')).toBeInTheDocument();
  });

  it("shows the plan-mode sentinel that floored the tier", () => {
    render(
      <RoutingDecisionCard
        decision={{ ...heuristic, cause: "plan_mode", matched_keyword: "Plan mode is active", score: undefined }}
      />,
    );
    expect(screen.getByText('Plan-mode floor: "Plan mode is active"')).toBeInTheDocument();
  });

  it("names the exit_plan_mode tool instead of quoting it as a sentinel", () => {
    render(
      <RoutingDecisionCard
        decision={{ ...heuristic, cause: "plan_mode", matched_keyword: "exit_plan_mode", score: undefined }}
      />,
    );
    expect(screen.getByText("Plan-mode floor (exit_plan_mode tool)")).toBeInTheDocument();
  });

  it("does not claim the score chose the tier on a plan-mode floored row", () => {
    // The score's band can name a lower tier than the floored badge; the cause suppresses it.
    render(
      <RoutingDecisionCard decision={{ ...heuristic, cause: "plan_mode", matched_keyword: "Plan mode is active" }} />,
    );
    expect(screen.queryByText(/below|to 0|at or above/)).not.toBeInTheDocument();
    expect(screen.getByText('Plan-mode floor: "Plan mode is active"')).toBeInTheDocument();
  });

  it("names the housekeeping sentinel so an operator can extend the pattern list", () => {
    // The sentinel is the string they would add to housekeeping_patterns to cover another
    // client, so the row is only useful if it says which one matched.
    render(
      <RoutingDecisionCard
        decision={{
          ...heuristic,
          cause: "housekeeping",
          matched_keyword: "Write the title in the predominant language of the session",
          score: undefined,
        }}
      />,
    );
    expect(
      screen.getByText('Client housekeeping call: "Write the title in the predominant language of the session"'),
    ).toBeInTheDocument();
  });

  it("still labels a housekeeping row when redaction dropped the sentinel", () => {
    // matched_keyword is prompt-quoting, so message-log redaction removes it. The row must
    // still read as a housekeeping decision rather than falling back to the raw cause.
    render(<RoutingDecisionCard decision={{ ...heuristic, cause: "housekeeping", score: undefined }} />);
    expect(screen.getByText("Client housekeeping call, classifier skipped")).toBeInTheDocument();
    expect(screen.queryByText("housekeeping")).not.toBeInTheDocument();
  });

  it("labels a modality pin override instead of showing the raw cause token", () => {
    render(<RoutingDecisionCard decision={{ ...heuristic, cause: "modality_pin_override" }} />);
    expect(screen.getByText("Overrode session pin for image input")).toBeInTheDocument();
    expect(screen.queryByText("modality_pin_override")).not.toBeInTheDocument();
  });

  it("labels a modality escalation instead of showing the raw cause token", () => {
    render(<RoutingDecisionCard decision={{ ...heuristic, cause: "modality_escalation" }} />);
    expect(screen.getByText("Escalated for image input")).toBeInTheDocument();
    expect(screen.queryByText("modality_escalation")).not.toBeInTheDocument();
  });

  it("shows the escalation keyword", () => {
    render(
      <RoutingDecisionCard decision={{ ...heuristic, escalated: true, escalation_keyword: "LITELLM ESCALATE" }} />,
    );
    expect(screen.getByText('Yes, keyword "LITELLM ESCALATE"')).toBeInTheDocument();
  });

  it("still shows the ask when escalation had nowhere higher to go", () => {
    // The tier did not move, but the row must not read like a request that never
    // asked to escalate.
    render(
      <RoutingDecisionCard decision={{ ...heuristic, escalated: false, escalation_keyword: "LITELLM ESCALATE" }} />,
    );
    expect(screen.getByText('Requested via "LITELLM ESCALATE"; already at the highest tier')).toBeInTheDocument();
  });

  it("omits the escalation row when no escalation was requested", () => {
    render(<RoutingDecisionCard decision={heuristic} />);
    expect(screen.queryByText("Escalated")).not.toBeInTheDocument();
  });

  it("still shows a ceiling escalation after the keyword is redacted away", () => {
    // Under message redaction the keyword is gone but `escalated` survives, so the
    // row must still say an escalation was requested.
    render(<RoutingDecisionCard decision={{ ...heuristic, escalated: false }} />);
    expect(screen.getByText("Requested; already at the highest tier")).toBeInTheDocument();
  });

  it("does not claim the score chose the tier on a redacted override row", () => {
    // `signals` is gone under redaction; the cause alone must suppress the band.
    render(<RoutingDecisionCard decision={{ ...heuristic, cause: "reasoning_override", signals: undefined }} />);
    expect(screen.queryByText(/SIMPLE|MEDIUM|COMPLEX|at or above/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Heuristic, REASONING override (2 or more reasoning markers, score of at least the Simple to Medium boundary)",
      ),
    ).toBeInTheDocument();
  });

  it("shows the operator's tier name on the badge instead of the canonical one", () => {
    render(<RoutingDecisionCard decision={{ ...heuristic, tier_label: "Deep" }} />);
    expect(screen.getByText("Deep")).toBeInTheDocument();
    expect(screen.queryByText("REASONING")).not.toBeInTheDocument();
  });

  it("keeps the canonical tier name when the router did not rename it", () => {
    render(<RoutingDecisionCard decision={heuristic} />);
    expect(screen.getByText("REASONING")).toBeInTheDocument();
  });

  it("drops the tier name from the score band on a renamed router", () => {
    render(<RoutingDecisionCard decision={{ ...heuristic, tier_label: "Deep" }} />);
    expect(screen.getByText("(at or above 0.6)")).toBeInTheDocument();
    expect(screen.queryByText(/at or above 0\.6, REASONING/)).not.toBeInTheDocument();
  });

  it("uses the operator's tier name in the reasoning override description", () => {
    render(
      <RoutingDecisionCard decision={{ ...heuristic, cause: "reasoning_override", score: 0.2, tier_label: "Deep" }} />,
    );
    expect(
      screen.getByText(
        "Heuristic, Deep override (2 or more reasoning markers, score of at least the Simple to Medium boundary)",
      ),
    ).toBeInTheDocument();
  });

  it("states the floor the override actually cleared", () => {
    render(
      <RoutingDecisionCard
        decision={{ ...heuristic, cause: "reasoning_override", score: 0.2, reasoning_override_min_score: 0.05 }}
      />,
    );
    expect(
      screen.getByText("Heuristic, REASONING override (2 or more reasoning markers, score of at least 0.05)"),
    ).toBeInTheDocument();
  });

  // A floor of 0 is an unconditional override, so a falsy check here would print the "before this change"
  // wording on a row that recorded a real floor.
  it("states a recorded floor of 0 rather than treating it as unrecorded", () => {
    render(
      <RoutingDecisionCard
        decision={{ ...heuristic, cause: "reasoning_override", score: 0.2, reasoning_override_min_score: 0 }}
      />,
    );
    expect(
      screen.getByText("Heuristic, REASONING override (2 or more reasoning markers, score of at least 0)"),
    ).toBeInTheDocument();
  });

  it("never prints undefined on a row logged before the floor was recorded", () => {
    render(<RoutingDecisionCard decision={{ ...heuristic, cause: "reasoning_override", score: 0.2 }} />);
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it("falls back to the raw cause for a value this build does not know", () => {
    render(<RoutingDecisionCard decision={{ cause: "some_future_cause", routed_model: "m" }} />);
    expect(screen.getByText("some_future_cause")).toBeInTheDocument();
  });

  describe("Chinese copy", () => {
    beforeEach(async () => {
      await i18n.changeLanguage("zh");
    });

    afterEach(async () => {
      cleanup();
      await i18n.changeLanguage("en");
    });

    it("renders the Chinese card chrome and row labels and hides the English ones", () => {
      render(
        <RoutingDecisionCard
          decision={{
            ...heuristic,
            request_type: "completion",
            escalated: true,
            escalation_keyword: "LITELLM ESCALATE",
          }}
        />,
      );

      expect(screen.getByText("路由")).toBeInTheDocument();
      expect(screen.getByText("层级")).toBeInTheDocument();
      expect(screen.getByText("请求类型")).toBeInTheDocument();
      expect(screen.getByText("决策依据")).toBeInTheDocument();
      expect(screen.getByText("分数")).toBeInTheDocument();
      expect(screen.getByText("路由至")).toBeInTheDocument();
      expect(screen.getByText("已升级")).toBeInTheDocument();
      expect(screen.getByText("信号")).toBeInTheDocument();
      expect(screen.queryByText("Routing")).not.toBeInTheDocument();
      expect(screen.queryByText("Tier")).not.toBeInTheDocument();
      expect(screen.queryByText("Request type")).not.toBeInTheDocument();
      expect(screen.queryByText("Decided by")).not.toBeInTheDocument();
      expect(screen.queryByText("Score")).not.toBeInTheDocument();
      expect(screen.queryByText("Routed to")).not.toBeInTheDocument();
      expect(screen.queryByText("Escalated")).not.toBeInTheDocument();
      expect(screen.queryByText("Signals")).not.toBeInTheDocument();
    });

    it("renders the Chinese router type label and hides the English one", () => {
      render(<RoutingDecisionCard decision={heuristic} />);

      expect(screen.getByText("(Auto-Router v2)")).toBeInTheDocument();
    });

    it("renders the Chinese score band and hides the English one", () => {
      render(<RoutingDecisionCard decision={heuristic} />);

      expect(screen.getByText("(高于或等于 0.6，REASONING)")).toBeInTheDocument();
      expect(screen.queryByText("(at or above 0.6, REASONING)")).not.toBeInTheDocument();
    });

    it("renders the Chinese router type labels for the adaptive and quality routers", () => {
      render(<RoutingDecisionCard decision={{ ...heuristic, router_type: "adaptive" }} />);
      expect(screen.getByText("(自适应路由器)")).toBeInTheDocument();
      expect(screen.queryByText("(Adaptive router)")).not.toBeInTheDocument();
      cleanup();

      render(<RoutingDecisionCard decision={{ ...heuristic, router_type: "quality" }} />);
      expect(screen.getByText("(质量路由器)")).toBeInTheDocument();
      expect(screen.queryByText("(Quality router)")).not.toBeInTheDocument();
    });

    it("renders the Chinese score bands for every boundary and hides the English ones", () => {
      const cases = [
        [0.1, "(低于 0.15，SIMPLE)"],
        [0.2, "(0.15 至 0.35，MEDIUM)"],
        [0.4, "(0.35 至 0.6，COMPLEX)"],
        [0.9, "(高于或等于 0.6，REASONING)"],
      ] as const;

      for (const [score, zh] of cases) {
        cleanup();
        render(<RoutingDecisionCard decision={{ ...heuristic, score }} />);
        expect(screen.getByText(zh)).toBeInTheDocument();
        expect(screen.queryByText(/below|to 0|at or above/)).not.toBeInTheDocument();
      }
    });

    it("renders the Chinese escalation wording and hides the English one", () => {
      render(
        <RoutingDecisionCard decision={{ ...heuristic, escalated: true, escalation_keyword: "LITELLM ESCALATE" }} />,
      );

      expect(screen.getByText('是，关键词 "LITELLM ESCALATE"')).toBeInTheDocument();
      expect(screen.queryByText('Yes, keyword "LITELLM ESCALATE"')).not.toBeInTheDocument();
      cleanup();

      render(<RoutingDecisionCard decision={{ ...heuristic, escalated: true }} />);
      expect(screen.getByText("是")).toBeInTheDocument();
      expect(screen.queryByText("Yes")).not.toBeInTheDocument();
    });

    it("renders the Chinese ceiling escalation wording and hides the English one", () => {
      render(<RoutingDecisionCard decision={{ ...heuristic, escalated: false }} />);

      expect(screen.getByText("已请求；已处于最高层级")).toBeInTheDocument();
      expect(screen.queryByText("Requested; already at the highest tier")).not.toBeInTheDocument();
      cleanup();

      render(
        <RoutingDecisionCard decision={{ ...heuristic, escalated: false, escalation_keyword: "LITELLM ESCALATE" }} />,
      );
      expect(screen.getByText('通过 "LITELLM ESCALATE" 请求；已处于最高层级')).toBeInTheDocument();
      expect(
        screen.queryByText('Requested via "LITELLM ESCALATE"; already at the highest tier'),
      ).not.toBeInTheDocument();
    });

    it("renders the Chinese plan-mode wording and hides the English one", () => {
      render(
        <RoutingDecisionCard
          decision={{ ...heuristic, cause: "plan_mode", matched_keyword: "Plan mode is active", score: undefined }}
        />,
      );

      expect(screen.getByText('计划模式下限："Plan mode is active"')).toBeInTheDocument();
      expect(screen.queryByText('Plan-mode floor: "Plan mode is active"')).not.toBeInTheDocument();
      cleanup();

      render(<RoutingDecisionCard decision={{ ...heuristic, cause: "plan_mode", score: undefined }} />);
      expect(screen.getByText("计划模式下限")).toBeInTheDocument();
      expect(screen.queryByText("Plan-mode floor")).not.toBeInTheDocument();
    });

    it("renders the Chinese exit_plan_mode tool wording and hides the English one", () => {
      render(
        <RoutingDecisionCard
          decision={{ ...heuristic, cause: "plan_mode", matched_keyword: "exit_plan_mode", score: undefined }}
        />,
      );

      expect(screen.getByText("计划模式下限（exit_plan_mode 工具）")).toBeInTheDocument();
      expect(screen.queryByText("Plan-mode floor (exit_plan_mode tool)")).not.toBeInTheDocument();
    });

    it("renders the Chinese housekeeping wording and hides the English one", () => {
      render(<RoutingDecisionCard decision={{ ...heuristic, cause: "housekeeping", score: undefined }} />);

      expect(screen.getByText("客户端维护调用，已跳过分类器")).toBeInTheDocument();
      expect(screen.queryByText("Client housekeeping call, classifier skipped")).not.toBeInTheDocument();
      cleanup();

      render(
        <RoutingDecisionCard
          decision={{ ...heuristic, cause: "housekeeping", matched_keyword: "Write the title", score: undefined }}
        />,
      );
      expect(screen.getByText('客户端维护调用："Write the title"')).toBeInTheDocument();
      expect(screen.queryByText('Client housekeeping call: "Write the title"')).not.toBeInTheDocument();
    });

    it("renders the Chinese keyword match wording and hides the English one", () => {
      render(
        <RoutingDecisionCard
          decision={{ ...heuristic, cause: "keyword", matched_keyword: "deploy to k8s", score: undefined }}
        />,
      );

      expect(screen.getByText('关键词匹配："deploy to k8s"')).toBeInTheDocument();
      expect(screen.queryByText('Keyword match: "deploy to k8s"')).not.toBeInTheDocument();
      cleanup();

      render(<RoutingDecisionCard decision={{ ...heuristic, cause: "keyword", score: undefined }} />);
      expect(screen.getByText("关键词匹配")).toBeInTheDocument();
      expect(screen.queryByText("Keyword match")).not.toBeInTheDocument();
    });

    it("renders the Chinese LLM classifier wording and hides the English one", () => {
      render(
        <RoutingDecisionCard decision={{ ...heuristic, cause: "llm_classifier", classifier_model: "claude-haiku" }} />,
      );

      expect(screen.getByText("LLM 分类器（claude-haiku）")).toBeInTheDocument();
      expect(screen.queryByText("LLM classifier (claude-haiku)")).not.toBeInTheDocument();
      cleanup();

      render(<RoutingDecisionCard decision={{ ...heuristic, cause: "llm_classifier" }} />);
      expect(screen.getByText("LLM 分类器")).toBeInTheDocument();
      expect(screen.queryByText("LLM classifier")).not.toBeInTheDocument();
    });

    it("renders the Chinese reasoning override wording and hides the English one", () => {
      render(
        <RoutingDecisionCard
          decision={{
            ...heuristic,
            cause: "reasoning_override",
            score: 0.2,
            reasoning_override_min_score: 0.05,
          }}
        />,
      );

      expect(screen.getByText("启发式，REASONING 覆盖（2 个或更多推理标记，分数至少为 0.05）")).toBeInTheDocument();
      expect(
        screen.queryByText("Heuristic, REASONING override (2 or more reasoning markers, score of at least 0.05)"),
      ).not.toBeInTheDocument();
      cleanup();

      render(
        <RoutingDecisionCard
          decision={{ ...heuristic, cause: "reasoning_override", score: 0.2, tier_label: "Deep" }}
        />,
      );
      expect(
        screen.getByText("启发式，Deep 覆盖（2 个或更多推理标记，分数至少为 Simple 到 Medium 的边界）"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "Heuristic, Deep override (2 or more reasoning markers, score of at least the Simple to Medium boundary)",
        ),
      ).not.toBeInTheDocument();
    });

    it("renders the Chinese wording for every constant cause and hides the English ones", () => {
      const cases = [
        ["heuristic_scorer", "启发式评分器", "Heuristic scorer"],
        ["heuristic_v2", "启发式 v2", "Heuristic v2"],
        ["heuristic_first_short_circuit", "启发式评分器，已跳过分类器", "Heuristic scorer, classifier skipped"],
        [
          "hybrid_short_circuit",
          "启发式评分器，分数明显高于所有边界",
          "Heuristic scorer, score clear of every boundary",
        ],
        ["classifier_plugin", "自定义分类器插件", "Custom classifier plugin"],
        ["semantic_keyword_match", "语义关键词匹配", "Semantic keyword match"],
        ["session_affinity_pin", "固定到会话", "Pinned to session"],
        ["session_affinity_escalation", "从会话固定升级", "Escalated from session pin"],
        ["user_turn_continuation", "续接轮次，已跳过分类器", "Continuation turn, classifier skipped"],
        ["modality_escalation", "因图片输入而升级", "Escalated for image input"],
        ["modality_pin_override", "因图片输入覆盖了会话固定", "Overrode session pin for image input"],
        ["quality_tier", "质量层级映射", "Quality tier mapping"],
        ["bandit", "自适应 Bandit", "Adaptive bandit"],
        ["default_fallback", "默认模型，无匹配路由", "Default model, no route matched"],
        ["classifier_fallback", "回退层级，LLM 分类器失败", "Fallback tier, LLM classifier failed"],
        ["default_model_fallback", "默认模型，LLM 分类器失败", "Default model, LLM classifier failed"],
      ] as const;

      for (const [cause, zh, en] of cases) {
        cleanup();
        render(<RoutingDecisionCard decision={{ cause, routed_model: "m", score: undefined }} />);
        expect(screen.getByText(zh)).toBeInTheDocument();
        expect(screen.queryByText(en)).not.toBeInTheDocument();
        expect(screen.queryByText(cause)).not.toBeInTheDocument();
      }
    });
  });
});
