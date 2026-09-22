import { screen, waitFor } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import {
  MountedFormProvider,
  useMountRegistry,
  type MountedFormValues,
} from "@/components/common_components/MountedFormField";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";

import { getOpenAPISchema } from "../networking";
import SchemaFormFields from "./check_openapi_schema";

vi.mock("../networking", () => ({ getOpenAPISchema: vi.fn() }));

const Harness: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const form = useForm<MountedFormValues>({ mode: "onChange" });
  const registry = useMountRegistry();
  return (
    <FormProvider {...form}>
      <MountedFormProvider value={{ control: form.control, registry }}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit(() => {})();
          }}
        >
          {children}
          <button type="submit">Submit</button>
        </form>
      </MountedFormProvider>
    </FormProvider>
  );
};

const schema = {
  components: {
    schemas: {
      Team: {
        required: ["name"],
        properties: {
          name: { type: "string" },
          count: { type: "number" },
          whole: { type: "integer" },
          enabled: { type: "boolean" },
          blocked: { type: "boolean" },
          max_budget: { type: "number" },
          budget_duration: { type: "string" },
          tpm_limit: { type: "number" },
          rpm_limit: { type: "number" },
          duration: { type: "string" },
          metadata: { type: "string", format: "json" },
          config: { type: "string", format: "json" },
          enforced_params: { type: "string", format: "json" },
          aliases: { type: "string", format: "json" },
          permissions: { type: "string" },
          key_alias: { type: "string" },
          tags: { type: "string" },
          models: { type: "string" },
          mode: { type: "string", enum: ["alpha", "beta"] },
        },
      },
      Other: {
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
};

const renderForm = () =>
  renderWithProviders(
    <Harness>
      <SchemaFormFields schemaComponent="Team" setValue={vi.fn()} />
    </Harness>,
  );

describe("SchemaFormFields Chinese copy", () => {
  beforeEach(async () => {
    vi.mocked(getOpenAPISchema).mockResolvedValue(schema as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese type help texts and hides the English originals", async () => {
    renderForm();

    expect(await screen.findByText("文本输入")).toBeInTheDocument();
    expect(screen.getByText("数字输入")).toBeInTheDocument();
    expect(screen.getByText("整数输入")).toBeInTheDocument();
    expect(screen.getByText("True/False 值")).toBeInTheDocument();
    expect(screen.queryByText("Text input")).not.toBeInTheDocument();
    expect(screen.queryByText("Numeric input")).not.toBeInTheDocument();
    expect(screen.queryByText("Whole number input")).not.toBeInTheDocument();
    expect(screen.queryByText("True/False value")).not.toBeInTheDocument();
  });

  it("renders the Chinese field-specific help texts and hides the English originals", async () => {
    renderForm();

    expect(await screen.findByText("输入最大预算（USD）（例如 100.50）")).toBeInTheDocument();
    expect(screen.getByText("选择预算重置的时间周期")).toBeInTheDocument();
    expect(screen.getByText("输入每分钟最大 Token 数（整数）")).toBeInTheDocument();
    expect(screen.getByText("输入每分钟最大请求数（整数）")).toBeInTheDocument();
    expect(screen.getByText("输入时长（例如 30s, 24h, 7d）")).toBeInTheDocument();
    expect(screen.getByText("输入以逗号分隔的权限字符串")).toBeInTheDocument();
    expect(screen.getByText("输入 true/false 或具体的阻止条件")).toBeInTheDocument();
    expect(screen.getByText("输入此密钥的唯一标识符")).toBeInTheDocument();
    expect(screen.getByText("输入以逗号分隔的标签字符串")).toBeInTheDocument();
    expect(screen.getByText("选择一个或多个模型名称")).toBeInTheDocument();

    expect(screen.queryByText("Enter maximum budget in USD (e.g., 100.50)")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a time period for budget reset")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter maximum tokens per minute (whole number)")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter maximum requests per minute (whole number)")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter duration (e.g., 30s, 24h, 7d)")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter comma-separated permission strings")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter true/false or specific block conditions")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a unique identifier for this key")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter comma-separated tag strings")).not.toBeInTheDocument();
    expect(screen.queryByText("Select one or more model names")).not.toBeInTheDocument();
  });

  it("renders the Chinese JSON help texts and hides the English originals", async () => {
    renderForm();

    expect(
      await screen.findByText(
        '输入包含键值对的 JSON 对象 示例：{"team": "research", "project": "nlp"} 必须是有效的 JSON 格式',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('以 JSON 对象输入配置 示例：{"setting": "value"} 必须是有效的 JSON 格式'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('以 JSON 对象输入参数 示例：{"param": "value"} 必须是有效的 JSON 格式'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('以 JSON 对象输入别名 示例：{"alias1": "value1", "alias2": "value2"} 必须是有效的 JSON 格式'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Must be valid JSON format/)).not.toBeInTheDocument();
  });

  it("renders the Chinese enum help text and hides the English original", async () => {
    renderForm();

    expect(await screen.findByText("从可用选项中选择 允许的值：alpha, beta")).toBeInTheDocument();
    expect(screen.queryByText(/Select from available options/)).not.toBeInTheDocument();
  });

  it("renders the Chinese placeholders and hides the English originals", async () => {
    renderForm();

    expect(await screen.findByPlaceholderText("例如：30s, 30h, 30d")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("以 JSON 输入")[0]).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter as JSON")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("eg: 30s, 30h, 30d")).not.toBeInTheDocument();
  });

  it("renders the Chinese schema error and hides the English original", async () => {
    vi.mocked(getOpenAPISchema).mockRejectedValue(new Error("boom"));
    renderForm();

    expect(await screen.findByText("错误：boom")).toBeInTheDocument();
    expect(screen.queryByText("Error: boom")).not.toBeInTheDocument();
  });

  it("renders the Chinese failed-to-fetch fallback and hides the English original", async () => {
    vi.mocked(getOpenAPISchema).mockRejectedValue("nope");
    renderForm();

    expect(await screen.findByText("错误：获取 schema 失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch schema")).not.toBeInTheDocument();
  });

  it("re-translates a failed fetch when the language changes", async () => {
    vi.mocked(getOpenAPISchema).mockRejectedValue("nope");
    renderForm();

    expect(await screen.findByText("错误：获取 schema 失败")).toBeInTheDocument();

    await i18n.changeLanguage("en");

    expect(await screen.findByText("Error: Failed to fetch schema")).toBeInTheDocument();
    expect(screen.queryByText("错误：获取 schema 失败")).not.toBeInTheDocument();
  });

  it("clears a failed fetch when a later fetch succeeds", async () => {
    vi.mocked(getOpenAPISchema).mockRejectedValue(new Error("boom"));
    const setValue = vi.fn();
    const { rerender } = renderWithProviders(
      <Harness>
        <SchemaFormFields schemaComponent="Team" setValue={setValue} />
      </Harness>,
    );
    expect(await screen.findByText("错误：boom")).toBeInTheDocument();

    vi.mocked(getOpenAPISchema).mockResolvedValue(schema as never);
    rerender(
      <Harness>
        <SchemaFormFields schemaComponent="Other" setValue={setValue} />
      </Harness>,
    );

    expect(await screen.findByText("文本输入")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("错误：boom")).not.toBeInTheDocument());
  });
});
