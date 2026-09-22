import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MountedFormProvider,
  useMountRegistry,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import i18n from "@/i18n/bootstrapI18n";
import { Providers } from "../provider_info_helpers";
import ProviderSpecificFields from "./provider_specific_fields";

const mockUseProviderFields = vi.fn();

vi.mock("@/app/(dashboard)/hooks/providers/useProviderFields", () => ({
  useProviderFields: () => mockUseProviderFields(),
}));

const AZURE_BASE_MODEL_HELP = "你的 azure 部署实际使用的模型。用于准确的成本跟踪。从此处选择名称";

const providerMetadata = [
  {
    provider: "OpenAI",
    provider_display_name: Providers.OpenAI,
    litellm_provider: "openai",
    credential_fields: [
      { key: "api_key", label: "OpenAI API Key", field_type: "password", required: true },
      { key: "api_base", label: "API Base", field_type: "text" },
    ],
  },
  {
    provider: "Vertex_AI",
    provider_display_name: Providers.Vertex_AI,
    litellm_provider: "vertex_ai",
    credential_fields: [{ key: "vertex_credentials", label: "Vertex Credentials", field_type: "upload" }],
  },
  {
    provider: "Azure",
    provider_display_name: Providers.Azure,
    litellm_provider: "azure",
    credential_fields: [{ key: "base_model", label: "Base Model", field_type: "text" }],
  },
];

interface HarnessProps {
  readonly selectedProvider: string;
  readonly triggerName?: string;
}

const Harness: React.FC<HarnessProps> = ({ selectedProvider, triggerName }) => {
  const form = useForm<MountedFormValues>({ mode: "onChange" });
  const registry = useMountRegistry();

  return (
    <FormProvider {...form}>
      <MountedFormProvider value={{ control: form.control, registry }}>
        <ProviderSpecificFields selectedProvider={selectedProvider} />
        <button type="button" onClick={() => void form.trigger(triggerName ?? "api_key")}>
          validate
        </button>
      </MountedFormProvider>
    </FormProvider>
  );
};

const renderFields = (props: HarnessProps) => render(<Harness {...props} />);

describe("ProviderSpecificFields Chinese copy", () => {
  beforeEach(async () => {
    mockUseProviderFields.mockReturnValue({ data: providerMetadata, isLoading: false, error: null });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese required validation message for a required credential field", async () => {
    const user = userEvent.setup();
    renderFields({ selectedProvider: Providers.OpenAI });

    await user.click(screen.getByRole("button", { name: "validate" }));

    expect(await screen.findByText("必填")).toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the provider fields are loading", () => {
    mockUseProviderFields.mockReturnValue({ data: null, isLoading: true, error: null });
    renderFields({ selectedProvider: Providers.Anthropic });

    expect(screen.getByText("正在加载提供商字段...")).toBeInTheDocument();
    expect(screen.queryByText("Loading provider fields...")).not.toBeInTheDocument();
  });

  it("renders the Chinese upload button and Vertex help text", () => {
    renderFields({ selectedProvider: Providers.Vertex_AI });

    expect(screen.getByRole("button", { name: "点击上传" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Click to Upload" })).not.toBeInTheDocument();
    expect(screen.getByText("提供 gcp 服务账号（.json 文件）")).toBeInTheDocument();
    expect(screen.queryByText("Give a gcp service account(.json file)")).not.toBeInTheDocument();
  });

  it("renders the Chinese Azure base model help line", () => {
    renderFields({ selectedProvider: Providers.Azure });

    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === AZURE_BASE_MODEL_HELP),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "The actual model your azure deployment uses. Used for accurate cost tracking. Select name from here",
      ),
    ).not.toBeInTheDocument();
  });
});
