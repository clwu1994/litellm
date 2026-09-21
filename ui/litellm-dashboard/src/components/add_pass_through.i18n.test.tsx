import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { chooseSelectOption } from "../../tests/test-utils";
import AddPassThroughEndpoint from "./add_pass_through";

const createPassThroughEndpoint = vi.fn();

vi.mock("./networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./networking")>()),
  createPassThroughEndpoint: (...args: unknown[]) => createPassThroughEndpoint(...args),
  getProxyBaseUrl: () => "https://proxy.example.com",
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const setup = () => userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
type User = ReturnType<typeof setup>;

const renderForm = () =>
  render(
    <AddPassThroughEndpoint accessToken="test-token" passThroughItems={[]} setPassThroughItems={vi.fn()} premiumUser />,
  );

const openModal = async (user: User) => {
  await user.click(screen.getByRole("button", { name: "+ 添加透传 Endpoint" }));
  await screen.findByText("路由配置");
};

const fillRequired = async (user: User) => {
  fireEvent.change(screen.getByPlaceholderText("bria"), { target: { value: "bria" } });
  fireEvent.change(screen.getByPlaceholderText("https://engine.prod.bria-api.com"), {
    target: { value: "https://example.com" },
  });
  await user.click(screen.getByRole("button", { name: "添加请求头" }));
  fireEvent.change(screen.getByPlaceholderText("请求头名称"), { target: { value: "Authorization" } });
  fireEvent.change(screen.getByPlaceholderText("请求头值"), { target: { value: "Bearer abc" } });
};

const submit = (user: User) => user.click(screen.getByRole("button", { name: "添加透传 Endpoint" }));

function findHintTrigger(label: string): Element | null {
  const labelElement = screen.getByText(label);
  return labelElement.closest("label")?.querySelector("svg") ?? null;
}

