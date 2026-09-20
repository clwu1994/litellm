import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/i18n/bootstrapI18n";
import ToolPermissionRulesEditor, { ToolPermissionConfig } from "./ToolPermissionRulesEditor";

describe("ToolPermissionRulesEditor", () => {
  it("renders empty state and lets users add a new rule", async () => {
    const onChange = vi.fn();
    render(<ToolPermissionRulesEditor value={undefined} onChange={onChange} />);

    expect(screen.getByText(/No tool rules added yet/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add rule/i }));

    expect(onChange).toHaveBeenCalled();
    const payload = onChange.mock.calls[0][0] as ToolPermissionConfig;
    expect(payload.rules).toHaveLength(1);
    expect(payload.rules[0].decision).toBe("allow");
  });

  it("captures violation message and argument constraints", async () => {
    let latestConfig: ToolPermissionConfig | null = null;
    const initialConfig: ToolPermissionConfig = {
      rules: [
        {
          id: "allow_bash",
          tool_name: "Bash",
          decision: "allow",
        },
      ],
      default_action: "deny",
      on_disallowed_action: "block",
      violation_message_template: "",
    };

    const Wrapper = () => {
      const [state, setState] = React.useState(initialConfig);
      const handleChange = (next: ToolPermissionConfig) => {
        latestConfig = next;
        setState(next);
      };
      return <ToolPermissionRulesEditor value={state} onChange={handleChange} />;
    };

    render(<Wrapper />);

    await userEvent.click(screen.getByRole("button", { name: /restrict tool arguments/i }));
    const initialInput = await screen.findByPlaceholderText(/messages\[0\].content/i);
    await userEvent.clear(initialInput);
    fireEvent.change(initialInput, { target: { value: "input.location" } });

    const violationArea = await screen.findByPlaceholderText(/violates our org policy/i);
    await userEvent.clear(violationArea);
    fireEvent.change(violationArea, { target: { value: "Do not run bash" } });

    await waitFor(() => {
      expect(latestConfig).not.toBeNull();
      expect(latestConfig?.rules[0].allowed_param_patterns).toEqual({ "input.location": "" });
      expect(latestConfig?.violation_message_template).toBe("Do not run bash");
    });
  });
});

/* eslint-disable testing-library/no-node-access -- The tooltip trigger is an icon with no accessible name, so reaching it needs the DOM */
const ZhWrapper = () => {
  const [state, setState] = React.useState<ToolPermissionConfig | undefined>(undefined);
  return <ToolPermissionRulesEditor value={state} onChange={setState} />;
};

describe("ToolPermissionRulesEditor Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese guardrail chrome and rule editor and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZhWrapper />);

    expect(screen.getByText("LiteLLM 工具权限 Guardrail")).toBeInTheDocument();
    expect(screen.getByText(/为工具名称或类型提供正则表达式/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加规则" })).toBeInTheDocument();
    expect(screen.getByText("尚未添加工具规则")).toBeInTheDocument();
    expect(screen.getByText("默认操作")).toBeInTheDocument();
    expect(screen.getByText("不允许的操作发生时")).toBeInTheDocument();
    expect(screen.getByText("违规消息（可选）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("This violates our org policy...")).toBeInTheDocument();

    expect(screen.queryByText("LiteLLM Tool Permission Guardrail")).not.toBeInTheDocument();
    expect(screen.queryByText("No tool rules added yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Default action")).not.toBeInTheDocument();
    expect(screen.queryByText("Violation message (optional)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Rule" })).not.toBeInTheDocument();
    expect(screen.queryByText("On disallowed action")).not.toBeInTheDocument();
    expect(screen.queryByText(/Provide regex patterns/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "添加规则" }));

    expect(screen.getByText("规则 1")).toBeInTheDocument();
    expect(screen.getByText("规则 ID")).toBeInTheDocument();
    expect(screen.getByText("工具名称（可选）")).toBeInTheDocument();
    expect(screen.getByText("工具类型（可选）")).toBeInTheDocument();
    expect(screen.getByText("决策")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(screen.queryByText("Rule ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool Name (optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Tool Type (optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Decision")).not.toBeInTheDocument();
    expect(screen.queryByText("Rule 1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "决策" }));
    expect(await screen.findByRole("option", { name: "允许" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "拒绝" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Allow" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
  });

  it("renders the Chinese action, constraint and tooltip chrome and hides the English one", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZhWrapper />);

    await user.click(screen.getByRole("button", { name: "添加规则" }));

    await user.click(screen.getByRole("combobox", { name: "默认操作" }));
    expect(await screen.findByRole("option", { name: "拒绝" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Deny" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("combobox", { name: "不允许的操作发生时" }));
    expect(await screen.findByRole("option", { name: "阻止" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "改写" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Rewrite" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    const trigger = screen.getByText("不允许的操作发生时").parentElement?.querySelector("svg");
    if (!trigger) throw new Error("no on-disallowed hint trigger");
    await user.hover(trigger);
    expect(
      await screen.findByText("阻止：调用被禁止的工具时返回错误。改写：移除该工具调用，但让响应的其余部分继续。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Block returns an error when a forbidden tool is invoked. Rewrite strips the tool call but lets the rest of the response continue.",
      ),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ 限制工具参数（可选）" }));
    expect(screen.getByText("参数约束（点号或数组路径）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 添加另一个约束" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除约束" })).toBeInTheDocument();

    expect(screen.queryByText("+ Restrict tool arguments (optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Argument constraints (dot or array paths)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add another constraint" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove constraint" })).not.toBeInTheDocument();
  });
});
