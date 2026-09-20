import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMajorAirlines } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";

import CompetitorIntentConfiguration, { type CompetitorIntentConfig } from "./CompetitorIntentConfiguration";

vi.mock("@/components/networking", () => ({ getMajorAirlines: vi.fn() }));

const mockAirlines = vi.mocked(getMajorAirlines);
const onChange = vi.fn();

const DEFAULT_CONFIG: CompetitorIntentConfig = {
  competitor_intent_type: "airline",
  brand_self: [],
  locations: [],
  policy: {
    competitor_comparison: "refuse",
    possible_competitor_comparison: "reframe",
  },
  threshold_high: 0.7,
  threshold_medium: 0.45,
  threshold_low: 0.3,
};

const Harness = ({ initialEnabled = true }: { initialEnabled?: boolean }) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [config, setConfig] = useState<CompetitorIntentConfig | null>(initialEnabled ? DEFAULT_CONFIG : null);
  const handleChange = (nextEnabled: boolean, nextConfig: CompetitorIntentConfig | null) => {
    onChange(nextEnabled, nextConfig);
    setEnabled(nextEnabled);
    setConfig(nextConfig);
  };
  return (
    <CompetitorIntentConfiguration enabled={enabled} config={config} accessToken="sk-test" onChange={handleChange} />
  );
};

const lastConfig = (): CompetitorIntentConfig => onChange.mock.calls[onChange.mock.calls.length - 1][1];

const chooseOption = async (user: ReturnType<typeof userEvent.setup>, index: number, optionText: string) => {
  await user.click(screen.getAllByRole("combobox")[index]);
  await user.click(await screen.findByRole("option", { name: optionText }));
};

