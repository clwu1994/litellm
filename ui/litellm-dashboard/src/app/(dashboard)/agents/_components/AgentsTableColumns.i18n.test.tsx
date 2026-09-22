import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import type { Agent } from "@/components/agents/types";

import { getAgentsTableColumns } from "./AgentsTableColumns";

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  agent_id: "agent-1",
  agent_name: "Test Agent",
  litellm_params: { model: "gpt-4" },
  spend: 0,
  keys: [{ token: "hash-1", key_alias: "primary", key_name: "sk-...1" }],
  created_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

const renderTable = (agents: Agent[], isAdmin = true) => {
  const t = i18n.getFixedT(i18n.language, "agents");
  const deps = { isAdmin, onAgentClick: vi.fn(), onDeleteClick: vi.fn(), t };
  return render(
    <DataTable
      data={agents}
      columns={getAgentsTableColumns(deps)}
      getRowId={(agent) => agent.agent_id}
      sortingMode="client"
      size="compact"
    />,
  );
};

describe("AgentsTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header and hides the English originals", () => {
    renderTable([makeAgent()]);

    for (const [zh, en] of [
      ["Agent 名称", "Agent Name"],
      ["消费（USD）", "Spend (USD)"],
      ["模型", "Model"],
      ["创建时间", "Created"],
      ["状态", "Status"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }

    // "Agent ID" keeps its identifier acronym, so its Chinese value is identical to the English one.
    expect(screen.getByText("Agent ID")).toBeInTheDocument();
  });

  it("renders the Chinese missing-model fallback and hides the English original", () => {
    renderTable([makeAgent({ litellm_params: { model: "" } })]);

    expect(screen.getByText("无")).toBeInTheDocument();
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
  });

  it("renders the Chinese status badges and hides the English originals", () => {
    renderTable([
      makeAgent({ agent_id: "keyed", agent_name: "Keyed Agent", keys: [{ token: "k" }] }),
      makeAgent({ agent_id: "keyless", agent_name: "Keyless Agent", keys: [] }),
    ]);

    expect(screen.getByText("活跃")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.getByText("需要设置")).toBeInTheDocument();
    expect(screen.queryByText("Needs Setup")).not.toBeInTheDocument();
  });

  it("renders the Chinese row actions in the open menu and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable([makeAgent({ agent_id: "agent-9" })]);

    expect(screen.getByLabelText("打开 Agent 操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open agent actions")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("打开 Agent 操作"));

    expect(await screen.findByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });
});
