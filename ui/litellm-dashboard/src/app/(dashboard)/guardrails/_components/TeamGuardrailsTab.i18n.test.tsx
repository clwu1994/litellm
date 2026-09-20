import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import {
  approveGuardrailSubmission,
  listGuardrailSubmissions,
  rejectGuardrailSubmission,
  updateGuardrailCall,
  type GuardrailSubmissionItem,
} from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";

import { TeamGuardrailsTab } from "./TeamGuardrailsTab";

vi.mock("@/components/networking", () => ({
  listGuardrailSubmissions: vi.fn(),
  approveGuardrailSubmission: vi.fn(),
  rejectGuardrailSubmission: vi.fn(),
  updateGuardrailCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/guardrails/useRegisterGuardrail", () => ({
  useRegisterGuardrail: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false }),
}));

vi.mock("@/components/common_components/team_dropdown", () => ({
  default: ({ id, value, onChange }: { id?: string; value?: string; onChange?: (value: string) => void }) => (
    <input id={id} aria-label="team" value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} />
  ),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: vi.fn() }));

/* eslint-disable testing-library/no-node-access -- The hint trigger is an icon with no accessible name, so reaching its tooltip needs the DOM */

const authorized = {
  isLoading: false,
  isAuthorized: true,
  token: "test-token",
  accessToken: "test-token",
  userId: "user-1",
  userEmail: "user@example.com",
  userRoleLabel: "Admin",
  isViewOnly: false,
  premiumUser: false,
  disabledPersonalKeyCreation: null,
  showSSOBanner: false,
  userRole: "Admin",
};

const withHeaders: GuardrailSubmissionItem = {
  guardrail_id: "guard-1",
  guardrail_name: "test-pending-guardrail",
  status: "pending_review",
  team_id: "team-1",
  litellm_params: {
    guardrail: "generic_guardrail_api",
    mode: "pre_call",
    api_base: "https://example.com/guard",
    headers: { "X-API-Key": "secret" },
    extra_headers: ["x-request-id"],
    forward_api_key: true,
  },
  guardrail_info: { model: "gpt-4o", description: "A test guardrail" },
  submitted_at: "2026-05-09T00:00:00Z",
  submitted_by_email: "dev@example.com",
};

const withoutHeaders = {
  ...withHeaders,
  guardrail_id: "guard-2",
  guardrail_name: "no-headers-guardrail",
  litellm_params: { ...withHeaders.litellm_params, headers: {}, extra_headers: [] },
};

const summary = (submissions: GuardrailSubmissionItem[]) => ({
  submissions,
  summary: {
    total: submissions.length,
    pending_review: submissions.length,
    active: 0,
    rejected: 0,
  },
});

const hasTextContent = (expected: string) => (_content: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === expected;

const renderTab = () => renderWithProviders(<TeamGuardrailsTab accessToken="test-token" />);

const openDetail = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  renderTab();
  await screen.findByText(name);
  await user.click(screen.getByRole("button", { name: "审核" }));
};

