import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { getGuardrailsList, testPoliciesAndGuardrails } from "@/components/networking";
import ComplianceUI from "./ComplianceUI";

type PapaConfig = {
  complete?: (results: { data: Record<string, string>[]; meta: { fields?: string[] } }) => void;
  error?: () => void;
};

const mockPapa = { parseImpl: null as ((config: PapaConfig) => void) | null };

vi.mock("papaparse", () => ({
  default: {
    unparse: vi.fn(() => ""),
    parse: vi.fn((_input: unknown, config: PapaConfig) => {
      mockPapa.parseImpl?.(config);
    }),
  },
}));

vi.mock("@/components/networking", () => ({
  getGuardrailsList: vi.fn().mockResolvedValue({
    guardrails: [{ guardrail_name: "g-one" }, { guardrail_name: "g-two" }],
  }),
  testPoliciesAndGuardrails: vi.fn().mockResolvedValue({ results: [] }),
}));

const mockAccess = { viewPolicies: true };

vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: () => mockAccess.viewPolicies,
}));

vi.mock("@/components/policies/PolicySelector", () => ({
  default: ({ onChange }: { onChange: (value: string[]) => void }) => (
    <>
      <button type="button" onClick={() => onChange(["policy-1"])}>
        pick-one-policy
      </button>
      <button type="button" onClick={() => onChange(["policy-1", "policy-2"])}>
        pick-two-policies
      </button>
    </>
  ),
  getPolicyOptionEntries: () => [],
}));

vi.mock("@/components/llm_calls/chat_completion", () => ({
  makeOpenAIChatCompletionRequest: vi.fn().mockResolvedValue(undefined),
}));

const renderCompliance = (props: Partial<ComponentProps<typeof ComplianceUI>> = {}) =>
  render(<ComplianceUI accessToken="test-token" disabledPersonalKeyCreation={false} {...props} />);

const csvFile = () => new File(["x"], "data.csv", { type: "text/csv" });

const csvInput = (container: HTMLElement): HTMLInputElement => {
  // eslint-disable-next-line testing-library/no-node-access -- the hidden CSV file input carries no accessible name
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error("the CSV file input is missing");
  return input;
};

const openCsvPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "CSV" }));
};

const uploadCsv = async (
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  rows: Record<string, string>[],
) => {
  await openCsvPanel(user);
  mockPapa.parseImpl = (config) => config.complete?.({ data: rows, meta: { fields: ["prompt", "expected_result"] } });
  fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
};

const batchResults = [
  {
    guardrail_errors: [{ guardrail_name: "g1", message: "bad" }],
    inputs: { texts: ["returned text"] },
  },
  { guardrail_errors: [] },
  { guardrail_errors: [{ guardrail_name: "g2", message: "nope" }] },
  { guardrail_errors: [] },
];

