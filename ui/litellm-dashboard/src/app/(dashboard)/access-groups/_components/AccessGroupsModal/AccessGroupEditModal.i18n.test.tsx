import { cleanup, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import type { AccessGroupResponse } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";

import { AccessGroupEditModal } from "./AccessGroupEditModal";

const mutate = vi.fn();

vi.mock("@/app/(dashboard)/hooks/accessGroups/useEditAccessGroup", () => ({
  useEditAccessGroup: () => ({ mutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/agents/useAgents", () => ({
  useAgents: () => ({ data: { agents: [{ agent_id: "agent-1", agent_name: "Support Bot" }] } }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [{ server_id: "srv-1", server_name: "Files" }] }),
}));

vi.mock("@/components/ModelSelect/ModelSelect", () => ({
  ModelSelect: () => <button type="button" aria-label="model-select" />,
}));

const accessGroup: AccessGroupResponse = {
  access_group_id: "ag-1",
  access_group_name: "Engineering",
  description: "Engineers",
  access_model_names: ["gpt-4"],
  access_mcp_server_ids: ["srv-1"],
  access_agent_ids: ["agent-1"],
  assigned_team_ids: [],
  assigned_key_ids: [],
  access_mcp_servers: [{ id: "srv-1", name: "Server One" }],
  access_agents: [{ id: "agent-1", name: "Agent One" }],
  assigned_teams: [],
  assigned_keys: [],
  created_at: "2024-01-01T00:00:00Z",
  created_by: "user-1",
  updated_at: "2024-01-02T00:00:00Z",
  updated_by: "user-1",
};

const renderModal = (overrides: Partial<AccessGroupResponse> = {}) =>
  renderWithProviders(
    <AccessGroupEditModal visible accessGroup={{ ...accessGroup, ...overrides }} onCancel={vi.fn()} />,
  );

describe("AccessGroupEditModal Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mutate.mockReset();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome", async () => {
    renderModal();

    const dialog = await screen.findByRole("dialog", { name: "编辑访问组" });
    expect(screen.queryByRole("dialog", { name: "Edit Access Group" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese tabs, field labels and placeholders across every tab", async () => {
    const user = userEvent.setup();
    renderModal({ access_mcp_server_ids: [], access_agent_ids: [] });

    const dialog = await screen.findByRole("dialog", { name: "编辑访问组" });
    expect(within(dialog).getByRole("tab", { name: "常规信息" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("tab", { name: "General Info" })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("组名称")).toHaveAttribute("placeholder", "例如：工程团队");
    expect(within(dialog).queryByPlaceholderText("e.g. Engineering Team")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("描述")).toHaveAttribute("placeholder", "描述此访问组的用途...");
    expect(
      within(dialog).queryByPlaceholderText("Describe the purpose of this access group..."),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("tab", { name: "模型" }));
    expect(within(dialog).queryByRole("tab", { name: "Models" })).not.toBeInTheDocument();
    expect(within(dialog).getByText("允许的模型")).toBeInTheDocument();
    expect(within(dialog).queryByText("Allowed Models")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("tab", { name: "MCP 服务器" }));
    expect(within(dialog).queryByRole("tab", { name: "MCP Servers" })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("允许的 MCP 服务器")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Allowed MCP Servers")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("允许的 MCP 服务器")).toHaveTextContent("选择 MCP 服务器");
    expect(within(dialog).queryByText("Select MCP servers")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("tab", { name: "Agent" }));
    expect(within(dialog).queryByRole("tab", { name: "Agents" })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("允许的 Agent")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Allowed Agents")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("允许的 Agent")).toHaveTextContent("选择 Agent");
    expect(within(dialog).queryByText("Select agents")).not.toBeInTheDocument();
  });

  it("renders the Chinese validation message when the name is cleared", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(await screen.findByLabelText("组名称"));
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("请输入访问组名称")).toBeInTheDocument();
    expect(screen.queryByText("Please enter the access group name")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("reports the Chinese updated toast on a successful save", async () => {
    const user = userEvent.setup();
    mutate.mockImplementation((_variables: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    renderModal();

    await screen.findByDisplayValue("Engineering");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("访问组更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Access group updated successfully");
  });
});
