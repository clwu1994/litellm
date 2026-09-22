import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";

import { getMCPHubTableColumns, MCPServerData } from "./MCPHubTableColumns";

const server = (overrides: Partial<MCPServerData> = {}): MCPServerData => ({
  server_id: "srv-1",
  server_name: "exa_test",
  description: "Search helpers",
  url: "https://mcp.example.com",
  transport: "http",
  auth_type: "api_key",
  created_at: "2026-01-01T00:00:00Z",
  created_by: "admin@example.com",
  updated_at: "2026-01-01T00:00:00Z",
  updated_by: "admin@example.com",
  teams: [],
  mcp_access_groups: [],
  allowed_tools: ["search", "fetch", "crawl"],
  extra_headers: [],
  mcp_info: { is_public: true },
  static_headers: {},
  status: "healthy",
  args: [],
  env: {},
  ...overrides,
});

const renderTable = (data: MCPServerData[]) => {
  const t = i18n.getFixedT(i18n.language, "modelHub");
  render(
    <DataTable
      data={data}
      columns={getMCPHubTableColumns({ onServerClick: vi.fn(), t })}
      getRowId={(row, index) => row.server_id || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("MCPHubTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every column header in Chinese and hides the English originals", () => {
    renderTable([server()]);

    expectLocalized("服务器名称", "Server Name");
    expectLocalized("描述", "Description");
    expectLocalized("传输方式", "Transport");
    expectLocalized("认证类型", "Auth Type");
    expectLocalized("状态", "Status");
    expectLocalized("工具", "Tools");
    expectLocalized("创建者", "Created By");
    expectLocalized("公开", "Public");
    expectLocalized("操作", "Actions");
  });

  it("renders the tool count and the all-tools fallback in Chinese and hides the English originals", () => {
    renderTable([server()]);

    expectLocalized("3 个工具", "3 tools");
    cleanup();

    renderTable([server({ allowed_tools: ["search"] })]);
    expectLocalized("1 个工具", "1 tool");
    cleanup();

    renderTable([server({ allowed_tools: [] })]);
    expectLocalized("所有工具", "All tools");
  });

  it("renders every server status value in Chinese and hides the English originals", () => {
    renderTable([
      server({ server_id: "s1", server_name: "a", status: "active" }),
      server({ server_id: "s2", server_name: "b", status: "inactive" }),
      server({ server_id: "s3", server_name: "c", status: "unknown" }),
      server({ server_id: "s4", server_name: "d", status: "healthy" }),
      server({ server_id: "s5", server_name: "e", status: "unhealthy" }),
      server({ server_id: "s6", server_name: "f", status: "" }),
    ]);

    expectLocalized("活跃", "active");
    expectLocalized("未启用", "inactive");
    expectLocalized("未知", "unknown");
    expectLocalized("健康", "healthy");
    expectLocalized("异常", "unhealthy");
  });

  it("keeps the transport and auth type wire values in English", () => {
    renderTable([server()]);

    expect(screen.getByText("http")).toBeInTheDocument();
    expect(screen.getByText("api_key")).toBeInTheDocument();
  });

  it("renders the public and private status badges in Chinese and hides the English originals", () => {
    renderTable([
      server({ server_id: "s1", server_name: "a", mcp_info: { is_public: true } }),
      server({ server_id: "s2", server_name: "b", mcp_info: { is_public: false } }),
    ]);

    expectLocalized("是", "Yes");
    expectLocalized("否", "No");
  });

  it("renders the row actions menu in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable([server()]);

    await user.click(screen.getByLabelText("打开 MCP 服务器操作"));

    expect(await screen.findByText("查看详情")).toBeInTheDocument();
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(screen.getByText("复制服务器名称")).toBeInTheDocument();
    expect(screen.queryByText("Copy server name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Open MCP server actions")).not.toBeInTheDocument();
  });

  it("reports the copy confirmation in Chinese and not in English", async () => {
    const user = userEvent.setup();
    renderTable([server()]);

    await user.click(screen.getByLabelText("打开 MCP 服务器操作"));
    await user.click(await screen.findByTestId("mcp-hub-action-copy"));

    expect(toast.success).toHaveBeenCalledWith("已复制服务器名称");
    expect(toast.success).not.toHaveBeenCalledWith("Server name copied");
  });
});

describe("MCPHubTableColumns English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural tool counts byte-identical", () => {
    renderTable([server()]);
    expect(screen.getByText("3 tools")).toBeInTheDocument();
    cleanup();

    renderTable([server({ allowed_tools: ["search"] })]);
    expect(screen.getByText("1 tool")).toBeInTheDocument();
  });

  it("keeps the status wire values byte-identical", () => {
    renderTable([
      server({ server_id: "s1", server_name: "a", status: "active" }),
      server({ server_id: "s2", server_name: "b", status: "unhealthy" }),
      server({ server_id: "s3", server_name: "c", status: "" }),
    ]);

    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("unhealthy")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });
});
