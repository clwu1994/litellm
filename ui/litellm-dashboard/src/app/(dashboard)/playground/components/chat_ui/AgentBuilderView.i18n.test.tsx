import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import AgentBuilderView from "./AgentBuilderView";
import type { AgentModel } from "../../llm_calls/fetch_agents";

const modelCreateCall = vi.fn().mockResolvedValue({ model_id: "id-new" });
const modelPatchUpdateCall = vi.fn().mockResolvedValue({});
const modelDeleteCall = vi.fn().mockResolvedValue({});
const keyCreateCall = vi.fn().mockResolvedValue({ key: "sk-agent-key" });
const fetchMCPServers = vi.fn().mockResolvedValue([]);
const fetchAvailableAgentModels = vi.fn();
const fetchAvailableModels = vi.fn().mockResolvedValue([{ model_group: "gpt-4o" }, { model_group: "claude-sonnet-4" }]);

vi.mock("@/components/networking", () => ({
  proxyBaseUrl: "https://proxy.example.com",
  modelCreateCall: (...args: unknown[]) => modelCreateCall(...args),
  modelPatchUpdateCall: (...args: unknown[]) => modelPatchUpdateCall(...args),
  modelDeleteCall: (...args: unknown[]) => modelDeleteCall(...args),
  keyCreateCall: (...args: unknown[]) => keyCreateCall(...args),
  fetchMCPServers: (...args: unknown[]) => fetchMCPServers(...args),
}));

vi.mock("../../llm_calls/fetch_agents", () => ({
  fetchAvailableAgentModels: (...args: unknown[]) => fetchAvailableAgentModels(...args),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: (...args: unknown[]) => fetchAvailableModels(...args),
}));

vi.mock("@/components/CodeBlock", () => ({
  default: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}));

vi.mock("./ChatUI", () => ({ default: () => <div data-testid="chat-panel" /> }));
vi.mock("../complianceUI/ComplianceUI", () => ({ default: () => <div data-testid="batch-panel" /> }));

const AGENTS: AgentModel[] = [
  {
    model_name: "support-agent",
    litellm_params: { model: "litellm_agent/gpt-4o", litellm_system_prompt: "Be helpful.", temperature: 0.3 },
    model_info: { id: "agent-1" },
  },
  {
    model_name: "research-agent",
    litellm_params: { model: "litellm_agent/claude-sonnet-4" },
    model_info: { id: "agent-2" },
  },
];

const props = { accessToken: "sk-access", token: "tok", userID: "u1", userRole: "Admin" };

const renderView = () => render(<AgentBuilderView {...props} />);

const waitForRoster = async () => {
  await screen.findByRole("button", { name: "support-agent litellm_agent" });
};

