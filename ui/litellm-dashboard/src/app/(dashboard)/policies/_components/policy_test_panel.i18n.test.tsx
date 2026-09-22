import React from "react";
import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import * as networking from "@/components/networking";

import PolicyTestPanel from "./policy_test_panel";

vi.mock("@/components/networking");

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ userId: "admin-user-id", userRole: "Admin", accessToken: "test-token" }),
}));

const setup = () => {
  const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
  renderWithProviders(<PolicyTestPanel accessToken="test-token" />);
  return user;
};

const simulate = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "模拟" }));
};

describe("PolicyTestPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(networking.teamListCall).mockResolvedValue([]);
    vi.mocked(networking.keyListCall).mockResolvedValue({ keys: [] });
    vi.mocked(networking.modelAvailableCall).mockResolvedValue({ data: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, description, fields and empty state", async () => {
    setup();
    await waitFor(() => expect(networking.modelAvailableCall).toHaveBeenCalled());

    expect(screen.getByText("策略模拟器")).toBeInTheDocument();
    expect(screen.queryByText("Policy Simulator")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "模拟请求以查看将应用哪些策略和 Guardrails。在下方选择团队、密钥、模型或标签，然后点击「模拟」查看结果。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Simulate a request to see which policies and guardrails would apply. Select a team, key, model, or tags below and click "Simulate" to see the results.',
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("团队别名")).toBeInTheDocument();
    expect(screen.queryByLabelText("Team Alias")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入团队别名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or type a team alias")).not.toBeInTheDocument();
    expect(screen.getByLabelText("密钥别名")).toBeInTheDocument();
    expect(screen.queryByLabelText("Key Alias")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入密钥别名")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or type a key alias")).not.toBeInTheDocument();
    expect(screen.getByLabelText("模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or type a model")).not.toBeInTheDocument();
    expect(screen.getByLabelText("标签")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tags")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入标签并按 Enter")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type a tag and press Enter")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "模拟" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simulate" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();

    expect(screen.getByText("尚未运行模拟")).toBeInTheDocument();
    expect(screen.queryByText("No simulation run yet")).not.toBeInTheDocument();
    expect(
      screen.getByText("在上方填写一个或多个字段，然后点击「模拟」，查看该请求将应用哪些策略和 Guardrails。"),
    ).toBeInTheDocument();
  });

  it("renders the Chinese empty combobox text", async () => {
    const user = setup();

    await user.click(screen.getByLabelText("团队别名"));

    expect(await screen.findByText("未找到选项")).toBeInTheDocument();
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("renders the Chinese results table", async () => {
    vi.mocked(networking.resolvePoliciesCall).mockResolvedValue({
      effective_guardrails: [],
      matched_policies: [
        { policy_name: "policy-alpha", matched_via: "team_alias", guardrails_added: ["pii-masking"] },
        { policy_name: "policy-beta", matched_via: "tag", guardrails_added: [] },
      ],
    });
    const user = setup();

    await simulate(user);

    expect(await screen.findByText("生效的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Effective Guardrails")).not.toBeInTheDocument();
    expect(screen.getByText("匹配的策略")).toBeInTheDocument();
    expect(screen.queryByText("Matched Policies")).not.toBeInTheDocument();
    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.queryByText("Policy")).not.toBeInTheDocument();
    expect(screen.getByText("匹配方式")).toBeInTheDocument();
    expect(screen.queryByText("Matched Via")).not.toBeInTheDocument();
    expect(screen.getByText("添加的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails Added")).not.toBeInTheDocument();
    expect(screen.getByText("policy-alpha")).toBeInTheDocument();
    expect(screen.getAllByText("无")).toHaveLength(2);
    expect(screen.queryByText("No simulation run yet")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match message", async () => {
    vi.mocked(networking.resolvePoliciesCall).mockResolvedValue({
      effective_guardrails: ["pii-masking"],
      matched_policies: [],
    });
    const user = setup();

    await simulate(user);

    expect(await screen.findByText("没有策略匹配此上下文")).toBeInTheDocument();
    expect(screen.queryByText("No policies matched this context")).not.toBeInTheDocument();
  });

  it("renders the Chinese resolve failure alert", async () => {
    vi.mocked(networking.resolvePoliciesCall).mockRejectedValue(new Error("boom"));
    const user = setup();

    await simulate(user);

    expect(await screen.findByText("错误")).toBeInTheDocument();
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
    expect(screen.getByText("解析策略失败。请检查代理日志。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to resolve policies. Check the proxy logs.")).not.toBeInTheDocument();
  });

  it("sends the resolve call from the Chinese controls", async () => {
    vi.mocked(networking.resolvePoliciesCall).mockResolvedValue({ effective_guardrails: [], matched_policies: [] });
    const user = setup();

    await simulate(user);

    await waitFor(() => expect(networking.resolvePoliciesCall).toHaveBeenCalledWith("test-token", {}));
  });
});
