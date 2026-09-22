import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { tagInfoCall, tagUpdateCall } from "@/components/networking";
import type { Tag } from "@/components/tag_management/types";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import TagInfoView from "./tag_info";

vi.mock("@/components/networking", () => ({
  tagInfoCall: vi.fn(),
  tagUpdateCall: vi.fn(),
}));

vi.mock("@/components/organisms/create_key_button", () => ({
  fetchUserModels: vi.fn(
    (_userID: string, _userRole: string, _accessToken: string, setUserModels: (models: string[]) => void) => {
      setUserModels(["model-1", "model-2"]);
      return Promise.resolve();
    },
  ),
}));

const mockTagInfoCall = vi.mocked(tagInfoCall);
const mockTagUpdateCall = vi.mocked(tagUpdateCall);

const tag: Tag = {
  name: "prod-tag",
  description: "original description",
  models: ["model-1", "model-2"],
  model_info: { "model-1": "GPT-4", "model-2": "Claude-3" },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  litellm_budget_table: { max_budget: 10, budget_duration: "7d", tpm_limit: 1000, rpm_limit: 60 },
};

const renderView = (editTag = false) =>
  renderWithProviders(
    <TagInfoView tagId="prod-tag" onClose={vi.fn()} accessToken="sk-test" is_admin editTag={editTag} />,
  );

describe("TagInfoView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockTagInfoCall.mockResolvedValue({ "prod-tag": tag });
    mockTagUpdateCall.mockResolvedValue(undefined);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state with the English original absent", () => {
    mockTagInfoCall.mockReturnValue(new Promise(() => {}));
    renderView();

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese tag details with the English originals absent", async () => {
    renderView();

    expect(await screen.findByRole("button", { name: "← 返回标签" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Back to Tags" })).not.toBeInTheDocument();
    expect(screen.getByText("标签名称：")).toBeInTheDocument();
    expect(screen.queryByText("Tag Name:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑标签" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Tag" })).not.toBeInTheDocument();
    expect(screen.getByText("标签详情")).toBeInTheDocument();
    expect(screen.queryByText("Tag Details")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["名称", "Name"],
      ["描述", "Description"],
      ["允许的模型", "Allowed Models"],
      ["创建时间", "Created"],
      ["最后更新", "Last Updated"],
      ["预算与速率限制", "Budget & Rate Limits"],
      ["最大预算", "Max Budget"],
      ["预算周期", "Budget Duration"],
      ["TPM 限制", "TPM Limit"],
      ["RPM 限制", "RPM Limit"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it.each([
    ["1h", "每小时"],
    ["24h", "每天"],
    ["7d", "每周"],
    ["30d", "每月"],
  ] as const)("renders the Chinese budget duration for the %s value", async (raw, zh) => {
    mockTagInfoCall.mockResolvedValue({
      "prod-tag": { ...tag, litellm_budget_table: { ...tag.litellm_budget_table, budget_duration: raw } },
    });
    renderView();

    await screen.findByRole("button", { name: "← 返回标签" });

    expect(screen.getByText(zh)).toBeInTheDocument();
    expect(screen.queryByText(raw)).not.toBeInTheDocument();
  });

  it("falls back to the raw budget duration for an unknown value", async () => {
    mockTagInfoCall.mockResolvedValue({
      "prod-tag": { ...tag, litellm_budget_table: { ...tag.litellm_budget_table, budget_duration: "45d" } },
    });
    renderView();

    await screen.findByRole("button", { name: "← 返回标签" });

    expect(screen.getByText("45d")).toBeInTheDocument();
  });

  it("renders the Chinese all-models badge when the tag has no models", async () => {
    mockTagInfoCall.mockResolvedValue({ "prod-tag": { ...tag, models: [] } });
    renderView();

    await screen.findByRole("button", { name: "← 返回标签" });

    expect(screen.getByText("所有模型")).toBeInTheDocument();
    expect(screen.queryByText("All Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-description fallback", async () => {
    mockTagInfoCall.mockResolvedValue({ "prod-tag": { ...tag, description: undefined } });
    renderView();

    await screen.findByRole("button", { name: "← 返回标签" });

    expect(screen.getByText("无描述")).toBeInTheDocument();
    expect(screen.queryByText("No description")).not.toBeInTheDocument();
  });

  it("renders the Chinese model id tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderView();

    await screen.findByRole("button", { name: "← 返回标签" });
    await user.hover(screen.getByText("GPT-4"));

    expect(await screen.findByText("ID：model-1")).toBeInTheDocument();
    expect(screen.queryByText("ID: model-1")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit form with the English originals absent", async () => {
    renderView(true);

    expect(await screen.findByLabelText("标签名称")).toHaveValue("prod-tag");
    expect(screen.queryByLabelText("Tag Name")).not.toBeInTheDocument();
    expect(screen.getByLabelText("描述")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
    expect(screen.getByText("允许的模型")).toBeInTheDocument();
    expect(screen.queryByText("Allowed Models")).not.toBeInTheDocument();
    expect(screen.getByText("选择允许处理此类数据的模型")).toBeInTheDocument();
    expect(screen.queryByText("Select which models are allowed to process this type of data")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select Models")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese budget section copy once it is expanded", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByLabelText("标签名称");

    await user.click(screen.getByRole("button", { name: "预算与速率限制" }));

    expect(await screen.findByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("此标签可花费的最大金额（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Maximum amount in USD this tag can spend")).not.toBeInTheDocument();
    expect(screen.getByText("重置预算")).toBeInTheDocument();
    expect(screen.queryByText("Reset Budget")).not.toBeInTheDocument();
    expect(screen.getByText("预算重置的频率")).toBeInTheDocument();
    expect(screen.queryByText("How often the budget should reset")).not.toBeInTheDocument();
    expect(screen.getByText("目前不支持标签的 TPM/RPM 限制。如果你需要此功能，请。")).toBeInTheDocument();
    expect(
      screen.queryByText("TPM/RPM limits for tags are not currently supported. If you need this feature, please ."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "创建一个 GitHub issue" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "create a GitHub issue" })).not.toBeInTheDocument();
  });

  it("renders the Chinese required-name validation message", async () => {
    const user = userEvent.setup();
    renderView(true);
    const nameInput = await screen.findByLabelText("标签名称");

    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("请输入标签名称")).toBeInTheDocument();
    expect(screen.queryByText("Please input a tag name")).not.toBeInTheDocument();
  });

  it("shows the Chinese fetch-details failure toast with the English original absent", async () => {
    mockTagInfoCall.mockRejectedValue(new Error("boom"));
    renderView();

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取标签详情失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching tag details: Error: boom");
  });

  it("shows the Chinese tag-updated toast with the English original absent", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByLabelText("标签名称");

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("标签更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Tag updated successfully");
  });

  it("shows the Chinese update-failure toast with the English original absent", async () => {
    const user = userEvent.setup();
    mockTagUpdateCall.mockRejectedValue(new Error("boom"));
    renderView(true);
    await screen.findByLabelText("标签名称");

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新标签失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error updating tag: Error: boom");
  });

  it("keeps the cancel button working from the Chinese edit form", async () => {
    const user = userEvent.setup();
    renderView(true);
    await screen.findByLabelText("标签名称");

    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(await screen.findByText("标签详情")).toBeInTheDocument();
    expect(screen.queryByText("Tag Details")).not.toBeInTheDocument();
  });
});
