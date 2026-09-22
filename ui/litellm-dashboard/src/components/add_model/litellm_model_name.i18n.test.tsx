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
import { Providers } from "../provider_info_helpers";
import LiteLLMModelNameField from "./litellm_model_name";

interface HarnessProps {
  readonly selectedProvider: string | null;
  readonly providerModels?: string[];
  readonly defaultValues?: MountedFormValues;
}

const Harness: React.FC<HarnessProps> = ({ selectedProvider, providerModels = [], defaultValues }) => {
  const form = useForm<MountedFormValues>({ mode: "onChange", defaultValues });
  const registry = useMountRegistry();

  return (
    <FormProvider {...form}>
      <MountedFormProvider value={{ control: form.control, registry }}>
        <LiteLLMModelNameField
          selectedProvider={selectedProvider}
          providerModels={providerModels}
          getPlaceholder={() => "gpt-3.5-turbo"}
        />
        <button
          type="button"
          onClick={() => {
            void form.trigger("model");
            void form.trigger("custom_model_name");
          }}
        >
          validate
        </button>
      </MountedFormProvider>
    </FormProvider>
  );
};

const renderField = (props: HarnessProps) => render(<Harness {...props} />);

describe("LiteLLMModelNameField Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese label and the Chinese hint inside the open tooltip", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.OpenAI });

    const label = screen.getByText("LiteLLM 模型名称");
    expect(label).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Model Name(s)")).not.toBeInTheDocument();

    await user.hover(findTooltipTriggerBeside(label));

    expect(await screen.findByText("LiteLLM 将发送给 LLM API 的模型名称")).toBeInTheDocument();
    expect(screen.queryByText("The model name LiteLLM will send to the LLM API")).not.toBeInTheDocument();
  });

  it("renders the Chinese at-least-one-model validation message", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.OpenAI });

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("请至少输入一个模型。")).toBeInTheDocument();
    expect(screen.queryByText("Please enter at least one model.")).not.toBeInTheDocument();
  });

  it("renders the Chinese deployment-name validation message for Azure", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.Azure });

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("请输入部署名称。")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a deployment name.")).not.toBeInTheDocument();
  });

  it("renders the Chinese select-a-provider placeholder and the Chinese send note", () => {
    renderField({ selectedProvider: null });

    expect(screen.getByPlaceholderText("请先选择提供商")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a provider first")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 将发送给 LLM API 的模型名称")).toBeInTheDocument();
    expect(screen.queryByText("The model name LiteLLM will send to the LLM API")).not.toBeInTheDocument();
  });

  it("renders the Chinese model list placeholder and empty state inside the open listbox", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.OpenAI, providerModels: ["gpt-4"] });

    const input = screen.getByPlaceholderText("选择模型");
    expect(input).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models")).not.toBeInTheDocument();

    await user.click(input);
    await user.keyboard("zzz");
    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom and wildcard options inside the open listbox", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.OpenAI, providerModels: ["gpt-4"] });

    await user.click(screen.getByPlaceholderText("选择模型"));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).getByText("自定义模型名称（在下方输入）")).toBeInTheDocument();
    expect(within(listbox).queryByText("Custom Model Name (Enter below)")).not.toBeInTheDocument();
    expect(within(listbox).getByText("所有 OpenAI 模型（通配符）")).toBeInTheDocument();
    expect(within(listbox).queryByText("All OpenAI Models (Wildcard)")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom model name placeholder and validation", async () => {
    const user = userEvent.setup();
    renderField({ selectedProvider: Providers.OpenAI, defaultValues: { model: ["custom"] } });

    expect(screen.getByPlaceholderText("输入自定义模型名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter custom model name")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("请输入自定义模型名称。")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a custom model name.")).not.toBeInTheDocument();
  });

  it("renders the Chinese Azure deployment placeholder and note", () => {
    renderField({ selectedProvider: Providers.Azure, defaultValues: { model: ["custom"] } });

    expect(screen.getByPlaceholderText("输入 Azure 部署名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter Azure deployment name")).not.toBeInTheDocument();
    expect(
      screen.getByText("你的部署名称将保存为公开模型名称，LiteLLM 内部会使用 'azure/deployment-name'"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your deployment name will be saved as the public model name, and LiteLLM will use 'azure/deployment-name' internally",
      ),
    ).not.toBeInTheDocument();
  });
});
