import React from "react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";
import type { AgentCreateInfo } from "@/components/networking";
import { toast } from "@/lib/toast";

import AddAgentForm from "./add_agent_form";

/* eslint-disable testing-library/no-node-access -- The label-hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */

vi.mock("@/components/networking", () => ({
  createAgentCall: vi.fn(),
  getAgentCreateMetadata: vi.fn(),
  getAgentsList: vi.fn(),
  keyCreateForAgentCall: vi.fn(),
  keyListCall: vi.fn(),
  keyUpdateCall: vi.fn(),
  modelAvailableCall: vi.fn(),
}));

vi.mock("./agent_card_discovery", () => ({ default: () => <div data-testid="agent-card-discovery" /> }));

vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  default: ({ placeholder }: { placeholder?: string }) => <input placeholder={placeholder} />,
}));

vi.mock("@/components/mcp_server_management/MCPToolPermissions", () => ({ default: () => <div /> }));
vi.mock("@/components/guardrails/GuardrailSelector", () => ({ default: () => <div /> }));
vi.mock("@/components/common_components/team_dropdown", () => ({ default: () => <div /> }));

const a2aInfo: AgentCreateInfo = {
  agent_type: "a2a",
  agent_type_display_name: "A2A Agent",
  description: "Agent-to-agent protocol",
  logo_url: "/ui/assets/logos/a2a_agent.png",
  credential_fields: [],
  use_a2a_form_fields: true,
};

const langgraphInfo: AgentCreateInfo = {
  agent_type: "langgraph",
  agent_type_display_name: "LangGraph",
  description: "LangGraph platform",
  logo_url: "/ui/assets/logos/langgraph.png",
  use_a2a_form_fields: false,
  litellm_params_template: { custom_llm_provider: "langgraph" },
  model_template: "langgraph/{assistant_id}",
  credential_fields: [
    { key: "api_base", label: "API Base", field_type: "text", required: true, placeholder: "https://host" },
    {
      key: "assistant_id",
      label: "Assistant ID",
      field_type: "text",
      required: true,
      validation_pattern: "^asst_",
    },
    { key: "api_key", label: "API Key", field_type: "password", required: false },
  ],
};

const vertexInfo: AgentCreateInfo = {
  agent_type: "vertex",
  agent_type_display_name: "Vertex AI",
  description: "Vertex AI agent engine",
  logo_url: "/ui/assets/logos/vertex.png",
  use_a2a_form_fields: true,
  credential_fields: [{ key: "project_id", label: "Project ID", field_type: "text", required: true }],
};

const renderForm = (accessToken: string | null = "tok") =>
  renderWithProviders(<AddAgentForm visible={true} onClose={vi.fn()} accessToken={accessToken} onSuccess={vi.fn()} />);

const panel = (name: string) => screen.findByRole("button", { name });

const openAgentTypeMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getAllByRole("combobox")[0]);
};

const selectAgentType = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await openAgentTypeMenu(user);
  await user.click(await screen.findByText(label));
};

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

const fillRequiredConfigureFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText("Agent 名称"), "support-agent");
  await user.type(screen.getByLabelText("显示名称"), "Support Agent");
  await user.type(screen.getByPlaceholderText("描述此 Agent 的功能..."), "answers questions");
};

const clickNext = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "下一步 →" }));
};

const goToStep = async (user: ReturnType<typeof userEvent.setup>, step: number) => {
  await fillRequiredConfigureFields(user);
  for (let index = 0; index < step; index++) await clickNext(user);
};

const userOptions = { pointerEventsCheck: PointerEventsCheckLevel.Never } as const;

