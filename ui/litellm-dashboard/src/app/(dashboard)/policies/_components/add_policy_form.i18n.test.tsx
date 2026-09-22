/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import { act, cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import type { Guardrail } from "@/components/guardrails/types";
import type { Policy } from "@/components/policies/types";

import AddPolicyForm from "./add_policy_form";

const networkingMocks = vi.hoisted(() => ({
  getResolvedGuardrails: vi.fn(),
  modelAvailableCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getResolvedGuardrails: networkingMocks.getResolvedGuardrails,
  modelAvailableCall: networkingMocks.modelAvailableCall,
}));

const EXISTING_POLICY: Policy = {
  policy_id: "pol-1",
  policy_name: "existing-policy",
  inherit: null,
  description: "an existing policy",
  guardrails_add: ["guard-a"],
  guardrails_remove: [],
  condition: { model: "gpt-4" },
};

const defaultProps = {
  visible: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  onOpenFlowBuilder: vi.fn(),
  accessToken: "test-token" as string | null,
  existingPolicies: [] as Policy[],
  availableGuardrails: [] as Guardrail[],
  createPolicy: vi.fn().mockResolvedValue({}),
  updatePolicy: vi.fn().mockResolvedValue({}),
};

const openSimpleForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("button", { name: "创建策略" }));
};

