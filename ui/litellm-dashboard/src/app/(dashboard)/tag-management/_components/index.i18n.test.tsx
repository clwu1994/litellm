import { fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { modelInfoCall, tagCreateCall, tagDeleteCall, tagListCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import TagManagement from "./index";

vi.mock("@/components/networking", () => ({
  tagListCall: vi.fn(),
  tagCreateCall: vi.fn(),
  tagDeleteCall: vi.fn(),
  modelInfoCall: vi.fn(),
}));

vi.mock("./TagTable", () => ({
  __esModule: true,
  default: ({ isLoading, onDelete }: { isLoading?: boolean; onDelete: (tagName: string) => void }) => (
    <div data-testid="tag-table">
      {isLoading ? "table-loading" : "table-loaded"}
      <button data-testid="mock-delete-trigger" onClick={() => onDelete("test-tag")}>
        trigger
      </button>
    </div>
  ),
}));

vi.mock("./tag_info", () => ({
  __esModule: true,
  default: () => <div>Mock Tag Info View</div>,
}));

vi.mock("./components/CreateTagModal", () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: (values: { tag_name: string }) => void }) => (
    <button data-testid="mock-create-submit" onClick={() => onSubmit({ tag_name: "new-tag" })}>
      create
    </button>
  ),
}));

const mockTagListCall = vi.mocked(tagListCall);
const mockTagCreateCall = vi.mocked(tagCreateCall);
const mockTagDeleteCall = vi.mocked(tagDeleteCall);
const mockModelInfoCall = vi.mocked(modelInfoCall);

const renderPage = () => renderWithProviders(<TagManagement accessToken="sk-test" userID="user-1" userRole="Admin" />);

describe("Tag Management page Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockTagListCall.mockResolvedValue({});
    mockTagCreateCall.mockResolvedValue(undefined);
    mockTagDeleteCall.mockResolvedValue(undefined);
    mockModelInfoCall.mockResolvedValue({ data: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page chrome with the English originals absent", async () => {
    renderPage();
    await screen.findByText("table-loaded");

    expect(screen.getByRole("heading", { name: "标签管理" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tag Management" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新标签" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh tags" })).not.toBeInTheDocument();
    expect(screen.getByText("点击标签名称可查看并编辑其详情。")).toBeInTheDocument();
    expect(screen.queryByText("Click on a tag name to view and edit its details.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 创建新标签" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Create New Tag" })).not.toBeInTheDocument();
  });

  it("renders the Chinese tag routing hint and link with the English originals absent", async () => {
    renderPage();
    await screen.findByText("table-loaded");

    expect(
      screen.getByText("你可以使用标签，根据请求中传入的标签来限制某些 LLM 的使用。在了解有关标签路由的更多信息。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "You can use tags to restrict the usage of certain LLMs based on tags passed in the request. Read more about tag routing .",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "此处" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "here" })).not.toBeInTheDocument();
  });

  it("renders the Chinese last-refreshed line with the English original absent", async () => {
    const spy = vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("2024-05-05 05:05:05");
    try {
      renderPage();
      await screen.findByText("table-loaded");

      fireEvent.click(screen.getByRole("button", { name: "刷新标签" }));

      expect(screen.getByText("上次刷新：2024-05-05 05:05:05")).toBeInTheDocument();
      expect(screen.queryByText("Last Refreshed: 2024-05-05 05:05:05")).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });

  it("renders the Chinese delete confirmation with the English originals absent", async () => {
    renderPage();
    await screen.findByText("table-loaded");

    expect(screen.queryByText("标签信息")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mock-delete-trigger"));

    expect(await screen.findByText("标签信息")).toBeInTheDocument();
    expect(screen.queryByText("Tag Information")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "删除标签" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Delete Tag" })).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此标签吗？此操作无法撤销。")).toBeInTheDocument();
    expect(
      screen.queryByText("Are you sure you want to delete this tag? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("标签名称")).toBeInTheDocument();
    expect(screen.queryByText("Tag Name")).not.toBeInTheDocument();
  });

  it("shows the Chinese fetch-tags failure toast with the English original absent", async () => {
    mockTagListCall.mockRejectedValue(new Error("boom"));
    renderPage();

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取标签失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching tags: Error: boom");
  });

  it("shows the Chinese fetch-models failure toast with the English original absent", async () => {
    mockModelInfoCall.mockRejectedValue(new Error("boom"));
    renderPage();

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取模型失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching models: Error: boom");
  });

  it("shows the Chinese tag-created toast with the English original absent", async () => {
    renderPage();
    await screen.findByText("table-loaded");

    fireEvent.click(screen.getByTestId("mock-create-submit"));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("标签创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Tag created successfully");
  });

  it("shows the Chinese tag-create failure toast with the English original absent", async () => {
    mockTagCreateCall.mockRejectedValue(new Error("boom"));
    renderPage();
    await screen.findByText("table-loaded");

    fireEvent.click(screen.getByTestId("mock-create-submit"));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建标签失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error creating tag: Error: boom");
  });

  it("shows the Chinese tag-deleted toast with the English original absent", async () => {
    renderPage();
    await screen.findByText("table-loaded");

    fireEvent.click(screen.getByTestId("mock-delete-trigger"));
    await screen.findByText("标签信息");
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("标签删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Tag deleted successfully");
  });

  it("shows the Chinese tag-delete failure toast with the English original absent", async () => {
    mockTagDeleteCall.mockRejectedValue(new Error("boom"));
    renderPage();
    await screen.findByText("table-loaded");

    fireEvent.click(screen.getByTestId("mock-delete-trigger"));
    await screen.findByText("标签信息");
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除标签失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error deleting tag: Error: boom");
  });
});
