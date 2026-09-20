import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import type { GuardrailFormValues } from "./GuardrailFormField";
import GuardrailOptionalParams from "./guardrail_optional_params";

const OPTIONAL_PARAMS = {
  param: "optional_params",
  description: "",
  required: false,
  type: "nested",
  fields: {
    severity_threshold: {
      param: "severity_threshold",
      description: "Severity threshold",
      required: true,
      type: "number",
    },
    enabled: { param: "enabled", description: "Enabled", required: false, type: "bool" },
    category_thresholds: {
      param: "category_thresholds",
      description: "Thresholds",
      required: false,
      type: "dict",
      dict_key_options: ["hate"],
      dict_value_type: "number",
    },
    category_flags: {
      param: "category_flags",
      description: "Flags",
      required: false,
      type: "dict",
      dict_key_options: ["violence"],
      dict_value_type: "boolean",
    },
  },
};

const Harness: React.FC = () => {
  const form = useForm<GuardrailFormValues>();
  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <GuardrailOptionalParams
        optionalParams={OPTIONAL_PARAMS}
        parentFieldKey="optional_params"
        control={form.control}
      />
      <button type="submit">save</button>
    </form>
  );
};

describe("GuardrailOptionalParams Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, fallback description and category chrome", () => {
    render(<Harness />);

    expect(screen.getByText("可选参数")).toBeInTheDocument();
    expect(screen.getByText("为此 Guardrail 提供商配置其他设置")).toBeInTheDocument();
    expect(screen.getAllByText("选择要配置的类别").length).toBe(2);
    expect(screen.getAllByText("选择类别以添加阈值配置").length).toBe(2);

    expect(screen.queryByText("Optional Parameters")).not.toBeInTheDocument();
    expect(screen.queryByText("Configure additional settings for this guardrail provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Select category to configure")).not.toBeInTheDocument();
    expect(screen.queryByText("Select a category to add threshold configuration")).not.toBeInTheDocument();
  });

  it("renders the Chinese boolean options, dict placeholders and remove action and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(screen.getAllByRole("combobox")[0]);
    expect(await screen.findByRole("option", { name: "是" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "否" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "True" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    const openDictSelect = async () => {
      const select = screen
        .getAllByRole("combobox")
        .find((element) => element.textContent?.includes("选择要配置的类别"));
      if (!select) throw new Error("no dict select");
      await user.click(select);
    };

    await openDictSelect();
    await user.click(await screen.findByRole("option", { name: "hate" }));
    expect(screen.getByPlaceholderText("输入 hate 的值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter hate value")).not.toBeInTheDocument();

    await openDictSelect();
    await user.click(await screen.findByRole("option", { name: "violence" }));
    expect(screen.getByText("选择 violence 的值")).toBeInTheDocument();
    expect(screen.queryByText("Select violence value")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "移除" })[0]);
    expect(screen.queryByPlaceholderText("输入 hate 的值")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("renders the Chinese required-field validation and hides the English one", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("severity_threshold 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("severity_threshold is required")).not.toBeInTheDocument();
  });
});
