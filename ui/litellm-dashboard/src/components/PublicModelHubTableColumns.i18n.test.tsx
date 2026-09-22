import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";

import {
  AgentCard,
  getPublicAgentHubColumns,
  getPublicMCPHubColumns,
  getPublicModelHubColumns,
  MCPServerData,
  ModelGroupInfo,
} from "./PublicModelHubTableColumns";

const model = (overrides: Partial<ModelGroupInfo> = {}): ModelGroupInfo => ({
  model_group: "gpt-4",
  providers: ["openai"],
  mode: "chat",
  max_input_tokens: 128000,
  max_output_tokens: 16384,
  input_cost_per_token: 0.0000025,
  output_cost_per_token: 0.00001,
  supports_parallel_function_calling: false,
  supports_vision: false,
  supports_function_calling: false,
  health_status: "healthy",
  health_response_time: 1234.5,
  health_checked_at: "2024-01-15T10:25:00Z",
  rpm: 1000,
  tpm: 2000,
  ...overrides,
});

const agent: AgentCard = {
  protocolVersion: "1.0",
  name: "Billing Router",
  description: "routes billing questions",
  url: "https://agent.example.com",
  version: "2.0",
  capabilities: { streaming: true },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [{ id: "s1", name: "Skill One", description: "First skill", tags: [] }],
};

const mcpServer: MCPServerData = {
  server_id: "srv-1",
  name: "exa_test",
  server_name: "exa_test",
  transport: "http",
  auth_type: "api_key",
  mcp_info: { server_name: "exa_test", description: "Search helpers" },
};

const renderModels = (data: ModelGroupInfo[]) => {
  const t = i18n.getFixedT(i18n.language, "modelHub");
  renderWithProviders(
    <DataTable
      data={data}
      columns={getPublicModelHubColumns({ onModelClick: vi.fn(), t })}
      getRowId={(row, index) => row.model_group || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("PublicModelHubTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every model column header in Chinese and hides the English originals", () => {
    renderModels([model()]);

    expectLocalized("模型名称", "Model Name");
    expectLocalized("提供商", "Providers");
    expectLocalized("模式", "Mode");
    expectLocalized("最大输入", "Max Input");
    expectLocalized("最大输出", "Max Output");
    expectLocalized("输入 $/1M", "Input $/1M");
    expectLocalized("输出 $/1M", "Output $/1M");
    expectLocalized("功能", "Features");
    expectLocalized("健康状态", "Health Status");
    expectLocalized("限制", "Limits");
  });

  it("renders the health status values in Chinese and hides the English originals", () => {
    renderModels([model({ model_group: "a", health_status: "healthy" })]);
    expectLocalized("健康", "healthy");
    cleanup();

    renderModels([model({ model_group: "b", health_status: "unhealthy" })]);
    expectLocalized("异常", "unhealthy");
    cleanup();

    renderModels([model({ model_group: "c", health_status: "unknown" })]);
    expectLocalized("未知", "unknown");
    cleanup();

    renderModels([model({ model_group: "d", health_status: undefined })]);
    expectLocalized("未知", "Unknown");
  });

  it("renders the health tooltip labels in Chinese and hides the English originals", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderModels([model()]);

    await user.hover(screen.getByText("健康"));

    expect(await screen.findByText("响应时间：1234.50ms")).toBeInTheDocument();
    expect(screen.queryByText("Response Time: 1234.50ms")).not.toBeInTheDocument();
    const checkedAt = new Date("2024-01-15T10:25:00Z").toLocaleString();
    expect(await screen.findByText(`上次检查：${checkedAt}`)).toBeInTheDocument();
    expect(screen.queryByText(`Last Checked: ${checkedAt}`)).not.toBeInTheDocument();
  });

  it("renders the unavailable and free fallbacks in Chinese and hides the English originals", () => {
    const sparse = {
      model_group: "sparse",
      mode: undefined,
      max_input_tokens: undefined,
      max_output_tokens: undefined,
      input_cost_per_token: undefined,
      output_cost_per_token: undefined,
    };
    renderModels([model(sparse)]);

    expectLocalized("对话", "Chat");
    expectLocalized("免费", "Free");
    expect(screen.getAllByText("不适用").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("N/A")).toHaveLength(0);
  });

  it("keeps model names, provider names, modes and the limits wire labels in English", () => {
    renderModels([model()]);

    expect(screen.getByText("gpt-4")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
    expect(screen.getByText("chat")).toBeInTheDocument();
    expect(screen.getByText("RPM: 1,000, TPM: 2,000")).toBeInTheDocument();
  });

  it("renders the agent column headers in Chinese and hides the English originals", () => {
    const t = i18n.getFixedT(i18n.language, "modelHub");
    renderWithProviders(
      <DataTable
        data={[agent]}
        columns={getPublicAgentHubColumns({ onAgentClick: vi.fn(), t })}
        getRowId={(row) => row.name}
        sortingMode="client"
        size="compact"
      />,
    );

    expectLocalized("Agent 名称", "Agent Name");
    expectLocalized("描述", "Description");
    expectLocalized("版本", "Version");
    expectLocalized("提供商", "Provider");
    expectLocalized("技能", "Skills");
    expectLocalized("能力", "Capabilities");
  });

  it("renders the MCP column headers in Chinese and hides the English originals", () => {
    const t = i18n.getFixedT(i18n.language, "modelHub");
    renderWithProviders(
      <DataTable
        data={[mcpServer]}
        columns={getPublicMCPHubColumns({ onServerClick: vi.fn(), t })}
        getRowId={(row) => row.server_id}
        sortingMode="client"
        size="compact"
      />,
    );

    expectLocalized("服务器名称", "Server Name");
    expectLocalized("描述", "Description");
    expectLocalized("传输方式", "Transport");
    expectLocalized("认证类型", "Auth Type");
    expect(screen.getByText("http")).toBeInTheDocument();
    expect(screen.getByText("api_key")).toBeInTheDocument();
  });
});
