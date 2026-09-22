import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import { Policy } from "@/components/policies/types";

import PolicyInfoView from "./policy_info";

vi.mock("@/components/networking");
vi.mock("./pipeline_flow_builder", () => ({
  PipelineInfoDisplay: () => <div data-testid="pipeline-info" />,
}));

const basePolicy: Policy = {
  policy_id: "policy-uuid-1",
  policy_name: "My Test Policy",
  inherit: null,
  description: "A test description",
  guardrails_add: ["guardrail-a"],
  guardrails_remove: ["guardrail-b"],
  condition: null,
};

const renderInfo = (policy: Policy | null = basePolicy, isAdmin = true) => {
  const getPolicy = vi.fn().mockResolvedValue(policy);
  renderWithProviders(
    <PolicyInfoView
      policyId="policy-uuid-1"
      onClose={vi.fn()}
      onEdit={vi.fn()}
      accessToken="test-token"
      isAdmin={isAdmin}
      getPolicy={getPolicy}
    />,
  );
  return getPolicy;
};

describe("PolicyInfoView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.getResolvedGuardrails).mockResolvedValue({ resolved_guardrails: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese not-found state", async () => {
    renderInfo(null);

    expect(await screen.findByText("未找到策略")).toBeInTheDocument();
    expect(screen.queryByText("Policy not found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go Back" })).not.toBeInTheDocument();
  });

  it("renders the Chinese back and edit buttons", async () => {
    renderInfo();

    expect(await screen.findByRole("button", { name: "返回策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Policies" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Policy" })).not.toBeInTheDocument();
  });

  it("renders the Chinese detail labels and fallback values", async () => {
    renderInfo();

    await screen.findByText("My Test Policy");

    for (const [zh, en] of [
      ["策略 ID", "Policy ID"],
      ["描述", "Description"],
      ["继承自", "Inherits From"],
      ["创建时间", "Created At"],
      ["更新时间", "Updated At"],
      ["要添加的 Guardrails", "Guardrails to Add"],
      ["要移除的 Guardrails", "Guardrails to Remove"],
      ["模型条件", "Model Condition"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(screen.getByText("无")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-description fallback", async () => {
    renderInfo({ ...basePolicy, description: null });

    expect(await screen.findByText("无描述")).toBeInTheDocument();
    expect(screen.queryByText("No description")).not.toBeInTheDocument();
  });

  it("renders the Chinese guardrails configuration and resolved guardrails", async () => {
    vi.mocked(networking.getResolvedGuardrails).mockResolvedValue({ resolved_guardrails: ["resolved-guardrail-x"] });
    renderInfo();

    expect(await screen.findByText("Guardrails 配置")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("解析后的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Resolved Guardrails")).not.toBeInTheDocument();
    expect(screen.getByText("最终将应用的 Guardrails（含继承）：")).toBeInTheDocument();
    expect(
      screen.queryByText("Final guardrails that will be applied (including inheritance):"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("resolved-guardrail-x")).toBeInTheDocument();
  });

  it("renders the Chinese conditions heading and empty model condition", async () => {
    renderInfo();

    expect(await screen.findByText("条件")).toBeInTheDocument();
    expect(screen.queryByText("Conditions")).not.toBeInTheDocument();
    expect(screen.getByText("无模型条件（应用于所有模型）")).toBeInTheDocument();
    expect(screen.queryByText("No model condition (applies to all models)")).not.toBeInTheDocument();
  });

  it("renders the Chinese pipeline heading and the plural pipeline title", async () => {
    const pipeline = {
      mode: "pre_call" as const,
      steps: [
        { guardrail: "g1", on_fail: "block" as const, on_pass: "allow" as const },
        { guardrail: "g2", on_fail: "block" as const, on_pass: "allow" as const },
      ],
    };
    renderInfo({ ...basePolicy, pipeline });

    expect(await screen.findByText("流水线流程")).toBeInTheDocument();
    expect(screen.queryByText("Pipeline Flow")).not.toBeInTheDocument();
    expect(screen.getByText("流水线（调用前 模式，2 个步骤）")).toBeInTheDocument();
    expect(screen.queryByText("Pipeline (pre_call mode, 2 steps)")).not.toBeInTheDocument();
  });

  it("renders the Chinese singular pipeline title with the post-call mode", async () => {
    const pipeline = {
      mode: "post_call" as const,
      steps: [{ guardrail: "g1", on_fail: "block" as const, on_pass: "allow" as const }],
    };
    renderInfo({ ...basePolicy, pipeline });

    expect(await screen.findByText("流水线（调用后 模式，1 个步骤）")).toBeInTheDocument();
    expect(screen.queryByText("Pipeline (post_call mode, 1 step)")).not.toBeInTheDocument();
  });
});