const hoverHint = async (user: User, label: string) => {
  const trigger = findHintTrigger(label);
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

describe("AddPassThroughEndpoint Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    createPassThroughEndpoint.mockResolvedValue({ endpoints: [{ id: "generated-id", path: "/bria" }] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese add dialog chrome", async () => {
    const user = setup();
    renderForm();

    expect(screen.getByRole("button", { name: "+ 添加透传 Endpoint" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Pass-Through Endpoint" })).not.toBeInTheDocument();

    await openModal(user);

    expect(screen.getByRole("heading", { name: "添加透传 Endpoint" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add Pass-Through Endpoint" })).not.toBeInTheDocument();
    expect(screen.getByText("什么是透传 Endpoint？")).toBeInTheDocument();
    expect(screen.queryByText("What is a Pass-Through Endpoint?")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "将请求从你的 LiteLLM 代理路由到任意外部 API。非常适合自定义模型、图像生成 API，或任何你想通过 LiteLLM 代理的服务。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Route requests from your LiteLLM proxy to any external API/)).not.toBeInTheDocument();
    expect(screen.getByText("路由配置")).toBeInTheDocument();
    expect(screen.queryByText("Route Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("配置发往你域名的请求如何转发到目标 API")).toBeInTheDocument();
    expect(
      screen.queryByText("Configure how requests to your domain will be forwarded to the target API"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("路径前缀")).toBeInTheDocument();
    expect(screen.queryByText("Path Prefix")).not.toBeInTheDocument();
    expect(screen.getByText("示例：/bria、/adobe-photoshop、/elasticsearch")).toBeInTheDocument();
    expect(screen.queryByText("Example: /bria, /adobe-photoshop, /elasticsearch")).not.toBeInTheDocument();
    expect(screen.getByText("目标 URL")).toBeInTheDocument();
    expect(screen.queryByText("Target URL")).not.toBeInTheDocument();
    expect(screen.getByText("示例：https://engine.prod.bria-api.com")).toBeInTheDocument();
    expect(screen.queryByText("Example:https://engine.prod.bria-api.com")).not.toBeInTheDocument();
    expect(screen.getByText("包含子路径")).toBeInTheDocument();
    expect(screen.queryByText("Include Subpaths")).not.toBeInTheDocument();
    expect(screen.getByText("将所有子路径转发到目标 API（推荐用于 REST API）")).toBeInTheDocument();
    expect(
      screen.queryByText("Forward all subpaths to the target API (recommended for REST APIs)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("请求头")).toBeInTheDocument();
    expect(screen.queryByText("Headers")).not.toBeInTheDocument();
    expect(screen.getByText("添加会随每个请求发送到目标 API 的请求头")).toBeInTheDocument();
    expect(
      screen.queryByText("Add headers that will be sent with every request to the target API"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("认证请求头")).toBeInTheDocument();
    expect(screen.queryByText("Authentication Headers")).not.toBeInTheDocument();
    expect(screen.getByText("添加认证 Token 和其他必需的请求头")).toBeInTheDocument();
    expect(screen.queryByText("Add authentication tokens and other required headers")).not.toBeInTheDocument();
    expect(screen.getByText("常见示例：auth_token、Authorization、x-api-key")).toBeInTheDocument();
    expect(screen.queryByText("Common examples: auth_token, Authorization, x-api-key")).not.toBeInTheDocument();
    expect(screen.getByText("默认查询参数")).toBeInTheDocument();
    expect(screen.queryByText("Default Query Parameters")).not.toBeInTheDocument();
    expect(screen.getByText("添加会自动随每个请求发送到目标 API 的查询参数")).toBeInTheDocument();
    expect(
      screen.queryByText("Add query parameters that will be automatically sent with every request to the target API"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("默认查询参数（可选）")).toBeInTheDocument();
    expect(screen.queryByText("Default Query Parameters (Optional)")).not.toBeInTheDocument();
    expect(screen.getByText("这些参数会随所有 GET、POST、PUT、PATCH 请求发送")).toBeInTheDocument();
    expect(screen.queryByText("Parameters are sent with all GET, POST, PUT, PATCH requests")).not.toBeInTheDocument();
    expect(screen.getByText("客户端参数会覆盖默认值。示例：version=v1、format=json、key=default")).toBeInTheDocument();
    expect(
      screen.queryByText("Client parameters override defaults. Examples: version=v1, format=json, key=default"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("性能")).toBeInTheDocument();
    expect(screen.queryByText("Performance")).not.toBeInTheDocument();
    expect(screen.getByText("配置此 Endpoint 的上游请求超时时间")).toBeInTheDocument();
    expect(screen.queryByText("Configure upstream request timeout for this endpoint")).not.toBeInTheDocument();
    expect(screen.getByText("请求超时（秒）")).toBeInTheDocument();
    expect(screen.queryByText("Request Timeout (seconds)")).not.toBeInTheDocument();
    expect(
      screen.getByText("对于响应较慢的上游 API，可使用更大的值（例如长时间运行的 LLM 调用可设为 1200）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Use a higher value for slow upstream APIs (e.g. 1200 for long-running LLM calls)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("计费")).toBeInTheDocument();
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
    expect(screen.getByText("此 Endpoint 的可选成本跟踪")).toBeInTheDocument();
    expect(screen.queryByText("Optional cost tracking for this endpoint")).not.toBeInTheDocument();
    expect(screen.getByText("每次请求成本（USD）")).toBeInTheDocument();
    expect(screen.queryByText("Cost Per Request (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("通过此 Endpoint 的每个请求所收取的成本")).toBeInTheDocument();
    expect(screen.queryByText("The cost charged for each request through this endpoint")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese HTTP method select states", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    expect(screen.getByText("HTTP 方法（可选）")).toBeInTheDocument();
    expect(screen.queryByText("HTTP Methods (Optional)")).not.toBeInTheDocument();
    expect(screen.getByText("支持所有 HTTP 方法（默认）")).toBeInTheDocument();
    expect(screen.queryByText("All HTTP methods supported (default)")).not.toBeInTheDocument();
    expect(screen.getByText("选择方法（留空表示全部）")).toBeInTheDocument();
    expect(screen.queryByText("Select methods (leave empty for all)")).not.toBeInTheDocument();

    await chooseSelectOption(user, screen.getByLabelText(/HTTP 方法/), "POST");

    expect(await screen.findByText("只有 POST 请求会被路由到此 Endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Only POST requests will be routed to this endpoint")).not.toBeInTheDocument();
  });

  it("renders the Chinese HTTP methods hint while its tooltip is open", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    await hoverHint(user, "HTTP 方法（可选）");

    expect(
      await screen.findByText(
        "选择特定的 HTTP 方法。留空则支持所有方法（GET、POST、PUT、DELETE、PATCH）。当同一路径需要为不同方法指定不同目标时很有用。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Leave empty to support all methods/)).not.toBeInTheDocument();
  });

  it("renders the Chinese authentication headers hint while its tooltip is open", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    await hoverHint(user, "认证请求头");

    expect(await screen.findByText("随请求转发的认证和其他请求头")).toBeInTheDocument();
    expect(screen.queryByText("Authentication and other headers to forward with requests")).not.toBeInTheDocument();
  });

  it("renders the Chinese default query parameters hint while its tooltip is open", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    await hoverHint(user, "默认查询参数（可选）");

    expect(
      await screen.findByText("会添加到所有请求的查询参数。客户端可以通过提供自己的值来覆盖这些参数。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Query parameters that will be added to all requests. Clients can override these by providing their own values.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese request timeout hint while its tooltip is open", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    await hoverHint(user, "请求超时（秒）");

    expect(
      await screen.findByText(
        "等待上游 API 响应的最长时间。留空则使用 general_settings.pass_through_request_timeout（默认 600 秒）。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Max time to wait for the upstream API to respond/)).not.toBeInTheDocument();
  });

  it("renders the Chinese cost hint while its tooltip is open", async () => {
    const user = setup();
    renderForm();
    await openModal(user);

    await hoverHint(user, "每次请求成本（USD）");

    expect(await screen.findByText("可选：跟踪发往此 Endpoint 的请求成本")).toBeInTheDocument();
    expect(screen.queryByText("Optional: Track costs for requests to this endpoint")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-field validation messages", async () => {
    const user = setup();
    renderForm();
    await openModal(user);
    await submit(user);

    expect(await screen.findByText("路径为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Path is required")).not.toBeInTheDocument();
    expect(screen.getByText("目标 URL 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Target URL is required")).not.toBeInTheDocument();
    expect(screen.getByText("请配置请求头")).toBeInTheDocument();
    expect(screen.queryByText("Please configure the headers")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid URL validation message", async () => {
    const user = setup();
    renderForm();
    await openModal(user);
    fireEvent.change(screen.getByPlaceholderText("bria"), { target: { value: "bria" } });
    fireEvent.change(screen.getByPlaceholderText("https://engine.prod.bria-api.com"), {
      target: { value: "not a url" },
    });
    await submit(user);

    expect(await screen.findByText("请输入有效的 URL")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a valid URL")).not.toBeInTheDocument();
  });

  it("reports the created endpoint toast in Chinese", async () => {
    const user = setup();
    renderForm();
    await openModal(user);
    await fillRequired(user);
    await submit(user);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("透传 Endpoint 创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Pass-through endpoint created successfully");
  });

  it("reports the create failure toast in Chinese", async () => {
    const user = setup();
    createPassThroughEndpoint.mockRejectedValue(new Error("boom"));
    renderForm();
    await openModal(user);
    await fillRequired(user);
    await submit(user);

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建透传 Endpoint 时出错：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error creating pass-through endpoint: Error: boom");
  });

  it("renders the Chinese creating label while the create is in flight", async () => {
    const user = setup();
    createPassThroughEndpoint.mockReturnValue(new Promise(() => {}));
    renderForm();
    await openModal(user);
    await fillRequired(user);
    await submit(user);

    expect(await screen.findByRole("button", { name: "创建中…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating..." })).not.toBeInTheDocument();
  });
});