describe("CompetitorIntentConfiguration reported config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAirlines.mockResolvedValue({ airlines: [] });
  });

  it("reports the seeded config when switched on and null when switched off", async () => {
    const user = userEvent.setup();
    render(<Harness initialEnabled={false} />);

    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenNthCalledWith(1, true, DEFAULT_CONFIG);

    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenNthCalledWith(2, false, null);
  });

  it("keeps every other key when the intent type changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseOption(user, 0, "Generic (specify competitors manually)");

    expect(lastConfig()).toStrictEqual({ ...DEFAULT_CONFIG, competitor_intent_type: "generic" });
    expect(screen.getByText("Competitors")).toBeInTheDocument();
    expect(screen.queryByText("Locations (optional)")).not.toBeInTheDocument();
  });

  it("reports a policy change without dropping the other policy key", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseOption(user, 3, "Reframe (suggest alternative)");

    expect(lastConfig()).toStrictEqual({
      ...DEFAULT_CONFIG,
      policy: { competitor_comparison: "reframe", possible_competitor_comparison: "reframe" },
    });
  });

  it("commits comma separated brand terms as separate tags", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const brandSelf = screen.getAllByRole("combobox")[1];
    await user.click(brandSelf);
    await user.type(brandSelf, "acme,globex,");

    expect(lastConfig().brand_self).toStrictEqual(["acme", "globex"]);
  });

  it("commits the pending brand term when the field loses focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const brandSelf = screen.getAllByRole("combobox")[1];
    await user.click(brandSelf);
    await user.type(brandSelf, "acme");
    await user.tab();

    expect(lastConfig().brand_self).toStrictEqual(["acme"]);
  });

  it("expands a picked airline into all of its match variants, lowercased", async () => {
    mockAirlines.mockResolvedValue({ airlines: [{ id: "qr", match: "Qatar Airways|qatar|qr", tags: [] }] });
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getAllByRole("combobox")[1]);
    const options = await screen.findAllByText(/Qatar Airways/);
    await user.click(options[options.length - 1]);

    expect(lastConfig().brand_self).toStrictEqual(["qatar airways", "qatar", "qr"]);
  });

  it("reports locations only while the airline type is selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const locations = screen.getAllByRole("combobox")[2];
    await user.click(locations);
    await user.type(locations, "doha,");

    expect(lastConfig()).toStrictEqual({ ...DEFAULT_CONFIG, locations: ["doha"] });
  });

  it("reports a typed decimal threshold and leaves the other two alone", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const thresholds = screen.getAllByRole("spinbutton");
    await user.clear(thresholds[0]);
    await user.type(thresholds[0], "0.55");

    expect(lastConfig()).toStrictEqual({ ...DEFAULT_CONFIG, threshold_high: 0.55 });
  });

  it("falls back to the default threshold when the field is cleared", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(screen.getAllByRole("spinbutton")[1]);

    expect(lastConfig()).toStrictEqual(DEFAULT_CONFIG);
  });

  it("clamps a threshold above the maximum back to 1 when the field is left", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const thresholds = screen.getAllByRole("spinbutton");
    await user.clear(thresholds[2]);
    await user.type(thresholds[2], "5");
    await user.tab();

    expect(lastConfig()).toStrictEqual({ ...DEFAULT_CONFIG, threshold_low: 1 });
  });

  it("explains the filter without rendering any control while switched off", () => {
    render(<Harness initialEnabled={false} />);

    expect(
      screen.getByText(
        "Block or reframe competitor comparison questions. When enabled, airline type auto-loads competitors from IATA; generic type requires manual competitor list.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });

  it.each([
    ["Type", "Airline (auto-load competitors from IATA)"],
    ["Policy: Competitor comparison", "Refuse (block request)"],
    ["Policy: Possible competitor comparison", "Reframe (suggest alternative to backend LLM)"],
  ])("shows the human label on the %s trigger", (name, label) => {
    render(<Harness />);

    expect(screen.getByRole("combobox", { name })).toHaveTextContent(label);
  });

  it("shows the human label on the Type trigger after switching to generic", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Type" }));
    await user.click(await screen.findByRole("option", { name: "Generic (specify competitors manually)" }));

    expect(screen.getByRole("combobox", { name: "Type" })).toHaveTextContent("Generic (specify competitors manually)");
  });
});

describe("CompetitorIntentConfiguration Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAirlines.mockResolvedValue({ airlines: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese competitor-intent chrome and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    expect(screen.getByText("竞品意图过滤器")).toBeInTheDocument();
    expect(
      screen.getByText(
        "阻止或改写竞品对比问题。航空公司类型使用主要航空公司（不含你的品牌）；通用类型需要手动填写竞品列表。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.getByText("你的品牌（brand_self）")).toBeInTheDocument();
    expect(screen.getByText("从列表中选择你的航空公司（不计入竞品），或输入以添加自定义词")).toBeInTheDocument();
    expect(screen.getByText("地点（可选）")).toBeInTheDocument();
    expect(screen.getByText("用于消歧的国家、城市、机场（例如 qatar、doha）")).toBeInTheDocument();
    expect(screen.getByText("策略：竞品对比")).toBeInTheDocument();
    expect(screen.getByText("策略：可能的竞品对比")).toBeInTheDocument();
    expect(screen.getByText("置信度阈值")).toBeInTheDocument();
    expect(screen.getByText("高")).toBeInTheDocument();
    expect(screen.getByText("中")).toBeInTheDocument();
    expect(screen.getByText("低")).toBeInTheDocument();
    expect(screen.getByText(/按置信度（0–1）对竞品意图分类/)).toBeInTheDocument();
    expect(screen.getByText("高（≥）")).toBeInTheDocument();
    expect(screen.getByText("：视为完整竞品对比 -> 使用「竞品对比」策略")).toBeInTheDocument();
    expect(screen.getByText("中（≥）")).toBeInTheDocument();
    expect(screen.getByText("：视为可能的对比 -> 使用「可能的竞品对比」策略")).toBeInTheDocument();
    expect(screen.getByText("低（≥）")).toBeInTheDocument();
    expect(screen.getByText("：仅记录日志；允许请求。低于低 -> 允许且不执行操作")).toBeInTheDocument();
    expect(screen.getByText(/提高阈值更宽松；降低阈值更严格。/)).toBeInTheDocument();

    expect(screen.getByRole("combobox", { name: "类型" })).toHaveTextContent("航空公司（从 IATA 自动加载竞品）");
    expect(screen.getByRole("combobox", { name: "策略：竞品对比" })).toHaveTextContent("拒绝（阻止请求）");
    expect(screen.getByRole("combobox", { name: "策略：可能的竞品对比" })).toHaveTextContent(
      "改写（向后端 LLM 建议替代方案）",
    );
    expect(await screen.findByPlaceholderText("搜索或选择航空公司，或输入以添加自定义项")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入后按 Enter 添加")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "类型" }));
    expect(await screen.findByRole("option", { name: "通用（手动指定竞品）" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("combobox", { name: "策略：竞品对比" }));
    expect(await screen.findByRole("option", { name: "改写（建议替代方案）" })).toBeInTheDocument();

    expect(screen.queryByText("Competitor Intent Filter")).not.toBeInTheDocument();
    expect(screen.queryByText("Confidence thresholds")).not.toBeInTheDocument();
    expect(screen.queryByText("Your Brand (brand_self)")).not.toBeInTheDocument();
    expect(screen.queryByText("Policy: Competitor comparison")).not.toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Block or reframe competitor comparison questions. Airline type uses major airlines (excluding your brand); generic requires manual competitor list.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Airline (auto-load competitors from IATA)")).not.toBeInTheDocument();
    expect(screen.queryByText("Generic (specify competitors manually)")).not.toBeInTheDocument();
    expect(screen.queryByText("Policy: Possible competitor comparison")).not.toBeInTheDocument();
    expect(screen.queryByText("Refuse (block request)")).not.toBeInTheDocument();
    expect(screen.queryByText("Reframe (suggest alternative)")).not.toBeInTheDocument();
    expect(screen.queryByText("Reframe (suggest alternative to backend LLM)")).not.toBeInTheDocument();
    expect(screen.queryByText("Medium")).not.toBeInTheDocument();
    expect(screen.queryByText("Low")).not.toBeInTheDocument();
    expect(screen.queryByText("High (≥)")).not.toBeInTheDocument();
    expect(screen.queryByText("Medium (≥)")).not.toBeInTheDocument();
    expect(screen.queryByText("Low (≥)")).not.toBeInTheDocument();
    expect(
      screen.queryByText(': Treat as full competitor comparison -> uses "Competitor comparison" policy'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(': Treat as possible comparison -> uses "Possible competitor comparison" policy'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(": Log only; allow request. Below Low -> allow with no action")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Raise thresholds to be more permissive; lower them to be stricter."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Classify competitor intent by confidence (0–1). Higher confidence -> stronger intent."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Select your airline from the list (excluded from competitors) or type to add a custom term"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Countries, cities, airports for disambiguation (e.g. qatar, doha)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or select airline, or type to add custom")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type and press Enter to add")).not.toBeInTheDocument();
  });

  it("renders the Chinese generic-type chrome and the disabled explanation", async () => {
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "类型" }));
    await user.click(await screen.findByRole("option", { name: "通用（手动指定竞品）" }));

    expect(screen.getByText("竞品")).toBeInTheDocument();
    expect(screen.getByText("要检测的竞品名称（通用类型必填）")).toBeInTheDocument();
    expect(screen.getByText("用户用于指代你品牌的名称或代码")).toBeInTheDocument();
    expect(screen.queryByText("地点（可选）")).not.toBeInTheDocument();
    expect(screen.queryByText("Competitors")).not.toBeInTheDocument();
    expect(screen.queryByText("Names/codes users use for your brand")).not.toBeInTheDocument();
    expect(screen.queryByText("Competitor names to detect (required for generic type)")).not.toBeInTheDocument();

    unmount();
    render(<Harness initialEnabled={false} />);
    expect(
      screen.getByText(
        "阻止或改写竞品对比问题。启用后，航空公司类型会从 IATA 自动加载竞品；通用类型需要手动填写竞品列表。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Block or reframe competitor comparison questions. When enabled, airline type auto-loads competitors from IATA; generic type requires manual competitor list.",
      ),
    ).not.toBeInTheDocument();
  });
});
