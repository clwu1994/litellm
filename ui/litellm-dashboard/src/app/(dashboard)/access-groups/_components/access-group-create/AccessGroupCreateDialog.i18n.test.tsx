import { cleanup, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { AccessGroupCreateDialog } from "./AccessGroupCreateDialog";

vi.mock("@/components/ModelSelect/ModelSelect", () => ({
  ModelSelect: () => <button type="button" aria-label="model-select" />,
}));

vi.mock("@/app/(dashboard)/hooks/agents/useAgents", () => ({
  useAgents: () => ({ data: { agents: [{ agent_id: "agent-1", agent_name: "Support Agent" }] } }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [{ server_id: "srv-1", server_name: "GitHub MCP" }] }),
}));

const Harness = ({ createAccessGroup }: { createAccessGroup: (body: unknown) => Promise<unknown> }) => {
  const [open, setOpen] = React.useState(true);
  return <AccessGroupCreateDialog open={open} onOpenChange={setOpen} createAccessGroup={createAccessGroup} />;
};

const renderDialog = (createAccessGroup: Mock = vi.fn().mockResolvedValue({})) => {
  renderWithProviders(<Harness createAccessGroup={createAccessGroup} />);
  return { createAccessGroup };
};

describe("AccessGroupCreateDialog Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog title, tabs, field labels and placeholders", async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = await screen.findByRole("dialog", { name: "创建访问组" });
    expect(screen.queryByRole("dialog", { name: "Create Access Group" })).not.toBeInTheDocument();
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

  it("renders the Chinese dialog actions and reports the created toast", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    const dialog = await screen.findByRole("dialog", { name: "创建访问组" });
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "创建组" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Create Group" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("组名称"), "prod-models");
    await user.click(screen.getByRole("button", { name: "创建组" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("访问组创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Access group created successfully");
    expect(createAccessGroup).toHaveBeenCalledTimes(1);
  });

  it("renders the Chinese in-flight submit label while the create is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: unknown) => void = () => {};
    const createAccessGroup = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );
    renderDialog(createAccessGroup);

    await user.type(screen.getByLabelText("组名称"), "prod-models");
    await user.click(screen.getByRole("button", { name: "创建组" }));

    expect(await screen.findByRole("button", { name: "创建中..." })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Creating..." })).not.toBeInTheDocument();

    resolveCreate({});
    await waitFor(() => expect(screen.queryByLabelText("组名称")).not.toBeInTheDocument());
  });

  it("reports the Chinese create-failure toast for a non-error rejection", async () => {
    const user = userEvent.setup();
    renderDialog(vi.fn().mockRejectedValue("boom"));

    await user.type(screen.getByLabelText("组名称"), "prod-models");
    await user.click(screen.getByRole("button", { name: "创建组" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建访问组失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create access group");
  });

  it("renders the Chinese validation message when the name is missing", async () => {
    const user = userEvent.setup();
    const { createAccessGroup } = renderDialog();

    await user.click(await screen.findByRole("button", { name: "创建组" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("请输入访问组名称");
    expect(screen.queryByText("Please enter the access group name")).not.toBeInTheDocument();
    expect(createAccessGroup).not.toHaveBeenCalled();
  });
});
