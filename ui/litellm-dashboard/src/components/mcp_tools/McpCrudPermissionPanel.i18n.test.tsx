import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import McpCrudPermissionPanel from "./McpCrudPermissionPanel";

const tools = [
  { name: "list-users" },
  { name: "get-user" },
  { name: "create-user" },
  { name: "update-user" },
  { name: "delete-user" },
  { name: "mysteryop" },
];

const renderPanel = (value: string[] | undefined) =>
  render(<McpCrudPermissionPanel tools={tools} value={value} onChange={vi.fn()} />);

describe("McpCrudPermissionPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the group labels, risk badges and descriptions in Chinese and hides the English originals", () => {
    renderPanel(undefined);

    expect(screen.getByText("读取")).toBeInTheDocument();
    expect(screen.getByText("创建")).toBeInTheDocument();
    expect(screen.getByText("更新")).toBeInTheDocument();
    expect(screen.getByText("删除")).toBeInTheDocument();
    expect(screen.getByText("其他")).toBeInTheDocument();
    expect(screen.getByText("安全操作：获取、列表、搜索。无副作用。")).toBeInTheDocument();
    expect(screen.getByText("新增资源：插入、上传、注册。")).toBeInTheDocument();
    expect(screen.getByText("修改现有资源：编辑、修补、重命名。")).toBeInTheDocument();
    expect(screen.getByText("破坏性操作：移除、清除、销毁。")).toBeInTheDocument();
    expect(screen.getAllByText("安全")).toHaveLength(1);
    expect(screen.getAllByText("中风险")).toHaveLength(2);
    expect(screen.getByText("高风险")).toBeInTheDocument();
    expect(screen.queryByText("Read")).not.toBeInTheDocument();
    expect(screen.queryByText("Create")).not.toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
    expect(screen.queryByText("Safe operations — fetch, list, search. No side effects.")).not.toBeInTheDocument();
    expect(screen.queryByText("Add new resources — insert, upload, register.")).not.toBeInTheDocument();
    expect(screen.queryByText("Modify existing resources — edit, patch, rename.")).not.toBeInTheDocument();
    expect(screen.queryByText("Destructive operations — remove, purge, destroy.")).not.toBeInTheDocument();
    expect(screen.queryByText("High Risk")).not.toBeInTheDocument();
    expect(screen.queryByText("Medium Risk")).not.toBeInTheDocument();
    expect(screen.queryByText("Safe")).not.toBeInTheDocument();
  });

  it("renders the allowed counts, bulk state, tool badges and group aria-labels in Chinese and hides the English originals", () => {
    renderPanel(undefined);

    expect(screen.getByText("已允许 2/2")).toBeInTheDocument();
    expect(screen.getAllByText("已允许 1/1")).toHaveLength(4);
    expect(screen.getAllByText("全部开启")).toHaveLength(5);
    expect(screen.getAllByText("开")).toHaveLength(5);
    expect(screen.getByLabelText("允许所有读取工具")).toBeInTheDocument();
    expect(screen.getByLabelText("允许所有其他工具")).toBeInTheDocument();
    expect(screen.queryByText("2/2 allowed")).not.toBeInTheDocument();
    expect(screen.queryByText("1/1 allowed")).not.toBeInTheDocument();
    expect(screen.queryByText("All on")).not.toBeInTheDocument();
    expect(screen.queryByText("on")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Allow all Read tools")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Allow all Other tools")).not.toBeInTheDocument();
  });

  it("renders the partial and all-off states in Chinese and hides the English originals", () => {
    renderPanel(["list-users"]);

    expect(screen.getByText("部分开启")).toBeInTheDocument();
    expect(screen.getByText("已允许 1/2")).toBeInTheDocument();
    expect(screen.getAllByText("全部关闭")).toHaveLength(4);
    expect(screen.getAllByText("关").length).toBeGreaterThan(0);
    expect(screen.queryByText("Partial")).not.toBeInTheDocument();
    expect(screen.queryByText("All off")).not.toBeInTheDocument();
    expect(screen.queryByText("off")).not.toBeInTheDocument();
  });

  it("renders the unclassified group copy in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderPanel(undefined);

    expect(screen.getByText("未分类")).toBeInTheDocument();
    expect(screen.queryByText("Unclassified")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /其他/ }));

    expect(screen.getByText("无法自动归类的操作。")).toBeInTheDocument();
    expect(screen.queryByText("Operations that could not be automatically classified.")).not.toBeInTheDocument();
  });
});
