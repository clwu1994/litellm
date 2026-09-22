/* eslint-disable testing-library/no-node-access -- The budget hint trigger is an icon with no accessible name, so reaching its tooltip needs the DOM */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

const { GET, PUT, DELETE, userRole } = vi.hoisted(() => ({
  GET: vi.fn(),
  PUT: vi.fn(),
  DELETE: vi.fn(),
  userRole: { current: "Admin" },
}));
vi.mock("@/lib/http/api", () => ({ fetchClient: { GET, PUT, DELETE } }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ accessToken: "sk-test", userRole: userRole.current }),
}));

import AccessGroupBudgetsPanel from "./AccessGroupBudgetsPanel";

const group = (accessGroup: string, budgetDuration: string | null, maxBudget: number | null) => ({
  access_group: accessGroup,
  model_names: [`${accessGroup}-nano`],
  deployment_count: 1,
  spend: 1.25,
  budget:
    budgetDuration === null
      ? null
      : {
          budget_id: `budget-${accessGroup}`,
          max_budget: maxBudget,
          soft_budget: null,
          budget_duration: budgetDuration,
          budget_reset_at: null,
        },
});

const GROUPS = [
  group("premium", "30d", 2.5),
  group("shared", null, null),
  group("hourly-group", "1h", 1),
  group("daily-group", "24h", 1),
  group("weekly-group", "7d", 1),
];

const renderPanel = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AccessGroupBudgetsPanel />
    </QueryClientProvider>,
  );
};

