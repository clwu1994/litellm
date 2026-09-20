import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import GuardrailTable from "./guardrail_table";
import { Guardrail, GuardrailDefinitionLocation } from "@/components/guardrails/types";

const baseProps = {
  isLoading: false,
  onDeleteClick: vi.fn(),
  onGuardrailClick: vi.fn(),
};

const makeGuardrail = (overrides: Partial<Guardrail> = {}): Guardrail => ({
  guardrail_id: "gr-1",
  guardrail_name: "PII Redaction",
  litellm_params: { guardrail: "presidio", mode: "pre_call", default_on: true },
  guardrail_info: null,
  created_at: "2021-01-01",
  updated_at: "2021-01-02",
  guardrail_definition_location: GuardrailDefinitionLocation.DB,
  ...overrides,
});

describe("GuardrailTable", () => {
  it("renders every column header", () => {
    render(<GuardrailTable guardrailsList={[]} {...baseProps} />);
    for (const header of ["Guardrail ID", "Name", "Provider", "Mode", "Default On", "Created At", "Updated At"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("renders the provider logo from the bundled guardrail logo map", () => {
    render(<GuardrailTable guardrailsList={[makeGuardrail()]} {...baseProps} />);
    const logo = screen.getByAltText("Presidio PII logo");
    expect(logo).toHaveAttribute("src", expect.stringContaining("microsoft_azure.svg"));
  });

  it("falls back to a letter avatar for an unknown provider slug", () => {
    const guardrail = makeGuardrail({
      litellm_params: { guardrail: "mystery_guard", mode: "pre_call", default_on: false },
    });
    render(<GuardrailTable guardrailsList={[guardrail]} {...baseProps} />);
    expect(screen.getByText("mystery_guard")).toBeInTheDocument();
    expect(screen.queryByAltText("mystery_guard logo")).not.toBeInTheDocument();
    expect(screen.getByText("m")).toBeInTheDocument();
  });

  it("renders a tag-based mode object instead of crashing the table", () => {
    const guardrail = makeGuardrail({
      litellm_params: {
        guardrail: "bedrock",
        mode: { tags: { "Service-Type: internal-service": "post_call" }, default: ["pre_call", "post_call"] },
        default_on: true,
      },
    });
    render(<GuardrailTable guardrailsList={[guardrail]} {...baseProps} />);
    expect(screen.getByText("pre_call, post_call (tag-based)")).toBeInTheDocument();
  });

  it("deletes a DB guardrail through the actions menu", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    const guardrail = makeGuardrail({ guardrail_id: "gr-9", guardrail_name: "Toxicity Filter" });
    render(<GuardrailTable guardrailsList={[guardrail]} {...baseProps} onDeleteClick={onDeleteClick} />);

    await user.click(screen.getByTestId("guardrail-actions-gr-9"));
    await user.click(await screen.findByTestId("guardrail-action-delete"));

    expect(onDeleteClick).toHaveBeenCalledWith("gr-9", "Toxicity Filter");
  });

  it("disables deletion for config guardrails so they cannot be removed from the dashboard", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    const guardrail = makeGuardrail({
      guardrail_id: "cfg-1",
      guardrail_name: "Config Guardrail",
      guardrail_definition_location: GuardrailDefinitionLocation.CONFIG,
    });
    render(<GuardrailTable guardrailsList={[guardrail]} {...baseProps} onDeleteClick={onDeleteClick} />);

    await user.click(screen.getByTestId("guardrail-actions-cfg-1"));
    const deleteItem = await screen.findByTestId("guardrail-action-delete");

    expect(deleteItem).toHaveAttribute("data-disabled");
    expect(onDeleteClick).not.toHaveBeenCalled();
  });
});

describe("GuardrailTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers, default badges and delete chrome and hides the English ones", async () => {
    const user = userEvent.setup();
    render(
      <GuardrailTable
        guardrailsList={[
          makeGuardrail(),
          makeGuardrail({
            guardrail_id: "gr-2",
            guardrail_name: "Second Guardrail",
            litellm_params: { guardrail: "presidio", mode: "pre_call", default_on: false },
          }),
        ]}
        {...baseProps}
      />,
    );

    for (const header of ["Guardrail ID", "名称", "提供商", "模式", "创建时间", "更新时间", "操作"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(screen.getByRole("columnheader", { name: "默认开启" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "默认开启" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "默认关闭" })).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Default On")).not.toBeInTheDocument();
    expect(screen.queryByText("Default Off")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("guardrail-actions-gr-1"));
    expect(screen.getAllByLabelText("打开 Guardrail 操作").length).toBeGreaterThan(0);
    expect(await screen.findByText("删除")).toBeInTheDocument();
    expect(screen.queryAllByLabelText("Open guardrail actions")).toHaveLength(0);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders the Chinese config-delete hint and hides the English one", async () => {
    const user = userEvent.setup();
    const guardrail = makeGuardrail({
      guardrail_id: "cfg-1",
      guardrail_definition_location: GuardrailDefinitionLocation.CONFIG,
    });
    render(<GuardrailTable guardrailsList={[guardrail]} {...baseProps} />);

    await user.click(screen.getByTestId("guardrail-actions-cfg-1"));
    const deleteItem = await screen.findByTestId("guardrail-action-delete");

    expect(deleteItem).toHaveAttribute("title", "Config Guardrail 在配置文件中定义，无法从仪表盘删除。");
    expect(deleteItem).not.toHaveAttribute(
      "title",
      "Config guardrails are defined in the config file and cannot be deleted from the dashboard.",
    );
  });

  it("uses the Chinese unnamed-guardrail fallback and hides the English one", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    render(
      <GuardrailTable
        guardrailsList={[makeGuardrail({ guardrail_id: "gr-x", guardrail_name: "" })]}
        {...baseProps}
        onDeleteClick={onDeleteClick}
      />,
    );

    await user.click(screen.getByTestId("guardrail-actions-gr-x"));
    await user.click(await screen.findByTestId("guardrail-action-delete"));

    expect(onDeleteClick).toHaveBeenCalledWith("gr-x", "未命名 Guardrail");
    expect(onDeleteClick).not.toHaveBeenCalledWith("gr-x", "Unnamed Guardrail");
  });

  it("renders the Chinese empty state and loading message and hides the English ones", () => {
    render(<GuardrailTable guardrailsList={[]} {...baseProps} />);

    expect(screen.getByText("还没有 Guardrail")).toBeInTheDocument();
    expect(screen.getByText("添加 Guardrail 即可开始过滤请求和响应。")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Add a guardrail to start filtering requests and responses.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message and hides the English one", () => {
    render(<GuardrailTable guardrailsList={[]} {...baseProps} isLoading />);

    expect(screen.getByText("正在加载 Guardrails…")).toBeInTheDocument();
    expect(screen.queryByText("Loading guardrails…")).not.toBeInTheDocument();
  });

  it("renders the Chinese tag-based mode suffix and hides the English one", () => {
    render(
      <GuardrailTable
        guardrailsList={[
          makeGuardrail({
            litellm_params: {
              guardrail: "bedrock",
              mode: { tags: { "Service-Type: internal-service": "post_call" }, default: ["pre_call", "post_call"] },
              default_on: true,
            },
          }),
        ]}
        {...baseProps}
      />,
    );

    expect(screen.getByText("pre_call, post_call (基于标签)")).toBeInTheDocument();
    expect(screen.queryByText("pre_call, post_call (tag-based)")).not.toBeInTheDocument();
  });
});
