import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { deleteClaudeCodePlugin, getClaudeCodePluginsList } from "@/components/networking";
import type { Plugin } from "@/components/claude_code_plugins/types";
import { toast } from "@/lib/toast";

import ClaudeCodePluginsPanel from "./ClaudeCodePluginsPanel";

vi.mock("@/components/networking", () => ({
  getClaudeCodePluginsList: vi.fn(),
  deleteClaudeCodePlugin: vi.fn(),
  registerClaudeCodePlugin: vi.fn(),
}));

const mockGetClaudeCodePluginsList = vi.mocked(getClaudeCodePluginsList);
const mockDeleteClaudeCodePlugin = vi.mocked(deleteClaudeCodePlugin);

const PLUGIN_WITH_METADATA: Plugin = {
  id: "plugin-1",
  name: "my-skill",
  version: "1.2.0",
  description: "A skill for testing",
  source: { source: "github", repo: "acme/my-skill" },
  category: "development",
  enabled: true,
  created_at: "2025-01-15T10:30:00Z",
};

const PLUGIN_WITHOUT_METADATA: Plugin = {
  id: "plugin-2",
  name: "older-skill",
  source: { source: "github", repo: "acme/older-skill" },
  enabled: false,
  created_at: "2024-01-10T09:15:00Z",
};

const PLUGINS = [PLUGIN_WITH_METADATA, PLUGIN_WITHOUT_METADATA];

const renderPanel = () => renderWithProviders(<ClaudeCodePluginsPanel accessToken="sk-test" userRole="Admin" />);

const openRowActions = async (user: ReturnType<typeof userEvent.setup>, actionLabel: string) => {
  await screen.findByText("my-skill");
  const triggers = screen.getAllByRole("button", { name: actionLabel });
  await user.click(triggers[0]);
};

const openDeleteDialog = async (user: ReturnType<typeof userEvent.setup>, actionLabel: string, deleteLabel: string) => {
  await openRowActions(user, actionLabel);
  await user.click(await screen.findByRole("menuitem", { name: deleteLabel }));
  return screen.findByRole("alertdialog");
};

