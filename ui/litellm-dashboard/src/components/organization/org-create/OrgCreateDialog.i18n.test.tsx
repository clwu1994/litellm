import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

vi.mock("@/components/ModelSelect/ModelSelect", () => ({
  ModelSelect: () => <button type="button">set-models</button>,
}));
vi.mock("@/components/vector_store_management/VectorStoreSelector", () => ({
  __esModule: true,
  default: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label="vector-store-selector" placeholder={placeholder} readOnly />
  ),
}));
vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  __esModule: true,
  default: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label="mcp-server-selector" placeholder={placeholder} readOnly />
  ),
}));

import { OrgCreateDialog } from "./OrgCreateDialog";

const Harness = ({ createOrganization }: { createOrganization: (body: unknown) => Promise<unknown> }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        reopen
      </button>
      <OrgCreateDialog open={open} onOpenChange={setOpen} accessToken="token" createOrganization={createOrganization} />
    </>
  );
};

const renderDialog = (overrides?: { createOrganization?: Mock }) => {
  const createOrganization = overrides?.createOrganization ?? vi.fn().mockResolvedValue({});
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <Harness createOrganization={createOrganization} />
    </QueryClientProvider>,
  );
  return { createOrganization };
};

describe("OrgCreateDialog Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog title, actions and selector copy in Chinese", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "创建组织" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create Organization" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建组织" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Organization" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();

    expect(screen.getByText("允许的向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Allowed Vector Stores")).not.toBeInTheDocument();
    expect(screen.getByText("选择此组织可以访问的向量存储。留空表示可访问所有向量存储")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select vector stores this organization can access. Leave empty for access to all vector stores",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择向量存储（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select vector stores (optional)")).not.toBeInTheDocument();

    expect(screen.getByText("允许的 MCP 服务器")).toBeInTheDocument();
    expect(screen.queryByText("Allowed MCP Servers")).not.toBeInTheDocument();
    expect(screen.getByText("选择此组织可以访问的 MCP 服务器、访问组和工具集。留空表示可访问所有")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select MCP servers, access groups, and toolsets this organization can access. Leave empty for access to all",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 MCP 服务器与访问组（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers and access groups (optional)")).not.toBeInTheDocument();
  });

  it("shows the creating label in Chinese while the create is pending", async () => {
    const user = userEvent.setup();
    renderDialog({ createOrganization: vi.fn().mockImplementation(() => new Promise(() => {})) });

    await user.type(screen.getByLabelText("组织名称"), "new-org");
    await user.click(screen.getByRole("button", { name: "创建组织" }));

    expect(await screen.findByRole("button", { name: "创建中…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating..." })).not.toBeInTheDocument();
  });

  it("reports the create outcome in Chinese", async () => {
    const user = userEvent.setup();
    const { createOrganization } = renderDialog();

    await user.type(screen.getByLabelText("组织名称"), "new-org");
    await user.click(screen.getByRole("button", { name: "创建组织" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("组织创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Organization created successfully");

    createOrganization.mockRejectedValueOnce("boom");
    await user.click(screen.getByRole("button", { name: "reopen" }));
    await user.type(screen.getByLabelText("组织名称"), "new-org");
    await user.click(screen.getByRole("button", { name: "创建组织" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建组织失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create organization");
  });

  it("reports the missing-name validation error in Chinese", async () => {
    const user = userEvent.setup();
    const { createOrganization } = renderDialog();

    await user.click(screen.getByRole("button", { name: "创建组织" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("请输入组织名称");
    expect(screen.queryByText("Please input an organization name")).not.toBeInTheDocument();
    expect(createOrganization).not.toHaveBeenCalled();
  });
});
