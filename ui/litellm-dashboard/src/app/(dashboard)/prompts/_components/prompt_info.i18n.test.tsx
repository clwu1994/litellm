import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deletePromptCall, getPromptInfo, getPromptVersions, type PromptSpec } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import PromptInfoView from "./prompt_info";

vi.mock("@/components/networking", () => ({
  getPromptInfo: vi.fn(),
  getPromptVersions: vi.fn(),
  deletePromptCall: vi.fn(),
}));

vi.mock("./prompt_editor_view/PromptCodeSnippets", () => ({ __esModule: true, default: () => null }));

const promptSpec = {
  prompt_id: "support-reply",
  version: 1,
  environment: "development",
  litellm_params: { prompt_id: "support-reply" },
  prompt_info: { prompt_type: "dotprompt" },
  created_by: "admin",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const infoResponse = {
  prompt_spec: promptSpec,
  raw_prompt_template: null,
  environments: ["development", "staging"],
};

const templateResponse = {
  ...infoResponse,
  raw_prompt_template: {
    content: "Hello {{name}}",
    litellm_prompt_id: "support-reply",
    metadata: { author: "admin" },
  },
};

const versionOne: PromptSpec = {
  prompt_id: "support-reply.v1",
  version: 1,
  litellm_params: { prompt_id: "support-reply.v1" },
  prompt_info: { prompt_type: "dotprompt" },
  created_by: "admin",
  created_at: "2024-01-01T00:00:00Z",
};

const versionTwo: PromptSpec = {
  prompt_id: "support-reply.v2",
  version: 2,
  litellm_params: { prompt_id: "support-reply.v2" },
  prompt_info: { prompt_type: "dotprompt" },
  created_by: "admin",
  created_at: "2024-01-02T00:00:00Z",
};

const renderView = () =>
  renderWithProviders(<PromptInfoView promptId="support-reply" onClose={vi.fn()} accessToken="sk-test" isAdmin />);

const cardLabel = (text: string) => screen.getAllByText(text).find((element) => element.tagName === "P");
const columnHeader = (text: string) => within(screen.getByRole("table")).getByText(text);

describe("PromptInfoView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getPromptInfo).mockResolvedValue(infoResponse);
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [] });
    vi.mocked(deletePromptCall).mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state and hides the English original", async () => {
    vi.mocked(getPromptInfo).mockReturnValue(new Promise(() => {}));
    renderView();

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    await act(async () => {});
  });

  it("renders the Chinese not-found state and load-failure toast, hiding the English originals", async () => {
    vi.mocked(getPromptInfo).mockRejectedValue(new Error("boom"));
    renderView();

    expect(await screen.findByText("未找到提示词")).toBeInTheDocument();
    expect(screen.queryByText("Prompt not found")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载提示词信息失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load prompt information");
  });

  it("renders the Chinese header, environment tabs and overview fields, hiding the English originals", async () => {
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [versionOne] });
    renderView();

    expect(await screen.findByRole("heading", { name: "提示词详情" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prompt Details" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回提示词" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Prompts" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prompt Studio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除提示词" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Prompt" })).not.toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "原始 JSON" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Raw JSON" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "提示词模板" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /开发/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /development/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /预发布/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /staging/ })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["版本", "Version"],
      ["提示词类型", "Prompt Type"],
      ["创建者", "Created By"],
      ["创建时间", "Created At"],
    ] as const) {
      expect(cardLabel(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
    expect(screen.getByText(/^更新于：\d{4}-\d{2}-\d{2} /)).toBeInTheDocument();
    expect(screen.queryByText(/^Updated:/)).not.toBeInTheDocument();
  });

  it("renders the Chinese version-history card and hides the English originals", async () => {
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [versionOne] });
    renderView();

    expect(await screen.findByRole("heading", { name: "版本历史：开发" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Version History/ })).not.toBeInTheDocument();
    expect(screen.getByText("最新")).toBeInTheDocument();
    expect(screen.queryByText("latest")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["版本", "Version"],
      ["创建者", "Created By"],
      ["日期", "Date"],
      ["操作", "Actions"],
    ] as const) {
      expect(columnHeader(zh)).toBeInTheDocument();
      expect(within(screen.getByRole("table")).queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty version-history state and hides the English original", async () => {
    renderView();

    expect(await screen.findByText("在 开发 中未找到版本")).toBeInTheDocument();
    expect(screen.queryByText(/No versions found in/)).not.toBeInTheDocument();
  });

  it("renders the Chinese loading-versions message and hides the English original", async () => {
    vi.mocked(getPromptVersions).mockReturnValue(new Promise(() => {}));
    renderView();

    expect(await screen.findByText("正在加载版本...")).toBeInTheDocument();
    expect(screen.queryByText("Loading versions...")).not.toBeInTheDocument();
  });

  it("renders the Chinese old-version banner, jumps to the latest version and hides the English originals", async () => {
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [versionOne, versionTwo] });
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByText("正在查看 v1，不是最新版本（v2）")).toBeInTheDocument();
    expect(screen.queryByText(/not the latest version/)).not.toBeInTheDocument();
    const goToLatest = screen.getByRole("button", { name: "转到最新版本" });
    expect(goToLatest).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go to latest" })).not.toBeInTheDocument();

    await user.click(goToLatest);

    await vi.waitFor(() => expect(getPromptInfo).toHaveBeenCalledWith("sk-test", "support-reply.v2", "development"));
  });

  it("renders the Chinese version-load failure toast and hides the English original", async () => {
    vi.mocked(getPromptVersions).mockResolvedValue({ prompts: [versionOne, versionTwo] });
    vi.mocked(getPromptInfo).mockImplementation((_token, promptId) =>
      promptId.includes(".v") ? Promise.reject(new Error("boom")) : Promise.resolve(infoResponse),
    );
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByText("v2"));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载版本 v2 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to load version v2");
  });

  it("renders the Chinese template tab, fields and copy control, hiding the English originals", async () => {
    vi.mocked(getPromptInfo).mockResolvedValue(templateResponse);
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByRole("tab", { name: "提示词模板" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Prompt Template" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "提示词模板" }));

    expect(screen.getByRole("heading", { name: "提示词模板" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prompt Template" })).not.toBeInTheDocument();
    for (const [zh, en] of [
      ["模板 ID", "Template ID"],
      ["内容", "Content"],
      ["模板元数据", "Template Metadata"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "复制内容" }));

    expect(await screen.findByRole("button", { name: "已复制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Content" })).not.toBeInTheDocument();
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("renders the Chinese raw-JSON panel and copy control, hiding the English originals", async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole("tab", { name: "原始 JSON" }));

    expect(screen.getByRole("heading", { name: "原始 API 响应" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Raw API Response" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复制 JSON" }));

    expect(await screen.findByRole("button", { name: "已复制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy JSON" })).not.toBeInTheDocument();
    expect(screen.queryByText("Copied!")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete dialog and shows the Chinese deleted toast", async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByRole("heading", { name: "提示词详情" });

    await user.click(screen.getByRole("button", { name: "删除提示词" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("删除提示词")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Prompt")).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent("确定要从所有环境删除提示词：support-reply？");
    expect(dialog).not.toHaveTextContent("Are you sure you want to delete prompt:");
    expect(within(dialog).getByText("此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText("This action cannot be undone.")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("提示词「support-reply」删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith('Prompt "support-reply" deleted successfully');
  });

  it("renders the Chinese delete-failure toast and hides the English original", async () => {
    vi.mocked(deletePromptCall).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderView();
    await screen.findByRole("heading", { name: "提示词详情" });

    await user.click(screen.getByRole("button", { name: "删除提示词" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除提示词失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete prompt");
  });
});
