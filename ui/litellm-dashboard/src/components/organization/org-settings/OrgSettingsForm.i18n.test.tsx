import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { Organization } from "@/components/networking";
import { toast } from "@/lib/toast";

vi.mock("@/components/ModelSelect/ModelSelect", () => ({
  ModelSelect: () => <button type="button">set-models</button>,
}));
vi.mock("@/components/vector_store_management/VectorStoreSelector", () => ({
  __esModule: true,
  default: ({ id, placeholder }: { id?: string; placeholder?: string }) => (
    <input id={id} aria-label="vector-store-selector" placeholder={placeholder} readOnly />
  ),
}));
vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  __esModule: true,
  default: ({ id, placeholder }: { id?: string; placeholder?: string }) => (
    <input id={id} aria-label="mcp-server-selector" placeholder={placeholder} readOnly />
  ),
}));

import { OrgSettingsForm } from "./OrgSettingsForm";

const org: Organization = {
  organization_id: "org-1",
  organization_alias: "acme",
  budget_id: "budget-1",
  metadata: {},
  models: ["gpt-5.2"],
  spend: 0,
  model_spend: {},
  created_at: "2026-01-01T00:00:00Z",
  created_by: "admin",
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: "admin",
  litellm_budget_table: { max_budget: 100, budget_duration: "30d", tpm_limit: 1000, rpm_limit: 50 },
  teams: null,
  users: null,
  members: null,
  object_permission: {
    object_permission_id: "op-1",
    mcp_servers: ["srv-1"],
    mcp_access_groups: [],
    vector_stores: ["vs-1"],
  },
};

const renderForm = (overrides?: { patchOrganization?: Mock; onSaved?: () => void }) => {
  const patchOrganization = overrides?.patchOrganization ?? vi.fn().mockResolvedValue({});
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <OrgSettingsForm
        organizationId="org-1"
        org={org}
        accessToken="token"
        onCancel={vi.fn()}
        onSaved={overrides?.onSaved ?? vi.fn()}
        patchOrganization={patchOrganization}
      />
    </QueryClientProvider>,
  );
  return { patchOrganization };
};

describe("OrgSettingsForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every field label, selector placeholder and action in Chinese", () => {
    renderForm();

    expect(screen.getByLabelText("组织名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Organization Name")).not.toBeInTheDocument();
    expect(screen.getByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("重置预算")).toBeInTheDocument();
    expect(screen.queryByLabelText("Reset Budget")).not.toBeInTheDocument();
    expect(screen.getByLabelText("每分钟 Token 数上限（TPM）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tokens per minute Limit (TPM)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("每分钟请求数上限（RPM）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Requests per minute Limit (RPM)")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Vector Stores")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择向量存储")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select vector stores")).not.toBeInTheDocument();
    expect(screen.getByText("MCP 服务器与访问组")).toBeInTheDocument();
    expect(screen.queryByText("MCP Servers & Access Groups")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 MCP 服务器与访问组")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select MCP servers and access groups")).not.toBeInTheDocument();
    expect(screen.getByLabelText("元数据")).toBeInTheDocument();
    expect(screen.queryByLabelText("Metadata")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the budget duration options in Chinese", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByLabelText("重置预算"));

    expect(await screen.findByRole("option", { name: "不重置" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "No reset" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每天" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "daily" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每周" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "weekly" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每月" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "monthly" })).not.toBeInTheDocument();
  });

  it("shows the saving label in Chinese while the patch is pending", async () => {
    const user = userEvent.setup();
    renderForm({ patchOrganization: vi.fn().mockImplementation(() => new Promise(() => {})) });

    fireEvent.change(screen.getByLabelText("组织名称"), { target: { value: "acme-2" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByRole("button", { name: "保存中…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });

  it("reports the save outcome in Chinese", async () => {
    const user = userEvent.setup();
    const { patchOrganization } = renderForm();

    fireEvent.change(screen.getByLabelText("组织名称"), { target: { value: "acme-2" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("组织设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Organization settings updated successfully");

    patchOrganization.mockRejectedValueOnce("boom");
    fireEvent.change(screen.getByLabelText("组织名称"), { target: { value: "acme-3" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新组织设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update organization settings");
  });

  it("reports the validation errors in Chinese", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.clear(screen.getByLabelText("组织名称"));
    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("请输入组织名称");
    expect(screen.queryByText("Please input an organization name")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("组织名称"), { target: { value: "acme" } });
    fireEvent.change(screen.getByLabelText("最大预算（USD）"), { target: { value: "-1" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("必须为非负数");
    expect(screen.queryByText("Must be a non-negative number")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("最大预算（USD）"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("每分钟 Token 数上限（TPM）"), { target: { value: "-1" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("必须为非负整数");
    expect(screen.queryByText("Must be a non-negative whole number")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("每分钟 Token 数上限（TPM）"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("元数据"), { target: { value: "not json" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("元数据必须是有效的 JSON 对象");
    expect(screen.queryByText("Metadata must be a valid JSON object")).not.toBeInTheDocument();
  });
});