describe("TeamGuardrailsTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(useAuthorized).mockReturnValue(authorized);
    vi.mocked(listGuardrailSubmissions).mockResolvedValue(summary([withHeaders]));
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese stats, filter and card chrome and hides the English", async () => {
    renderTab();
    await screen.findByText("test-pending-guardrail");

    expect(screen.getByText("已提交总数")).toBeInTheDocument();
    expect(screen.getAllByText("待审核").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("活跃").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("已拒绝").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByPlaceholderText("搜索 Guardrail...")).toBeInTheDocument();
    expect(screen.getByLabelText("按状态筛选")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "全部状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加 Guardrail/ })).toBeInTheDocument();
    expect(screen.getByText("团队：team-1")).toBeInTheDocument();
    expect(screen.getByText("模型：")).toBeInTheDocument();
    expect(screen.getByText("提交时间：")).toBeInTheDocument();
    expect(screen.getByText("转发 API Key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "审核" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "通过" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "拒绝" })).toBeInTheDocument();
    expect(screen.getByText("静态请求头")).toBeInTheDocument();

    expect(screen.queryByText("Total Submitted")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending Review")).not.toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search guardrails...")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Filter by status")).not.toBeInTheDocument();
    expect(screen.queryByText("All Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Team: team-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Forward API Key")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(screen.queryByText("Static headers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Guardrail/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Model:")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitted:")).not.toBeInTheDocument();
  });

  it("renders the Chinese close label on the selected card", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");

    await user.click(screen.getByRole("button", { name: "审核" }));

    expect(screen.getAllByRole("button", { name: "关闭" }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the Chinese card static-header empty state and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(listGuardrailSubmissions).mockResolvedValue(summary([withoutHeaders]));
    renderTab();
    await screen.findByText("no-headers-guardrail");

    await user.click(screen.getByRole("button", { name: /静态请求头/ }));

    expect(screen.getByText("未配置静态请求头。")).toBeInTheDocument();
    expect(screen.queryByText("No static headers configured.")).not.toBeInTheDocument();
  });

  it("renders the Chinese detail chrome and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    await openDetail(user, "test-pending-guardrail");

    expect(screen.getByText("由 dev@example.com 于 2026-05-09 提交")).toBeInTheDocument();
    expect(screen.getByLabelText("关闭详情面板")).toBeInTheDocument();
    expect(screen.getByText("Endpoint")).toBeInTheDocument();
    expect(screen.getByText("方法")).toBeInTheDocument();
    expect(screen.getByText("转发 LiteLLM API Key")).toBeInTheDocument();
    expect(
      screen.getByText(
        hasTextContent(
          "启用后，调用方的 LiteLLM API Key 会作为 Authorization 请求头转发到你的 Guardrail Endpoint。这使你的 Guardrail 可以使用原调用方的凭证验证模型调用。",
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("每次请求都会发送到 Guardrail。")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请求头名称（例如 X-API-Key）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("值")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "添加" })).toHaveLength(2);
    expect(screen.getByText("转发客户端请求头")).toBeInTheDocument();
    expect(
      screen.getByText("允许从客户端请求转发到 Guardrail 的请求头名称（例如 x-request-id）。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("移除 X-API-Key")).toBeInTheDocument();
    expect(screen.getByLabelText("移除 x-request-id")).toBeInTheDocument();
    expect(screen.getByText("等效配置")).toBeInTheDocument();
    expect(
      screen.getByText(
        hasTextContent(
          "该 Guardrail 运行在独立实例上。它接收用户请求，并将结果转发到流水线的下一步。配置详情请参见 LiteLLM Generic Guardrail API 文档。",
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /LiteLLM Generic Guardrail API 文档/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试 Endpoint" })).toBeInTheDocument();
    expect(screen.queryByText("Sent with every request to the guardrail.")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Allowed header names to forward from the client request to the guardrail (e.g. x-request-id).",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        hasTextContent(
          "When enabled, the caller's LiteLLM API key is forwarded as an Authorization header to your guardrail endpoint. This allows your guardrail to authenticate model calls using the original caller's credentials.",
        ),
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        hasTextContent(
          "This guardrail runs on a separate instance. It receives the user request and forwards the result to the next step in the pipeline. See LiteLLM Generic Guardrail API docs for configuration details.",
        ),
      ),
    ).not.toBeInTheDocument();

    expect(screen.queryByText("Submitted by dev@example.com on 2026-05-09")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Close detail panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Method")).not.toBeInTheDocument();
    expect(screen.queryByText("Forward LiteLLM API Key")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Header name (e.g. X-API-Key)")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Value")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
    expect(screen.queryByText("Forward client headers")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remove X-API-Key")).not.toBeInTheDocument();
    expect(screen.queryByText("Equivalent config")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Endpoint" })).not.toBeInTheDocument();
  });

  it("renders the Chinese detail empty states and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(listGuardrailSubmissions).mockResolvedValue(summary([withoutHeaders]));
    await openDetail(user, "no-headers-guardrail");

    expect(screen.getByText("未配置静态请求头。")).toBeInTheDocument();
    expect(screen.getByText("未配置转发的客户端请求头。")).toBeInTheDocument();
    expect(screen.queryByText("No static headers configured.")).not.toBeInTheDocument();
    expect(screen.queryByText("No forward client headers configured.")).not.toBeInTheDocument();
  });

  it("renders the Chinese approve and reject confirm dialogs and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");

    await user.click(screen.getByRole("button", { name: "通过" }));

    expect(screen.getByText("通过 Guardrail")).toBeInTheDocument();
    expect(
      screen.getByText(hasTextContent('确定要通过 "test-pending-guardrail"? 这将使其生效并可供使用。')),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByText("Approve Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText(/Are you sure you want to approve/)).not.toBeInTheDocument();
    expect(screen.queryByText("This will make it active and available for use.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));
    await user.click(screen.getByRole("button", { name: "拒绝" }));

    expect(screen.getByText("拒绝 Guardrail")).toBeInTheDocument();
    expect(
      screen.getByText(hasTextContent('确定要拒绝 "test-pending-guardrail"? 这将将其标记为已拒绝并通知团队。')),
    ).toBeInTheDocument();
    expect(screen.queryByText("Reject Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText(/Are you sure you want to reject/)).not.toBeInTheDocument();
    expect(screen.queryByText("This will mark it as rejected and notify the team.")).not.toBeInTheDocument();
  });

  it("renders the Chinese submit dialog chrome and mode options and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");

    await user.click(screen.getByRole("button", { name: /添加 Guardrail/ }));

    expect(screen.getByText("提交 Guardrail 以供审核")).toBeInTheDocument();
    expect(screen.getByText("你的 Guardrail 将先发送给管理员审核，审核通过后才会生效。")).toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.getByLabelText("Guardrail 名称")).toBeInTheDocument();
    expect(screen.getByLabelText("模式")).toBeInTheDocument();
    expect(screen.getByLabelText("API Base URL")).toBeInTheDocument();
    expect(screen.getByText("额外的 litellm_params（可选）")).toBeInTheDocument();
    expect(screen.getByText("Guardrail 信息（可选）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交审核" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "模式" })).toHaveTextContent("调用前");

    await user.click(screen.getByRole("combobox", { name: "模式" }));
    expect(await screen.findByRole("option", { name: "调用后" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "调用中" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Pre Call" })).not.toBeInTheDocument();

    expect(screen.queryByText("Submit Guardrail for Review")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Your guardrail will be sent for admin review before it becomes active."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Additional litellm_params (optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardrail Info (optional)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit for Review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Post Call" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "During Call" })).not.toBeInTheDocument();
  });

  it("renders the Chinese extra params tooltip on hover", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");
    await user.click(screen.getByRole("button", { name: /添加 Guardrail/ }));

    const label = screen.getByText("额外的 litellm_params（可选）");
    const trigger = label.closest("label")?.querySelector("svg");
    if (!trigger) throw new Error("no hint trigger");
    await user.hover(trigger);

    expect(
      await screen.findByText(
        "合并到 litellm_params 的 JSON 对象。例如 forward_api_key、headers、model、unreachable_fallback",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "JSON object merged into litellm_params. e.g. forward_api_key, headers, model, unreachable_fallback",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese validation messages and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");
    await user.click(screen.getByRole("button", { name: /添加 Guardrail/ }));
    await screen.findByText("提交 Guardrail 以供审核");

    await user.type(
      screen.getByPlaceholderText('{"forward_api_key": true, "headers": {"X-Custom": "value"}}'),
      '"nope"',
    );
    await user.type(screen.getByPlaceholderText('{"description": "Detects PII in requests"}'), "nope");
    await user.click(screen.getByRole("button", { name: "提交审核" }));

    expect(await screen.findByText("请选择团队")).toBeInTheDocument();
    expect(screen.getByText("请输入 Guardrail 名称")).toBeInTheDocument();
    expect(screen.getByText("请输入 API Base URL")).toBeInTheDocument();
    expect(screen.getByText("必须是 JSON 对象")).toBeInTheDocument();
    expect(screen.getByText("无效的 JSON")).toBeInTheDocument();

    expect(screen.queryByText("Select a team")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter a guardrail name")).not.toBeInTheDocument();
    expect(screen.queryByText("Enter the API base URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Must be a JSON object")).not.toBeInTheDocument();
    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();
  });

  it("renders the Chinese url validation message and hides the English", async () => {
    const user = userEvent.setup({ delay: null });
    renderTab();
    await screen.findByText("test-pending-guardrail");
    await user.click(screen.getByRole("button", { name: /添加 Guardrail/ }));
    await screen.findByText("提交 Guardrail 以供审核");

    await user.type(screen.getByPlaceholderText("https://your-guardrail-api.com/v1/check"), "example.com");
    await user.click(screen.getByRole("button", { name: "提交审核" }));

    expect(await screen.findByText("必须是有效的 URL")).toBeInTheDocument();
    expect(screen.queryByText("Must be a valid URL")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading, empty and load-failure states and hides the English", async () => {
    vi.mocked(listGuardrailSubmissions).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderTab();
    expect(screen.getByText("正在加载提交内容…")).toBeInTheDocument();
    expect(screen.queryByText("Loading submissions…")).not.toBeInTheDocument();
    unmount();

    vi.mocked(listGuardrailSubmissions).mockResolvedValue(summary([]));
    renderTab();
    expect(await screen.findByText("没有符合筛选条件的 Guardrail。")).toBeInTheDocument();
    expect(screen.queryByText("No guardrails match your filters.")).not.toBeInTheDocument();
    cleanup();

    vi.mocked(listGuardrailSubmissions).mockRejectedValue("boom");
    renderTab();
    expect(await screen.findByText("加载提交内容失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load submissions")).not.toBeInTheDocument();
  });

  it("emits the Chinese toasts for the write actions", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(updateGuardrailCall).mockResolvedValue(undefined);
    vi.mocked(approveGuardrailSubmission).mockResolvedValue({
      guardrail_id: "guard-1",
      status: "active",
      message: "ok",
    });
    vi.mocked(rejectGuardrailSubmission).mockResolvedValue({
      guardrail_id: "guard-1",
      status: "rejected",
      message: "ok",
    });
    renderTab();
    await screen.findByText("test-pending-guardrail");

    await user.click(screen.getByRole("switch"));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已禁用转发 API Key"));
    await user.click(screen.getByRole("switch"));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已启用转发 API Key"));

    await user.click(screen.getByRole("button", { name: "审核" }));
    await screen.findByText("转发 LiteLLM API Key");

    await user.type(screen.getByPlaceholderText("请求头名称（例如 X-API-Key）"), "X-Trace");
    await user.type(screen.getByPlaceholderText("值"), "trace-value");
    await user.click(screen.getAllByRole("button", { name: "添加" })[0]);
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("静态请求头已更新"));

    await user.type(screen.getByPlaceholderText("e.g. x-request-id"), "x-trace-id");
    await user.click(screen.getAllByRole("button", { name: "添加" })[1]);
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("转发的客户端请求头已更新"));

    await user.click(screen.getAllByRole("button", { name: "通过" }).at(-1)!);
    await screen.findByText("通过 Guardrail");
    await user.click(screen.getAllByRole("button", { name: "通过" }).at(-1)!);
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardrail 已通过"));

    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1)!);
    await screen.findByText("拒绝 Guardrail");
    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1)!);
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardrail 已拒绝"));

    await user.click(screen.getByRole("button", { name: /添加 Guardrail/ }));
    await screen.findByText("提交 Guardrail 以供审核");
    await user.type(screen.getByLabelText("team"), "team-1");
    await user.type(screen.getByPlaceholderText("e.g. pii-detection"), "pii-detection");
    await user.type(
      screen.getByPlaceholderText("https://your-guardrail-api.com/v1/check"),
      "https://guard.example.com",
    );
    await user.click(screen.getByRole("button", { name: "提交审核" }));
    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Guardrail 已提交审核"));

    expect(toast.success).not.toHaveBeenCalledWith("Forward API key enabled");
    expect(toast.success).not.toHaveBeenCalledWith("Forward API key disabled");
    expect(toast.success).not.toHaveBeenCalledWith("Static headers updated");
    expect(toast.success).not.toHaveBeenCalledWith("Forward client headers updated");
    expect(toast.success).not.toHaveBeenCalledWith("Guardrail approved");
    expect(toast.success).not.toHaveBeenCalledWith("Guardrail rejected");
    expect(toast.success).not.toHaveBeenCalledWith("Guardrail submitted for review");
  });

  it("emits the Chinese failure toasts for the write actions", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(updateGuardrailCall).mockRejectedValue(new Error("nope"));
    vi.mocked(approveGuardrailSubmission).mockRejectedValue(new Error("nope"));
    vi.mocked(rejectGuardrailSubmission).mockRejectedValue(new Error("nope"));
    renderTab();
    await screen.findByText("test-pending-guardrail");

    await user.click(screen.getByRole("switch"));
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新转发 API Key 失败"));

    await user.click(screen.getByRole("button", { name: "审核" }));
    await screen.findByText("转发 LiteLLM API Key");

    await user.type(screen.getByPlaceholderText("请求头名称（例如 X-API-Key）"), "X-Trace");
    await user.type(screen.getByPlaceholderText("值"), "trace-value");
    await user.click(screen.getAllByRole("button", { name: "添加" })[0]);
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新静态请求头失败"));

    await user.type(screen.getByPlaceholderText("e.g. x-request-id"), "x-trace-id");
    await user.click(screen.getAllByRole("button", { name: "添加" })[1]);
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新转发的客户端请求头失败"));

    await user.click(screen.getAllByRole("button", { name: "通过" }).at(-1)!);
    await screen.findByText("通过 Guardrail");
    await user.click(screen.getAllByRole("button", { name: "通过" }).at(-1)!);
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("通过 Guardrail 失败"));

    await user.click(screen.getByRole("button", { name: "取消" }));
    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1)!);
    await screen.findByText("拒绝 Guardrail");
    await user.click(screen.getAllByRole("button", { name: "拒绝" }).at(-1)!);
    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("拒绝 Guardrail 失败"));

    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update forward API key");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update static headers");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update forward client headers");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to approve guardrail");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to reject guardrail");
  });
});
