import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { PolicyAttachment } from "@/components/policies/types";

import AttachmentTable from "./AttachmentTable";

vi.mock("./impact_popover", () => ({
  default: function ImpactPopoverMock() {
    return <button aria-label="View blast radius" />;
  },
}));

const makeAttachment = (overrides: Partial<PolicyAttachment> = {}): PolicyAttachment => ({
  attachment_id: "att-abcdef1",
  policy_name: "my-policy",
  scope: null,
  teams: [],
  keys: [],
  models: [],
  tags: [],
  ...overrides,
});

const defaultProps = {
  attachments: [],
  isLoading: false,
  onDeleteClick: vi.fn(),
  isAdmin: true,
  accessToken: "test-token",
};

const CONFIG_HINT_ZH = "Config 附件在配置文件中定义，无法从仪表板删除。";
const CONFIG_HINT_EN = "Config attachments are defined in the config file and cannot be deleted from the dashboard.";

describe("AttachmentTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderWithProviders(<AttachmentTable {...defaultProps} />);

    for (const [zh, en] of [
      ["附件 ID", "Attachment ID"],
      ["策略", "Policy"],
      ["范围", "Scope"],
      ["团队", "Teams"],
      ["密钥", "Keys"],
      ["模型", "Models"],
      ["标签", "Tags"],
      ["创建时间", "Created At"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese loading message while loading", () => {
    renderWithProviders(<AttachmentTable {...defaultProps} isLoading />);

    expect(screen.getByText("正在加载附件…")).toBeInTheDocument();
    expect(screen.queryByText("Loading attachments…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state", () => {
    renderWithProviders(<AttachmentTable {...defaultProps} />);

    expect(screen.getByText("未找到附件")).toBeInTheDocument();
    expect(screen.queryByText("No attachments found")).not.toBeInTheDocument();
    expect(screen.getByText("将策略附加到团队、密钥、模型或标签，以控制其生效范围。")).toBeInTheDocument();
    expect(
      screen.queryByText("Attach a policy to teams, keys, models, or tags to control where it applies."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese global scope badge", () => {
    renderWithProviders(<AttachmentTable {...defaultProps} attachments={[makeAttachment({ scope: "*" })]} />);

    expect(screen.getByText("全局 (*)")).toBeInTheDocument();
    expect(screen.queryByText("Global (*)")).not.toBeInTheDocument();
  });

  it("renders the Chinese row action labels and aria label", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AttachmentTable {...defaultProps} attachments={[makeAttachment()]} />);

    const trigger = screen.getByTestId("attachment-actions-att-abcdef1");
    expect(trigger).toHaveAttribute("aria-label", "打开附件操作");
    expect(screen.queryByLabelText("Open attachment actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByTestId("attachment-action-copy-id")).toHaveTextContent("复制附件 ID");
    expect(screen.getByTestId("attachment-action-delete")).toHaveTextContent("删除附件");
    expect(screen.queryByText("Copy attachment ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete attachment")).not.toBeInTheDocument();
  });

  it("shows the Chinese copied-id toast when the attachment id is copied", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderWithProviders(<AttachmentTable {...defaultProps} attachments={[makeAttachment()]} />);

    await user.click(screen.getByTestId("attachment-actions-att-abcdef1"));
    await user.click(await screen.findByTestId("attachment-action-copy-id"));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制附件 ID"));
    expect(toast.success).not.toHaveBeenCalledWith("Attachment ID copied");
  });

  it("renders the Chinese config hint on the disabled delete action", async () => {
    const user = userEvent.setup();
    const attachment = makeAttachment({ definition_location: "config" });
    renderWithProviders(<AttachmentTable {...defaultProps} attachments={[attachment]} />);

    await user.click(screen.getByTestId("attachment-actions-att-abcdef1"));

    expect(await screen.findByTestId("attachment-action-delete")).toHaveAttribute("title", CONFIG_HINT_ZH);
    expect(screen.queryByTitle(CONFIG_HINT_EN)).not.toBeInTheDocument();
  });
});
