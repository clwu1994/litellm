/* eslint-disable testing-library/no-node-access -- The <Trans> intro renders its first clause inside <strong>, so the paragraph text is reached from that node */
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPToolConfiguration from "./mcp_tool_configuration";

const twoTools = [
  { name: "read_user", description: "Read user" },
  { name: "delete_user", description: "Delete user" },
];

const baseProps = {
  accessToken: "token",
  formValues: { url: "https://example.com/mcp", transport: "http", auth_type: "none" },
  allowedTools: [] as string[],
  existingAllowedTools: null,
  onAllowedToolsChange: vi.fn(),
  onToolNameToDisplayNameChange: vi.fn(),
  onToolNameToDescriptionChange: vi.fn(),
  isEditMode: true,
};

const renderConfig = (overrides: Record<string, unknown> = {}) =>
  render(
    <MCPToolConfiguration
      {...baseProps}
      toolNameToDisplayName={{}}
      toolNameToDescription={{}}
      externalTools={twoTools}
      externalCanFetch
      {...overrides}
    />,
  );

const EditableRow = ({ tool }: { tool: { name: string; description?: string } }) => {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  return (
    <MCPToolConfiguration
      {...baseProps}
      toolNameToDisplayName={displayNames}
      toolNameToDescription={descriptions}
      onToolNameToDisplayNameChange={setDisplayNames}
      onToolNameToDescriptionChange={setDescriptions}
      externalTools={[tool]}
      externalCanFetch
    />
  );
};

