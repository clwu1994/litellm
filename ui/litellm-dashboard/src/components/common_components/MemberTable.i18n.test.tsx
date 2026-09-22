import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import type { Member } from "@/components/networking";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";

import MemberTable from "./MemberTable";

const MEMBERS: Member[] = [
  { user_id: "u-zed", user_email: "zed@example.com", user_alias: "Zed Ortiz", role: "user" },
  { user_id: "u-amy", user_email: "amy@example.com", user_alias: "amy chen", role: "admin" },
];

const renderTable = (members: Member[] = MEMBERS) =>
  renderWithProviders(
    <MemberTable members={members} canEdit onEdit={vi.fn()} onDelete={vi.fn()} onAddMember={vi.fn()} />,
  );

describe("MemberTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers and hides the English originals", () => {
    renderTable();

    expect(screen.getByText("名称")).toBeInTheDocument();
    expect(screen.getByText("用户邮箱")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("角色")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("User Email")).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders the Chinese member count and add button and hides the English originals", () => {
    renderTable();

    expect(screen.getByText("2 位成员")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加成员/ })).toBeInTheDocument();
    expect(screen.queryByText("2 Members")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Member/ })).not.toBeInTheDocument();
  });

  it("uses the singular Chinese member count for one member", () => {
    renderTable([MEMBERS[0]]);

    expect(screen.getByText("1 位成员")).toBeInTheDocument();
    expect(screen.queryByText("1 Member")).not.toBeInTheDocument();
  });

  it("renders the Chinese search placeholder and hides the English original", () => {
    renderTable();

    expect(screen.getByPlaceholderText("按姓名、邮箱或用户 ID 搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by name, email, or user ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese filter drawer copy and role option and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByTestId("datatable-filters-trigger"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("缩小成员范围")).toBeInTheDocument();
    expect(within(dialog).getByText("所有角色")).toBeInTheDocument();
    expect(within(dialog).queryByText("Narrow down members")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("All Roles")).not.toBeInTheDocument();
  });

  it("renders the Chinese member action tooltips and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.hover(screen.getAllByTestId("edit-member")[0]);
    expect(await screen.findByText("编辑成员")).toBeInTheDocument();
    expect(screen.queryByText("Edit member")).not.toBeInTheDocument();

    await user.hover(screen.getAllByTestId("delete-member")[0]);
    expect(await screen.findByText("删除成员")).toBeInTheDocument();
    expect(screen.queryByText("Delete member")).not.toBeInTheDocument();
  });

  it("renders the Chinese narrowed empty state and hides the English original", async () => {
    renderTable();

    fireEvent.change(screen.getByTestId("datatable-search"), { target: { value: "zzz-no-match" } });

    expect(await screen.findByText("没有符合搜索或筛选条件的成员")).toBeInTheDocument();
    expect(screen.queryByText("No members match your search or filters")).not.toBeInTheDocument();
  });

  it("renders raw role identifiers through the alias in the role cell and the filter options", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();

    await user.click(screen.getByTestId("datatable-filters-trigger"));
    await user.click(await screen.findByTestId("filter-role"));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("admin")).toBeInTheDocument();
    expect(within(listbox).getByText("user")).toBeInTheDocument();
  });

  it("renders the Chinese default-admin badge and hides the English original", () => {
    renderTable([{ user_id: "default_user_id", user_email: "admin@example.com", user_alias: "Admin", role: "admin" }]);

    expect(screen.getByText("默认 Proxy 管理员")).toBeInTheDocument();
    expect(screen.queryByText("Default Proxy Admin")).not.toBeInTheDocument();
  });
});
