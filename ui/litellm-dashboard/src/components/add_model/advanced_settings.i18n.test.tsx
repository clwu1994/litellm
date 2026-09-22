import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MountedFormProvider,
  useMountRegistry,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import i18n from "@/i18n/bootstrapI18n";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";
import AdvancedSettings from "./advanced_settings";

dayjs.extend(utc);

const mockUsePtuCostAttributionEnabled = vi.fn();

vi.mock("@/app/(dashboard)/hooks/uiSettings/usePtuCostAttributionEnabled", () => ({
  usePtuCostAttributionEnabled: () => mockUsePtuCostAttributionEnabled(),
}));

vi.mock("../networking", async () => {
  const actual = await vi.importActual<typeof import("../networking")>("../networking");
  return { ...actual, vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }) };
});

const PASSTHROUGH_HINT = "允许在 pass through 路由中使用这些凭证。了解更多";
const PASS_JSON_INTRO = "传入 litellm 支持参数的 JSON litellm.completion() call";

interface HarnessProps {
  readonly ptu: boolean;
}

const seedPtu = (form: ReturnType<typeof useForm<MountedFormValues>>) => () => {
  form.setValue("ptu_count", "15");
  form.setValue("ptu_effective_from", dayjs.utc("2026-09-01T00:00:00Z"));
  form.setValue("ptu_effective_to", dayjs.utc("2026-08-01T00:00:00Z"));
};

const Harness: React.FC<HarnessProps> = ({ ptu }) => {
  const form = useForm<MountedFormValues>({ mode: "onChange" });
  const registry = useMountRegistry();

  return (
    <FormProvider {...form}>
      <MountedFormProvider value={{ control: form.control, registry }}>
        <AdvancedSettings
          showAdvancedSettings={true}
          setShowAdvancedSettings={() => {}}
          guardrailsList={[]}
          tagsList={{}}
          accessToken="test-token"
        />
        <button type="button" onClick={() => void form.trigger("input_cost_per_token")}>
          validate-input-cost
        </button>
        <button type="button" onClick={() => void form.trigger("litellm_extra_params")}>
          validate-json
        </button>
        <button type="button" onClick={() => void form.trigger("ptu_count")}>
          validate-ptu-count
        </button>
        <button type="button" onClick={() => void form.trigger("cost_per_ptu_per_hour")}>
          validate-ptu-rate
        </button>
        <button type="button" onClick={() => void form.trigger("ptu_effective_from")}>
          validate-ptu-from
        </button>
        <button type="button" onClick={() => void form.trigger("ptu_effective_to")}>
          validate-ptu-to
        </button>
        <button type="button" onClick={seedPtu(form)}>
          seed-ptu
        </button>
        <span data-testid="ptu-enabled">{String(ptu)}</span>
      </MountedFormProvider>
    </FormProvider>
  );
};

const openAdvanced = async (ptu = false) => {
  mockUsePtuCostAttributionEnabled.mockReturnValue(ptu);
  const user = userEvent.setup();
  render(<Harness ptu={ptu} />);
  await user.click(screen.getByText("高级设置"));
  return user;
};

