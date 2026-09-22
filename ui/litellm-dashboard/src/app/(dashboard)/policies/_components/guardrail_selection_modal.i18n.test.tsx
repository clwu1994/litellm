import React from "react";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import GuardrailSelectionModal from "./guardrail_selection_modal";

interface GuardrailDef {
  guardrail_name: string;
  guardrail_info: { description?: string };
  litellm_params: Record<string, unknown>;
}

const makeGuardrailDef = (
  name: string,
  description: string | null = "A guardrail description",
  litellmParams: Record<string, unknown> = {},
): GuardrailDef => ({
  guardrail_name: name,
  guardrail_info: description === null ? {} : { description },
  litellm_params: { guardrail: "presidio", mode: "pre_call", ...litellmParams },
});

const makeTemplate = (guardrailDefs: GuardrailDef[] = [], overrides: Record<string, unknown> = {}) => ({
  title: "Test Template",
  guardrailDefinitions: guardrailDefs,
  ...overrides,
});

const defaultProps = {
  visible: true,
  template: makeTemplate([makeGuardrailDef("guardrail-new-1"), makeGuardrailDef("guardrail-new-2")]),
  existingGuardrails: new Set<string>(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

const findLine = (text: string) => screen.getAllByText((_, element) => element?.textContent === text).at(0) ?? null;

describe("GuardrailSelectionModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese summary, actions and plural confirm for two new guardrails", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} progressInfo={{ current: 2, total: 5 }} />);

    expect(await screen.findByText("Test Template")).toBeInTheDocument();
    expect(screen.getByText("模板 2/5")).toBeInTheDocument();
    expect(screen.queryByText("Template 2 of 5")).not.toBeInTheDocument();
    expect(screen.getByText("检查并选择要为此模板创建的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Review and select guardrails to create for this template")).not.toBeInTheDocument();
    expect(screen.getByText("共 2 个 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("2 total guardrails")).not.toBeInTheDocument();
    expect(screen.getByText("2 个新增")).toBeInTheDocument();
    expect(screen.queryByText("2 new")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选新增项" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select All New" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消全选" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deselect All" })).not.toBeInTheDocument();
    expect(findLine("2 个 Guardrail 将被创建")).toBeInTheDocument();
    expect(screen.queryByText("2 guardrails will be created")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建 2 个 Guardrail 并使用模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create 2 Guardrails & Use Template" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese singular confirm for one new guardrail", async () => {
    renderWithProviders(
      <GuardrailSelectionModal {...defaultProps} template={makeTemplate([makeGuardrailDef("only-new")])} />,
    );

    expect(await screen.findByText("only-new")).toBeInTheDocument();
    expect(findLine("1 个 Guardrail 将被创建")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建 1 个 Guardrail 并使用模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create 1 Guardrail & Use Template" })).not.toBeInTheDocument();
  });

  it("renders the Chinese already-exists badge and all-exist summary", async () => {
    renderWithProviders(
      <GuardrailSelectionModal
        {...defaultProps}
        template={makeTemplate([makeGuardrailDef("existing-g")])}
        existingGuardrails={new Set(["existing-g"])}
      />,
    );

    expect(await screen.findByText("existing-g")).toBeInTheDocument();
    expect(screen.getByText("已存在")).toBeInTheDocument();
    expect(screen.queryByText("Already exists")).not.toBeInTheDocument();
    expect(screen.getByText("1 个已存在")).toBeInTheDocument();
    expect(screen.queryByText("1 already exist")).not.toBeInTheDocument();
    expect(screen.getByText("所有 Guardrails 都已存在。你可以继续使用此模板。")).toBeInTheDocument();
    expect(
      screen.queryByText("All guardrails already exist. You can proceed to use this template."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use Template" })).not.toBeInTheDocument();
  });

  it("renders the Chinese fallbacks and counts for an unknown guardrail", async () => {
    const unknownParams = { guardrail: undefined, mode: undefined, patterns: ["a", "b"], categories: ["c"] };
    renderWithProviders(
      <GuardrailSelectionModal
        {...defaultProps}
        template={makeTemplate([makeGuardrailDef("mystery-g", null, unknownParams)])}
      />,
    );

    expect(await screen.findByText("mystery-g")).toBeInTheDocument();
    expect(screen.getByText("暂无描述")).toBeInTheDocument();
    expect(screen.queryByText("No description available")).not.toBeInTheDocument();
    expect(screen.getAllByText("未知")).toHaveLength(2);
    expect(screen.queryByText("unknown")).not.toBeInTheDocument();
    expect(screen.getByText("2 个模式")).toBeInTheDocument();
    expect(screen.queryByText("2 pattern(s)")).not.toBeInTheDocument();
    expect(screen.getByText("1 个类别")).toBeInTheDocument();
    expect(screen.queryByText("1 category/categories")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-template notice", async () => {
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} template={makeTemplate([])} />);

    expect(await screen.findByText("此模板未定义任何 Guardrail。")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails defined for this template.")).not.toBeInTheDocument();
    expect(screen.getByText("此模板将使用你系统中现有的 Guardrails。")).toBeInTheDocument();
    expect(screen.queryByText("This template will use existing guardrails in your system.")).not.toBeInTheDocument();
  });

  it("renders the Chinese discovered-competitors panel", async () => {
    renderWithProviders(
      <GuardrailSelectionModal
        {...defaultProps}
        template={makeTemplate([makeGuardrailDef("g1")], { discoveredCompetitors: ["Acme", "Globex"] })}
      />,
    );

    expect(await screen.findByText("AI 发现的竞品（2）")).toBeInTheDocument();
    expect(screen.queryByText("AI-Discovered Competitors (2)")).not.toBeInTheDocument();
    expect(screen.getByText("这些竞品名称将被 competitor-name-blocker Guardrail 自动拦截。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "These competitor names will be automatically blocked by the competitor-name-blocker guardrail.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese deselect-all warning", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);

    await screen.findByText("guardrail-new-1");
    await user.click(screen.getByRole("button", { name: "取消全选" }));

    expect(
      screen.getByText("请至少选择一个要创建的 Guardrail，或点击「使用模板」在不创建新 Guardrail 的情况下继续。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Select at least one guardrail to create, or click "Use Template" to proceed without creating new guardrails.',
      ),
    ).not.toBeInTheDocument();
  });

  it("selects the singular and plural create labels in English", async () => {
    await i18n.changeLanguage("en");

    const first = renderWithProviders(
      <GuardrailSelectionModal {...defaultProps} template={makeTemplate([makeGuardrailDef("only-new")])} />,
    );
    expect(await screen.findByRole("button", { name: "Create 1 Guardrail & Use Template" })).toBeInTheDocument();
    expect(findLine("1 guardrail will be created")).toBeInTheDocument();
    first.unmount();

    renderWithProviders(<GuardrailSelectionModal {...defaultProps} />);
    expect(await screen.findByRole("button", { name: "Create 2 Guardrails & Use Template" })).toBeInTheDocument();
    expect(findLine("2 guardrails will be created")).toBeInTheDocument();
  });
});
