import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { ToolArgumentsForm } from "./ToolArgumentsForm";
import type { ToolArgumentField } from "./toolCallArguments";

const field = (key: string, prop: ToolArgumentField["prop"], required = false): ToolArgumentField => ({
  key,
  prop,
  required,
});

const renderForm = (overrides: Record<string, unknown> = {}) =>
  render(
    <ToolArgumentsForm
      fields={[]}
      singleInputFallback={false}
      isLoading={false}
      hasRun={false}
      onRun={vi.fn()}
      {...overrides}
    />,
  );

describe("ToolArgumentsForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the single-input fallback in Chinese and hides the English originals", () => {
    renderForm({ singleInputFallback: true });

    expect(screen.getByText("输入")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入此工具的内容")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter input for this tool")).not.toBeInTheDocument();
  });

  it("renders the no-parameters state in Chinese and hides the English originals", () => {
    renderForm();

    expect(screen.getByText("无需参数")).toBeInTheDocument();
    expect(screen.getByText("此工具无需任何输入参数即可调用。")).toBeInTheDocument();
    expect(screen.queryByText("No Parameters Required")).not.toBeInTheDocument();
    expect(screen.queryByText("This tool can be called without any input parameters.")).not.toBeInTheDocument();
  });

  it("renders the JSON object field in Chinese and hides the English originals", () => {
    renderForm({ fields: [field("payload", { type: "object" })] });

    expect(screen.getByPlaceholderText("输入 payload 的 JSON 对象")).toBeInTheDocument();
    expect(screen.getByText("请提供有效的 JSON 对象。")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter JSON object for payload")).not.toBeInTheDocument();
    expect(screen.queryByText("Provide a valid JSON object.")).not.toBeInTheDocument();
  });

  it("renders the JSON array field in Chinese and hides the English originals", () => {
    renderForm({ fields: [field("tags", { type: "array" })] });

    expect(screen.getByPlaceholderText("输入 tags 的 JSON 数组")).toBeInTheDocument();
    expect(screen.getByText("请提供有效的 JSON 数组。")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter JSON array for tags")).not.toBeInTheDocument();
    expect(screen.queryByText("Provide a valid JSON array.")).not.toBeInTheDocument();
  });

  it("renders the enum select options in Chinese and hides the English originals", () => {
    renderForm({ fields: [field("mode", { type: "string", enum: ["fast", ""] }, true)] });

    expect(screen.getByText("选择 mode")).toBeInTheDocument();
    expect(screen.getByText("空字符串")).toBeInTheDocument();
    expect(screen.queryByText("Select mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Empty string")).not.toBeInTheDocument();
  });

  it("renders the plain field placeholder in Chinese and hides the English original", () => {
    renderForm({ fields: [field("name", { type: "string" })] });

    expect(screen.getByPlaceholderText("输入 name")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter name")).not.toBeInTheDocument();
  });

  it("renders the submit button states in Chinese and hides the English originals", () => {
    const { unmount } = renderForm();
    expect(screen.getByRole("button", { name: "调用工具" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Call Tool" })).not.toBeInTheDocument();
    unmount();

    const withRun = renderForm({ hasRun: true });
    expect(screen.getByRole("button", { name: "再次调用" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Call Again" })).not.toBeInTheDocument();
    withRun.unmount();

    renderForm({ isLoading: true });
    expect(screen.getByRole("button", { name: "调用中..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Calling Tool/ })).not.toBeInTheDocument();
  });
});