describe("AddPolicyForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    networkingMocks.getResolvedGuardrails.mockResolvedValue({ resolved_guardrails: [] });
    networkingMocks.modelAvailableCall.mockResolvedValue({ data: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese mode picker chrome", async () => {
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await act(async () => {});

    expect(screen.getByText("创建新策略")).toBeInTheDocument();
    expect(screen.queryByText("Create New Policy")).not.toBeInTheDocument();
    expect(screen.getByText("简单模式")).toBeInTheDocument();
    expect(screen.queryByText("Simple Mode")).not.toBeInTheDocument();
    expect(screen.getByText("从列表中选择 Guardrails，全部并行运行。")).toBeInTheDocument();
    expect(screen.queryByText("Pick guardrails from a list. All run in parallel.")).not.toBeInTheDocument();
    expect(screen.getByText("新")).toBeInTheDocument();
    expect(screen.queryByText("NEW")).not.toBeInTheDocument();
    expect(screen.getByText("Flow Builder")).toBeInTheDocument();
    expect(screen.getByText("定义步骤、条件和错误响应。")).toBeInTheDocument();
    expect(screen.queryByText("Define steps, conditions, and error responses.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Policy" })).not.toBeInTheDocument();
  });

  it("renders the Chinese flow-builder notice and continue label once flow builder is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);

    await user.click(screen.getByText("Flow Builder"));

    expect(screen.getByText("你将前往 Flow Builder 以可视化方式设计策略逻辑。")).toBeInTheDocument();
    expect(
      screen.queryByText("You'll be taken to the Flow Builder to design your policy logic visually."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续前往 Flow Builder" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue to Builder" })).not.toBeInTheDocument();
  });

  it("renders the Chinese simple-form labels, section headings and placeholders", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);

    await openSimpleForm(user);

    expect(await screen.findByLabelText("策略名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Policy Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：global-baseline、healthcare-compliance")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., global-baseline, healthcare-compliance")).not.toBeInTheDocument();
    expect(screen.getByLabelText("描述")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("描述此策略的用途……")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe what this policy does...")).not.toBeInTheDocument();

    expect(screen.getByText("继承")).toBeInTheDocument();
    expect(screen.queryByText("Inheritance")).not.toBeInTheDocument();
    expect(screen.getByText("继承自")).toBeInTheDocument();
    expect(screen.queryByText("Inherit From")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择父策略（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a parent policy (optional)")).not.toBeInTheDocument();

    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("要添加的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails to Add")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要添加的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select guardrails to add")).not.toBeInTheDocument();
    expect(screen.getByText("要移除的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails to Remove")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择要移除的 Guardrails（从继承的 Guardrails 中）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select guardrails to remove (from inherited)")).not.toBeInTheDocument();

    expect(screen.getByText("条件（可选）")).toBeInTheDocument();
    expect(screen.queryByText("Conditions (Optional)")).not.toBeInTheDocument();
    expect(screen.getByText("模型范围")).toBeInTheDocument();
    expect(screen.queryByText("Model Scope")).not.toBeInTheDocument();
    expect(
      screen.getByText("默认情况下，此策略将应用于所有模型。你也可以在下方将其限制为特定模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "By default, this policy will run on all models. You can optionally restrict it to specific models below.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("模型条件类型")).toBeInTheDocument();
    expect(screen.queryByText("Model Condition Type")).not.toBeInTheDocument();
    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    expect(screen.getByText("自定义正则表达式")).toBeInTheDocument();
    expect(screen.queryByText("Custom Regex Pattern")).not.toBeInTheDocument();

    expect(screen.getByLabelText("模型（可选）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model (Optional)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("留空则应用于所有模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave empty to apply to all models")).not.toBeInTheDocument();
  });

  it("renders the Chinese tooltips while each is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await openSimpleForm(user);

    const inheritLabel = await screen.findByText("继承自");
    const inheritTrigger = inheritLabel.closest("label")?.querySelector("svg");
    if (!inheritTrigger) throw new Error("no inherit hint trigger");
    await user.hover(inheritTrigger);
    expect(
      await screen.findByText("从另一个策略继承 Guardrails。子策略将包含父策略的所有 Guardrails。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Inherit guardrails from another policy. The child policy will include all guardrails from the parent.",
      ),
    ).not.toBeInTheDocument();

    const addLabel = screen.getByText("要添加的 Guardrails");
    const addTrigger = addLabel.closest("label")?.querySelector("svg");
    if (!addTrigger) throw new Error("no guardrails-to-add hint trigger");
    await user.hover(addTrigger);
    expect(await screen.findByText("这些 Guardrails 将被添加到匹配此策略的请求中")).toBeInTheDocument();
    expect(
      screen.queryByText("These guardrails will be added to requests matching this policy"),
    ).not.toBeInTheDocument();

    const removeLabel = screen.getByText("要移除的 Guardrails");
    const removeTrigger = removeLabel.closest("label")?.querySelector("svg");
    if (!removeTrigger) throw new Error("no guardrails-to-remove hint trigger");
    await user.hover(removeTrigger);
    expect(await screen.findByText("这些 Guardrails 将从继承的 Guardrails 中移除")).toBeInTheDocument();
    expect(screen.queryByText("These guardrails will be removed from inherited guardrails")).not.toBeInTheDocument();

    const modelLabel = screen.getByText("模型（可选）");
    const modelTrigger = modelLabel.closest("label")?.querySelector("svg");
    if (!modelTrigger) throw new Error("no model-condition hint trigger");
    await user.hover(modelTrigger);
    expect(await screen.findByText("选择要应用此策略的特定模型。留空则应用于所有模型。")).toBeInTheDocument();
    expect(
      screen.queryByText("Select a specific model to apply this policy to. Leave empty to apply to all models."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese regex branch labels, tooltip and placeholder", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await openSimpleForm(user);

    await user.click(screen.getByRole("radio", { name: "自定义正则表达式" }));

    expect(await screen.findByLabelText("正则表达式（可选）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Regex Pattern (Optional)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("模型（可选）")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("留空则应用于所有模型（例如 gpt-4.* 或 bedrock/claude-.*）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Leave empty to apply to all models (e.g., gpt-4.* or bedrock/claude-.*)"),
    ).not.toBeInTheDocument();

    const regexLabel = screen.getByText("正则表达式（可选）");
    const regexTrigger = regexLabel.closest("label")?.querySelector("svg");
    if (!regexTrigger) throw new Error("no regex hint trigger");
    await user.hover(regexTrigger);
    expect(
      await screen.findByText("输入用于匹配模型的正则表达式（例如 gpt-4.* 或 bedrock/.*）。留空则应用于所有模型。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Enter a regex pattern to match models (e.g., gpt-4.* or bedrock/.*). Leave empty to apply to all models.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese resolved-guardrails alert for an edited policy", async () => {
    networkingMocks.getResolvedGuardrails.mockResolvedValue({ resolved_guardrails: ["guard-a"] });
    renderWithProviders(<AddPolicyForm {...defaultProps} editingPolicy={EXISTING_POLICY} />);

    expect(await screen.findByText("解析后的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Resolved Guardrails")).not.toBeInTheDocument();
    expect(screen.getByText("这些是最终将应用的 Guardrails（含继承）：")).toBeInTheDocument();
    expect(
      screen.queryByText("These are the final guardrails that will be applied (including inheritance):"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese edit title and update button when editing", async () => {
    renderWithProviders(<AddPolicyForm {...defaultProps} editingPolicy={EXISTING_POLICY} />);

    expect(await screen.findByText("编辑策略")).toBeInTheDocument();
    expect(screen.queryByText("Edit Policy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新策略" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Policy" })).not.toBeInTheDocument();
  });

  it("renders the Chinese required-name validation and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await openSimpleForm(user);

    await user.click(screen.getByRole("button", { name: "创建策略" }));

    expect(await screen.findByText("请输入策略名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a policy name")).not.toBeInTheDocument();
  });

  it("renders the Chinese name-format validation and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await openSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("策略名称"), { target: { value: "not a valid name!" } });
    await user.click(screen.getByRole("button", { name: "创建策略" }));

    expect(await screen.findByText("策略名称只能包含字母、数字、连字符和下划线")).toBeInTheDocument();
    expect(
      screen.queryByText("Policy name can only contain letters, numbers, hyphens, and underscores"),
    ).not.toBeInTheDocument();
  });

  it("toasts the Chinese create success and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} />);
    await openSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("策略名称"), { target: { value: "brand-new-policy" } });
    await user.click(screen.getByRole("button", { name: "创建策略" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("策略创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Policy created successfully");
  });

  it("toasts the Chinese update success and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} editingPolicy={EXISTING_POLICY} />);

    await user.click(await screen.findByRole("button", { name: "更新策略" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("策略更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Policy updated successfully");
  });

  it("toasts the Chinese save failure with the error message and hides the English", async () => {
    const createPolicy = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} createPolicy={createPolicy} />);
    await openSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("策略名称"), { target: { value: "failing-policy" } });
    await user.click(screen.getByRole("button", { name: "创建策略" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存策略失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save policy: boom");
  });

  it("toasts the Chinese no-access-token failure and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddPolicyForm {...defaultProps} accessToken={null} />);
    await openSimpleForm(user);

    fireEvent.change(await screen.findByLabelText("策略名称"), { target: { value: "no-token-policy" } });
    await user.click(screen.getByRole("button", { name: "创建策略" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存策略失败：没有可用的访问 Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save policy: No access token available");
  });
});
