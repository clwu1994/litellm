import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ModelRetrySettingsTab from "./ModelRetrySettingsTab";

type GlobalRetryPolicy = { [key: string]: number };
type ModelGroupRetryPolicy = { [key: string]: { [key: string]: number } | undefined };

const buildProps = (overrides: Record<string, unknown> = {}) => ({
  selectedModelGroup: "global" as string | null,
  setSelectedModelGroup: vi.fn(),
  availableModelGroups: ["gpt-4", "claude-3-opus"],
  globalRetryPolicy: null as GlobalRetryPolicy | null,
  setGlobalRetryPolicy: vi.fn(),
  defaultRetry: 0,
  modelGroupRetryPolicy: null as ModelGroupRetryPolicy | null,
  setModelGroupRetryPolicy: vi.fn(),
  handleSaveRetrySettings: vi.fn(),
  ...overrides,
});

describe("ModelRetrySettingsTab Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese global scope heading, description and scope label", () => {
    render(<ModelRetrySettingsTab {...buildProps()} />);

    expect(screen.getByText("重试策略范围：")).toBeInTheDocument();
    expect(screen.queryByText("Retry Policy Scope:")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "全局重试策略" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Global Retry Policy" })).not.toBeInTheDocument();
    expect(screen.getByText("应用于所有模型组的默认重试设置，除非被覆盖")).toBeInTheDocument();
    expect(
      screen.queryByText("Default retry settings applied to all model groups unless overridden"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese global default scope option and the Chinese Save button", () => {
    render(<ModelRetrySettingsTab {...buildProps()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent("全局默认");
    expect(screen.queryByText("Global Default")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders the Chinese all-other-errors row and its retry-count aria label", () => {
    render(<ModelRetrySettingsTab {...buildProps()} />);

    expect(screen.getByText("所有其他错误")).toBeInTheDocument();
    expect(screen.queryByText("All other errors")).not.toBeInTheDocument();
    expect(screen.getByLabelText("所有其他错误 重试次数")).toBeInTheDocument();
    expect(screen.getByLabelText("BadRequestError (400) 重试次数")).toBeInTheDocument();
    expect(screen.queryByLabelText("BadRequestError (400) retry count")).not.toBeInTheDocument();
  });

  it("renders the Chinese model scope heading, description and inherited value", () => {
    render(
      <ModelRetrySettingsTab
        {...buildProps({
          selectedModelGroup: "gpt-4",
          globalRetryPolicy: { BadRequestErrorRetries: 2 },
          defaultRetry: 0,
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "gpt-4 的重试策略" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Retry Policy for gpt-4" })).not.toBeInTheDocument();
    expect(screen.getByText("针对特定模型的重试设置。未设置时回退到全局默认值。")).toBeInTheDocument();
    expect(
      screen.queryByText("Model-specific retry settings. Falls back to global defaults if not set."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("（全局：2）")).toBeInTheDocument();
    expect(screen.queryByText("(Global: 2)")).not.toBeInTheDocument();
  });

  it("renders the Chinese Reset button for a row with an override", async () => {
    const user = userEvent.setup();
    const setModelGroupRetryPolicy = vi.fn();
    render(
      <ModelRetrySettingsTab
        {...buildProps({
          selectedModelGroup: "gpt-4",
          modelGroupRetryPolicy: { "gpt-4": { BadRequestErrorRetries: 5 } },
          setModelGroupRetryPolicy,
        })}
      />,
    );

    const resetButton = screen.getByRole("button", { name: "重置" });
    expect(resetButton).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();

    await user.click(resetButton);
    expect(setModelGroupRetryPolicy).toHaveBeenCalled();
  });
});
