import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import TemplateParameterModal from "./template_parameter_modal";

const { modelHubCall, enrichPolicyTemplateStream } = vi.hoisted(() => ({
  modelHubCall: vi.fn(),
  enrichPolicyTemplateStream: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ modelHubCall, enrichPolicyTemplateStream }));

type UserEvent = ReturnType<typeof userEvent.setup>;

type StreamResult = { competitors: string[]; competitor_variations?: Record<string, string[]> };
type StreamArgs = [
  token: string,
  templateId: string,
  params: Record<string, string>,
  model: string,
  onName: (name: string) => void,
  onDone: (result: StreamResult) => void,
];

const plainTemplate = {
  id: "tpl-plain",
  title: "Basic Redaction",
  parameters: [
    { name: "org_name", label: "Organization Name", type: "string", required: true, placeholder: "e.g. Contoso" },
  ],
};

const enrichmentTemplate = {
  id: "tpl-competitor",
  title: "Competitor Blocking",
  llm_enrichment: { parameter: "brand_name" },
  parameters: [{ name: "brand_name", label: "Your Brand Name", type: "string", required: true }],
};

const defaultProps = {
  visible: true,
  template: plainTemplate,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  accessToken: "sk-test",
};

const renderModal = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProviders(<TemplateParameterModal {...defaultProps} {...props} />);

const selectModel = async (user: UserEvent) => {
  await user.click(screen.getAllByRole("combobox")[0]);
  const options = await screen.findAllByText("gpt-5.1");
  await user.click(options[options.length - 1]);
};

const fillBrandName = async (user: UserEvent) => {
  fireEvent.change(screen.getByPlaceholderText("例如：Acme Airlines"), { target: { value: "Contoso" } });
  await selectModel(user);
};

describe("TemplateParameterModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    modelHubCall.mockResolvedValue({ data: [{ model_group: "gpt-5.1" }] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese description and footer actions for a plain template", async () => {
    renderModal();

    expect(await screen.findByText("Basic Redaction")).toBeInTheDocument();
    expect(screen.getByText("为你的品牌配置竞品屏蔽")).toBeInTheDocument();
    expect(screen.queryByText("Configure competitor blocking for your brand")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
  });

  it("renders the Chinese enrichment chrome", async () => {
    renderModal({ template: enrichmentTemplate });

    expect(await screen.findByText("竞品发现")).toBeInTheDocument();
    expect(screen.queryByText("Competitor Discovery")).not.toBeInTheDocument();
    expect(screen.getByText("✨ 使用 AI")).toBeInTheDocument();
    expect(screen.queryByText("✨ Use AI")).not.toBeInTheDocument();
    expect(screen.getByText("手动输入")).toBeInTheDocument();
    expect(screen.queryByText("Enter Manually")).not.toBeInTheDocument();
    expect(screen.getByText("你的品牌名称")).toBeInTheDocument();
    expect(screen.queryByText("Your Brand Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：Acme Airlines")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. Acme Airlines")).not.toBeInTheDocument();
    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择用于生成名称的模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model to generate names")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "✨ 生成竞品名称" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "✨ Generate Competitor Names" })).not.toBeInTheDocument();
    expect(screen.getByText("竞品名称")).toBeInTheDocument();
    expect(screen.queryByText("Competitor Names")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入名称并按 Enter 添加")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type a name and press Enter to add")).not.toBeInTheDocument();
    expect(screen.getByText("输入名称并按 Enter 添加。点击 ✕ 移除。")).toBeInTheDocument();
    expect(screen.queryByText("Type a name and press Enter to add. Click ✕ to remove.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholder while the model list loads", async () => {
    modelHubCall.mockReturnValue(new Promise(() => {}));
    renderModal({ template: enrichmentTemplate });

    expect(await screen.findByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty model text when the list is empty", async () => {
    modelHubCall.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await waitFor(() => expect(modelHubCall).toHaveBeenCalledWith("sk-test"));
    await user.click(screen.getAllByRole("combobox")[0]);

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
  });

  it("hides the AI model picker once manual entry is selected", async () => {
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("竞品发现");
    await user.click(screen.getByText("手动输入"));

    await waitFor(() => expect(screen.queryByText("选择模型")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "✨ 生成竞品名称" })).not.toBeInTheDocument();
  });

  it("renders the Chinese generating label while the stream is in flight", async () => {
    enrichPolicyTemplateStream.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("竞品发现");
    await fillBrandName(user);
    await user.click(screen.getByRole("button", { name: "✨ 生成竞品名称" }));

    expect(await screen.findByRole("button", { name: "✨ 正在生成名称..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "✨ Generating names..." })).not.toBeInTheDocument();
  });

  it("renders the Chinese competitor chips, variations and refinement copy after generation", async () => {
    enrichPolicyTemplateStream.mockImplementation(async (...args: StreamArgs) => {
      const [, , , , , onDone] = args;
      onDone({
        competitors: ["Northwind"],
        competitor_variations: { Northwind: ["Northwind Corp", "Northwind Inc"] },
      });
    });
    const user = userEvent.setup();
    renderModal({ template: enrichmentTemplate });

    await screen.findByText("竞品发现");
    await fillBrandName(user);
    await user.click(screen.getByRole("button", { name: "✨ 生成竞品名称" }));
    await screen.findByText("Northwind");

    expect(screen.getByLabelText("移除 Northwind")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove Northwind")).not.toBeInTheDocument();
    expect(screen.getByText("✓ 已自动生成 2 个替代拼写和变体，用于 Guardrail 匹配")).toBeInTheDocument();
    expect(
      screen.queryByText("✓ 2 alternate spellings & variations auto-generated for guardrail matching"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("优化列表")).toBeInTheDocument();
    expect(screen.queryByText("Refine List")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：再添加 10 个亚洲品牌，增加到 50 个……")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("e.g. add 10 more from Asia, increase to 50 total..."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发送" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(screen.getByText("给出添加、移除或修改竞品的指令。按 Enter 发送。")).toBeInTheDocument();
    expect(
      screen.queryByText("Give instructions to add, remove, or change competitors. Press Enter to send."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese creating-guardrails label while the confirm is loading", async () => {
    renderWithProviders(<TemplateParameterModal {...defaultProps} template={enrichmentTemplate} isLoading />);

    expect(await screen.findByRole("button", { name: "正在创建 Guardrails..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating guardrails..." })).not.toBeInTheDocument();
  });
});
