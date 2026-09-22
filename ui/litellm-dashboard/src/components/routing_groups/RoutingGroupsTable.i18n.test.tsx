import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import RoutingGroupsTable from "./RoutingGroupsTable";
import type { RoutingGroup } from "./types";

const GROUPS: RoutingGroup[] = [
  { group_name: "prod-group", models: ["gpt-4o"], routing_strategy: "usage-based-routing" },
  { group_name: "dev-group", models: ["gpt-4o-mini"], routing_strategy: "simple-shuffle" },
];

const renderTable = (groups: RoutingGroup[] = GROUPS, isLoading = false) =>
  renderWithProviders(<RoutingGroupsTable groups={groups} isLoading={isLoading} onEdit={vi.fn()} onDelete={vi.fn()} />);

describe("RoutingGroupsTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and strategy labels in Chinese", () => {
    renderTable();

    expect(screen.getByText("分组名称")).toBeInTheDocument();
    expect(screen.queryByText("Group Name")).not.toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.queryByText("Models")).not.toBeInTheDocument();
    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.queryByText("Strategy")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();

    expect(screen.getByText("基于用量")).toBeInTheDocument();
    expect(screen.queryByText("Usage Based")).not.toBeInTheDocument();
    expect(screen.getByText("简单随机")).toBeInTheDocument();
    expect(screen.queryByText("Simple Shuffle")).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese", () => {
    renderTable([]);

    expect(screen.getByText("暂无路由分组")).toBeInTheDocument();
    expect(screen.queryByText("No routing groups yet")).not.toBeInTheDocument();
    expect(screen.getByText("创建一个分组，将一组模型负载均衡到同一个名称下。")).toBeInTheDocument();
    expect(
      screen.queryByText("Create a group to load-balance a set of models behind one name."),
    ).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese", () => {
    renderTable([], true);

    expect(screen.getByText("正在加载路由分组…")).toBeInTheDocument();
    expect(screen.queryByText("Loading routing groups…")).not.toBeInTheDocument();
  });

  it("renders the row actions in Chinese", async () => {
    const user = userEvent.setup();
    renderTable();

    const trigger = screen.getByTestId("routing-group-actions-prod-group");
    expect(trigger).toHaveAccessibleName("打开 prod-group 的操作");
    expect(trigger).not.toHaveAccessibleName("Open actions for prod-group");

    await user.click(trigger);

    expect(await screen.findByText("编辑")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.getByText("删除")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("renders the usage panel copy in Chinese inside the expanded row", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "prod-group" }));

    expect(await screen.findByText("此分组的路由方式")).toBeInTheDocument();
    expect(screen.queryByText("How routing works for this group")).not.toBeInTheDocument();

    const paragraph = screen.getByText(/调用方按名称请求/);
    expect(paragraph).toHaveTextContent(
      "调用方按名称请求分组中的任意模型；LiteLLM 会在后台使用基于用量策略选择一个部署。",
    );
    expect(paragraph).not.toHaveTextContent("Callers request any model in the group by name");
    expect(screen.queryByText(/Callers request any model in the group by name/)).not.toBeInTheDocument();
  });
});
