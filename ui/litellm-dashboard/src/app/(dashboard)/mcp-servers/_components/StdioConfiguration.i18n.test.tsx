/* eslint-disable testing-library/no-node-access -- The info trigger is an icon with no accessible name, so reaching its tooltip needs the DOM */

import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { renderInMcpForm } from "./McpFormTestHarness";
import StdioConfiguration from "./StdioConfiguration";

const hoverInfoFor = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
};

describe("StdioConfiguration Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese field label and hides the English original", () => {
    renderInMcpForm(<StdioConfiguration isVisible />);

    expect(screen.getByText("Stdio 配置（JSON）")).toBeInTheDocument();
    expect(screen.queryByText("Stdio Configuration (JSON)")).not.toBeInTheDocument();
  });

  it("renders the Chinese configuration tooltip in the same open state", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<StdioConfiguration isVisible />);

    await hoverInfoFor(user, "Stdio 配置（JSON）");

    expect(
      await screen.findByText(
        "以 JSON 格式粘贴你的 stdio MCP 服务器配置。你可以使用来自 config.yaml 的完整 mcpServers 结构，或仅使用内部的服务器配置。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Paste your stdio MCP server configuration in JSON format. You can use the full mcpServers structure from config.yaml or just the inner server configuration.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese required error once the field is emptied and hides the English original", async () => {
    renderInMcpForm(<StdioConfiguration isVisible />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "{}" } });
    fireEvent.change(textarea, { target: { value: "" } });

    expect(await screen.findByText("请输入 stdio 配置")).toBeInTheDocument();
    expect(screen.queryByText("Please enter stdio configuration")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid-JSON error once invalid JSON is entered and hides the English original", async () => {
    renderInMcpForm(<StdioConfiguration isVisible />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "not json" } });

    expect(await screen.findByText("请输入有效的 JSON")).toBeInTheDocument();
    expect(screen.queryByText("Please enter valid JSON")).not.toBeInTheDocument();
  });
});
