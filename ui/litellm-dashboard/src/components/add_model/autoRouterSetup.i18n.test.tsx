import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return { ...actual, modelCreateCall: vi.fn() };
});

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

import HeuristicScoringConfig from "./HeuristicScoringConfig";
import CustomDimensionRows from "./CustomDimensionRows";
import RouterConfigBuilder from "./RouterConfigBuilder";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";
import { toast } from "@/lib/toast";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const value: ComplexityRouterConfigValue = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: ["o3"], REASONING: ["o3"] },
  classifier_type: "heuristic",
};

const expectChinese = (zh: string, en: string) => {
  expect(screen.getAllByText(zh, { exact: false }).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en, { exact: false })).toHaveLength(0);
};

describe("auto-router setup Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the advanced scoring panel in Chinese", () => {
    renderWithProviders(<HeuristicScoringConfig value={value} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("高级评分"));

    expectChinese("高级评分", "Advanced scoring");
    expectChinese("层级边界", "Tier boundaries");
    expectChinese("简单到中等", "Simple to Medium");
    expectChinese("中等到复杂", "Medium to Complex");
    expectChinese("复杂到推理", "Complex to Reasoning");
    expectChinese("Token 阈值", "Token thresholds");
    expectChinese("短于", "Short below");
    expectChinese("长于", "Long above");
    expectChinese("维度权重", "Dimension weights");
    expectChinese("代码存在", "Code presence");
    expectChinese("推理标记", "Reasoning markers");
    expectChinese("技术术语", "Technical terms");
    expectChinese("Token 数量", "Token count");
    expectChinese("简单指示", "Simple indicators");
    expectChinese("多步骤模式", "Multi-step patterns");
    expectChinese("问题复杂度", "Question complexity");
    expectChinese("推理覆盖下限", "Reasoning override floor");
    expectChinese("最低得分", "Minimum score");
    expectChinese("总计", "total");
  });

  it("renders the custom dimension rows in Chinese", () => {
    renderWithProviders(
      <CustomDimensionRows
        rows={[{ id: "draft", name: "domain", weight: 0.2, keywords: ["orbitmesh"] }]}
        disabled={false}
        onChange={vi.fn()}
        onWeight={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expectChinese("自定义维度 1", "Custom dimension 1");
    expectChinese("名称", "Name");
    expectChinese("权重", "Weight");
    expectChinese("关键词（每行一个）", "Keywords (one per line)");
    expectChinese("正则表达式模式（每行一个）", "Regex patterns (one per line)");
    expectChinese("评分方式", "Scoring");
    expectChinese("添加自定义维度", "Add custom dimension");
    expectChinese(
      "关键词匹配当前提问。正则表达式扫描其前 2,048 个字符，并允许最多 64 个有界的单字符重复。代理会在保存时校验模式。",
      "Keywords match the current ask. Regex scans its first 2,048 characters and permits bounded single-character repeats up to 64. The proxy validates patterns on save.",
    );
    expectChinese("移除", "Remove");
  });

  it("renders the router config builder in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterConfigBuilder modelInfo={[]} value={null} onChange={vi.fn()} />);

    expectChinese("路由配置", "Routes Configuration");
    expectChinese("添加路由", "Add Route");
    expectChinese("尚未配置任何路由。点击“添加路由”开始。", 'No routes configured. Click "Add Route" to get started.');
    expectChinese("JSON 预览", "JSON Preview");
    expectChinese("显示", "Show");

    await user.click(screen.getByRole("button", { name: "添加路由" }));
    expectChinese("模型", "Model");
    expectChinese("描述", "Description");
    expectChinese("得分阈值", "Score Threshold");
    expectChinese("示例话语", "Example Utterances");
    expectChinese("未命名", "Unnamed");
  });

  it("renders the submit toasts in Chinese", async () => {
    const networking = await import("../networking");
    vi.mocked(networking.modelCreateCall).mockRejectedValue(new Error("boom"));
    const t = i18n.getFixedT("zh", "models");

    await handleAddAutoRouterSubmit(
      {
        auto_router_name: "my-router",
        auto_router_default_model: "gpt-4o",
        model_type: "complexity_router",
        complexity_router_config: { tiers: value.tiers, classifier_type: "heuristic" },
      } as never,
      "token",
      { t, resetForm: vi.fn() },
    );

    expect(toast.fromError).toHaveBeenCalledWith("添加自动路由器失败：Error: boom");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("renders the submit success toast in Chinese", async () => {
    const networking = await import("../networking");
    vi.mocked(networking.modelCreateCall).mockResolvedValue({});
    const t = i18n.getFixedT("zh", "models");

    await handleAddAutoRouterSubmit(
      {
        auto_router_name: "my-router",
        auto_router_default_model: "gpt-4o",
        model_type: "complexity_router",
        complexity_router_config: { tiers: value.tiers, classifier_type: "heuristic" },
      } as never,
      "token",
      { t, resetForm: vi.fn() },
    );

    expect(toast.success).toHaveBeenCalledWith("成功创建自动路由器：my-router");
  });
});
