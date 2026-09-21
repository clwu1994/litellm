import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import PassThroughInfoView from "./pass_through_info";

const updatePassThroughEndpoint = vi.fn();
const deletePassThroughEndpointsCall = vi.fn();

vi.mock("./networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./networking")>()),
  updatePassThroughEndpoint: (...args: unknown[]) => updatePassThroughEndpoint(...args),
  deletePassThroughEndpointsCall: (...args: unknown[]) => deletePassThroughEndpointsCall(...args),
  getProxyBaseUrl: () => "https://proxy.example.com",
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const minimal = {
  id: "ep-1",
  path: "/bria",
  target: "https://engine.prod.bria-api.com",
  headers: {},
  include_subpath: false,
  auth: false,
  methods: [],
};

const full = {
  id: "ep-1",
  path: "/bria",
  target: "https://engine.prod.bria-api.com",
  headers: { Authorization: "Bearer abc" },
  include_subpath: true,
  cost_per_request: 2,
  timeout: 600,
  auth: true,
  methods: ["GET"],
  guardrails: { pii: { request_fields: ["request_id"], response_fields: ["text"] }, custom: null },
};

const renderView = (data: typeof full | typeof minimal = full) =>
  render(<PassThroughInfoView endpointData={data} onClose={vi.fn()} accessToken="test-token" isAdmin premiumUser />);

const openSettingsTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("tab", { name: "设置" }));
};

const openEditForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await openSettingsTab(user);
  await user.click(screen.getByRole("button", { name: "编辑设置" }));
  await screen.findByLabelText("目标 URL");
};