describe("ClaudeCodePluginsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: PLUGINS, count: PLUGINS.length });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page chrome and hides the English original", async () => {
    renderPanel();

    expect(await screen.findByRole("heading", { name: "技能" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();

    const description = screen.getByText(/注册 Claude Code 技能/);
    expect(description).toHaveTextContent(
      "注册 Claude Code 技能。已发布的技能会出现在所有用户的 Skill Hub 中，并通过 /claude-code/marketplace.json 提供。",
    );
    expect(description).not.toHaveTextContent(
      "Register Claude Code skills. Published skills appear in the Skill Hub for all users and are served via /claude-code/marketplace.json.",
    );

    expect(screen.getByRole("button", { name: "+ 添加技能" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Skill" })).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message while the skills are loading", async () => {
    mockGetClaudeCodePluginsList.mockReturnValue(new Promise(() => {}));
    renderPanel();

    expect(await screen.findByText("正在加载技能…")).toBeInTheDocument();
    expect(screen.queryByText("Loading skills…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", async () => {
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: [], count: 0 });
    renderPanel();

    expect(await screen.findByText("未找到技能")).toBeInTheDocument();
    expect(screen.getByText("添加一个技能即可开始。")).toBeInTheDocument();
    expect(screen.queryByText("No skills found")).not.toBeInTheDocument();
    expect(screen.queryByText("Add one to get started.")).not.toBeInTheDocument();
  });

  it("renders the Chinese column headers and hides the English originals", async () => {
    renderPanel();
    await screen.findByText("my-skill");

    expect(screen.getByRole("columnheader", { name: "技能名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "版本" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "描述" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "类别" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "公开" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "创建时间" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();

    expect(screen.queryByRole("columnheader", { name: "Skill Name" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Version" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Description" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Public" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Created At" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("renders the Chinese cell fallbacks and public flags and hides the English originals", async () => {
    renderPanel();
    await screen.findByText("my-skill");

    expect(screen.getByText("不适用")).toBeInTheDocument();
    expect(screen.getByText("无描述")).toBeInTheDocument();
    expect(screen.getByText("未分类")).toBeInTheDocument();
    expect(screen.getByText("是")).toBeInTheDocument();
    expect(screen.getByText("否")).toBeInTheDocument();

    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    expect(screen.queryByText("No description")).not.toBeInTheDocument();
    expect(screen.queryByText("Uncategorized")).not.toBeInTheDocument();
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions and the Chinese copy toast and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("my-skill");
    expect(screen.getAllByRole("button", { name: "打开技能操作" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Open skill actions" })).not.toBeInTheDocument();

    await openRowActions(user, "打开技能操作");

    expect(await screen.findByRole("menuitem", { name: "复制技能 ID" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copy skill ID" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();

    await user.click(screen.getByTestId("plugin-action-copy"));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制技能 ID"));
    expect(toast.success).not.toHaveBeenCalledWith("Skill ID copied");
  });

  it("renders the Chinese delete confirmation and success toast and hides the English originals", async () => {
    const user = userEvent.setup();
    mockDeleteClaudeCodePlugin.mockResolvedValue({});
    renderPanel();

    const dialog = await openDeleteDialog(user, "打开技能操作", "删除");

    expect(within(dialog).getByText("删除技能")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Skill")).not.toBeInTheDocument();

    const description = within(dialog).getByText(/确定要删除技能/);
    expect(description).toHaveTextContent("确定要删除技能：my-skill？");
    expect(description).not.toHaveTextContent("Are you sure you want to delete skill");

    expect(within(dialog).getByText("此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText("This action cannot be undone.")).not.toBeInTheDocument();

    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("技能 “my-skill” 删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith('Skill "my-skill" deleted successfully');
  });

  it("renders the Chinese delete failure toast and hides the English original", async () => {
    const user = userEvent.setup();
    mockDeleteClaudeCodePlugin.mockRejectedValueOnce(new Error("boom"));
    renderPanel();

    const dialog = await openDeleteDialog(user, "打开技能操作", "删除");
    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("删除技能失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete skill");
  });
});

describe("ClaudeCodePluginsPanel English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: PLUGINS, count: PLUGINS.length });
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English page chrome, columns, cells and row actions byte-identical", async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText("my-skill");

    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    const description = screen.getByText(/Register Claude Code skills/);
    expect(description).toHaveTextContent(
      "Register Claude Code skills. Published skills appear in the Skill Hub for all users and are served via /claude-code/marketplace.json.",
    );
    expect(screen.getByRole("button", { name: "+ Add Skill" })).toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: "Skill Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Version" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Description" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Public" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Created At" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();

    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("No description")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();

    await openRowActions(user, "Open skill actions");
    expect(await screen.findByRole("menuitem", { name: "Copy skill ID" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();

    await user.click(screen.getByTestId("plugin-action-copy"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Skill ID copied"));
  });

  it("keeps the original English loading and empty copy byte-identical", async () => {
    mockGetClaudeCodePluginsList.mockReturnValue(new Promise(() => {}));
    renderPanel();
    expect(await screen.findByText("Loading skills…")).toBeInTheDocument();

    cleanup();
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: [], count: 0 });
    renderPanel();
    expect(await screen.findByText("No skills found")).toBeInTheDocument();
    expect(screen.getByText("Add one to get started.")).toBeInTheDocument();
  });

  it("keeps the original English delete confirmation byte-identical", async () => {
    const user = userEvent.setup();
    mockDeleteClaudeCodePlugin.mockResolvedValue({});
    renderPanel();

    const dialog = await openDeleteDialog(user, "Open skill actions", "Delete");

    expect(within(dialog).getByText("Delete Skill")).toBeInTheDocument();
    const description = within(dialog).getByText(/Are you sure you want to delete skill/);
    expect(description).toHaveTextContent("Are you sure you want to delete skill: my-skill?");
    expect(within(dialog).getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("keeps the original English delete success toast byte-identical", async () => {
    const user = userEvent.setup();
    mockDeleteClaudeCodePlugin.mockResolvedValue({});
    renderPanel();

    const dialog = await openDeleteDialog(user, "Open skill actions", "Delete");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Skill "my-skill" deleted successfully'));
  });

  it("keeps the original English delete failure toast byte-identical", async () => {
    const user = userEvent.setup();
    mockDeleteClaudeCodePlugin.mockRejectedValueOnce(new Error("boom"));
    renderPanel();

    const dialog = await openDeleteDialog(user, "Open skill actions", "Delete");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete skill"));
  });
});
