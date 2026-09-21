import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { PassThroughEndpointsTable } from "./PassThroughEndpointsTable";
import type { passThroughItem } from "./PassThroughSettings";

const endpoints: passThroughItem[] = [
  {
    id: "ep-1",
    path: "/v1/rerank",
    target: "https://api.cohere.com/v1/rerank",
    headers: { Authorization: "Bearer secret-value" },
    auth: true,
    methods: ["POST"],
  },
  { id: "ep-2", path: "/bria", target: "https://engine.prod.bria-api.com", headers: {}, auth: false },
  {
    id: "ep-config",
    path: "/from-config",
    target: "https://config.example.com",
    headers: {},
    is_from_config: true,
  },
];

const renderTable = (props: Partial<React.ComponentProps<typeof PassThroughEndpointsTable>> = {}) =>
  render(
    <PassThroughEndpointsTable
      endpoints={endpoints}
      isLoading={false}
      onEndpointClick={vi.fn()}
      onDeleteClick={vi.fn()}
      {...props}
    />,
  );

function findHintTrigger(label: string): Element | null {
  const labelElement = screen.getByText(label);
  return labelElement.closest("div")?.querySelector("svg") ?? null;
}

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = findHintTrigger(label);
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("PassThroughEndpointsTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "来源" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Source" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "路径" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Path" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "目标" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Target" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "方法" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Methods" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "认证" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "请求头" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Headers" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
  });

  it("renders the Chinese source, methods and auth cell labels", () => {
    renderTable();

    expect(screen.getByText("配置文件")).toBeInTheDocument();
    expect(screen.queryByText("Config")).not.toBeInTheDocument();
    expect(screen.getAllByText("数据库")).toHaveLength(2);
    expect(screen.queryByText("DB")).not.toBeInTheDocument();
    expect(screen.getAllByText("全部")).toHaveLength(2);
    expect(screen.queryByText("ALL")).not.toBeInTheDocument();
    expect(screen.getByText("是")).toBeInTheDocument();
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();
    expect(screen.getAllByText("否")).toHaveLength(2);
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state", () => {
    renderTable({ endpoints: [] });

    expect(screen.getByText("未配置透传 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("No pass-through endpoints configured")).not.toBeInTheDocument();
    expect(screen.getByText("添加透传 Endpoint 来路由自定义路径。")).toBeInTheDocument();
    expect(screen.queryByText("Add a pass-through endpoint to route custom paths.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message", () => {
    renderTable({ endpoints: [], isLoading: true });

    expect(screen.getByText("正在加载透传 Endpoint…")).toBeInTheDocument();
    expect(screen.queryByText("Loading pass-through endpoints…")).not.toBeInTheDocument();
  });

  it("renders the Chinese row action labels and config hint", async () => {
    const user = userEvent.setup();
    renderTable();

    expect(screen.getAllByLabelText("打开 Endpoint 操作")).toHaveLength(3);
    expect(screen.queryByLabelText("Open endpoint actions")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("endpoint-actions-ep-1"));
    expect(await screen.findByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByTestId("endpoint-actions-ep-config"));
    expect(await screen.findByTestId("endpoint-config-hint")).toHaveTextContent(
      "此 Endpoint 定义在配置文件中，无法在仪表盘上编辑或删除。",
    );
    expect(screen.getByTestId("endpoint-config-hint")).not.toHaveTextContent(
      "This endpoint is defined in the config file and cannot be edited or deleted on the dashboard.",
    );
  });

  it("renders the Chinese methods tooltip while it is open", async () => {
    const user = userEvent.setup();
    renderTable();

    await hoverHint(user, "方法");

    expect(await screen.findByText("此 Endpoint 支持的 HTTP 方法")).toBeInTheDocument();
    expect(screen.queryByText("HTTP methods supported by this endpoint")).not.toBeInTheDocument();
  });

  it("renders the Chinese authentication tooltip while it is open", async () => {
    const user = userEvent.setup();
    renderTable();

    await hoverHint(user, "认证");

    expect(await screen.findByText("调用此 Endpoint 需要 LiteLLM Virtual Key")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Virtual Key required to call endpoint")).not.toBeInTheDocument();
  });

  it("renders the Chinese header visibility toggle", async () => {
    const user = userEvent.setup();
    renderTable();

    const toggles = screen.getAllByRole("button", { name: "显示请求头" });
    expect(screen.queryByRole("button", { name: "Show headers" })).not.toBeInTheDocument();

    await user.click(toggles[0]);

    expect(screen.getByRole("button", { name: "隐藏请求头" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide headers" })).not.toBeInTheDocument();
  });
});
