import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { Agent } from "@/components/agents/types";

import AgentCostView from "./agent_cost_view";

const makeAgent = (litellmParams: Agent["litellm_params"]): Agent => ({
  agent_id: "agent-1",
  agent_name: "Test Agent",
  litellm_params: litellmParams,
});

describe("AgentCostView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese cost label and hides the English originals", () => {
    const params = {
      model: "gpt-4",
      cost_per_query: 0.05,
      input_cost_per_token: 0.000012,
      output_cost_per_token: 0.000034,
    };
    renderWithProviders(<AgentCostView agent={makeAgent(params)} />);

    expect(screen.getByText("成本配置")).toBeInTheDocument();
    expect(screen.queryByText("Cost Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("每次查询成本")).toBeInTheDocument();
    expect(screen.queryByText("Cost Per Query")).not.toBeInTheDocument();
    expect(screen.getByText("每 Token 输入成本")).toBeInTheDocument();
    expect(screen.queryByText("Input Cost Per Token")).not.toBeInTheDocument();
    expect(screen.getByText("每 Token 输出成本")).toBeInTheDocument();
    expect(screen.queryByText("Output Cost Per Token")).not.toBeInTheDocument();
  });
});