const openActions = async (accessGroup: string) => {
  await userEvent.click(await screen.findByTestId(`access-group-actions-${accessGroup}`));
};

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).closest("label")?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("AccessGroupBudgetsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    userRole.current = "Admin";
    GET.mockResolvedValue({ data: { access_groups: GROUPS } });
    PUT.mockResolvedValue({ data: { access_group: "shared", spend: 0, budget: null } });
    DELETE.mockResolvedValue({ data: { access_group: "premium", budget_deleted: true, message: "ok" } });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese panel description and every Chinese column header", async () => {
    renderPanel();

    expect(await screen.findByText("premium")).toBeInTheDocument();
    expect(
      screen.getByText(
        "一个模型访问组可以有一个预算，通过名称授予该组的每个 Virtual Key 共同从其中扣费。通过通配符或 all-proxy-models 访问该组模型的 Virtual Key 不计入此预算。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "A model access group can carry one budget that every key granted the group by name draws from together. Keys that reach the group's models through a wildcard or all-proxy-models are not charged against it.",
      ),
    ).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["访问组", "Access Group"],
      ["模型", "Models"],
      ["部署", "Deployments"],
      ["共享支出", "Shared Spend"],
      ["重置周期", "Resets"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders every Chinese reset-window label", async () => {
    renderPanel();

    await screen.findByText("premium");

    for (const [zh, en] of [
      ["每月", "monthly"],
      ["每小时", "hourly"],
      ["每天", "daily"],
      ["每周", "weekly"],
      ["未设置", "Not set"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese loading message while the groups are in flight", () => {
    GET.mockReturnValue(new Promise(() => {}));
    renderPanel();

    expect(screen.getByText("正在加载模型访问组…")).toBeInTheDocument();
    expect(screen.queryByText("Loading model access groups…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state", async () => {
    GET.mockResolvedValue({ data: { access_groups: [] } });
    renderPanel();

    expect(await screen.findByText("暂无模型访问组")).toBeInTheDocument();
    expect(screen.queryByText("No model access groups yet")).not.toBeInTheDocument();
    expect(screen.getByText("在部署的模型设置中将其加入访问组，然后在这里为该组设置共享预算。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Put a deployment in an access group from its model settings, then give the group a shared budget here.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese row action labels and the no-budget tooltip", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("premium");
    expect(screen.getByLabelText("打开 premium 的预算操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open budget actions for premium")).not.toBeInTheDocument();

    await openActions("premium");
    expect(await screen.findByRole("menuitem", { name: "编辑预算" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit budget" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "清除预算" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Clear budget" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await openActions("shared");
    expect(await screen.findByRole("menuitem", { name: "设置预算" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Set budget" })).not.toBeInTheDocument();
    expect(screen.getByTestId("access-group-action-clear-budget")).toHaveAttribute("title", "此访问组没有可清除的预算");
    expect(screen.getByTestId("access-group-action-clear-budget")).not.toHaveAttribute(
      "title",
      "This access group has no budget to clear",
    );
  });

  it("renders the Chinese write-blocked tooltip for a non-admin", async () => {
    userRole.current = "Admin Viewer";
    renderPanel();

    await screen.findByText("premium");
    await openActions("premium");

    expect(await screen.findByTestId("access-group-action-set-budget")).toHaveAttribute(
      "title",
      "只有代理管理员可以更改访问组预算",
    );
    expect(screen.getByTestId("access-group-action-set-budget")).not.toHaveAttribute(
      "title",
      "Only a proxy admin can change an access group budget",
    );
  });

  it("renders the Chinese slash-blocked tooltip for a group a path segment cannot carry", async () => {
    GET.mockResolvedValue({ data: { access_groups: [group("openai/prod", null, null)] } });
    renderPanel();

    await screen.findByText("openai/prod");
    await openActions("openai/prod");

    expect(await screen.findByTestId("access-group-action-set-budget")).toHaveAttribute(
      "title",
      "无法为名称包含斜杠的访问组设置预算",
    );
    expect(screen.getByTestId("access-group-action-set-budget")).not.toHaveAttribute(
      "title",
      "A budget cannot be set on a group whose name contains a slash",
    );
  });

  it("renders the Chinese set-budget modal chrome and hints", async () => {
    const user = userEvent.setup({ delay: null });
    renderPanel();

    await screen.findByText("shared");
    await openActions("shared");
    await user.click(await screen.findByRole("menuitem", { name: "设置预算" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "设置“shared”的预算" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: 'Set budget for "shared"' })).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "通过名称授予此访问组的每个 Virtual Key 共用这一个预算。通过通配符或访问该组模型的 Virtual Key 不计入此预算。",
      ),
    ).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(
      "Every key granted this access group by name draws from this one budget. A key that reaches the group's models through a wildcard or all-proxy-models is not charged against it.",
    );

    for (const [zh, en] of [
      ["最大预算（USD）", "Max Budget (USD)"],
      ["软预算（USD）", "Soft Budget (USD)"],
      ["重置预算", "Reset Budget"],
    ] as const) {
      expect(within(dialog).getByText(zh)).toBeInTheDocument();
      expect(within(dialog).queryByText(en)).not.toBeInTheDocument();
    }

    expect(
      within(dialog).getByText("留空的字段会保留预算原有的值。使用“清除预算”可移除预算本身。"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "A field left blank keeps whatever the budget already has. Use Clear budget to remove the budget itself.",
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "保存预算" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Save Budget" })).not.toBeInTheDocument();

    await hoverHint(user, "最大预算（USD）");
    expect(
      await screen.findByText("整个访问组的总支出上限。当共享支出达到此值时，所有从该组扣费的 Virtual Key 都会被拒绝"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Total the whole group may spend. Once its shared spend reaches this, every key that draws from the group is refused",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "软预算（USD）");
    expect(await screen.findByText("当该组支出达到此值时触发告警。请求仍会继续成功")).toBeInTheDocument();
    expect(
      screen.queryByText("Fires an alert when the group's spend reaches this. Requests keep succeeding"),
    ).not.toBeInTheDocument();

    await hoverHint(user, "重置预算");
    expect(await screen.findByText("该组支出的重置频率。留空表示预算永不重置")).toBeInTheDocument();
    expect(
      screen.queryByText("How often the group's spend resets. Leave empty for a budget that never resets"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese edit-budget modal title", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("premium");
    await openActions("premium");
    await user.click(await screen.findByRole("menuitem", { name: "编辑预算" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "编辑“premium”的预算" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: 'Edit budget for "premium"' })).not.toBeInTheDocument();
  });

  it("renders the Chinese validation error when every field is blank", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("shared");
    await openActions("shared");
    await user.click(await screen.findByRole("menuitem", { name: "设置预算" }));
    await user.click(await screen.findByRole("button", { name: "保存预算" }));

    expect(await screen.findByText("请至少设置最大预算、软预算或重置周期中的一项")).toBeInTheDocument();
    expect(screen.queryByText("Set at least one of max budget, soft budget or reset window")).not.toBeInTheDocument();
  });

  it("renders the Chinese saving label while the save is in flight", async () => {
    const user = userEvent.setup();
    PUT.mockReturnValue(new Promise(() => {}));
    renderPanel();

    await screen.findByText("shared");
    await openActions("shared");
    await user.click(await screen.findByRole("menuitem", { name: "设置预算" }));
    fireEvent.change(await screen.findByLabelText("最大预算（USD）"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "保存预算" }));

    expect(await screen.findByRole("button", { name: "保存中…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });

  it("reports the saved budget toast in Chinese", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("shared");
    await openActions("shared");
    await user.click(await screen.findByRole("menuitem", { name: "设置预算" }));
    fireEvent.change(await screen.findByLabelText("最大预算（USD）"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "保存预算" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已为“shared”保存预算"));
    expect(toast.success).not.toHaveBeenCalledWith('Budget saved for "shared"');
  });

  it("renders the Chinese clear dialog chrome and reports the cleared toast in Chinese", async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText("premium");
    await openActions("premium");
    await user.click(await screen.findByRole("menuitem", { name: "清除预算" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("heading", { name: "清除预算" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("heading", { name: "Clear Budget" })).not.toBeInTheDocument();
    expect(
      within(dialog).getByText("确定要清除此访问组的预算吗？已记录的共享支出会一并清除，该组的模型仍可继续使用。"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Are you sure you want to clear this access group's budget? The recorded shared spend is cleared with it, and the group's models stay available.",
      ),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("访问组", { selector: "dt" })).toBeInTheDocument();
    expect(within(dialog).getByText("最大预算", { selector: "dt" })).toBeInTheDocument();
    expect(within(dialog).queryByText("Max Budget")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已为“premium”清除预算"));
    expect(toast.success).not.toHaveBeenCalledWith('Budget cleared for "premium"');
  });
});