describe("AddAgentForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.getAgentCreateMetadata).mockReset().mockResolvedValue([a2aInfo, langgraphInfo, vertexInfo]);
    vi.mocked(networking.getAgentsList).mockReset().mockResolvedValue({ agents: [] });
    vi.mocked(networking.keyListCall).mockReset().mockResolvedValue({ keys: [] });
    vi.mocked(networking.modelAvailableCall).mockReset().mockResolvedValue({ data: [] });
    vi.mocked(networking.createAgentCall)
      .mockReset()
      .mockResolvedValue({ agent_id: "agent-1", agent_name: "created-agent" } as never);
    vi.mocked(networking.keyCreateForAgentCall)
      .mockReset()
      .mockResolvedValue({ key: "sk-new" } as never);
    vi.mocked(networking.keyUpdateCall)
      .mockReset()
      .mockResolvedValue({} as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese configure step chrome and hides the English originals", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    expect(screen.getByText("添加新 Agent")).toBeInTheDocument();
    expect(screen.queryByText("Add New Agent")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["配置", "Configure"],
      ["权限", "Entitlements"],
      ["治理", "Governance"],
      ["Agent 管理", "Agent Management"],
      ["就绪", "Ready"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(screen.getByRole("list", { name: "Agent 创建步骤" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Agent creation steps" })).not.toBeInTheDocument();

    expect(screen.getByLabelText("Agent 类型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Agent Type")).not.toBeInTheDocument();

    expect(screen.getByText("基本信息（必填）")).toBeInTheDocument();
    expect(screen.queryByText("Basic Information (Required)")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["技能", "Skills"],
      ["能力", "Capabilities"],
      ["可选设置", "Optional Settings"],
      ["成本配置", "Cost Configuration"],
      ["LiteLLM 参数", "LiteLLM Parameters"],
      ["认证 Headers", "Authentication Headers"],
    ] as const) {
      expect(screen.getByRole("button", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: en })).not.toBeInTheDocument();
    }

    expect(screen.getByPlaceholderText("例如 customer-support-agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., customer-support-agent")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["显示名称", "Display Name"],
      ["描述", "Description"],
      ["版本", "Version"],
      ["协议版本", "Protocol Version"],
    ] as const) {
      expect(screen.getByLabelText(zh)).toBeInTheDocument();
      expect(screen.queryByLabelText(en)).not.toBeInTheDocument();
    }
    expect(screen.getByLabelText("URL")).toBeInTheDocument();

    expect(screen.getByPlaceholderText("例如 Customer Support Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., Customer Support Agent")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("描述此 Agent 的功能...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe what this agent does...")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "下一步 →" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next →" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    await hoverHint(user, "Agent 类型");
    expect(await screen.findByText("选择你要创建的 Agent 类型", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Select the type of agent you want to create")).not.toBeInTheDocument();
  });

  it("renders the Chinese basic-panel hints and the protocol-version help text", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    expect(
      screen.getByText("LiteLLM 向客户端提供此版本，并将上游 Agent 的响应转换为与之匹配，无论原始 Agent 的版本如何。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "LiteLLM serves this version to clients and converts the upstream agent's responses to match it, regardless of the original agent's version.",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "Agent 名称");
    expect(await screen.findByText("Agent 的唯一标识符", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Unique identifier for the agent")).not.toBeInTheDocument();

    await hoverHint(user, "URL");
    expect(await screen.findByText("托管 Agent 的 Base URL（可选）", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Base URL where the agent is hosted (optional)")).not.toBeInTheDocument();

    await hoverHint(user, "协议版本");
    expect(
      await screen.findByText(
        "LiteLLM 向客户端提供的此 Agent 的 A2A 协议版本。LiteLLM 会将上游 Agent 的响应转换为该版本，因此无论原始 Agent 的版本如何，客户端看到的始终是你在此选择的版本。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "The A2A protocol version LiteLLM serves to clients for this agent. LiteLLM converts the upstream agent's responses to this version, so clients always see the version you pick here regardless of the original agent's version.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese skills panel, its required errors and the authentication-header copy", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    await user.click(await panel("技能"));
    expect(screen.getByRole("button", { name: "添加技能" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Skill" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加技能" }));

    for (const [zh, en] of [
      ["技能 ID", "Skill ID"],
      ["技能名称", "Skill Name"],
      ["标签", "Tags"],
      ["示例", "Examples"],
    ] as const) {
      expect(await screen.findByLabelText(zh)).toBeInTheDocument();
      expect(screen.queryByLabelText(en)).not.toBeInTheDocument();
    }
    expect(screen.getByPlaceholderText("例如 Returns hello world")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("此技能的功能")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入标签并按 Enter")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入示例并按 Enter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除技能" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Skill" })).not.toBeInTheDocument();

    await clickNext(user);

    const skillIdField = screen.getByLabelText("技能 ID").closest("div[data-slot='field']") as HTMLElement;
    expect(await within(skillIdField).findByText("必填")).toBeInTheDocument();
    expect(screen.queryByText("Required")).not.toBeInTheDocument();

    await user.click(await panel("认证 Headers"));
    expect(screen.getByText("静态 Headers")).toBeInTheDocument();
    expect(screen.queryByText("Static Headers")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加静态 Header" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Static Header" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 x-api-key、Authorization")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. x-api-key, Authorization")).not.toBeInTheDocument();
    expect(screen.getByLabelText("转发客户端 Headers")).toBeInTheDocument();
    expect(screen.queryByLabelText("Forward Client Headers")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加静态 Header" }));
    expect(screen.getByPlaceholderText("Header 名称（例如 Authorization）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Header name (e.g. Authorization)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("值（例如 Bearer token123）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Value (e.g. Bearer token123)")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除静态 Header" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove static header" })).not.toBeInTheDocument();

    await clickNext(user);
    expect(await screen.findByText("必须填写 Header 名称")).toBeInTheDocument();
    expect(screen.queryByText("Header name required")).not.toBeInTheDocument();
    expect(screen.getByText("必须填写值")).toBeInTheDocument();
    expect(screen.queryByText("Value required")).not.toBeInTheDocument();

    await hoverHint(user, "静态 Headers");
    expect(
      await screen.findByText(
        "始终发送到后端 Agent 的 Headers，与客户端请求无关。由管理员配置，冲突时以静态值优先。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Headers always sent to the backend agent, regardless of the client request. Admin-configured, static wins on conflict.",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "转发客户端 Headers");
    expect(
      await screen.findByText(
        "要从客户端请求中提取并转发给 Agent 的 Header 名称。输入名称并按 Enter。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Header names to extract from the client's request and forward to the agent. Type a name and press Enter.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese capabilities, optional, cost and LiteLLM panels", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    await user.click(await panel("能力"));
    for (const [zh, en] of [
      ["流式传输", "Streaming"],
      ["推送通知", "Push Notifications"],
      ["状态转换历史", "State Transition History"],
    ] as const) {
      expect(await screen.findByRole("switch", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("switch", { name: en })).not.toBeInTheDocument();
    }

    await user.click(await panel("可选设置"));
    expect(await screen.findByLabelText("图标 URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Icon URL")).not.toBeInTheDocument();
    expect(screen.getByLabelText("文档 URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Documentation URL")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "支持认证扩展卡片" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Supports Authenticated Extended Card" })).not.toBeInTheDocument();

    await user.click(await panel("成本配置"));
    for (const [zh, en] of [
      ["每次查询成本（$）", "Cost Per Query ($)"],
      ["每 Token 输入成本（$）", "Input Cost Per Token ($)"],
      ["每 Token 输出成本（$）", "Output Cost Per Token ($)"],
    ] as const) {
      expect(await screen.findByLabelText(zh)).toBeInTheDocument();
      expect(screen.queryByLabelText(en)).not.toBeInTheDocument();
    }
    await hoverHint(user, "每次查询成本（$）");
    expect(await screen.findByText("每次查询的固定成本", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Fixed cost per query")).not.toBeInTheDocument();
    await hoverHint(user, "每 Token 输入成本（$）");
    expect(await screen.findByText("每个输入 Token 的成本", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Cost per input token")).not.toBeInTheDocument();
    await hoverHint(user, "每 Token 输出成本（$）");
    expect(await screen.findByText("每个输出 Token 的成本", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Cost per output token")).not.toBeInTheDocument();

    await user.click(await panel("LiteLLM 参数"));
    expect(await screen.findByLabelText("模型（可选）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model (Optional)")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "设为公开" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Make Public" })).not.toBeInTheDocument();
  });

  it("renders the Chinese entitlements step and its hints", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 1);

    expect(screen.getByRole("button", { name: "← 返回" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Back" })).not.toBeInTheDocument();

    expect(
      screen.getByText("配置此 Agent 允许使用的模型、Agent 和 MCP 工具。留空表示允许全部（受密钥/团队权限限制）。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Configure which models, agents, and MCP tools this agent is allowed to use. Leave fields empty to allow all (subject to key/team permissions).",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("允许的模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Allowed Models")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型（留空表示全部）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select models (leave empty for all)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("允许的 Agent（子 Agent）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Allowed Agents (Sub-Agents)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 Agent（留空表示全部）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select agents (leave empty for all)")).not.toBeInTheDocument();
    expect(screen.getByText("允许的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Allowed MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 MCP 服务器或访问组（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers or access groups (optional)")).not.toBeInTheDocument();

    await hoverHint(user, "允许的模型");
    expect(
      await screen.findByText("限制此 Agent 可以调用的模型。留空表示允许全部。", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Restrict which models this agent can call. Leave empty to allow all."),
    ).not.toBeInTheDocument();

    await hoverHint(user, "允许的 Agent（子 Agent）");
    expect(
      await screen.findByText(
        "限制此 Agent 可以作为子 Agent 调用的其他 Agent。留空表示允许全部。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Restrict which other agents this agent can invoke as sub-agents. Leave empty to allow all."),
    ).not.toBeInTheDocument();

    await hoverHint(user, "允许的 MCP 服务器");
    expect(
      await screen.findByText("选择此 Agent 可以访问的 MCP 服务器或访问组", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Select which MCP servers or access groups this agent can access"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese model and agent loading placeholders", async () => {
    vi.mocked(networking.modelAvailableCall).mockReturnValue(new Promise(() => {}));
    vi.mocked(networking.getAgentsList).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 1);

    expect(await screen.findByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("正在加载 Agent...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading agents...")).not.toBeInTheDocument();
  });

  it("renders the Chinese governance step and hides the English originals", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 2);

    for (const [zh, en] of [
      ["追踪", "Tracing"],
      ["要求对此 Agent 的调用携带 x-litellm-trace-id", "Require x-litellm-trace-id on calls TO this agent"],
      [
        "仅接受携带 trace-id 调用此 Agent（例如作为子 Agent 使用时）。",
        "Only accept this agent being invoked with a trace-id (e.g. when used as a sub-agent).",
      ],
      ["要求此 Agent 发起的调用携带 x-litellm-trace-id", "Require x-litellm-trace-id on calls BY this agent"],
      [
        "要求此 Agent 发起的 LLM/MCP 调用包含 x-litellm-trace-id，以便跟踪会话。",
        "Requires LLM/MCP calls made by this agent to include x-litellm-trace-id for session tracking.",
      ],
      ["预算与速率限制", "Budgets & Rate Limits"],
      [
        "请在 Tracing 中启用“Require x-litellm-trace-id on calls BY this agent”以配置预算和速率限制。",
        'Enable "Require x-litellm-trace-id on calls BY this agent" in Tracing to configure budgets and rate limits.',
      ],
      ["会话预算", "Session Budgets"],
      ["最大迭代次数", "Max Iterations"],
      ["每个会话 LLM 调用次数的硬性上限", "Hard cap on LLM calls per session"],
      ["每个会话最大预算（$）", "Max Budget Per Session ($)"],
      ["单次 trace 在返回 429 前的最大消费", "Max spend per trace before returning 429"],
      ["Agent 速率限制", "Agent Rate Limits"],
      ["应用于此 Agent 所有调用方的全局速率限制。", "Global rate limits applied across all callers of this agent."],
      ["TPM 限制", "TPM Limit"],
      ["RPM 限制", "RPM Limit"],
      ["每会话速率限制", "Per-Session Rate Limits"],
      [
        "每个会话（x-litellm-trace-id）的速率限制。每个会话拥有独立的计数器。",
        "Rate limits per session (x-litellm-trace-id). Each session gets its own counters.",
      ],
      ["会话 TPM 限制", "Session TPM Limit"],
      ["会话 RPM 限制", "Session RPM Limit"],
      [
        "为此 Agent 应用 Guardrails。选中的 Guardrails 将在该 Agent 的所有调用上运行。",
        "Apply guardrails to this agent. Selected guardrails will run on all calls made by this agent.",
      ],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    for (const [zh, en] of [
      ["例如 25", "e.g. 25"],
      ["例如 5.00", "e.g. 5.00"],
      ["例如 100000", "e.g. 100000"],
      ["例如 100", "e.g. 100"],
      ["例如 10000", "e.g. 10000"],
      ["例如 20", "e.g. 20"],
    ] as const) {
      expect(screen.getByPlaceholderText(zh)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(en)).not.toBeInTheDocument();
    }

    // "Guardrails" is kept in English in both locales, so both share the same value.
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
  });

  it("renders the Chinese key-assignment step and hides the English originals", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    for (const [zh, en] of [
      ["分配给团队", "Assign to Team"],
      ["为此 Agent 创建新密钥", "Create a new key for this agent"],
      ["专用于此 Agent 的密钥。", "A dedicated key scoped to this agent."],
      ["密钥名称", "Key Name"],
      ["推荐", "Recommended"],
      ["分配现有密钥", "Assign an existing key"],
      ["将你已有的密钥重新分配给此 Agent。", "Re-assign a key you already have to this agent."],
      ["暂时跳过，稍后再分配密钥", "Skip for now — I'll assign a key later"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    expect(screen.getByRole("radio", { name: "为此 Agent 创建新密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Create a new key for this agent" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "分配现有密钥" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Assign an existing key" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 my-agent-key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. my-agent-key")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建 Agent →" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Agent →" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "分配现有密钥" }));
    expect(await screen.findByPlaceholderText("按密钥名称搜索…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by key name…")).not.toBeInTheDocument();

    await hoverHint(user, "分配给团队");
    expect(
      await screen.findByText(
        "可选地将此 Agent 分配给一个团队。该 Agent 及其密钥将属于所选团队。",
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Optionally assign this agent to a team. The agent and its key will belong to the selected team.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese key-loading placeholder", async () => {
    vi.mocked(networking.keyListCall).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("radio", { name: "分配现有密钥" }));

    expect(await screen.findByPlaceholderText("正在加载密钥…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading keys…")).not.toBeInTheDocument();
  });

  it("renders the Chinese ready step and reports the Chinese create toasts", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    expect(await screen.findByText("Agent 创建成功！")).toBeInTheDocument();
    expect(screen.queryByText("Agent Created!")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
  });

  it("renders the Chinese in-flight create button and hides the English original", async () => {
    vi.mocked(networking.createAgentCall).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    expect(await screen.findByRole("button", { name: "正在创建..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating..." })).not.toBeInTheDocument();
  });

  it("renders the Chinese assigned-key sentence", async () => {
    vi.mocked(networking.keyListCall).mockResolvedValue({
      keys: [{ token: "key-maple", key_alias: "Maple key" }],
    } as never);
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("radio", { name: "分配现有密钥" }));
    await user.click(await screen.findByPlaceholderText("按密钥名称搜索…"));
    await user.click(await screen.findByText("Maple key"));
    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    expect(await screen.findByText(/密钥/)).toHaveTextContent("密钥 Maple key 已分配给此 Agent。");
    expect(screen.queryByText(/Key .* has been assigned to this agent\./)).not.toBeInTheDocument();
  });

  it("renders the Chinese unassigned-key sentence after skipping", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "暂时跳过，稍后再分配密钥" }));
    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    expect(await screen.findByText("未分配密钥。你可以在 Virtual Keys 页面创建一个。")).toBeInTheDocument();
    expect(
      screen.queryByText("No key assigned. You can create one from the Virtual Keys page."),
    ).not.toBeInTheDocument();
  });

  it("reports the Chinese create toasts", async () => {
    const user = userEvent.setup(userOptions);
    vi.mocked(networking.createAgentCall).mockRejectedValue(new Error("boom"));
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("创建 Agent 失败：boom"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to create agent: boom");
  });

  it("reports the Chinese create failure without a server message", async () => {
    const user = userEvent.setup(userOptions);
    vi.mocked(networking.createAgentCall).mockRejectedValue("");
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("创建 Agent 失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to create agent");
  });

  it("reports the Chinese missing-token toast", async () => {
    const user = userEvent.setup(userOptions);
    renderForm(null);
    await goToStep(user, 3);

    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("没有可用的 access token"));
    expect(toast.error).not.toHaveBeenCalledWith("No access token available");
  });

  it("reports the Chinese missing-key toast", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await goToStep(user, 3);

    await user.click(screen.getByRole("radio", { name: "分配现有密钥" }));
    await user.click(screen.getByRole("button", { name: "创建 Agent →" }));
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("请选择一个现有密钥进行分配"));
    expect(toast.error).not.toHaveBeenCalledWith("Please select an existing key to assign");
  });

  it("renders the Chinese custom-agent branch", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    await openAgentTypeMenu(user);
    expect(await screen.findByText("未列出？")).toBeInTheDocument();
    expect(screen.queryByText("Not listed?")).not.toBeInTheDocument();
    expect(screen.getByText("通用")).toBeInTheDocument();
    expect(screen.queryByText("GENERIC")).not.toBeInTheDocument();
    expect(screen.getByText("适用于不遵循标准协议的 Agent，只需一个 Virtual Key")).toBeInTheDocument();
    expect(
      screen.queryByText("For agents that don't follow a standard protocol, just needs a virtual key"),
    ).not.toBeInTheDocument();

    await user.click(await screen.findByText("自定义 / 其他"));
    expect(screen.queryByText("Custom / Other")).not.toBeInTheDocument();
    expect(await screen.findByPlaceholderText("例如 my-custom-agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. my-custom-agent")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("描述此 Agent 的功能…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe what this agent does…")).not.toBeInTheDocument();

    await clickNext(user);
    expect(await screen.findByText("请输入 Agent 名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter an agent name")).not.toBeInTheDocument();
  });

  it("renders the Chinese dynamic-agent branch and its validation copy", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    await selectAgentType(user, "LangGraph");

    expect(await screen.findByPlaceholderText("例如 my-langgraph-agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., my-langgraph-agent")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("描述此 Agent 的功能...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe what this agent does...")).not.toBeInTheDocument();
    expect(screen.getByText("成本配置")).toBeInTheDocument();
    expect(screen.queryByText("Cost Configuration")).not.toBeInTheDocument();

    await hoverHint(user, "Agent 名称");
    expect(await screen.findByText("Agent 的唯一标识符", {}, { timeout: 3000 })).toBeInTheDocument();
    await hoverHint(user, "描述");
    expect(await screen.findByText("简要描述此 Agent 的功能", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText("Brief description of what this agent does")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Assistant ID"), "bad");
    await clickNext(user);

    expect(await screen.findByText("请输入唯一的 Agent 名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a unique agent name")).not.toBeInTheDocument();
    expect(screen.getByText("请输入 API Base")).toBeInTheDocument();
    expect(screen.queryByText("Please enter API Base")).not.toBeInTheDocument();
    expect(screen.getByText("Assistant ID 看起来不完整或格式有误")).toBeInTheDocument();
    expect(screen.queryByText("Assistant ID looks incomplete or malformed")).not.toBeInTheDocument();
  });

  it("renders the Chinese settings heading for an A2A-form agent type", async () => {
    const user = userEvent.setup(userOptions);
    renderForm();
    await screen.findByLabelText("Agent 名称");

    await selectAgentType(user, "Vertex AI");

    expect(await screen.findByText("Vertex AI 设置")).toBeInTheDocument();
    expect(screen.queryByText("Vertex AI Settings")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Project ID")).toBeInTheDocument();

    await clickNext(user);
    expect(await screen.findByText("请输入 Project ID")).toBeInTheDocument();
    expect(screen.queryByText("Please enter Project ID")).not.toBeInTheDocument();
  });
});
