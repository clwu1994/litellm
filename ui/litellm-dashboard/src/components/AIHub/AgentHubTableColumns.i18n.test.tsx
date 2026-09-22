import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";

import { getAgentHubTableColumns, AgentHubData } from "./AgentHubTableColumns";

const agent = (overrides: Partial<AgentHubData> = {}): AgentHubData => ({
  agent_id: "agent-1",
  protocolVersion: "1.0",
  name: "Billing Router",
  description: "routes billing questions",
  url: "https://agent.example.com",
  version: "2.0",
  capabilities: { streaming: true },
  defaultInputModes: ["text"],
  defaultOutputModes: ["text", "image"],
  skills: [
    { id: "s1", name: "Skill One", description: "First skill" },
    { id: "s2", name: "Skill Two", description: "Second skill" },
    { id: "s3", name: "Skill Three", description: "Third skill" },
  ],
  is_public: true,
  ...overrides,
});

const renderTable = (data: AgentHubData[]) => {
  const t = i18n.getFixedT(i18n.language, "modelHub");
  render(
    <DataTable
      data={data}
      columns={getAgentHubTableColumns({ onAgentClick: vi.fn(), t })}
      getRowId={(row, index) => row.agent_id || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("AgentHubTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every column header in Chinese and hides the English originals", () => {
    renderTable([agent()]);

    expectLocalized("Agent 名称", "Agent Name");
    expectLocalized("描述", "Description");
    expectLocalized("版本", "Version");
    expectLocalized("协议", "Protocol");
    expectLocalized("技能", "Skills");
    expectLocalized("能力", "Capabilities");
    expectLocalized("输入/输出模式", "I/O Modes");
    expectLocalized("公开", "Public");
    expectLocalized("操作", "Actions");
  });

  it("renders the skill count and I/O mode labels in Chinese and hides the English originals", () => {
    renderTable([agent()]);

    expectLocalized("3 个技能", "3 skills");
    expectLocalized("输入：", "In:");
    expectLocalized("输出：", "Out:");
  });

  it("renders the singular skill count in Chinese and hides the English original", () => {
    renderTable([agent({ skills: [{ id: "s1", name: "Only Skill", description: "One" }] })]);

    expectLocalized("1 个技能", "1 skill");
  });

  it("renders the public and private status badges in Chinese and hides the English originals", () => {
    renderTable([agent({ is_public: true }), agent({ agent_id: "agent-2", name: "Support Bot", is_public: false })]);

    expectLocalized("是", "Yes");
    expectLocalized("否", "No");
  });

  it("keeps capability keys, provider-style values and names in English", () => {
    renderTable([agent()]);

    expect(screen.getByText("Billing Router")).toBeInTheDocument();
    expect(screen.getByText("streaming")).toBeInTheDocument();
    expect(screen.getByText("routes billing questions")).toBeInTheDocument();
  });

  it("renders the row actions menu in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable([agent()]);

    await user.click(screen.getByLabelText("打开 Agent 操作"));

    expect(await screen.findByText("查看详情")).toBeInTheDocument();
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(screen.getByText("复制 Agent 名称")).toBeInTheDocument();
    expect(screen.queryByText("Copy agent name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Open agent actions")).not.toBeInTheDocument();
  });

  it("reports the copy confirmation in Chinese and not in English", async () => {
    const user = userEvent.setup();
    renderTable([agent()]);

    await user.click(screen.getByLabelText("打开 Agent 操作"));
    await user.click(await screen.findByTestId("agent-hub-action-copy"));

    expect(toast.success).toHaveBeenCalledWith("已复制 Agent 名称");
    expect(toast.success).not.toHaveBeenCalledWith("Agent name copied");
  });
});

describe("AgentHubTableColumns English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural skill counts byte-identical", () => {
    renderTable([agent()]);
    expect(screen.getByText("3 skills")).toBeInTheDocument();
    cleanup();

    renderTable([agent({ skills: [{ id: "s1", name: "Only Skill", description: "One" }] })]);
    expect(screen.getByText("1 skill")).toBeInTheDocument();
  });
});