describe("AgentBuilderView Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    fetchAvailableAgentModels.mockResolvedValue(AGENTS);
    fetchAvailableModels.mockResolvedValue([{ model_group: "gpt-4o" }, { model_group: "claude-sonnet-4" }]);
    fetchMCPServers.mockResolvedValue([]);
    modelCreateCall.mockResolvedValue({ model_id: "id-new" });
    keyCreateCall.mockResolvedValue({ key: "sk-agent-key" });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese sign-in prompt", () => {
    render(<AgentBuilderView accessToken={null} token={null} userID={null} userRole={null} />);

    expect(screen.getByText("登录后使用 Agent Builder。")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to use Agent Builder.")).not.toBeInTheDocument();
  });

  it("renders the Chinese roster, tabs, configure form and experimental notice", async () => {
    renderView();
    await waitForRoster();

    expect(screen.getByText("Agent Builder")).toBeInTheDocument();
    expect(screen.getByText("构建满足你合规要求的 Agent。")).toBeInTheDocument();
    expect(screen.queryByText("Build Agents that pass your compliance requirements.")).not.toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByLabelText("添加 Agent")).toBeInTheDocument();
    expect(screen.queryByLabelText("Add agent")).not.toBeInTheDocument();
    expect(screen.getByText("新建 Agent")).toBeInTheDocument();
    expect(screen.queryByText("New agent")).not.toBeInTheDocument();

    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("批量测试")).toBeInTheDocument();
    expect(screen.getByText("接入")).toBeInTheDocument();
    expect(screen.queryByText("Configure")).not.toBeInTheDocument();
    expect(screen.queryByText("Batch Test")).not.toBeInTheDocument();

    expect(screen.getByText("Agent 名称")).toBeInTheDocument();
    expect(screen.queryByText("Agent name")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("support-agent")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("我的 Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("My Agent")).not.toBeInTheDocument();

    expect(screen.getByText("系统提示词")).toBeInTheDocument();
    expect(screen.queryByText("System prompt")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("你是一个乐于助人的助手...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("You are a helpful assistant...")).not.toBeInTheDocument();

    expect(screen.getByText("底层 LLM")).toBeInTheDocument();
    expect(screen.queryByText("Underlying LLM")).not.toBeInTheDocument();
    expect(screen.getByLabelText("底层 LLM")).toBeInTheDocument();
    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByText("最大 Token 数")).toBeInTheDocument();
    expect(screen.queryByText("Max tokens")).not.toBeInTheDocument();

    expect(screen.getByText("MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("MCP servers")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("选择要附加的 MCP 服务器（与 chat completions API 格式相同）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Select MCP servers to attach (same format as chat completions API)"),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "更新 Agent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Agent" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "在对话中测试" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test in Chat" })).not.toBeInTheDocument();

    expect(
      screen.getByText("Agent Builder 为实验性功能，可能随时变更或移除。我们期待你的反馈，请发送邮件至", {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("product@berri.ai")).toBeInTheDocument();
    expect(screen.queryByText("Agent Builder is experimental", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and the new-agent save control", async () => {
    const user = userEvent.setup({ delay: null });
    fetchAvailableAgentModels.mockResolvedValue([]);
    renderView();

    expect(await screen.findByText("还没有 Agent。添加一个 Agent 开始使用。")).toBeInTheDocument();
    expect(screen.queryByText("No agents yet. Add an agent to get started.")).not.toBeInTheDocument();

    await user.click(screen.getByText("新建 Agent"));
    expect(screen.getByRole("button", { name: "保存 Agent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Agent" })).not.toBeInTheDocument();
  });

  it("renders the Chinese empty states of the visited agent tabs after starting a new agent", async () => {
    const user = userEvent.setup({ delay: null });
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");

    await user.click(screen.getByRole("tab", { name: "对话" }));
    await user.click(screen.getByRole("tab", { name: "批量测试" }));
    await user.click(screen.getByRole("tab", { name: "接入" }));
    await user.click(screen.getByText("新建 Agent"));

    expect(screen.getByText("请先保存一个 Agent，再在对话中测试。")).toBeInTheDocument();
    expect(screen.queryByText("Save an agent first to test in Chat.")).not.toBeInTheDocument();
    expect(screen.getByText("请选择一个 Agent 以运行批量测试。")).toBeInTheDocument();
    expect(screen.queryByText("Select an agent to run batch tests.")).not.toBeInTheDocument();
    expect(screen.getByText("请选择一个 Agent 以查看如何接入。")).toBeInTheDocument();
    expect(screen.queryByText("Select an agent to see how to connect.")).not.toBeInTheDocument();
  });

  it("renders the Chinese delete confirmation dialog", async () => {
    const user = userEvent.setup({ delay: null });
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");

    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);

    expect(await screen.findByText("删除 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Delete agent")).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除 “support-agent” 吗？此操作无法撤销。")).toBeInTheDocument();
    expect(
      screen.queryByText('Are you sure you want to delete "support-agent"? This cannot be undone.'),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "取消" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese missing-model-id warning", async () => {
    fetchAvailableAgentModels.mockResolvedValue([
      { model_name: "config-agent", litellm_params: { model: "litellm_agent/gpt-4o" } },
    ]);
    renderView();
    await screen.findByRole("button", { name: "config-agent litellm_agent" });

    expect(
      screen.getByText("此 Agent 无法在此更新或删除（缺少 model id）。请前往 Models & Endpoints 管理。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("This agent cannot be updated or deleted here (missing model id).", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese connect tab chrome", async () => {
    const user = userEvent.setup({ delay: null });
    renderView();
    await waitForRoster();

    await user.click(screen.getByRole("tab", { name: "接入" }));

    expect(screen.getByText("代理 Base URL")).toBeInTheDocument();
    expect(screen.queryByText("Proxy base URL")).not.toBeInTheDocument();
    expect(screen.getByText("调用你的 Agent（cURL）")).toBeInTheDocument();
    expect(screen.queryByText("Call your agent (cURL)")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "为此 Agent 创建密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create a key for this agent" })).not.toBeInTheDocument();
    expect(screen.getByText("创建一个只能调用此 Agent 的 Virtual Key。", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByText("该 Virtual Key 将限定为你（user_id），并限制为模型", { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Create a virtual key that can only call this agent.", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "为此 Agent 创建密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create key for this agent" })).not.toBeInTheDocument();
  });

  it("renders the Chinese underlying-model placeholder when no model is available", async () => {
    fetchAvailableModels.mockResolvedValue([]);
    fetchAvailableAgentModels.mockResolvedValue([
      { model_name: "config-agent", litellm_params: {}, model_info: { id: "agent-9" } },
    ]);
    renderView();
    await screen.findByRole("button", { name: "config-agent litellm_agent" });

    expect(screen.getByText("选择模型")).toBeInTheDocument();
    expect(screen.queryByText("Select model")).not.toBeInTheDocument();
  });

  it("renders the Chinese key-created and key-creation-disabled copy", async () => {
    const user = userEvent.setup({ delay: null });
    render(<AgentBuilderView {...props} disabledPersonalKeyCreation />);
    await waitForRoster();

    await user.click(screen.getByRole("tab", { name: "接入" }));
    expect(screen.getByText("你的账号已禁用密钥创建。")).toBeInTheDocument();
    expect(screen.queryByText("Key creation is disabled for your account.")).not.toBeInTheDocument();
  });

  it("renders the Chinese key-created confirmation", async () => {
    const user = userEvent.setup({ delay: null });
    renderView();
    await waitForRoster();

    await user.click(screen.getByRole("tab", { name: "接入" }));
    await user.click(await screen.findByRole("button", { name: "为此 Agent 创建密钥" }));

    expect(
      await screen.findByText("密钥已创建。它显示在上方的 cURL 示例中，复制该代码片段即可使用。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Key created. It is shown in the cURL example above — copy the snippet to use it."),
    ).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Virtual Key 已创建。请使用下方 curl 示例中的密钥。");
  });

  it("renders the Chinese attached MCP server summary for one and two servers", async () => {
    const user = userEvent.setup({ delay: null });
    fetchMCPServers.mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
      { server_id: "srv-2", alias: "slack", server_name: "slack-mcp" },
    ]);
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");

    const control = screen.getByPlaceholderText("选择要附加的 MCP 服务器（与 chat completions API 格式相同）");
    await user.click(control);
    await user.click((await screen.findAllByText("github"))[0]);
    await user.keyboard("{Escape}");

    expect(await screen.findByText("已保存 1 个 MCP 服务器。", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("请在 chat completions 中使用相同的", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("tools")).toBeInTheDocument();
    expect(screen.getByText("数组。", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("1 MCP server saved.", { exact: false })).not.toBeInTheDocument();

    await user.click(control);
    await user.click((await screen.findAllByText("slack"))[0]);
    await user.keyboard("{Escape}");

    expect(await screen.findByText("已保存 2 个 MCP 服务器。", { exact: false })).toBeInTheDocument();
  });

  it("renders the English singular MCP server summary under the locale that selects it", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup({ delay: null });
    fetchMCPServers.mockResolvedValue([{ server_id: "srv-1", alias: "github", server_name: "github-mcp" }]);
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");

    const control = screen.getByPlaceholderText("Select MCP servers to attach (same format as chat completions API)");
    await user.click(control);
    await user.click((await screen.findAllByText("github"))[0]);
    await user.keyboard("{Escape}");

    expect(await screen.findByText("1 MCP server saved.", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("1 MCP servers saved.", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the English plural MCP server summary under the locale that selects it", async () => {
    await i18n.changeLanguage("en");
    const user = userEvent.setup({ delay: null });
    fetchMCPServers.mockResolvedValue([
      { server_id: "srv-1", alias: "github", server_name: "github-mcp" },
      { server_id: "srv-2", alias: "slack", server_name: "slack-mcp" },
    ]);
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");

    const control = screen.getByPlaceholderText("Select MCP servers to attach (same format as chat completions API)");
    await user.click(control);
    await user.click((await screen.findAllByText("github"))[0]);
    await user.keyboard("{Escape}");
    await user.click(control);
    await user.click((await screen.findAllByText("slack"))[0]);
    await user.keyboard("{Escape}");

    expect(await screen.findByText("2 MCP servers saved.", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("2 MCP server saved.", { exact: false })).not.toBeInTheDocument();
  });

  it("reports the Chinese agent toasts", async () => {
    const user = userEvent.setup({ delay: null });

    fetchAvailableAgentModels.mockRejectedValueOnce(new Error("down"));
    renderView();
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("加载 Agent 失败"));
    cleanup();

    modelCreateCall.mockRejectedValueOnce(new Error("nope"));
    renderView();
    await waitForRoster();
    await user.click(screen.getByText("新建 Agent"));
    fireEvent.change(screen.getByPlaceholderText("我的 Agent"), { target: { value: "billing-agent" } });
    await user.click(screen.getByRole("button", { name: "保存 Agent" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存 Agent 失败"));
    cleanup();

    modelPatchUpdateCall.mockRejectedValueOnce(new Error("nope"));
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");
    await user.click(screen.getByRole("button", { name: "更新 Agent" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新 Agent 失败"));
    cleanup();

    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");
    await user.click(screen.getByRole("button", { name: "更新 Agent" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Agent 更新成功"));
    cleanup();

    modelDeleteCall.mockRejectedValueOnce(new Error("nope"));
    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");
    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);
    await user.click((await screen.findAllByRole("button", { name: "删除" })).at(-1)!);
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除 Agent 失败"));
    cleanup();

    renderView();
    await waitForRoster();
    await screen.findByDisplayValue("support-agent");
    await user.click(screen.getAllByRole("button", { name: "删除" })[0]);
    await user.click((await screen.findAllByRole("button", { name: "删除" })).at(-1)!);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Agent 已删除"));
  });

  it("reports the Chinese key-creation toasts", async () => {
    const user = userEvent.setup({ delay: null });

    keyCreateCall.mockResolvedValueOnce({});
    renderView();
    await waitForRoster();
    await user.click(screen.getByRole("tab", { name: "接入" }));
    await user.click(await screen.findByRole("button", { name: "为此 Agent 创建密钥" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("密钥已创建但未返回其值"));
    cleanup();

    keyCreateCall.mockRejectedValueOnce(new Error("nope"));
    renderView();
    await waitForRoster();
    await user.click(screen.getByRole("tab", { name: "接入" }));
    await user.click(await screen.findByRole("button", { name: "为此 Agent 创建密钥" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("为此 Agent 创建密钥失败"));
  });
});