describe("PassThroughInfoView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    updatePassThroughEndpoint.mockResolvedValue({});
    deletePassThroughEndpointsCall.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese overview chrome for a minimal endpoint", () => {
    renderView(minimal);

    expect(screen.getByText("透传 Endpoint：/bria")).toBeInTheDocument();
    expect(screen.queryByText("Pass Through Endpoint: /bria")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← 返回" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Back" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getAllByText("路径").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Path")).not.toBeInTheDocument();
    expect(screen.getByText("目标")).toBeInTheDocument();
    expect(screen.queryByText("Target")).not.toBeInTheDocument();
    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.queryByText("Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("精确路径")).toBeInTheDocument();
    expect(screen.queryByText("Exact Path")).not.toBeInTheDocument();
    expect(screen.getByText("无需认证")).toBeInTheDocument();
    expect(screen.queryByText("No Auth")).not.toBeInTheDocument();
    expect(screen.getByText("支持所有 HTTP 方法")).toBeInTheDocument();
    expect(screen.queryByText("All HTTP methods supported")).not.toBeInTheDocument();
    expect(screen.getAllByText("否").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders the Chinese overview chrome for a fully configured endpoint", async () => {
    const user = userEvent.setup();
    renderView(full);

    expect(screen.getAllByText("包含子路径").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Include Subpath")).not.toBeInTheDocument();
    expect(screen.getByText("需要认证")).toBeInTheDocument();
    expect(screen.queryByText("Auth Required")).not.toBeInTheDocument();
    expect(screen.getByText("HTTP 方法：")).toBeInTheDocument();
    expect(screen.queryByText("HTTP Methods:")).not.toBeInTheDocument();
    expect(screen.getByText("每次请求成本：$2")).toBeInTheDocument();
    expect(screen.queryByText("Cost per request: $2")).not.toBeInTheDocument();
    expect(screen.getAllByText("请求头").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Headers")).not.toBeInTheDocument();
    expect(screen.getByText("已配置 1 个请求头")).toBeInTheDocument();
    expect(screen.queryByText("1 headers configured")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("已配置 2 个 Guardrail")).toBeInTheDocument();
    expect(screen.queryByText("2 guardrails configured")).not.toBeInTheDocument();
    expect(screen.getByText("请求字段：request_id")).toBeInTheDocument();
    expect(screen.queryByText("Request fields: request_id")).not.toBeInTheDocument();
    expect(screen.getByText("响应字段：text")).toBeInTheDocument();
    expect(screen.queryByText("Response fields: text")).not.toBeInTheDocument();
    expect(screen.getByText("使用整个负载")).toBeInTheDocument();
    expect(screen.queryByText("Uses entire payload")).not.toBeInTheDocument();
    expect(screen.getAllByText("是").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();

    const toggles = screen.getAllByRole("button", { name: "显示请求头" });
    expect(screen.queryByRole("button", { name: "Show headers" })).not.toBeInTheDocument();
    await user.click(toggles[0]);
    expect(screen.getByRole("button", { name: "隐藏请求头" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide headers" })).not.toBeInTheDocument();
  });

  it("renders the Chinese settings read view for a fully configured endpoint", async () => {
    const user = userEvent.setup();
    renderView(full);
    await openSettingsTab(user);

    expect(screen.getByText("透传 Endpoint 设置")).toBeInTheDocument();
    expect(screen.queryByText("Pass Through Endpoint Settings")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 Endpoint" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Endpoint" })).not.toBeInTheDocument();
    expect(screen.getByText("目标 URL")).toBeInTheDocument();
    expect(screen.queryByText("Target URL")).not.toBeInTheDocument();
    expect(screen.getByText("请求超时")).toBeInTheDocument();
    expect(screen.queryByText("Request Timeout")).not.toBeInTheDocument();
    expect(screen.getByText("认证要求")).toBeInTheDocument();
    expect(screen.queryByText("Authentication Required")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty headers read view", async () => {
    const user = userEvent.setup();
    renderView(minimal);
    await openSettingsTab(user);

    expect(screen.getByText("未配置请求头")).toBeInTheDocument();
    expect(screen.queryByText("No headers configured")).not.toBeInTheDocument();
  });

  it("renders the Chinese settings edit form", async () => {
    const user = userEvent.setup();
    renderView(full);
    await openEditForm(user);

    expect(screen.getByLabelText("目标 URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Target URL")).not.toBeInTheDocument();
    expect(screen.getByLabelText("请求头（JSON）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Headers (JSON)")).not.toBeInTheDocument();
    expect(screen.getByText("HTTP 方法（可选）")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "包含子路径" })).toBeInTheDocument();
    expect(screen.getByLabelText("每次请求成本")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cost per Request")).not.toBeInTheDocument();
    expect(screen.getByLabelText("请求超时（秒）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Request Timeout (seconds)")).not.toBeInTheDocument();
    expect(
      screen.getByText("等待上游响应的最长时间。留空则使用全局 pass_through_request_timeout（默认 600 秒）。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Max time to wait for upstream response/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the Chinese validation message when the target is cleared", async () => {
    const user = userEvent.setup();
    renderView(full);
    await openEditForm(user);

    fireEvent.change(screen.getByLabelText("目标 URL"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("请输入目标 URL")).toBeInTheDocument();
    expect(screen.queryByText("Please input a target URL")).not.toBeInTheDocument();
  });

  it("reports the invalid headers toast in Chinese", async () => {
    const user = userEvent.setup();
    renderView(full);
    await openEditForm(user);

    fireEvent.change(screen.getByLabelText("请求头（JSON）"), { target: { value: "{" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(toast.fromError).toHaveBeenCalledWith("请求头的 JSON 格式无效");
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON format for headers");
    expect(updatePassThroughEndpoint).not.toHaveBeenCalled();
  });

  it("reports the update failure toast in Chinese", async () => {
    const user = userEvent.setup();
    updatePassThroughEndpoint.mockRejectedValue(new Error("boom"));
    renderView(full);
    await openEditForm(user);

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新透传 Endpoint 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update pass through endpoint");
  });

  it("reports the deleted endpoint toast in Chinese", async () => {
    const user = userEvent.setup();
    renderView(full);
    await openSettingsTab(user);

    await user.click(screen.getByRole("button", { name: "删除 Endpoint" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("透传 Endpoint 删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Pass through endpoint deleted successfully");
  });

  it("reports the delete failure toast in Chinese", async () => {
    const user = userEvent.setup();
    deletePassThroughEndpointsCall.mockRejectedValue(new Error("boom"));
    renderView(full);
    await openSettingsTab(user);

    await user.click(screen.getByRole("button", { name: "删除 Endpoint" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除透传 Endpoint 失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete pass through endpoint");
  });
});
