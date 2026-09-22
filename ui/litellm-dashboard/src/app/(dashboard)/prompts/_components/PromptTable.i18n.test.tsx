import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PromptSpec } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import PromptTable from "./PromptTable";

vi.mock("@/components/networking", () => ({
  modelHubCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const prompts: PromptSpec[] = [
  {
    prompt_id: "prompt-newer",
    litellm_params: { prompt_id: "prompt-newer" },
    prompt_info: { prompt_type: "dotprompt" },
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T11:00:00Z",
    environment: "production",
    created_by: "user-1",
  },
  {
    prompt_id: "prompt-older",
    litellm_params: { prompt_id: "prompt-older" },
    prompt_info: { prompt_type: "dotprompt" },
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-12T14:20:00Z",
  },
];

const defaultProps = {
  promptsList: prompts,
  isLoading: false,
  onPromptClick: vi.fn(),
  onDeleteClick: vi.fn(),
  accessToken: null,
  isAdmin: true,
};

describe("PromptTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header and hides the English originals", () => {
    renderWithProviders(<PromptTable {...defaultProps} />);

    for (const [zh, en] of [
      ["提示词 ID", "Prompt ID"],
      ["模型", "Model"],
      ["创建时间", "Created At"],
      ["更新时间", "Updated At"],
      ["环境", "Environment"],
      ["创建者", "Created By"],
      ["类型", "Type"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty state and hides the English originals", () => {
    renderWithProviders(<PromptTable {...defaultProps} promptsList={[]} />);

    expect(screen.getByText("尚无提示词")).toBeInTheDocument();
    expect(screen.queryByText("No prompts yet")).not.toBeInTheDocument();
    expect(screen.getByText("添加提示词以开始管理可复用的模板。")).toBeInTheDocument();
    expect(screen.queryByText("Add a prompt to start managing reusable templates.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message and hides the English original", () => {
    renderWithProviders(<PromptTable {...defaultProps} isLoading />);

    expect(screen.getByText("正在加载提示词…")).toBeInTheDocument();
    expect(screen.queryByText("Loading prompts…")).not.toBeInTheDocument();
  });

  it("renders the Chinese environment badge values and hides the raw English values", () => {
    renderWithProviders(<PromptTable {...defaultProps} />);

    expect(screen.getByText("生产")).toBeInTheDocument();
    expect(screen.queryByText("production")).not.toBeInTheDocument();
    expect(screen.getByText("开发")).toBeInTheDocument();
    expect(screen.queryByText("development")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions with their Chinese aria label and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptTable {...defaultProps} />);

    const trigger = screen.getByTestId("prompt-actions-prompt-newer");
    expect(trigger).toHaveAttribute("aria-label", "打开提示词操作");
    expect(trigger).not.toHaveAttribute("aria-label", "Open prompt actions");

    await user.click(trigger);

    expect(await screen.findByText("复制提示词 ID")).toBeInTheDocument();
    expect(screen.queryByText("Copy prompt ID")).not.toBeInTheDocument();
    expect(screen.getByTestId("prompt-action-delete")).toHaveTextContent("删除");
  });

  it("toasts the Chinese copied-ID message and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PromptTable {...defaultProps} />);

    await user.click(screen.getByTestId("prompt-actions-prompt-newer"));
    await user.click(await screen.findByTestId("prompt-action-copy"));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制提示词 ID"));
    expect(toast.success).not.toHaveBeenCalledWith("Prompt ID copied");
  });

  it("passes the Chinese unknown-prompt fallback name to the delete handler", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    renderWithProviders(
      <PromptTable {...defaultProps} promptsList={[{ ...prompts[1], prompt_id: "" }]} onDeleteClick={onDeleteClick} />,
    );

    await user.click(screen.getByTestId("prompt-actions-"));
    await user.click(await screen.findByTestId("prompt-action-delete"));

    expect(onDeleteClick).toHaveBeenCalledWith("", "未知提示词", "development");
  });
});
