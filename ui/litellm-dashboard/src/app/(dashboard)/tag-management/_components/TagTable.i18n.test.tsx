import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tag } from "@/components/tag_management/types";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import TagTable from "./TagTable";

const mockTag: Tag = {
  name: "test-tag",
  description: "Test description",
  models: ["model-1", "model-2"],
  model_info: { "model-1": "GPT-4", "model-2": "Claude-3" },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const dynamicSpendTag: Tag = {
  name: "dynamic-spend-tag",
  description: "This is just a spend tag that was passed dynamically in a request. It does not control any LLM models.",
  models: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const renderTable = (data: Tag[], isLoading = false) =>
  renderWithProviders(
    <TagTable data={data} onEdit={vi.fn()} onDelete={vi.fn()} onSelectTag={vi.fn()} isLoading={isLoading} />,
  );

describe("TagTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty state with the English originals absent", () => {
    renderTable([]);

    expect(screen.getByText("暂无标签")).toBeInTheDocument();
    expect(screen.queryByText("No tags yet")).not.toBeInTheDocument();
    expect(screen.getByText("创建标签以开始路由并限制模型使用。")).toBeInTheDocument();
    expect(screen.queryByText("Create a tag to start routing and restricting model usage.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message with the English original absent", () => {
    renderTable([], true);

    expect(screen.getByText("正在加载标签…")).toBeInTheDocument();
    expect(screen.queryByText("Loading tags…")).not.toBeInTheDocument();
  });

  it("renders the Chinese column headers and actions label with the English originals absent", () => {
    renderTable([mockTag]);

    for (const [zh, en] of [
      ["标签名称", "Tag Name"],
      ["描述", "Description"],
      ["允许的模型", "Allowed Models"],
      ["创建时间", "Created"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese all-models badge when a tag has no models", () => {
    renderTable([{ ...mockTag, models: [] }]);

    expect(screen.getByText("所有模型")).toBeInTheDocument();
    expect(screen.queryByText("All Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions menu with the English originals absent", async () => {
    const user = userEvent.setup();
    renderTable([mockTag]);

    expect(screen.getByRole("button", { name: "打开标签操作" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open tag actions" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开标签操作" }));

    expect(await screen.findByText("编辑")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.getByText("删除")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders the Chinese model id tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable([mockTag]);

    await user.hover(screen.getByText("GPT-4"));

    expect(await screen.findByText("ID：model-1")).toBeInTheDocument();
    expect(screen.queryByText("ID: model-1")).not.toBeInTheDocument();
  });

  it("renders the Chinese dynamic spend tag tooltips while they are open", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable([dynamicSpendTag]);

    await user.hover(screen.getByText("dynamic-spend-tag"));

    expect(await screen.findByText("无法查看动态生成的支出标签的信息")).toBeInTheDocument();
    expect(
      screen.queryByText("You cannot view the information of a dynamically generated spend tag"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开标签操作" }));

    const editItem = await screen.findByTestId("tag-action-edit");
    const deleteItem = await screen.findByTestId("tag-action-delete");

    expect(editItem).toHaveAttribute("title", "无法编辑动态生成的支出标签");
    expect(editItem).not.toHaveAttribute("title", "Dynamically generated spend tags cannot be edited");
    expect(deleteItem).toHaveAttribute("title", "无法删除动态生成的支出标签");
    expect(deleteItem).not.toHaveAttribute("title", "Dynamically generated spend tags cannot be deleted");
  });
});
