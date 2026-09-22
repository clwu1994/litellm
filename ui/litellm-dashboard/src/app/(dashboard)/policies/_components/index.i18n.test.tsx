import { act, cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import PoliciesPanel from "./index";

const POLICY_ID = "pol-11111111-2222-3333-4444-555555555555";
const ATTACHMENT_ID = "att-11111111-2222-3333-4444-555555555555";

const networkingMocks = vi.hoisted(() => ({
  getPoliciesList: vi.fn(),
  getPolicyAttachmentsList: vi.fn(),
  getGuardrailsList: vi.fn(),
  getPolicyInfo: vi.fn(),
  getPolicyTemplates: vi.fn(),
  modelHubCall: vi.fn(),
  enrichPolicyTemplateStream: vi.fn(),
  deletePolicyCall: vi.fn(),
  createPolicyCall: vi.fn(),
  updatePolicyCall: vi.fn(),
  createPolicyAttachmentCall: vi.fn(),
  createGuardrailCall: vi.fn(),
  enrichPolicyTemplate: vi.fn(),
  deletePolicyAttachmentCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  ...networkingMocks,
}));

vi.mock("./impact_popover", () => ({
  default: () => <button type="button" aria-label="View blast radius" />,
}));

vi.mock("./pipeline_flow_builder", () => ({
  FlowBuilderPage: () => null,
}));

vi.mock("./policy_info", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./add_policy_form", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./ai_suggestion_modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./policy_test_panel", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("./add_attachment_form", () => ({
  __esModule: true,
  default: () => null,
}));

const POLICY = {
  policy_id: POLICY_ID,
  policy_name: "pii-policy",
  inherit: null,
  description: null,
  guardrails_add: [],
  guardrails_remove: [],
  condition: null,
  definition_location: "db",
};

const ATTACHMENT = {
  attachment_id: ATTACHMENT_ID,
  policy_name: "pii-policy",
  scope: null,
  teams: [],
  keys: [],
  models: [],
  tags: [],
};

const listItemWithText = (text: string) => (_content: string, element: Element | null) =>
  element?.tagName === "LI" && element.textContent === text;

const flushAsyncUpdates = () => act(async () => {});

const makeGuardrailDef = (name: string) => ({
  guardrail_name: name,
  guardrail_info: { description: "A guardrail description" },
  litellm_params: { guardrail: "presidio", mode: "pre_call" },
});

const makeTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: "tpl-1",
  title: "Test Template",
  description: "A test template",
  icon: "ShieldCheckIcon",
  iconColor: "text-success",
  iconBg: "bg-success/10",
  guardrails: [],
  tags: [],
  complexity: "Low" as const,
  ...overrides,
});

const renderPanel = () => renderWithProviders(<PoliciesPanel accessToken="test-token" userRole="Admin" />);

