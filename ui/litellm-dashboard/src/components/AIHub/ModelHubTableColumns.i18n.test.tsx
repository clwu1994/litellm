import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";

import { getModelHubTableColumns, ModelHubData } from "./ModelHubTableColumns";

const model = (overrides: Partial<ModelHubData> = {}): ModelHubData => ({
  model_group: "gpt-4o",
  providers: ["openai", "azure", "bedrock"],
  max_input_tokens: 128000,
  max_output_tokens: 16384,
  input_cost_per_token: 0.0000025,
  output_cost_per_token: 0.00001,
  mode: "chat",
  supports_parallel_function_calling: false,
  supports_vision: true,
  supports_function_calling: true,
  is_public_model_group: true,
  ...overrides,
});

const renderTable = (data: ModelHubData[]) => {
  const t = i18n.getFixedT(i18n.language, "modelHub");
  render(
    <DataTable
      data={data}
      columns={getModelHubTableColumns({ onModelClick: vi.fn(), t })}
      getRowId={(row, index) => row.model_group || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("ModelHubTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every column header in Chinese and hides the English originals", () => {
    renderTable([model()]);

    expectLocalized("公开模型名称", "Public Model Name");
    expectLocalized("提供商", "Provider");
    expectLocalized("模式", "Mode");
    expectLocalized("Token", "Tokens");
    expectLocalized("成本/1M", "Cost/1M");
    expectLocalized("功能", "Features");
    expectLocalized("公开", "Public");
    expectLocalized("操作", "Actions");
  });

  it("renders the public and private status badges in Chinese and hides the English originals", () => {
    renderTable([model(), model({ model_group: "private-model", is_public_model_group: false })]);

    expectLocalized("是", "Yes");
    expectLocalized("否", "No");
  });

  it("keeps model names, provider names, modes and capability names in English", () => {
    renderTable([model()]);

    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("chat")).toBeInTheDocument();
    expect(screen.getByText("Vision")).toBeInTheDocument();
    expect(screen.getByText("Function Calling")).toBeInTheDocument();
  });

  it("renders the row actions menu in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable([model()]);

    await user.click(screen.getByLabelText("打开模型操作"));

    expect(await screen.findByText("查看详情")).toBeInTheDocument();
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(screen.getByText("复制模型名称")).toBeInTheDocument();
    expect(screen.queryByText("Copy model name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Open model actions")).not.toBeInTheDocument();
  });

  it("reports the copy confirmation in Chinese and not in English", async () => {
    const user = userEvent.setup();
    renderTable([model()]);

    await user.click(screen.getByLabelText("打开模型操作"));
    await user.click(await screen.findByTestId("model-hub-action-copy"));

    expect(toast.success).toHaveBeenCalledWith("已复制模型名称");
    expect(toast.success).not.toHaveBeenCalledWith("Model name copied");
  });
});
