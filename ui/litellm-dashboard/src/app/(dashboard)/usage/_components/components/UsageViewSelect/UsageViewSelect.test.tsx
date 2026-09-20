import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseSelectOption } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { UsageViewSelect } from "./UsageViewSelect";

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox"));
};

// The listbox is portalled outside the render container in both antd and Base UI, so an
// option is "offered" when the label appears more times on the page than inside the trigger.
const offers = (container: HTMLElement, label: string) =>
  screen.queryAllByText(label).length > within(container).queryAllByText(label).length;

describe("UsageViewSelect", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" />);

    expect(screen.getByText("Usage View")).toBeInTheDocument();
    expect(screen.getByText("Select the usage data you want to view")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await openMenu(user);
    expect(offers(container, "Your Usage")).toBe(true);
  });

  it("should call onChange when value changes", async () => {
    const user = userEvent.setup();
    render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Admin" />);

    await chooseSelectOption(user, screen.getByRole("combobox"), /^Team Usage/);

    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange.mock.calls[0][0]).toBe("team");
  });

  it("should show Tag Usage for non-admin users with tag usage permission", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" canViewTagUsage={true} />,
    );

    await openMenu(user);
    expect(offers(container, "Tag Usage")).toBe(true);
  });

  it("should hide Tag Usage for non-admin users without tag usage permission", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" />);

    await openMenu(user);
    expect(offers(container, "Tag Usage")).toBe(false);
  });

  it.each(["Organization Usage", "Agent Usage (A2A)"])("should show %s to an admin", async (optionName) => {
    const user = userEvent.setup();
    const { container } = render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Admin" />);

    await openMenu(user);
    expect(offers(container, optionName)).toBe(true);
  });

  it.each(["Organization Usage", "Agent Usage (A2A)"])("should hide %s from an internal user", async (optionName) => {
    const user = userEvent.setup();
    const { container } = render(
      <UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" canViewTagUsage={true} />,
    );

    await openMenu(user);
    expect(offers(container, optionName)).toBe(false);
  });

  // An org admin's session role is "Internal User" — org-admin-ness lives in the
  // membership table — so the two rows above cannot tell them apart from a plain
  // internal user. Organization Usage must open for them, and only that option:
  // the proxy serves them /organization/daily/activity scoped to the orgs they
  // administer, but still refuses the agent usage route.
  it.each([
    ["Organization Usage", true],
    ["Agent Usage (A2A)", false],
  ] as const)("should offer %s to an org admin: %s", async (optionName, expected) => {
    const user = userEvent.setup();
    const { container } = render(
      <UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" isOrgAdmin={true} />,
    );

    await openMenu(user);
    expect(offers(container, optionName)).toBe(expected);
  });

  it.each(["Team Usage", "Tag Usage"])("should keep %s available to an internal user", async (optionName) => {
    const user = userEvent.setup();
    const { container } = render(
      <UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" canViewTagUsage={true} />,
    );

    await openMenu(user);
    expect(offers(container, optionName)).toBe(true);
  });
});

describe("UsageViewSelect Chinese copy", () => {
  const mockOnChange = vi.fn();

  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title and description and hides the English ones", () => {
    render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" />);

    expect(screen.getByText("用量视图")).toBeInTheDocument();
    expect(screen.getByText("选择要查看的用量数据")).toBeInTheDocument();
    expect(screen.queryByText("Usage View")).not.toBeInTheDocument();
    expect(screen.queryByText("Select the usage data you want to view")).not.toBeInTheDocument();
  });

  it("offers every option label and description in Chinese to an admin and hides the English ones", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UsageViewSelect value="global" onChange={mockOnChange} userRole="Admin" canViewTagUsage={true} />,
    );

    await openMenu(user);

    expect(await screen.findAllByRole("option")).toHaveLength(9);

    for (const label of [
      "全局用量",
      "你的用量",
      "组织用量",
      "团队用量",
      "客户用量",
      "标签用量",
      "Agent 用量（A2A）",
      "用户用量",
      "用户 Agent 活动",
    ]) {
      expect(offers(container, label)).toBe(true);
    }
    for (const description of [
      "查看所有资源的用量",
      "查看你自己的用量",
      "查看所有组织的用量",
      "按团队查看用量",
      "按客户账户查看用量",
      "按标签分组查看用量",
      "按 AI Agent 查看用量",
      "按单个用户查看用量",
      "查看详细的用户 Agent 活动日志",
    ]) {
      expect(offers(container, description)).toBe(true);
    }

    for (const label of [
      "Global Usage",
      "Organization Usage",
      "Team Usage",
      "Customer Usage",
      "Tag Usage",
      "Agent Usage (A2A)",
      "User Usage",
      "User Agent Activity",
    ]) {
      expect(offers(container, label)).toBe(false);
    }
    for (const description of [
      "View usage across all resources",
      "View your own usage",
      "View usage across all organizations",
      "View usage by team",
      "View usage by customer accounts",
      "View usage grouped by tags",
      "View usage by AI agents",
      "View usage by individual users",
      "View detailed user agent activity logs",
    ]) {
      expect(offers(container, description)).toBe(false);
    }
  });

  it("offers the non-admin global label and description in Chinese and hides the English ones", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsageViewSelect value="global" onChange={mockOnChange} userRole="Internal User" />);

    expect(screen.getByText("你的用量")).toBeInTheDocument();
    await openMenu(user);
    expect(offers(container, "查看你的用量")).toBe(true);

    expect(screen.queryByText("Your Usage")).not.toBeInTheDocument();
    expect(offers(container, "View your usage")).toBe(false);
    expect(offers(container, "Global Usage")).toBe(false);
    expect(offers(container, "View usage across all resources")).toBe(false);
  });
});
