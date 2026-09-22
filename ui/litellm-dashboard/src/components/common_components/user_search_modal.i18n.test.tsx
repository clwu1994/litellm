import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { userFilterUICall } from "@/components/networking";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";

import UserSearchModal from "./user_search_modal";

vi.mock("@/components/networking", () => ({ userFilterUICall: vi.fn().mockResolvedValue([]) }));

const renderModal = () =>
  renderWithProviders(<UserSearchModal isVisible onCancel={vi.fn()} onSubmit={vi.fn()} accessToken="sk-test" />);

describe("UserSearchModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, labels and notice and hides the English originals", () => {
    renderModal();

    expect(screen.getByText("添加团队成员")).toBeInTheDocument();
    expect(screen.getByText("邮箱")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("成员角色")).toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(
      screen.getByText("搜索只会从已存在的用户中选择。如需添加新用户，请先让 Proxy 管理员为其创建账号。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加成员/ })).toBeInTheDocument();

    expect(screen.queryByText("Add Team Member")).not.toBeInTheDocument();
    expect(screen.queryByText("Member Role")).not.toBeInTheDocument();
    expect(screen.queryByText("OR")).not.toBeInTheDocument();
    expect(screen.queryByText(/Search selects from users that already exist/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Member/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese search placeholders and hides the English originals", () => {
    renderModal();

    expect(screen.getByPlaceholderText("按邮箱搜索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按用户 ID 搜索")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by email")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by user ID")).not.toBeInTheDocument();
  });

  it("renders the Chinese default role descriptions and hides the English originals", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("combobox", { name: /成员角色/ }));

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("admin")).toBeInTheDocument();
    expect(within(listbox).getByText("user")).toBeInTheDocument();
    expect(within(listbox).getByText("- 管理员角色。可以创建团队密钥、添加成员并管理设置。")).toBeInTheDocument();
    expect(within(listbox).getByText("- 用户角色。可以查看团队信息，但不能管理团队。")).toBeInTheDocument();
    expect(
      within(listbox).queryByText("- Admin role. Can create team keys, add members, and manage settings."),
    ).not.toBeInTheDocument();
    expect(within(listbox).queryByText("- User role. Can view team info, but not manage it.")).not.toBeInTheDocument();
  });

  it("renders the Chinese adding label while submitting and hides the English original", async () => {
    const user = userEvent.setup();
    vi.mocked(userFilterUICall).mockResolvedValue([{ user_id: "u1", user_email: "a@b.c", role: "user" }] as never);
    renderWithProviders(
      <UserSearchModal isVisible onCancel={vi.fn()} onSubmit={() => new Promise(() => {})} accessToken="sk-test" />,
    );

    const input = within(screen.getByTestId("member-email-search")).getByRole("combobox");
    await user.click(input);
    await user.type(input, "a");
    await waitFor(() => expect(userFilterUICall).toHaveBeenCalled(), { timeout: 3000 });
    await user.click(await screen.findByRole("option", { name: "a@b.c" }));
    await user.click(screen.getByRole("button", { name: /添加成员/ }));

    expect(await screen.findByRole("button", { name: "添加中..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adding..." })).not.toBeInTheDocument();
  });
});
