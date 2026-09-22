import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { MCPServerData } from "@/components/AIHub/MCPHubTableColumns";

import MakeMCPPublicForm from "./MakeMCPPublicForm";

vi.mock("../../networking", () => ({
  makeMCPPublicCall: vi.fn(),
}));

import { makeMCPPublicCall } from "../../networking";

const server = (overrides: Partial<MCPServerData> = {}): MCPServerData => ({
  server_id: "server-1",
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
  allowed_tools: [],
  extra_headers: [],
  mcp_info: {},
  static_headers: {},
  status: "active",
  args: [],
  env: {},
  ...overrides,
});

const baseProps = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "test-token",
  onSuccess: vi.fn(),
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const findParagraph = (text: string): HTMLElement =>
  screen.getByText((_, el) => el?.tagName === "P" && normalize(el.textContent ?? "") === normalize(text));

const hasParagraph = (pattern: RegExp): boolean =>
  screen.queryAllByText((_, el) => el?.tagName === "P" && pattern.test(el.textContent ?? "")).length > 0;

describe("MakeMCPPublicForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the step one copy in Chinese and hides the English originals", () => {
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[server()]} />);

    expectLocalized("将 MCP 服务器设为公开", "Make MCP Servers Public");
    expectLocalized("选择要设为公开的 MCP 服务器", "Select MCP Servers to Make Public");
    expectLocalized("选择服务器", "Select Servers");
    expectLocalized("确认", "Confirm");
    expectLocalized(
      "选择你希望在公共 Model Hub 上可见的 MCP 服务器。用户仍需有效的 Virtual Key 才能使用这些服务器。",
      "Select the MCP servers you want to be visible on the public model hub. Users will still require a valid Virtual Key to use these servers.",
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选 (1)" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select All (1)" })).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", () => {
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[]} />);

    expectLocalized("没有可用的 MCP 服务器。", "No MCP servers available.");
    expect(screen.getByRole("checkbox", { name: "全选" })).toBeInTheDocument();
  });

  it("renders the server status values in Chinese and hides the English originals", () => {
    render(
      <MakeMCPPublicForm
        {...baseProps}
        mcpHubData={[server({ status: "active" }), server({ server_id: "server-2", server_name: "b", status: "" })]}
      />,
    );

    expectLocalized("活跃", "active");
    expectLocalized("未知", "unknown");
  });

  it("renders the tools overflow count in Chinese and hides the English original", () => {
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[server({ allowed_tools: ["a", "b", "c", "d", "e"] })]} />);

    expectLocalized("还有 2 个", "+2 more");
  });

  it("renders the selected and total counts in Chinese with the full rendered strings", async () => {
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[server({ mcp_info: { is_public: true } })]} />);

    expect(screen.getByText("个 MCP 服务器已选中")).toHaveTextContent("1 个 MCP 服务器已选中");
    expect(screen.queryByText("MCP server selected")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expectLocalized("确认将 MCP 服务器设为公开", "Confirm Making MCP Servers Public");
    expectLocalized("要设为公开的 MCP 服务器：", "MCP Servers to be made public:");
    expectLocalized("警告：", "Warning:");
    expectLocalized("设为公开", "Make Public");
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();

    expect(findParagraph("总计： 1 个 MCP 服务器将被设为公开")).toBeInTheDocument();
    expect(hasParagraph(/MCP server will be made public/)).toBe(false);
  });

  it("renders the plural total count in Chinese and hides the English original", async () => {
    render(
      <MakeMCPPublicForm
        {...baseProps}
        mcpHubData={[
          server({ mcp_info: { is_public: true } }),
          server({ server_id: "server-2", server_name: "b", mcp_info: { is_public: true } }),
        ]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(findParagraph("总计： 2 个 MCP 服务器将被设为公开")).toBeInTheDocument();
    expect(hasParagraph(/MCP servers will be made public/)).toBe(false);
    expect(screen.queryByText("MCP servers selected")).not.toBeInTheDocument();
  });

  it("renders the warning body in Chinese and hides the English original while keeping the route literal", async () => {
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[server({ mcp_info: { is_public: true } })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    const warning = screen.getByText(/一旦你将这些 MCP 服务器设为公开/);
    expect(warning).toHaveTextContent(
      "一旦你将这些 MCP 服务器设为公开，任何能访问 /ui/model_hub_table 的人都能知道它们存在于该代理上。",
    );
    expect(screen.getByText("/ui/model_hub_table")).toBeInTheDocument();
    expect(screen.queryByText(/Once you make these MCP servers public/)).not.toBeInTheDocument();
  });

  it("reports the success toast in Chinese and not in English", async () => {
    vi.mocked(makeMCPPublicCall).mockResolvedValueOnce({});
    render(
      <MakeMCPPublicForm
        {...baseProps}
        mcpHubData={[
          server({ mcp_info: { is_public: true } }),
          server({ server_id: "server-2", server_name: "b", mcp_info: { is_public: true } }),
        ]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("已成功将 2 个 MCP 服务器设为公开！");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Successfully made 2 MCP server(s) public!");
  });

  it("reports the failure toast in Chinese and not in English", async () => {
    vi.mocked(makeMCPPublicCall).mockRejectedValueOnce(new Error("boom"));
    render(<MakeMCPPublicForm {...baseProps} mcpHubData={[server({ mcp_info: { is_public: true } })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("将 MCP 服务器设为公开失败。请重试。");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to make MCP servers public. Please try again.");
  });

  it("reports the empty-selection guard in Chinese and not in English", async () => {
    const { rerender } = render(
      <MakeMCPPublicForm {...baseProps} mcpHubData={[server({ mcp_info: { is_public: true } })]} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    rerender(
      <MakeMCPPublicForm
        {...baseProps}
        visible={false}
        mcpHubData={[server({ server_id: "server-2", server_name: "b", mcp_info: {} })]}
      />,
    );
    rerender(
      <MakeMCPPublicForm
        {...baseProps}
        mcpHubData={[server({ server_id: "server-2", server_name: "b", mcp_info: {} })]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "设为公开" }));
    });

    expect(toast.fromError).toHaveBeenCalledWith("请至少选择一个要设为公开的 MCP 服务器");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select at least one MCP server to make public");
  });
});
