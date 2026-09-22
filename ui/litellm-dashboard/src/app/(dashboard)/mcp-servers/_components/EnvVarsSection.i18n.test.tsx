import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import EnvVarsSection from "./EnvVarsSection";
import { renderInMcpForm } from "./McpFormTestHarness";
import { expectPair, expectTooltipPair } from "./mcpI18nTestUtils";

const oneGlobalRow = { env_vars: [{ name: "DB_PROTOCOL", value: "postgresql", scope: "global" }] };

describe("EnvVarsSection Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese section heading and hides the English original", () => {
    renderInMcpForm(<EnvVarsSection />);

    expectPair("变量", "Variables");
  });

  it("renders the Chinese tooltip intro in the same open state and hides the English original", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<EnvVarsSection />);

    await expectTooltipPair(
      user,
      "变量",
      "定义可在 Static Headers 或认证中使用",
      "Define variables you can interpolate in Static Headers or Authentication using",
    );
  });

  it("renders the Chinese instance scope and its description in the same open state and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<EnvVarsSection />);

    await expectTooltipPair(user, "变量", "实例", "Instance");
    await expectTooltipPair(
      user,
      "变量",
      "由管理员定义、供所有用户使用的值。",
      "admin-defined value used for every user.",
    );
  });

  it("renders the Chinese per-user scope and its description in the same open state and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<EnvVarsSection />);

    await expectTooltipPair(user, "变量", "每用户", "Per-user");
    await expectTooltipPair(
      user,
      "变量",
      "每个用户通过 MCP Gateway 仪表板提供自己的值（例如个人凭证）。",
      "each user supplies their own value (e.g. personal credentials) via the MCP Gateway dashboard.",
    );
  });

  it("renders the Chinese reference hint and example and hides the English originals", () => {
    renderInMcpForm(<EnvVarsSection />);

    expect(screen.getByText("在 Static Headers 或认证中按以下方式引用这些变量", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("例如：", { exact: false })).toBeInTheDocument();
    expect(
      screen.queryByText("Reference these in Static Headers or Authentication as", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("For example:", { exact: false })).not.toBeInTheDocument();
  });

  it("renders the Chinese column headers and hides the English originals", () => {
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);

    expectPair("变量名", "Variable Name");
    expectPair("值 / 描述", "Value / Description");
    expectPair("作用域", "Scope");
  });

  it("renders the Chinese scope options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "实例" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每用户" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Instance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Per-user" })).not.toBeInTheDocument();
  });

  it("renders the Chinese add-variable button and hides the English original", () => {
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);

    expectPair("添加变量", "Add Variable");
  });

  it("renders the Chinese name and value placeholders and hides the English originals", () => {
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);

    expect(screen.getByPlaceholderText("例如 DB_PROTOCOL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 postgresql")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. DB_PROTOCOL")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. postgresql")).not.toBeInTheDocument();
  });

  it("renders the Chinese name-required error once the name is emptied and hides the English original", async () => {
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);
    const name = screen.getByPlaceholderText("例如 DB_PROTOCOL");

    fireEvent.change(name, { target: { value: "DB_PROTOCOL" } });
    fireEvent.change(name, { target: { value: "" } });

    expect(await screen.findByText("变量名为必填项")).toBeInTheDocument();
    expect(screen.queryByText("Variable name is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese name-pattern error and hides the English original", async () => {
    renderInMcpForm(<EnvVarsSection />, oneGlobalRow);

    fireEvent.change(screen.getByPlaceholderText("例如 DB_PROTOCOL"), { target: { value: "9LIVES" } });

    expect(await screen.findByText("请使用字母、数字和下划线；不能以数字开头。")).toBeInTheDocument();
    expect(screen.queryByText("Use letters, digits, underscores; cannot start with a digit.")).not.toBeInTheDocument();
  });

  it("renders the Chinese per-user hint, tooltip and description placeholder and hides the English originals", async () => {
    const user = userEvent.setup();
    renderInMcpForm(<EnvVarsSection />, {
      env_vars: [{ name: "DB_USER", value: "", scope: "user", description: "" }],
    });

    expectPair("提示", "Hint");
    expect(screen.getByPlaceholderText("例如 你的数据库用户名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. Your DB username")).not.toBeInTheDocument();
    await expectTooltipPair(
      user,
      "提示",
      "每用户变量没有共享值。此文本只是提示，在用户填写自己的值时显示。",
      "Per-user variables have no shared value. This text is only a hint shown to each user when they fill in their own value.",
    );
  });
});
