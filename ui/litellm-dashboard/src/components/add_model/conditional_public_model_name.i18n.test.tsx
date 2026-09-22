import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  MountedFormProvider,
  useMountRegistry,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import i18n from "@/i18n/bootstrapI18n";
import { findTooltipTriggerBeside } from "../../../tests/i18nTooltip";
import ConditionalPublicModelName from "./conditional_public_model_name";

const TOOLTIP_INTRO = "你在调用 LiteLLM Proxy 的 API 时指定的名称";
const TOOLTIP_EXAMPLE = "示例：如果你将公开模型命名为 example-name，并选择 openai/qwen-plus-latest 作为 LiteLLM 模型";
const TOOLTIP_USAGE = '用法：你使用 model = "example-name" 向 LiteLLM proxy 发起 API 调用';
const TOOLTIP_RESULT = "结果：LiteLLM 会将 qwen-plus-latest 发送给提供商";

const Harness: React.FC<{ readonly defaultValues: MountedFormValues }> = ({ defaultValues }) => {
  const form = useForm<MountedFormValues>({ mode: "onChange", defaultValues });
  const registry = useMountRegistry();

  return (
    <FormProvider {...form}>
      <MountedFormProvider value={{ control: form.control, registry }}>
        <ConditionalPublicModelName />
        <button type="button" onClick={() => void form.trigger("model_mappings")}>
          validate
        </button>
      </MountedFormProvider>
    </FormProvider>
  );
};

const renderMappings = (defaultValues: MountedFormValues) => render(<Harness defaultValues={defaultValues} />);

describe("ConditionalPublicModelName Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese section label and column headers", () => {
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "gpt-4", litellm_model: "gpt-4" }] });

    expect(screen.getByText("模型映射")).toBeInTheDocument();
    expect(screen.queryByText("Model Mappings")).not.toBeInTheDocument();
    expect(screen.getByText("公开模型名称")).toBeInTheDocument();
    expect(screen.queryByText("Public Model Name")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 模型名称")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Model Name")).not.toBeInTheDocument();
  });

  it("renders the Chinese section tooltip inside the open state", async () => {
    const user = userEvent.setup();
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "gpt-4", litellm_model: "gpt-4" }] });

    await user.hover(findTooltipTriggerBeside(screen.getByText("模型映射")));

    expect(await screen.findByText("将公开模型名称映射到 LiteLLM 模型名称以实现负载均衡")).toBeInTheDocument();
    expect(
      screen.queryByText("Map public model names to LiteLLM model names for load balancing"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese LiteLLM model name tooltip inside the open state", async () => {
    const user = userEvent.setup();
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "gpt-4", litellm_model: "gpt-4" }] });

    await user.hover(findTooltipTriggerBeside(screen.getByText("LiteLLM 模型名称")));

    expect(await screen.findByText("LiteLLM 将发送给 LLM API 的模型名称")).toBeInTheDocument();
    expect(screen.queryByText("The model name LiteLLM will send to the LLM API")).not.toBeInTheDocument();
  });

  it("renders every Chinese line of the public name tooltip inside the open state", async () => {
    const user = userEvent.setup();
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "gpt-4", litellm_model: "gpt-4" }] });

    const trigger = findTooltipTriggerBeside(screen.getByText("公开模型名称"));
    await user.hover(trigger);

    const line = (text: string) => (_: string, element: Element | null) =>
      element?.tagName === "DIV" && element.textContent === text;
    expect(await screen.findByText(line(TOOLTIP_INTRO))).toBeInTheDocument();
    expect(screen.getByText(line(TOOLTIP_EXAMPLE))).toBeInTheDocument();
    expect(screen.getByText(line(TOOLTIP_USAGE))).toBeInTheDocument();
    expect(screen.getByText(line(TOOLTIP_RESULT))).toBeInTheDocument();
    expect(screen.queryByText(line("The name you specify in your API calls to LiteLLM Proxy"))).not.toBeInTheDocument();
    expect(screen.queryByText(line("LiteLLM sends qwen-plus-latest to the provider"))).not.toBeInTheDocument();
  });

  it("renders the Chinese at-least-one-mapping validation message", async () => {
    const user = userEvent.setup();
    renderMappings({ model: [], model_mappings: [] });

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("至少需要一个模型映射")).toBeInTheDocument();
    expect(screen.queryByText("At least one model mapping is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese valid-public-names validation message", async () => {
    const user = userEvent.setup();
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "", litellm_model: "gpt-4" }] });

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("所有模型映射都必须具有有效的公开名称")).toBeInTheDocument();
    expect(screen.queryByText("All model mappings must have valid public names")).not.toBeInTheDocument();
  });

  it("keeps the English column header out of the Chinese table", () => {
    renderMappings({ model: ["gpt-4"], model_mappings: [{ public_name: "gpt-4", litellm_model: "gpt-4" }] });

    const table = screen.getByRole("table");
    expect(within(table).queryByText("Public Model Name")).not.toBeInTheDocument();
    expect(within(table).getByText("公开模型名称")).toBeInTheDocument();
  });
});