describe("ComplianceUI Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAccess.viewPolicies = true;
    mockPapa.parseImpl = null;
    (getGuardrailsList as ReturnType<typeof vi.fn>).mockResolvedValue({
      guardrails: [{ guardrail_name: "g-one" }, { guardrail_name: "g-two" }],
    });
    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    Element.prototype.scrollIntoView = vi.fn();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese test configuration and prompt library chrome", () => {
    renderCompliance();

    expect(screen.getByText("测试配置")).toBeInTheDocument();
    expect(screen.queryByText("Test Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("选择策略、Guardrails 或两者进行测试。")).toBeInTheDocument();
    expect(screen.queryByText("Select policies, guardrails, or both to test against.")).not.toBeInTheDocument();
    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.queryByText("Policies")).not.toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(screen.queryByText("or")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("未选择")).toBeInTheDocument();
    expect(screen.queryByText("None selected")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "模拟 (0)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simulate (0)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reset/ })).not.toBeInTheDocument();
    expect(screen.getByText("测试提示词")).toBeInTheDocument();
    expect(screen.queryByText("Test Prompts")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索提示词...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search prompts...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select All" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CSV" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "全部" })[0]).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "快速测试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quick Test" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "批量结果" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Batch Results" })).not.toBeInTheDocument();
    expect(screen.getByText("未选择策略或 Guardrails，请在上方选择要测试的规则。")).toBeInTheDocument();
    expect(screen.queryByText(/No policies or guardrails selected/)).not.toBeInTheDocument();
    expect(screen.getByText("在下方输入提示词即可快速测试。")).toBeInTheDocument();
    expect(screen.queryByText("Type a prompt below to quickly test it.")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入要测试的文本...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter text to test...")).not.toBeInTheDocument();
    expect(screen.getByText("提交", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("to submit", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test" })).not.toBeInTheDocument();
  });

  it("renders the guardrails-only introduction when policies are not viewable", () => {
    mockAccess.viewPolicies = false;
    renderCompliance();

    expect(screen.getByText("选择要测试的 Guardrails。")).toBeInTheDocument();
    expect(screen.queryByText("Select guardrails to test against.")).not.toBeInTheDocument();
    expect(screen.queryByText("策略")).not.toBeInTheDocument();
    expect(screen.queryByText("或")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty guardrail dropdown", async () => {
    (getGuardrailsList as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ guardrails: [] });
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: /未选择/ }));

    expect(await screen.findByText("没有可用的 Guardrails。请在 Guardrails 页面创建。")).toBeInTheDocument();
    expect(
      screen.queryByText("No guardrails available. Create guardrails in the Guardrails page."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese selected-guardrail chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: /未选择/ }));
    await user.click(await screen.findByRole("button", { name: /g-one/ }));

    expect(screen.getByText("已选择 1 个")).toBeInTheDocument();
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove")).not.toBeInTheDocument();
    expect(screen.getByText("测试对象：")).toBeInTheDocument();
    expect(screen.queryByText("Testing against:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试 1 个 Guardrail" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 1 guardrail" })).not.toBeInTheDocument();
  });

  it("renders the Chinese singular policy count under the locale that selects it", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: "pick-one-policy" }));

    expect(screen.getByRole("button", { name: "Test 1 policy" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 1 policies" })).not.toBeInTheDocument();
  });

  it("renders the Chinese plural policy count", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: "pick-two-policies" }));

    expect(screen.getByRole("button", { name: "测试 2 条策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 2 policies" })).not.toBeInTheDocument();
  });

  it("renders the Chinese combined policy and guardrail count", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: "pick-one-policy" }));
    await user.click(screen.getByRole("button", { name: /未选择/ }));
    await user.click(await screen.findByRole("button", { name: /g-one/ }));

    expect(screen.getByRole("button", { name: "测试 1 条策略 & 1 个 Guardrail" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 1 policy & 1 guardrail" })).not.toBeInTheDocument();
  });

  it("renders the Chinese singular guardrail count under the locale that selects it", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: /None selected/ }));
    await user.click(await screen.findByRole("button", { name: /g-one/ }));

    expect(screen.getByRole("button", { name: "Test 1 guardrail" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test 1 guardrails" })).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-prompt form and the added custom prompt", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: "添加" }));

    expect(screen.getByPlaceholderText("输入测试提示词...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your test prompt...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "应失败" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Should Fail" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "应通过" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Should Pass" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("输入测试提示词..."), { target: { value: "custom prompt" } });
    await user.click(screen.getAllByRole("button", { name: "添加" })[1]);

    expect(screen.getByText("自定义")).toBeInTheDocument();
    expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    expect(screen.getByText("自定义提示词")).toBeInTheDocument();
    expect(screen.queryByText("Custom Prompts")).not.toBeInTheDocument();
    expect(screen.getByText("本次会话添加的自定义提示词。")).toBeInTheDocument();
    expect(screen.queryByText("Custom prompts added this session.")).not.toBeInTheDocument();
    expect(screen.getByText("1 条提示词")).toBeInTheDocument();
    expect(screen.queryByText("1 prompts")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选本类" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select all" })).not.toBeInTheDocument();
    expect(screen.getByText("应失败")).toBeInTheDocument();
    expect(screen.getByLabelText("删除")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete")).not.toBeInTheDocument();
  });

  it("renders the Chinese CSV upload chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await openCsvPanel(user);

    expect(screen.getByText("上传 CSV 数据集")).toBeInTheDocument();
    expect(screen.queryByText("Upload CSV Dataset")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Download Template/ })).not.toBeInTheDocument();
    expect(screen.getByText("必填列：")).toBeInTheDocument();
    expect(screen.queryByText("Required columns:")).not.toBeInTheDocument();
    expect(screen.getByText("（fail 或 pass）")).toBeInTheDocument();
    expect(screen.queryByText("(fail or pass)")).not.toBeInTheDocument();
    expect(screen.getByText("可选列：")).toBeInTheDocument();
    expect(screen.queryByText("Optional columns:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择 CSV 文件" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Choose CSV file/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese CSV validation errors", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = renderCompliance();
    await openCsvPanel(user);

    fireEvent.change(csvInput(container), { target: { files: [new File(["x"], "data.txt", { type: "text/plain" })] } });
    expect(await screen.findByText("请上传 .csv 文件。")).toBeInTheDocument();
    expect(screen.queryByText("Please upload a .csv file.")).not.toBeInTheDocument();

    const oversized = csvFile();
    Object.defineProperty(oversized, "size", { value: 6 * 1024 * 1024 });
    fireEvent.change(csvInput(container), { target: { files: [oversized] } });
    expect(await screen.findByText("文件过大（最大 5 MB）。")).toBeInTheDocument();
    expect(screen.queryByText("File too large (max 5 MB).")).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) => config.complete?.({ data: [], meta: { fields: [] } });
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(await screen.findByText("CSV 文件为空。")).toBeInTheDocument();
    expect(screen.queryByText("CSV file is empty.")).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) => config.complete?.({ data: [{ foo: "bar" }], meta: { fields: ["foo"] } });
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(
      await screen.findByText(
        "缺少必填列：prompt, expected_result。必需：prompt、expected_result。可选：framework、category。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Missing required columns/)).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) =>
      config.complete?.({ data: [{ expected_result: "fail" }], meta: { fields: ["prompt", "expected_result"] } });
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(await screen.findByText("第 2 行：缺少提示词文本")).toBeInTheDocument();
    expect(screen.queryByText("Row 2: missing prompt text")).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) =>
      config.complete?.({
        data: [{ prompt: "hello", expected_result: "maybe" }],
        meta: { fields: ["prompt", "expected_result"] },
      });
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(
      await screen.findByText('第 2 行：expected_result 必须为 "fail" 或 "pass"，实际为 "maybe"'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/expected_result must be/)).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) =>
      config.complete?.({
        data: Array.from({ length: 6 }, () => ({ prompt: "hello", expected_result: "maybe" })),
        meta: { fields: ["prompt", "expected_result"] },
      });
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(await screen.findByText("...以及另外 1 个错误", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("...and 1 more errors", { exact: false })).not.toBeInTheDocument();

    mockPapa.parseImpl = (config) => config.error?.();
    fireEvent.change(csvInput(container), { target: { files: [csvFile()] } });
    expect(await screen.findByText("解析 CSV 文件失败。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to parse CSV file.")).not.toBeInTheDocument();
  });

  it("renders the Chinese CSV-uploaded library and the batch result chrome", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = renderCompliance();

    await uploadCsv(user, container, [
      { prompt: "p1", expected_result: "fail" },
      { prompt: "p2", expected_result: "pass" },
      { prompt: "p3", expected_result: "pass" },
      { prompt: "p4", expected_result: "fail" },
    ]);

    expect(await screen.findByText("CSV 上传")).toBeInTheDocument();
    expect(screen.queryByText("CSV Upload")).not.toBeInTheDocument();
    expect(screen.getByText("上传的提示词")).toBeInTheDocument();
    expect(screen.queryByText("Uploaded Prompts")).not.toBeInTheDocument();
    expect(screen.getByText("从 CSV 上传的提示词 — 上传的提示词。")).toBeInTheDocument();
    expect(screen.queryByText("Prompts uploaded from CSV — Uploaded Prompts.")).not.toBeInTheDocument();

    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockResolvedValue({ results: batchResults });
    await user.click(screen.getByRole("button", { name: "模拟 (4)" }));

    expect(await screen.findByText("结果")).toBeInTheDocument();
    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export CSV/ })).not.toBeInTheDocument();
    expect(screen.getAllByTitle("本应拦截但被放行的内容")[0]).toBeInTheDocument();
    expect(screen.queryAllByTitle("Allowed content that should have been blocked")).toHaveLength(0);
    expect(screen.getAllByTitle("本应放行但被拦截的内容")[0]).toBeInTheDocument();
    expect(screen.queryAllByTitle("Blocked content that should have been allowed")).toHaveLength(0);
    expect(screen.getByText("1 个漏报")).toBeInTheDocument();
    expect(screen.queryByText("1 FN")).not.toBeInTheDocument();
    expect(screen.getByText("1 个误报")).toBeInTheDocument();
    expect(screen.queryByText("1 FP")).not.toBeInTheDocument();
    expect(screen.getByText("全部 (4)")).toBeInTheDocument();
    expect(screen.queryByText("all (4)")).not.toBeInTheDocument();
    expect(screen.getByText("匹配 (2)")).toBeInTheDocument();
    expect(screen.queryByText("matches (2)")).not.toBeInTheDocument();
    expect(screen.getByText("不匹配 (2)")).toBeInTheDocument();
    expect(screen.queryByText("mismatches (2)")).not.toBeInTheDocument();
    expect(screen.getByText("待处理 (0)")).toBeInTheDocument();
    expect(screen.queryByText("pending (0)")).not.toBeInTheDocument();
    expect(screen.getByText("总计")).toBeInTheDocument();
    expect(screen.queryByText("total")).not.toBeInTheDocument();
    expect(screen.getByText("正确")).toBeInTheDocument();
    expect(screen.queryByText("correct")).not.toBeInTheDocument();
    expect(screen.getByText("漏报")).toBeInTheDocument();
    expect(screen.queryByText("false negative")).not.toBeInTheDocument();
    expect(screen.getByText("误报")).toBeInTheDocument();
    expect(screen.queryByText("false positive")).not.toBeInTheDocument();
    expect(screen.getByText("得分")).toBeInTheDocument();
    expect(screen.queryByText("Score")).not.toBeInTheDocument();
    expect(screen.getAllByText("预期拦截")[0]).toBeInTheDocument();
    expect(screen.queryAllByText("Expect Block")).toHaveLength(0);
    expect(screen.getAllByText("预期放行")[0]).toBeInTheDocument();
    expect(screen.queryAllByText("Expect Allow")).toHaveLength(0);
    expect(screen.getAllByText("✓ 匹配")[0]).toBeInTheDocument();
    expect(screen.queryAllByText("✓ Match")).toHaveLength(0);
    expect(screen.getAllByText("✗ 差距")[0]).toBeInTheDocument();
    expect(screen.queryAllByText("✗ Gap")).toHaveLength(0);

    const expandButtons = screen.getAllByLabelText("展开");
    expect(screen.queryAllByLabelText("Expand")).toHaveLength(0);
    await user.click(expandButtons[0]);
    await user.click(expandButtons[2]);
    await user.click(expandButtons[3]);

    expect(screen.getAllByLabelText("收起")[0]).toBeInTheDocument();
    expect(screen.queryAllByLabelText("Collapse")).toHaveLength(0);
    expect(screen.getAllByText("触发来源：")[0]).toBeInTheDocument();
    expect(screen.queryByText("Triggered by:")).not.toBeInTheDocument();
    expect(screen.getAllByText("结论：")[0]).toBeInTheDocument();
    expect(screen.queryByText("Verdict:")).not.toBeInTheDocument();
    expect(screen.getAllByText("处理正确")[0]).toBeInTheDocument();
    expect(screen.queryByText("Correctly handled")).not.toBeInTheDocument();
    expect(screen.getByText("差距 — 本应被拦截")).toBeInTheDocument();
    expect(screen.queryByText("Gap — should have been blocked")).not.toBeInTheDocument();
    expect(screen.getByText("误报 — 被错误拦截")).toBeInTheDocument();
    expect(screen.queryByText("False positive — incorrectly blocked")).not.toBeInTheDocument();
    expect(screen.getByText("LLM 响应：")).toBeInTheDocument();
    expect(screen.queryByText("LLM response:")).not.toBeInTheDocument();
    expect(screen.getByText("returned text")).toBeInTheDocument();
  });

  it("renders the Chinese empty batch results", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    await user.click(screen.getByRole("button", { name: "批量结果" }));

    expect(screen.getByText("选择提示词并点击“模拟”以运行批量合规测试。")).toBeInTheDocument();
    expect(
      screen.queryByText("Select prompts and click Simulate to run batch compliance tests."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese running chrome while a batch is in flight", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = renderCompliance();
    await uploadCsv(user, container, [{ prompt: "p1", expected_result: "fail" }]);

    let release: (value: unknown) => void = () => {};
    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    await user.click(screen.getByRole("button", { name: "模拟 (1)" }));

    expect(await screen.findByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Stop/ })).not.toBeInTheDocument();
    expect(screen.getByText("运行中...")).toBeInTheDocument();
    expect(screen.queryByText("Running...")).not.toBeInTheDocument();

    release({ results: [] });
  });

  it("renders the Chinese quick-test allowed response from a model", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance({ backendMode: "chat_completions", fixedModel: "gpt-4" });

    fireEvent.change(screen.getByPlaceholderText("输入要测试的文本..."), { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: "测试" }));

    expect(await screen.findByText("已放行 — 已收到模型响应。")).toBeInTheDocument();
    expect(screen.queryByText("Allowed — model response received.")).not.toBeInTheDocument();
    expect(screen.getByText("已放行")).toBeInTheDocument();
    expect(screen.queryByText("Allowed")).not.toBeInTheDocument();
    expect(screen.getByText("返回内容：", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("Returned:", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the Chinese quick-test blocked and allowed verdicts", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      inputs: { texts: ["processed"] },
      guardrail_errors: [{ guardrail_name: "g1", message: "blocked msg" }],
    });
    fireEvent.change(screen.getByPlaceholderText("输入要测试的文本..."), { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: "测试" }));

    expect(await screen.findByText("已拦截 — g1: blocked msg")).toBeInTheDocument();
    expect(screen.queryByText("Blocked — g1: blocked msg")).not.toBeInTheDocument();
    expect(screen.getByText("已拦截")).toBeInTheDocument();
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();

    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      inputs: { texts: ["processed"] },
      guardrail_errors: [],
    });
    fireEvent.change(screen.getByPlaceholderText("输入要测试的文本..."), { target: { value: "hello again" } });
    await user.click(screen.getByRole("button", { name: "测试" }));

    expect(await screen.findByText("已放行 — 未检测到策略或 Guardrail 违规。")).toBeInTheDocument();
    expect(screen.queryByText("Allowed — no policy or guardrail violations detected.")).not.toBeInTheDocument();
  });

  it("renders the Chinese quick-test error", async () => {
    const user = userEvent.setup({ delay: null });
    renderCompliance();

    (testPoliciesAndGuardrails as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("kaboom"));
    fireEvent.change(screen.getByPlaceholderText("输入要测试的文本..."), { target: { value: "hello" } });
    await user.click(screen.getByRole("button", { name: "测试" }));

    expect(await screen.findByText("错误：kaboom")).toBeInTheDocument();
    expect(screen.queryByText("Error: kaboom")).not.toBeInTheDocument();
  });
});