describe("MCPToolConfiguration Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the loaded configuration header and grouped view in Chinese and hides the English originals", () => {
    renderConfig();

    expect(screen.getByText("工具配置")).toBeInTheDocument();
    expect(screen.getByText("风险分组")).toBeInTheDocument();
    expect(screen.getByText("平铺列表")).toBeInTheDocument();
    const selectTools = screen.getByText("选择用户可以调用的工具：").closest("p");
    expect(selectTools).toHaveTextContent(
      "选择用户可以调用的工具：只有勾选的工具才可供用户调用。未勾选的工具将被阻止执行。",
    );
    expect(selectTools).not.toHaveTextContent(
      "Select which tools users can call: Only checked tools will be available for users to invoke. Unchecked tools will be blocked from execution.",
    );
    expect(screen.getByText("已为用户访问启用 2 个工具中的 2 个")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称或描述搜索工具...")).toBeInTheDocument();
    expect(screen.queryByText("Tool Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Risk Groups")).not.toBeInTheDocument();
    expect(screen.queryByText("Flat List")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select which tools users can call: Only checked tools will be available for users to invoke. Unchecked tools will be blocked from execution.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("2 of 2 tools enabled for user access")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search tools by name or description...")).not.toBeInTheDocument();
  });

  it("renders the flat list headings, bulk actions and row copy in Chinese and hides the English originals", () => {
    renderConfig({ keyTools: [{ name: "read_user", description: "Read user" }] });

    fireEvent.click(screen.getByText("平铺列表"));

    expect(screen.getByText("建议的工具")).toBeInTheDocument();
    expect(screen.getByText("所有工具")).toBeInTheDocument();
    expect(screen.getAllByText("全部启用")).toHaveLength(2);
    expect(screen.getAllByText("全部禁用")).toHaveLength(2);
    expect(screen.getAllByText("✓ 用户可以调用此工具")).toHaveLength(2);
    expect(screen.getAllByTitle("编辑显示名称和描述")).toHaveLength(2);
    expect(screen.queryByText("Suggested tools")).not.toBeInTheDocument();
    expect(screen.queryByText("All tools")).not.toBeInTheDocument();
    expect(screen.queryByText("Enable all")).not.toBeInTheDocument();
    expect(screen.queryByText("Disable all")).not.toBeInTheDocument();
    expect(screen.queryByText("✓ Users can call this tool")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Edit display name and description")).not.toBeInTheDocument();
  });

  it("renders the plain tools heading in Chinese when no tool is suggested", () => {
    renderConfig();

    fireEvent.click(screen.getByText("平铺列表"));

    expect(screen.getByText("工具")).toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("renders the expanded row editor in Chinese and hides the English originals", async () => {
    render(<EditableRow tool={{ name: "read_user" }} />);

    fireEvent.click(screen.getByText("平铺列表"));
    fireEvent.click(screen.getByTitle("编辑显示名称和描述"));

    expect(screen.getByText("显示名称")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("无描述")).toBeInTheDocument();
    expect(screen.getByText("覆盖用户看到的此工具名称。留空则使用原始名称。")).toBeInTheDocument();
    expect(screen.getByText("覆盖向用户显示的工具描述。留空则使用原始描述。")).toBeInTheDocument();
    expect(screen.queryByText("Display Name")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("No description")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Override how this tool's name appears to users. Leave blank to use original."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Override the tool description shown to users. Leave blank to use original."),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("read_user"), { target: { value: "Browse Repo" } });

    await waitFor(() => {
      expect(screen.getByText("自定义名称")).toBeInTheDocument();
      expect(screen.getByText("仅允许字母、数字、下划线和连字符（不能有空格）。")).toBeInTheDocument();
    });
    expect(screen.queryByText("Custom name")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Only letters, digits, underscores, and hyphens are allowed (no spaces)."),
    ).not.toBeInTheDocument();
  });

  it("renders the disabled row copy in Chinese and hides the English original", () => {
    renderConfig({ existingAllowedTools: [] });

    fireEvent.click(screen.getByText("平铺列表"));

    expect(screen.getAllByText("✗ 用户不能调用此工具")).toHaveLength(2);
    expect(screen.queryByText("✗ Users cannot call this tool")).not.toBeInTheDocument();
  });

  it("renders the loading state in Chinese and hides the English original", () => {
    renderConfig({ externalIsLoading: true });

    expect(screen.getByText("正在加载工具...")).toBeInTheDocument();
    expect(screen.queryByText("Loading tools...")).not.toBeInTheDocument();
  });

  it("renders the preview-forbidden message in Chinese and hides the English original", () => {
    renderConfig({
      externalError: "Tool preview is not available for submissions. Tools will be verified by an admin during review.",
      externalErrorStatus: 403,
    });

    expect(screen.getByText("提交内容不支持工具预览。工具将由管理员在审核期间验证。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Tool preview is not available for submissions. Tools will be verified by an admin during review.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the generic load failure in Chinese and hides the English originals", () => {
    renderConfig({ externalError: "boom", externalErrorStatus: 500 });

    expect(screen.getByText("无法加载工具")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
    expect(screen.queryByText("Unable to load tools")).not.toBeInTheDocument();
  });

  it("renders the spec-empty state in Chinese and hides the English originals", () => {
    renderConfig({ externalTools: [], keyTools: [{ name: "read_user", description: "Read user" }] });

    expect(screen.getByText("未从 spec 加载到工具")).toBeInTheDocument();
    expect(screen.getByText("预期工具：read_user")).toBeInTheDocument();
    expect(screen.queryByText("No tools loaded from spec")).not.toBeInTheDocument();
    expect(screen.queryByText("Expected tools: read_user")).not.toBeInTheDocument();
  });

  it("renders the no-tools state in Chinese and hides the English originals", () => {
    renderConfig({ externalTools: [] });

    expect(screen.getByText("没有可配置的工具")).toBeInTheDocument();
    expect(screen.getByText("连接带工具的 MCP 服务器以进行配置")).toBeInTheDocument();
    expect(screen.queryByText("No tools available for configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect to an MCP server with tools to configure them")).not.toBeInTheDocument();
  });

  it("renders the incomplete-form state in Chinese and hides the English originals", () => {
    renderConfig({ externalCanFetch: false });

    expect(screen.getByText("填写必填字段以配置工具")).toBeInTheDocument();
    expect(screen.getByText("填写 URL、Transport 和 Authentication 以加载可用工具")).toBeInTheDocument();
    expect(screen.queryByText("Complete required fields to configure tools")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Fill in URL, Transport, and Authentication to load available tools"),
    ).not.toBeInTheDocument();
  });

  it("renders the search-miss state in Chinese and hides the English original", () => {
    renderConfig();

    fireEvent.click(screen.getByText("平铺列表"));
    fireEvent.change(screen.getByPlaceholderText("按名称或描述搜索工具..."), { target: { value: "zzz" } });

    expect(screen.getByText("未找到匹配“zzz”的工具")).toBeInTheDocument();
    expect(screen.queryByText('No tools found matching "zzz"')).not.toBeInTheDocument();
  });

  it("keeps the English tool/plural summary when the locale is English", async () => {
    await i18n.changeLanguage("en");

    const { unmount } = renderConfig({ externalTools: [twoTools[0]] });
    expect(screen.getByText("1 of 1 tool enabled for user access")).toBeInTheDocument();
    unmount();

    renderConfig();
    expect(screen.getByText("2 of 2 tools enabled for user access")).toBeInTheDocument();
  });
});
