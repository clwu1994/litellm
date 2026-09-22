/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import CreateTagModal from "./CreateTagModal";

const availableModels = [
  {
    model_name: "GPT-4",
    litellm_params: { model: "gpt-4" },
    model_info: { id: "model-1" },
  },
];

const renderModal = () =>
  renderWithProviders(
    <CreateTagModal visible onCancel={vi.fn()} onSubmit={vi.fn()} availableModels={availableModels} />,
  );

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("CreateTagModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese create form with the English originals absent", () => {
    renderModal();

    expect(screen.getByRole("heading", { name: "创建新标签" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create New Tag" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("标签名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tag Name")).not.toBeInTheDocument();
    expect(screen.getByLabelText("描述")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
    expect(screen.getByText("允许的模型")).toBeInTheDocument();
    expect(screen.queryByText("Allowed Models")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select Models")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建标签" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Tag" })).not.toBeInTheDocument();
  });

  it("renders the Chinese budget section copy once it is expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "预算与速率限制（可选）" }));

    expect(await screen.findByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("重置预算")).toBeInTheDocument();
    expect(screen.queryByText("Reset Budget")).not.toBeInTheDocument();
    expect(screen.getByText("目前不支持标签的 TPM/RPM 限制。如果你需要此功能，请。")).toBeInTheDocument();
    expect(
      screen.queryByText("TPM/RPM limits for tags are not currently supported. If you need this feature, please ."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "创建一个 GitHub issue" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "create a GitHub issue" })).not.toBeInTheDocument();
  });

  it("renders the Chinese field hints while they are open", async () => {
    const user = userEvent.setup({ delay: null });
    renderModal();

    await hoverHint(user, "允许的模型");
    expect(await screen.findByText("选择允许处理来自此标签的请求的模型")).toBeInTheDocument();
    expect(
      screen.queryByText("Select which models are allowed to process requests from this tag"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "预算与速率限制（可选）" }));

    await hoverHint(user, "最大预算（USD）");
    expect(
      await screen.findByText("此标签可花费的最大金额（USD）。达到该金额后，带有此标签的请求将被阻止"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Maximum amount in USD this tag can spend. When reached, requests with this tag will be blocked",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "重置预算");
    expect(await screen.findByText("预算重置的频率。例如，设置为 'daily' 将每 24 小时重置预算")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "How often the budget should reset. For example, setting 'daily' will reset the budget every 24 hours",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese required-name validation message", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "创建标签" }));

    expect(await screen.findByText("请输入标签名称")).toBeInTheDocument();
    expect(screen.queryByText("Please input a tag name")).not.toBeInTheDocument();
  });
});
