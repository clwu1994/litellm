import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";

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
import { useComplexityScorerDefaults } from "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults";
import { LOADED_SCORER_DEFAULTS_QUERY } from "../../../tests/mocks/complexityScorerDefaults";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const value: ComplexityRouterConfigValue = {
  tiers: { SIMPLE: ["gpt-4o-mini"], MEDIUM: ["gpt-4o"], COMPLEX: ["o3"], REASONING: ["o3"] },
  classifier_type: "heuristic",
};

const expectChinese = (zh: string, en: string) => {
  expect(screen.getAllByText(zh, { exact: false }).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en, { exact: false })).toHaveLength(0);
};

const expectChinesePlaceholder = (zh: string, en: string) => {
  expect(screen.getAllByPlaceholderText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByPlaceholderText(en)).toHaveLength(0);
};

const expectChineseLabel = (zh: string, en: string) => {
  expect(screen.getAllByLabelText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByLabelText(en)).toHaveLength(0);
};

describe("auto-router setup Chinese copy", () => {
  beforeEach(async () => {
    vi.mocked(useComplexityScorerDefaults).mockReturnValue(LOADED_SCORER_DEFAULTS_QUERY);
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

  it("renders the advanced scoring chrome in Chinese", () => {
    renderWithProviders(
      <HeuristicScoringConfig value={{ ...value, reasoning_override_min_score: 0.2 }} onChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("高级评分"));

    expectChinese(
      "下方的每个调节项都是可选的。若不修改，路由器会跟随随附的默认值，因此会采用对它们的任何重新校准，而不会固定在此处显示的数字上。",
      "Every knob below is optional. Left untouched, the router follows the shipped defaults, so it picks up any recalibration of them rather than staying pinned to the numbers shown here.",
    );
    expectChinese("总计 1.00", "total 1.00");
    expectChinese("恢复默认权重", "Restore default weights");
    expectChinese("重置为默认值", "Reset to defaults");
    expectChineseLabel("代码存在 权重", "Code presence weight");
    expectChinese(
      "两个或更多推理标记会将请求提升到推理层级，但仅当其加权得分达到此下限时才会生效。",
      "Two or more reasoning markers promote a request to the reasoning tier, but only once its weighted score reaches this floor.",
    );
    expectChinese(
      "若不修改，它会跟随“简单到中等”的边界，当前为 0.15。",
      "Left untouched, it tracks the Simple to Medium boundary, currently 0.15.",
    );
    expectChinese("将其设为 0 即可仅凭标记进行提升。", "Set it to 0 to promote on the markers alone.");
    expectChinese(
      "每个层级的起始加权得分。得分范围为 -1 到 1，简短或对话式提示的得分低于 0，因此负边界是将琐碎流量提升到更高层级的有效方式。",
      "The weighted score each tier starts at. Scores run from -1 to 1, and short or conversational prompts score below 0, so a negative boundary is a valid way to lift trivial traffic into a higher tier.",
    );
    expectChinese(
      "将 Token 数量维度推向其下限或上限的预估提示长度（以 Token 计）。两者之间的长度得分为中性。",
      "Estimated prompt length, in tokens, that pushes the token count dimension to its floor or ceiling. Lengths between the two score neutral.",
    );
    expectChinese(
      "更改某个权重会重新平衡其他内置和自定义权重，使其总和为 1.00。保存会存储这些值。未修改的路由器保留其现有权重。",
      "Changing a weight rebalances the other built-in and custom weights to total 1.00. Save stores those values. Untouched routers keep their existing weights.",
    );
  });

  it("renders the singular and plural override-count badge in Chinese", () => {
    const { unmount } = renderWithProviders(
      <HeuristicScoringConfig value={{ ...value, reasoning_override_min_score: 0.2 }} onChange={vi.fn()} />,
    );
    expectChinese("1 项覆盖", "1 override");
    unmount();

    renderWithProviders(
      <HeuristicScoringConfig
        value={{
          ...value,
          reasoning_override_min_score: 0.2,
          tier_boundaries: { simple_medium: 0.1, medium_complex: 0.3, complex_reasoning: 0.5 },
        }}
        onChange={vi.fn()}
      />,
    );
    expectChinese("2 项覆盖", "2 overrides");
  });

  it("renders the loading copy for the shipped defaults in Chinese", () => {
    vi.mocked(useComplexityScorerDefaults).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    renderWithProviders(<HeuristicScoringConfig value={value} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("高级评分"));

    expectChinese("正在加载随附的默认值……", "Loading the shipped defaults...");
  });

  it("renders the shipped-defaults failure copy and retry in Chinese", () => {
    vi.mocked(useComplexityScorerDefaults).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    } as never);
    renderWithProviders(<HeuristicScoringConfig value={value} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("高级评分"));

    expectChinese(
      "无法加载随附的默认值，因此仅显示此路由器已覆盖的值。保存仍然有效，未修改的调节项会继续跟随默认值。",
      "Could not load the shipped defaults, so only values this router already overrides are shown. Saving still works, and an untouched knob keeps following the defaults.",
    );
    expectChinese("重试", "Retry");
  });

  it("renders the untouched override-floor copy in Chinese when no defaults are known", () => {
    vi.mocked(useComplexityScorerDefaults).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    renderWithProviders(<HeuristicScoringConfig value={value} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText("高级评分"));

    expectChinese("若不修改，它会跟随“简单到中等”的边界。", "Left untouched, it tracks the Simple to Medium boundary.");
  });

  it("renders the custom dimension scoring modes, aria labels and help in Chinese", async () => {
    const user = userEvent.setup();
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

    expectChinese("二元", "Binary");
    expectChineseLabel("移除自定义维度 1", "Remove custom dimension 1");
    expectChineseLabel("domain 权重", "domain weight");
    expectChinese(
      "二元对任何命中都使用完整权重。匹配计数对一个不同匹配项使用一半权重，对两个或更多使用完整权重。",
      "Binary uses the full weight for any hit. Match count uses half for one distinct matcher and full weight for two or more.",
    );

    await user.click(screen.getByLabelText("评分方式"));
    expect(await screen.findByText("匹配计数")).toBeInTheDocument();
    expect(screen.queryByText("Match count")).not.toBeInTheDocument();
  });

  it("renders the router builder route chrome, tooltips and hide toggle in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterConfigBuilder modelInfo={[]} value={null} onChange={vi.fn()} />);

    await user.hover(findTooltipTriggerBeside(screen.getByText("路由配置")));
    expect(await screen.findByText("配置路由逻辑，根据用户输入模式自动选择最佳模型")).toBeInTheDocument();
    expect(
      screen.queryByText("Configure routing logic to automatically select the best model based on user input patterns"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加路由" }));

    expectChinese("路由 1：未命名", "Route 1: Unnamed");
    expectChineseLabel("删除", "delete");
    expectChinesePlaceholder("描述何时应使用此路由……", "Describe when this route should be used...");
    expectChinesePlaceholder("输入话语并按回车……", "Type an utterance and press Enter...");
    expectChinese(
      "输入话语并按回车即可添加。你也可以粘贴多行。",
      "Type an utterance and press Enter to add it. You can also paste multiple lines.",
    );

    await user.hover(findTooltipTriggerBeside(screen.getByText("得分阈值")));
    expect(await screen.findByText("路由到此模型的最低相似度得分（0-1）")).toBeInTheDocument();
    expect(screen.queryByText("Minimum similarity score to route to this model (0-1)")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("示例话语")));
    expect(await screen.findByText("此路由的训练示例。输入话语并按回车即可添加。")).toBeInTheDocument();
    expect(
      screen.queryByText("Training examples for this route. Type an utterance and press Enter to add it."),
    ).not.toBeInTheDocument();

    const utteranceInput = screen.getByPlaceholderText("输入话语并按回车……");
    await user.type(utteranceInput, "hello{Enter}");
    expectChineseLabel("移除 hello", "Remove hello");

    await user.click(screen.getByRole("button", { name: "显示" }));
    expectChinese("隐藏", "Hide");
  });

  it("renders the heuristic scoring boundary and token warnings in Chinese", () => {
    const { unmount } = renderWithProviders(
      <HeuristicScoringConfig
        value={{ ...value, tier_boundaries: { simple_medium: 0.5, medium_complex: 0.3, complex_reasoning: 0.6 } }}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("高级评分"));
    expectChinese(
      "这些边界递减，因此它们之间的每个层级都不可达，其流量会路由到其他地方。",
      "These boundaries decrease, so every tier between them is unreachable and its traffic routes elsewhere.",
    );
    unmount();

    renderWithProviders(
      <HeuristicScoringConfig
        value={{ ...value, token_thresholds: { simple: 400, complex: 100 } }}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("高级评分"));
    expectChinese(
      "短阈值不低于长阈值，因此没有任何提示长度在长度维度上得分为中性。",
      "The short threshold is not below the long one, so no prompt length scores neutral on length.",
    );
  });
});