describe("PoliciesPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    networkingMocks.getPoliciesList.mockResolvedValue({ policies: [POLICY] });
    networkingMocks.getPolicyAttachmentsList.mockResolvedValue({ attachments: [ATTACHMENT] });
    networkingMocks.getGuardrailsList.mockResolvedValue({ guardrails: [] });
    networkingMocks.getPolicyTemplates.mockResolvedValue([]);
    networkingMocks.createGuardrailCall.mockResolvedValue(undefined);
    networkingMocks.modelHubCall.mockResolvedValue({ data: [] });
    networkingMocks.deletePolicyCall.mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tab labels", async () => {
    renderPanel();

    for (const [zh, en] of [
      ["模板", "Templates"],
      ["策略", "Policies"],
      ["附件", "Attachments"],
      ["策略模拟器", "Policy Simulator"],
    ] as const) {
      expect(await screen.findByRole("tab", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese about-policies alert", async () => {
    renderPanel();

    const panel = await screen.findByRole("tabpanel");

    expect(within(panel).getByText("关于策略")).toBeInTheDocument();
    expect(within(panel).queryByText("About Policies")).not.toBeInTheDocument();
    expect(
      within(panel).getByText("使用策略对 Guardrails 进行分组，并控制哪些 Guardrails 针对特定团队、密钥或模型运行。"),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByText(
        "Use policies to group guardrails and control which ones run for specific teams, keys, or models.",
      ),
    ).not.toBeInTheDocument();
    expect(within(panel).getByText("为什么使用策略？")).toBeInTheDocument();
    expect(within(panel).queryByText("Why use policies?")).not.toBeInTheDocument();
    expect(within(panel).getByText("为团队、密钥或模型启用/停用特定 Guardrails")).toBeInTheDocument();
    expect(
      within(panel).queryByText("Enable/disable specific guardrails for teams, keys, or models"),
    ).not.toBeInTheDocument();
    expect(within(panel).getByText("将 Guardrails 归入单个策略")).toBeInTheDocument();
    expect(within(panel).queryByText("Group guardrails into a single policy")).not.toBeInTheDocument();
    expect(within(panel).getByText("继承现有策略并按需覆盖")).toBeInTheDocument();
    expect(
      within(panel).queryByText("Inherit from existing policies and override what you need"),
    ).not.toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "在文档中了解更多 ->" })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: "Learn more in the documentation ->" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "关闭关于策略" })).toBeInTheDocument();
    expect(within(panel).queryByLabelText("Dismiss About Policies")).not.toBeInTheDocument();
  });

  it("renders the Chinese add-policy button and delete dialog", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("tab", { name: "策略" }));
    const panel = screen.getByRole("tabpanel");

    expect(within(panel).getByRole("button", { name: "+ 新增策略" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "+ Add New Policy" })).not.toBeInTheDocument();

    await user.click(within(panel).getByTestId(`policy-actions-${POLICY_ID}`));
    await user.click(await screen.findByTestId("policy-action-delete"));

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("删除策略")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Policy")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除策略：pii-policy？此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Are you sure you want to delete policy/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("策略信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Policy Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("名称")).toBeInTheDocument();
    expect(within(dialog).getByText("ID")).toBeInTheDocument();
    expect(within(dialog).getByText("描述")).toBeInTheDocument();
    expect(within(dialog).getByText("继承自")).toBeInTheDocument();
    expect(within(dialog).queryByText("Inherits From")).not.toBeInTheDocument();
  });

  it("shows the Chinese deleted-policy toast after confirming", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("tab", { name: "策略" }));
    const panel = screen.getByRole("tabpanel");
    await user.click(within(panel).getByTestId(`policy-actions-${POLICY_ID}`));
    await user.click(await screen.findByTestId("policy-action-delete"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("策略「pii-policy」删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith('Policy "pii-policy" deleted successfully');
    await flushAsyncUpdates();
  });

  it("shows the Chinese policy fetch failure toast", async () => {
    networkingMocks.getPoliciesList.mockRejectedValue(new Error("boom"));
    renderPanel();

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("获取策略失败"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to fetch policies");
  });

  it("shows the Chinese attachment fetch failure toast", async () => {
    networkingMocks.getPolicyAttachmentsList.mockRejectedValue(new Error("boom"));
    renderPanel();

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("获取附件失败"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to fetch attachments");
  });

  it("renders the Chinese about-attachments alert and add button", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("tab", { name: "附件" }));
    const panel = screen.getByRole("tabpanel");

    expect(within(panel).getByText("关于策略附件")).toBeInTheDocument();
    expect(within(panel).queryByText("About Policy Attachments")).not.toBeInTheDocument();
    expect(
      within(panel).getByText(
        "策略附件控制策略的生效范围。只有将策略附加到特定团队、密钥、模型、标签或全局，策略才会生效。",
      ),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByText(
        "Policy attachments control where your policies apply. Policies don't do anything until you attach them to specific teams, keys, models, tags, or globally.",
      ),
    ).not.toBeInTheDocument();
    expect(within(panel).getByText("附件范围：")).toBeInTheDocument();
    expect(within(panel).queryByText("Attachment Scopes:")).not.toBeInTheDocument();

    expect(within(panel).getByText(listItemWithText("全局 (*) - 应用于所有请求"))).toBeInTheDocument();
    expect(within(panel).getByText(listItemWithText("团队 - 仅应用于特定团队"))).toBeInTheDocument();
    expect(
      within(panel).getByText(listItemWithText("密钥 - 仅应用于特定 API Key（支持 dev-* 之类的通配符）")),
    ).toBeInTheDocument();
    expect(within(panel).getByText(listItemWithText("模型 - 仅在使用特定模型时应用"))).toBeInTheDocument();
    expect(
      within(panel).getByText(
        listItemWithText(
          "标签 - 匹配密钥/团队 metadata.tags 中的标签，或请求正文（metadata.tags）中动态传入的标签。用它来跨分组执行策略，例如「所有标记为 healthcare 的密钥都会应用 HIPAA Guardrails」。支持通配符（prod-*）。",
        ),
      ),
    ).toBeInTheDocument();
    expect(within(panel).queryByText(/Applies to all requests/)).not.toBeInTheDocument();

    expect(within(panel).getByRole("link", { name: "详细了解附件 ->" })).toBeInTheDocument();
    expect(within(panel).queryByRole("link", { name: "Learn more about attachments ->" })).not.toBeInTheDocument();
    expect(within(panel).getByText("企业版功能说明")).toBeInTheDocument();
    expect(within(panel).queryByText("Enterprise Feature Notice")).not.toBeInTheDocument();
    expect(
      within(panel).getByText("策略附件的部分功能将在后续版本中作为 LiteLLM Enterprise 提供。"),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByText("Parts of policy attachments will be on LiteLLM Enterprise in subsequent releases."),
    ).not.toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "+ 新增附件" })).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: "+ Add New Attachment" })).not.toBeInTheDocument();
  });

  it("renders the Chinese attachment delete dialog", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole("tab", { name: "附件" }));
    const panel = screen.getByRole("tabpanel");
    await user.click(within(panel).getByTestId(`attachment-actions-${ATTACHMENT_ID}`));
    await user.click(await screen.findByTestId("attachment-action-delete"));

    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("删除附件")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Attachment")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此附件？此操作无法撤销。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Are you sure you want to delete this attachment? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("附件信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Attachment Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("附件 ID")).toBeInTheDocument();
    expect(within(dialog).getByText("策略")).toBeInTheDocument();
    expect(within(dialog).getByText("范围")).toBeInTheDocument();
    expect(within(dialog).queryByText("Scope")).not.toBeInTheDocument();
  });

  it("shows the Chinese delete-policy failure toast", async () => {
    const user = userEvent.setup();
    networkingMocks.deletePolicyCall.mockRejectedValue(new Error("boom"));
    renderPanel();

    await user.click(await screen.findByRole("tab", { name: "策略" }));
    const panel = screen.getByRole("tabpanel");
    await user.click(within(panel).getByTestId(`policy-actions-${POLICY_ID}`));
    await user.click(await screen.findByTestId("policy-action-delete"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("删除策略失败"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete policy");
  });

  it("shows the Chinese created-guardrails toast after using a template", async () => {
    const user = userEvent.setup();
    networkingMocks.getPolicyTemplates.mockResolvedValue([
      makeTemplate({ guardrailDefinitions: [makeGuardrailDef("new-g")] }),
    ]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));
    await user.click(await screen.findByRole("button", { name: "创建 1 个 Guardrail 并使用模板" }));

    await act(async () => {
      await vi.waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("已创建 1 个 Guardrail！完成策略表单即可保存。"),
      );
    });
    expect(toast.success).not.toHaveBeenCalledWith("Created 1 guardrail! Complete the policy form to save.");
  });

  it("shows the Chinese plural created-guardrails toast after using a template", async () => {
    const user = userEvent.setup();
    networkingMocks.getPolicyTemplates.mockResolvedValue([
      makeTemplate({ guardrailDefinitions: [makeGuardrailDef("g1"), makeGuardrailDef("g2")] }),
    ]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));
    await user.click(await screen.findByRole("button", { name: "创建 2 个 Guardrail 并使用模板" }));

    await act(async () => {
      await vi.waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("已创建 2 个 Guardrail！完成策略表单即可保存。"),
      );
    });
    expect(toast.success).not.toHaveBeenCalledWith("Created 2 guardrails! Complete the policy form to save.");
  });

  it("shows the Chinese template-ready toast when no guardrails are created", async () => {
    const user = userEvent.setup();
    networkingMocks.getPolicyTemplates.mockResolvedValue([
      makeTemplate({ guardrailDefinitions: [makeGuardrailDef("existing-g")] }),
    ]);
    networkingMocks.getGuardrailsList.mockResolvedValue({ guardrails: [{ guardrail_name: "existing-g" }] });
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));
    await user.click(await screen.findByRole("button", { name: "使用模板" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("模板已就绪！完成策略表单即可保存。"));
    });
    expect(toast.success).not.toHaveBeenCalledWith("Template ready! Complete the policy form to save.");
  });

  it("shows the Chinese partial guardrail-creation warning", async () => {
    const user = userEvent.setup();
    networkingMocks.createGuardrailCall.mockRejectedValue(new Error("boom"));
    networkingMocks.getPolicyTemplates.mockResolvedValue([
      makeTemplate({ guardrailDefinitions: [makeGuardrailDef("g1"), makeGuardrailDef("g2")] }),
    ]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));
    await user.click(await screen.findByRole("button", { name: "创建 2 个 Guardrail 并使用模板" }));

    await act(async () => {
      await vi.waitFor(() =>
        expect(toast.warning).toHaveBeenCalledWith("创建 2 个 Guardrail 失败：g1, g2。你可能需要手动创建它们。"),
      );
    });
    expect(toast.warning).not.toHaveBeenCalledWith(/Failed to create 2 guardrail/);
  });

  it("shows the Chinese guardrails-load failure toast when a template is used", async () => {
    const user = userEvent.setup();
    networkingMocks.getGuardrailsList.mockRejectedValue(new Error("boom"));
    networkingMocks.getPolicyTemplates.mockResolvedValue([makeTemplate()]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("加载 Guardrails 失败，请重试。"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to load guardrails. Please try again.");
  });

  it("shows the Chinese template-configuration failure toast", async () => {
    const user = userEvent.setup();
    networkingMocks.enrichPolicyTemplate.mockRejectedValue(new Error("boom"));
    networkingMocks.getPolicyTemplates.mockResolvedValue([
      makeTemplate({
        parameters: [{ name: "brand_name", label: "Brand Name", type: "string", required: true }],
        llm_enrichment: { parameter: "brand_name" },
      }),
    ]);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "使用模板" }));
    await user.click(await screen.findByRole("radio", { name: "手动输入" }));
    await user.type(screen.getByPlaceholderText("输入名称并按 Enter 添加"), "Acme{Enter}");
    await user.type(screen.getByPlaceholderText("例如：Acme Airlines"), "Acme Airlines");
    await user.click(await screen.findByRole("button", { name: "继续" }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("配置模板失败，请重试。"));
    });
    expect(toast.error).not.toHaveBeenCalledWith("Failed to configure template. Please try again.");
  });

  it("shows the Chinese authentication-required toast when the token is gone", async () => {
    const user = userEvent.setup();
    networkingMocks.getPolicyTemplates.mockResolvedValue([makeTemplate()]);
    const { rerender } = renderPanel();
    await screen.findByRole("button", { name: "使用模板" });

    rerender(<PoliciesPanel accessToken={null} userRole="Admin" />);
    await user.click(screen.getByRole("button", { name: "使用模板" }));

    expect(toast.error).toHaveBeenCalledWith("需要身份验证");
    expect(toast.error).not.toHaveBeenCalledWith("Authentication required");
  });
});
