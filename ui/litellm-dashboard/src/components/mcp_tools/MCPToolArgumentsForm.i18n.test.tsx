import React from "react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPToolArgumentsForm, { type MCPToolArgumentsFormRef } from "./MCPToolArgumentsForm";
import { type InputSchema, type MCPTool } from "./types";

const toolWith = (schema: InputSchema | string): MCPTool =>
  ({ name: "demo_tool", description: "", inputSchema: schema, mcp_info: {} }) as unknown as MCPTool;

const renderForm = (schema: InputSchema | string) => {
  const ref = React.createRef<MCPToolArgumentsFormRef>();
  renderWithProviders(<MCPToolArgumentsForm ref={ref} tool={toolWith(schema)} />);
  return ref;
};

const submitError = async (ref: React.RefObject<MCPToolArgumentsFormRef | null>) => {
  try {
    await ref.current!.getSubmitValues();
    return null;
  } catch (error) {
    return error;
  }
};

describe("MCPToolArgumentsForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese single-input label, placeholder and validation message", async () => {
    const ref = renderForm("An input schema");

    expect(screen.getByText("输入")).toBeInTheDocument();
    expect(screen.queryByText("Input")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入此工具的内容")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter input for this tool")).not.toBeInTheDocument();

    await submitError(ref);

    expect(await screen.findByText("请输入此工具的内容")).toBeInTheDocument();
    expect(screen.queryByText("Please enter input for this tool")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-parameters empty state", () => {
    renderForm({ type: "object" } as InputSchema);

    expect(screen.getByText("此工具无需参数。")).toBeInTheDocument();
    expect(screen.queryByText("No parameters required for this tool.")).not.toBeInTheDocument();
  });

  it("renders the Chinese field placeholders and required validation", async () => {
    const ref = renderForm({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    });

    expect(screen.getByPlaceholderText("输入 name")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter name")).not.toBeInTheDocument();

    await submitError(ref);

    expect(await screen.findByText("请输入 name")).toBeInTheDocument();
    expect(screen.queryByText("Please enter name")).not.toBeInTheDocument();
  });

  it("renders the Chinese select placeholder and empty-string option", async () => {
    const user = userEvent.setup();
    renderForm({ type: "object", properties: { status: { type: "string", enum: ["", "active"] } } });

    expect(screen.getByText("选择 status")).toBeInTheDocument();
    expect(screen.queryByText("Select status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("空字符串")).toBeInTheDocument();
    expect(within(listbox).queryByText("Empty string")).not.toBeInTheDocument();
  });

  it("renders the boolean options", async () => {
    const user = userEvent.setup();
    renderForm({ type: "object", properties: { flag: { type: "boolean" } } });

    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("True")).toBeInTheDocument();
    expect(within(listbox).getByText("False")).toBeInTheDocument();
  });

  it("renders the Chinese JSON object placeholder and both validation messages", async () => {
    const ref = renderForm({ type: "object", properties: { payload: { type: "object" } } });

    const textarea = screen.getByPlaceholderText("输入 payload 的 JSON 对象");
    expect(screen.queryByPlaceholderText("Enter JSON object for payload")).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "{bad" } });
    await submitError(ref);
    expect(await screen.findByText("JSON 无效")).toBeInTheDocument();
    expect(screen.queryByText("Invalid JSON")).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "[1,2]" } });
    await submitError(ref);
    expect(await screen.findByText("请输入 JSON 对象")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a JSON object")).not.toBeInTheDocument();
  });

  it("renders the Chinese JSON array placeholder and wrong-type validation message", async () => {
    const ref = renderForm({ type: "object", properties: { items: { type: "array" } } });

    const textarea = screen.getByPlaceholderText("输入 items 的 JSON 数组");
    expect(screen.queryByPlaceholderText("Enter JSON array for items")).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '{"a":1}' } });
    await submitError(ref);

    expect(await screen.findByText("请输入 JSON 数组")).toBeInTheDocument();
    expect(screen.queryByText("Please enter a JSON array")).not.toBeInTheDocument();
  });
});