describe("AdvancedSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese heading and custom pricing label", async () => {
    await openAdvanced();

    expect(screen.getByText("高级设置")).toBeInTheDocument();
    expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
    expect(screen.getByText("自定义定价")).toBeInTheDocument();
    expect(screen.queryByText("Custom Pricing")).not.toBeInTheDocument();
  });

  it("renders the Chinese knowledge base, guardrail and tag labels, helps and placeholders", async () => {
    const user = await openAdvanced();

    expect(screen.getByText("已附加的知识库（RAG）")).toBeInTheDocument();
    expect(screen.queryByText("Attached Knowledge Bases (RAG)")).not.toBeInTheDocument();
    expect(
      screen.getByText("选择要附加的向量存储。对此模型的请求会自动将其用于 RAG。可在“工具 > 向量存储”中设置向量存储。"),
    ).toBeInTheDocument();
    expect(await screen.findByPlaceholderText("选择知识库（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select knowledge bases (optional)")).not.toBeInTheDocument();

    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("选择现有 guardrails。前往“Guardrails”标签页创建新的 guardrails。")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入 guardrails")).toBeInTheDocument();

    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入标签")).toBeInTheDocument();

    await user.click(screen.getByPlaceholderText("选择或输入 guardrails"));
    expect(await screen.findByText("输入以添加 guardrail")).toBeInTheDocument();
    expect(screen.queryByText("Type to add a guardrail")).not.toBeInTheDocument();
  });

  it("renders the Chinese tag empty state inside the open listbox", async () => {
    const user = await openAdvanced();

    await user.click(screen.getByPlaceholderText("选择或输入标签"));

    expect(await screen.findByText("输入以添加标签")).toBeInTheDocument();
    expect(screen.queryByText("Type to add a tag")).not.toBeInTheDocument();
  });

  it("renders the Chinese knowledge base and guardrail tooltips inside the open state", async () => {
    const user = await openAdvanced();

    await user.hover(findTooltipTriggerBeside(screen.getByText("已附加的知识库（RAG）")));
    expect(
      await screen.findByText("用于 RAG 的向量存储。对此模型的每次请求都会自动从这些知识库中检索上下文。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Vector stores to use for RAG. Every request to this model will automatically retrieve context from these knowledge bases.",
      ),
    ).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("Guardrails")));
    expect(await screen.findByText("为此密钥应用安全 guardrails，以过滤内容或执行策略")).toBeInTheDocument();
    expect(
      screen.queryByText("Apply safety guardrails to this key to filter content or enforce policies"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese pass-through, cache control, params and model info labels", async () => {
    const user = await openAdvanced();

    expect(screen.getByText("用于 pass through 路由")).toBeInTheDocument();
    expect(screen.queryByText("Use in pass through routes")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("用于 pass through 路由")));
    const line = (text: string) => (_, element: Element | null) =>
      element?.tagName === "DIV" && element.textContent === text;
    expect((await screen.findAllByText(line(PASSTHROUGH_HINT))).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(line("Allow using these credentials in pass through routes. Learn more")),
    ).not.toBeInTheDocument();

    expect(screen.getByText("缓存控制注入点")).toBeInTheDocument();
    expect(screen.queryByText("Cache Control Injection Points")).not.toBeInTheDocument();
    await user.hover(findTooltipTriggerBeside(screen.getByText("缓存控制注入点")));
    expect(
      await screen.findByText(
        "告诉 litellm 在哪里注入缓存控制检查点。你可以按角色指定（应用于该角色的所有消息），也可以按具体的消息索引指定。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Tell litellm where to inject cache control checkpoints. You can specify either by role (to apply to all messages of that role) or by specific message index.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByText("LiteLLM 参数")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Params")).not.toBeInTheDocument();
    await user.hover(findTooltipTriggerBeside(screen.getByText("LiteLLM 参数")));
    expect(await screen.findByText("用于发起 litellm.completion() 调用的可选 litellm 参数。")).toBeInTheDocument();
    expect(
      screen.queryByText("Optional litellm params used for making a litellm.completion() call."),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === PASS_JSON_INTRO),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "Pass JSON of litellm supported params litellm.completion() call",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByText("模型信息")).toBeInTheDocument();
    expect(screen.queryByText("Model Info")).not.toBeInTheDocument();
    await user.hover(findTooltipTriggerBeside(screen.getByText("模型信息")));
    expect(await screen.findByText("可选的模型信息参数。调用 `/model/info` endpoint 时返回。")).toBeInTheDocument();
    expect(
      screen.queryByText("Optional model info params. Returned when calling `/model/info` endpoint."),
    ).not.toBeInTheDocument();
  });

  it("renders every Chinese PTU field label and hint when PTU cost attribution is enabled", async () => {
    const user = await openAdvanced(true);

    for (const label of [
      "PTU 数量",
      "计算出的每 PTU/小时费用（USD）",
      "PTU 生效起始时间（UTC）",
      "PTU 生效结束时间（UTC）",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("PTU Count")).not.toBeInTheDocument();
    expect(screen.queryByText("Calculated Cost per PTU / Hour (USD)")).not.toBeInTheDocument();
    expect(screen.queryByText("PTU Effective From (UTC)")).not.toBeInTheDocument();
    expect(screen.queryByText("PTU Effective To (UTC)")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("PTU 数量")));
    expect(
      await screen.findByText("此部署的预置吞吐单元。与“每 PTU/小时的费用”和团队一起设置，以归集固定的每日成本。"),
    ).toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("计算出的每 PTU/小时费用（USD）")));
    expect(
      await screen.findByText("固定成本 = PTU 数量 * 此费率 * 活跃小时数，归集到部署所属团队。"),
    ).toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("PTU 生效起始时间（UTC）")));
    expect(
      await screen.findByText(
        "PTU 窗口的起始时间，设置 PTU 数量时必填。固定成本在窗口内按小时累计；在 23:00 开启的窗口当天会收取一小时费用。",
      ),
    ).toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("PTU 生效结束时间（UTC）")));
    expect(await screen.findByText("PTU 窗口的可选结束时间（不含）。留空表示不设结束时间。")).toBeInTheDocument();
    expect(
      screen.queryByText("Optional end of the PTU window (exclusive). Leave blank for open-ended."),
    ).not.toBeInTheDocument();
  });

  it("renders every Chinese custom pricing label, hint and placeholder", async () => {
    const user = await openAdvanced();
    await user.click(screen.getByRole("switch", { name: "自定义定价" }));

    expect(screen.getByText("定价模式")).toBeInTheDocument();
    expect(screen.queryByText("Pricing Model")).not.toBeInTheDocument();

    await user.click(screen.getByText("每百万 tokens"));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("每秒")).toBeInTheDocument();
    expect(within(listbox).queryByText("Per Second")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.getByText("输入成本（每 100 万 tokens）")).toBeInTheDocument();
    expect(screen.queryByText("Input Cost (per 1M tokens)")).not.toBeInTheDocument();
    expect(screen.getByText("输出成本（每 100 万 tokens）")).toBeInTheDocument();
    expect(screen.queryByText("Output Cost (per 1M tokens)")).not.toBeInTheDocument();
    expect(screen.getByText("缓存读取成本（每 100 万 tokens）")).toBeInTheDocument();
    expect(screen.getByText("缓存写入成本（每 100 万 tokens）")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("留空则默认为输入成本").length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText("Defaults to Input Cost if blank")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("缓存读取成本（每 100 万 tokens）")));
    expect(await screen.findByText("留空则默认为输入成本。")).toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(screen.getByText("缓存写入成本（每 100 万 tokens）")));
    expect(
      await screen.findByText("留空则默认为输入成本（未设置缓存写入费率时，后端会回退到 input_cost_per_token）。"),
    ).toBeInTheDocument();
  });

  it("renders the Chinese per-second cost label after switching the pricing model", async () => {
    const user = await openAdvanced();
    await user.click(screen.getByRole("switch", { name: "自定义定价" }));
    await user.click(screen.getByText("每百万 tokens"));
    await user.click(await screen.findByText("每秒"));

    expect(await screen.findByText("每秒成本")).toBeInTheDocument();
    expect(screen.queryByText("Cost Per Second")).not.toBeInTheDocument();
  });

  it("renders the Chinese number and JSON validation messages", async () => {
    const user = await openAdvanced();
    await user.click(screen.getByRole("switch", { name: "自定义定价" }));

    fireEvent.change(screen.getByLabelText("输入成本（每 100 万 tokens）"), { target: { value: "-5" } });
    await user.click(screen.getByRole("button", { name: "validate-input-cost" }));

    expect(await screen.findByText("请输入有效的正数")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a valid positive number")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("LiteLLM 参数"), { target: { value: "not json" } });
    await user.click(screen.getByRole("button", { name: "validate-json" }));

    expect(await screen.findByText("请输入有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Please enter valid JSON")).not.toBeInTheDocument();
  });

  it("renders the Chinese PTU validation messages", async () => {
    const user = await openAdvanced(true);

    fireEvent.change(screen.getByLabelText("PTU 数量"), { target: { value: "2.5" } });
    await user.click(screen.getByRole("button", { name: "validate-ptu-count" }));
    expect(await screen.findByText("PTU 数量必须是 1 到 1,000,000 之间的整数")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("计算出的每 PTU/小时费用（USD）"), { target: { value: "1000001" } });
    await user.click(screen.getByRole("button", { name: "validate-ptu-rate" }));
    expect(await screen.findByText("每 PTU/小时费用必须在 0 到 1,000,000 之间")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "seed-ptu" }));
    await user.click(screen.getByRole("button", { name: "validate-ptu-to" }));
    expect(await screen.findByText("PTU 生效结束时间必须晚于生效起始时间")).toBeInTheDocument();
  });

  it("renders the Chinese PTU pair and reserved-capacity validation messages", async () => {
    const user = await openAdvanced(true);

    fireEvent.change(screen.getByLabelText("PTU 数量"), { target: { value: "15" } });
    await user.click(screen.getByRole("button", { name: "validate-ptu-count" }));
    expect((await screen.findAllByText("PTU 数量和每 PTU/小时费用必须同时设置")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("switch", { name: "自定义定价" }));
    fireEvent.change(screen.getByLabelText("输入成本（每 100 万 tokens）"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "validate-input-cost" }));
    expect(await screen.findByText("PTU 部署按预留容量计费，因此此成本必须为 0 或留空")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "validate-ptu-from" }));
    expect(await screen.findByText("设置 PTU 数量时，必须填写 PTU 生效起始时间")).toBeInTheDocument();
  });
});
