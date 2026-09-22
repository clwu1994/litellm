import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { getProxyBaseUrl, getPublicModelHubInfo, updateUsefulLinksCall } from "@/components/networking";

import UsefulLinksManagement from "./UsefulLinksManagement";

vi.mock("@/components/networking", () => ({
  getPublicModelHubInfo: vi.fn(),
  updateUsefulLinksCall: vi.fn(),
  getProxyBaseUrl: vi.fn(),
}));

const mockedGetPublicModelHubInfo = vi.mocked(getPublicModelHubInfo);
const mockedUpdateUsefulLinksCall = vi.mocked(updateUsefulLinksCall);
const mockedGetProxyBaseUrl = vi.mocked(getProxyBaseUrl);

const EMPTY_HUB_INFO = {
  docs_title: "Docs",
  custom_docs_description: null,
  litellm_version: "1.0.0",
  useful_links: {},
};

const TWO_LINKS = {
  "First Link": { url: "https://first.example.com", index: 0 },
  "Second Link": { url: "https://second.example.com", index: 1 },
};

const renderPanel = () => renderWithProviders(<UsefulLinksManagement accessToken="token" userRole="Admin" />);

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("UsefulLinksManagement Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    mockedGetPublicModelHubInfo.mockResolvedValue({ ...EMPTY_HUB_INFO, useful_links: TWO_LINKS });
    mockedUpdateUsefulLinksCall.mockResolvedValue({});
    mockedGetProxyBaseUrl.mockReturnValue("https://proxy.example.com");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the panel copy in Chinese and hides the English originals", async () => {
    renderPanel();

    expect(await screen.findByText("链接管理")).toBeInTheDocument();
    expectLocalized("链接管理", "Link Management");
    expectLocalized(
      "管理公共 Model Hub 上 “实用链接” 下显示的链接。",
      "Manage the links that are displayed under 'Useful Links' on the public model hub.",
    );
    expectLocalized("添加新链接", "Add New Link");
    expectLocalized("显示名称", "Display Name");
    expectLocalized("管理现有链接", "Manage Existing Links");
    expectLocalized("公共 Model Hub", "Public Model Hub");
    expectLocalized("重新排序", "Rearrange Order");
    expectLocalized("添加链接", "Add Link");
    expectLocalized("操作", "Actions");
    expect(screen.getByPlaceholderText("友好名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Friendly name")).not.toBeInTheDocument();
    expect(screen.getAllByText("URL").length).toBeGreaterThan(0);
    expect(screen.getByTitle("打开公共 Model Hub")).toBeInTheDocument();
    expect(screen.queryByTitle("Open Public Model Hub")).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", async () => {
    mockedGetPublicModelHubInfo.mockResolvedValue(EMPTY_HUB_INFO);
    renderPanel();

    expect(await screen.findByText("尚未添加链接。请在上方添加新链接。")).toBeInTheDocument();
    expect(screen.queryByText("No links added yet. Add a new link above.")).not.toBeInTheDocument();
  });

  it("renders the row action tooltips in Chinese and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();
    await screen.findByText("First Link");

    await user.hover(screen.getByTestId("open-link-0-First Link"));
    expect(await screen.findByText("打开链接")).toBeInTheDocument();
    expect(screen.queryByText("Open link")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("edit-link-0-First Link"));
    expect(await screen.findByText("编辑链接")).toBeInTheDocument();
    expect(screen.queryByText("Edit link")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("delete-link-0-First Link"));
    expect(await screen.findByText("删除链接")).toBeInTheDocument();
    expect(screen.queryByText("Delete link")).not.toBeInTheDocument();
  });

  it("renders the rearrange controls and their tooltips in Chinese and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();
    await screen.findByText("First Link");

    await user.click(screen.getByRole("button", { name: "重新排序" }));

    expectLocalized("保存顺序", "Save Order");
    expectLocalized("取消", "Cancel");

    await user.hover(screen.getByTestId("move-down-0-First Link"));
    expect(await screen.findByText("下移")).toBeInTheDocument();
    expect(screen.queryByText("Move down")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("move-down-1-Second Link"));
    expect(await screen.findByText("已在底部")).toBeInTheDocument();
    expect(screen.queryByText("Already at the bottom")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("move-up-0-First Link"));
    expect(await screen.findByText("已在顶部")).toBeInTheDocument();
    expect(screen.queryByText("Already at the top")).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("move-up-1-Second Link"));
    expect(await screen.findByText("上移")).toBeInTheDocument();
    expect(screen.queryByText("Move up")).not.toBeInTheDocument();
  });

  it("renders the edit mode actions in Chinese and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();
    await screen.findByText("First Link");

    await user.click(screen.getByTestId("edit-link-0-First Link"));

    expectLocalized("保存", "Save");
    expectLocalized("取消", "Cancel");
  });

  it("reports the validation, duplicate and save failures in Chinese and not in English", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();
    await screen.findByText("First Link");

    await user.type(screen.getByPlaceholderText("友好名称"), "Broken");
    await user.type(screen.getByPlaceholderText("https://example.com"), "not-a-url");
    await user.click(screen.getByRole("button", { name: "添加链接" }));
    expect(toast.fromError).toHaveBeenCalledWith("请输入有效的 URL");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please enter a valid URL");

    await user.clear(screen.getByPlaceholderText("友好名称"));
    await user.type(screen.getByPlaceholderText("友好名称"), "First Link");
    await user.clear(screen.getByPlaceholderText("https://example.com"));
    await user.type(screen.getByPlaceholderText("https://example.com"), "https://dup.example.com");
    await user.click(screen.getByRole("button", { name: "添加链接" }));
    expect(toast.fromError).toHaveBeenCalledWith("已存在使用此显示名称的链接");
    expect(toast.fromError).not.toHaveBeenCalledWith("A link with this display name already exists");

    mockedUpdateUsefulLinksCall.mockRejectedValueOnce(new Error("boom"));
    await user.clear(screen.getByPlaceholderText("友好名称"));
    await user.type(screen.getByPlaceholderText("友好名称"), "Third Link");
    await user.clear(screen.getByPlaceholderText("https://example.com"));
    await user.type(screen.getByPlaceholderText("https://example.com"), "https://third.example.com");
    await user.click(screen.getByRole("button", { name: "添加链接" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存链接失败 - Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save links - Error: boom");
  });

  it("reports the add, update, delete and reorder confirmations in Chinese and not in English", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderPanel();
    await screen.findByText("First Link");

    await user.type(screen.getByPlaceholderText("友好名称"), "Third Link");
    await user.type(screen.getByPlaceholderText("https://example.com"), "https://third.example.com");
    await user.click(screen.getByRole("button", { name: "添加链接" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("链接添加成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Link added successfully");

    await user.click(screen.getAllByTestId(/^edit-link-/)[2]);
    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("链接更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Link updated successfully");

    await user.click(screen.getAllByTestId(/^delete-link-/)[2]);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("链接删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Link deleted successfully");

    await user.click(screen.getByRole("button", { name: "重新排序" }));
    await user.click(screen.getByRole("button", { name: "保存顺序" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("链接顺序保存成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Link order saved successfully");
  });
});
