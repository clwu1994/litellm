import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { type GuardrailFormValues } from "../GuardrailFormField";
import LLMJudgeFields from "./LLMJudgeFields";

const Harness: React.FC = () => {
  const form = useForm<GuardrailFormValues>();
  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <LLMJudgeFields availableModels={["gpt-5"]} control={form.control} />
      <button type="submit">save</button>
    </form>
  );
};

const WeightHarness: React.FC = () => {
  const form = useForm<GuardrailFormValues>({
    defaultValues: { criteria: [{ name: "Accuracy", weight: 60, description: "check" }] },
  });
  return <LLMJudgeFields availableModels={["gpt-5"]} control={form.control} />;
};

/* eslint-disable testing-library/no-node-access -- The hint trigger is an icon with no accessible name, so reaching its portal needs the DOM */
const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const fieldLabel = screen.getAllByText(label).find((element) => element.closest("label"));
  const trigger = fieldLabel?.closest("label")?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("LLMJudgeFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese judge chrome, hints and failure options and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    expect(screen.getByText(/每次 LLM 响应后/)).toBeInTheDocument();
    expect(screen.getAllByText("评判模型").length).toBeGreaterThan(0);
    expect(screen.getByText(/会依据你的标准对其评分（0–100）/)).toBeInTheDocument();
    expect(screen.getByLabelText("评判模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.getByText("通过的最低分数")).toBeInTheDocument();
    expect(screen.getByText("失败时")).toBeInTheDocument();
    expect(screen.getByText("评判标准")).toBeInTheDocument();
    expect(screen.getByText("权重")).toBeInTheDocument();
    expect(screen.getByText("添加标准")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除标准" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("标准名称（例如 Policy accuracy）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("评判模型应针对此标准检查什么？")).toBeInTheDocument();
    expect(screen.getByText(/权重合计：100%/)).toBeInTheDocument();

    await hoverHint(user, "评判模型");
    expect(await screen.findByText(/读取并评分每条响应的 LLM/)).toBeInTheDocument();
    expect(screen.queryByText(/The LLM that reads each response and grades it/)).not.toBeInTheDocument();
    await hoverHint(user, "通过的最低分数");
    expect(await screen.findByText(/若各标准得分的加权平均分低于此值/)).toBeInTheDocument();
    expect(
      screen.queryByText(/0–100\. If the weighted average of criterion scores falls below this/),
    ).not.toBeInTheDocument();
    await hoverHint(user, "失败时");
    expect(
      await screen.findByText("阻止：分数过低时返回 HTTP 422。记录日志：记录结果但放行响应。"),
    ).toBeInTheDocument();
    await hoverHint(user, "评判标准");
    expect(await screen.findByText(/每条标准都是评判模型要检查的内容/)).toBeInTheDocument();
    expect(screen.queryByText(/Each criterion is something the judge checks/)).not.toBeInTheDocument();
    await hoverHint(user, "权重");
    expect(await screen.findByText(/此标准在最终得分中所占的比重/)).toBeInTheDocument();
    expect(screen.queryByText(/How much this criterion counts toward the final score/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "失败时" }));
    expect(await screen.findByRole("option", { name: "阻止（返回 422）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "仅记录日志" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Block (return 422)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Log only" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByText("Judge Model")).not.toBeInTheDocument();
    expect(screen.queryByText("Minimum Score to Pass")).not.toBeInTheDocument();
    expect(screen.queryByText("Evaluation Criteria")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Criterion")).not.toBeInTheDocument();
    expect(screen.queryByText("Weights total: 100%")).not.toBeInTheDocument();
    expect(screen.queryByText("On Failure")).not.toBeInTheDocument();
    expect(screen.queryByText("Weight")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove criterion" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Criterion name (e.g. Policy accuracy)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("What should the judge check for this criterion?")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Block: return HTTP 422 when the score is too low. Log: record the result but let the response through.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/After each LLM response/)).not.toBeInTheDocument();
  });

  it("renders the Chinese judge-model empty state and validation and the weight total states", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    const modelInput = screen.getByPlaceholderText("选择模型");
    await user.click(modelInput);
    await user.type(modelInput, "zzz");
    expect(await screen.findByText("没有匹配的模型")).toBeInTheDocument();
    expect(screen.queryByText("No matching models")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.clear(screen.getByPlaceholderText("e.g. 50"));
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(await screen.findByText("请选择评判模型")).toBeInTheDocument();
    expect(await screen.findByText("请输入标准名称")).toBeInTheDocument();
    expect(await screen.findByText("描述要检查的内容")).toBeInTheDocument();
    expect(await screen.findByText("请输入权重")).toBeInTheDocument();
    expect(screen.queryByText("Select a judge model")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter criterion name")).not.toBeInTheDocument();
    expect(screen.queryByText("Describe what to check")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter weight")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid weight total and hides the English one", () => {
    render(<WeightHarness />);

    expect(screen.getByText(/权重合计：60%/)).toBeInTheDocument();
    expect(screen.getByText(/合计必须为 100%/)).toBeInTheDocument();
    expect(screen.queryByText(/must add up to 100%/)).not.toBeInTheDocument();
  });

  it("adds a criterion through the Chinese add button", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "添加标准" }));

    expect(screen.getAllByPlaceholderText("标准名称（例如 Policy accuracy）")).toHaveLength(2);
    expect(screen.queryByText("Add Criterion")).not.toBeInTheDocument();
  });
});
