import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import type { components } from "@/lib/http/schema";
import { toast } from "@/lib/toast";

import EditBudgetModal from "./edit_budget_modal";
import { chooseSelectOption } from "../../../../../tests/test-utils";

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/budgets/useBudgets", () => ({
  useUpdateBudget: () => ({ mutateAsync: updateMock }),
}));

type BudgetItem = components["schemas"]["BudgetListItem"];

const EXISTING_BUDGET: BudgetItem = {
  budget_id: "budget-alpha",
  max_budget: 100,
  budget_duration: "7d",
  tpm_limit: 1000,
  rpm_limit: 10,
  soft_budget: 25,
  budget_reset_at: "2026-02-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

const renderModal = () =>
  render(<EditBudgetModal isModalVisible={true} setIsModalVisible={vi.fn()} existingBudget={EXISTING_BUDGET} />);

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Save" }));

const openOptionalSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Optional Settings"));
  await screen.findByLabelText("Max Budget (USD)");
};

describe("EditBudgetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("submits only the mounted fields when Optional Settings stays collapsed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Max Tokens per minute"));
    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "500.567" } });
    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock.mock.calls[0][0]).toEqual({
      budget_id: "budget-alpha",
      tpm_limit: 500.57,
      rpm_limit: 10,
    });
  });

  it("submits every field once Optional Settings is expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText("Max Tokens per minute"));
    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "500.567" } });
    await user.clear(screen.getByLabelText("Max Requests per minute"));
    fireEvent.change(screen.getByLabelText("Max Requests per minute"), { target: { value: "7" } });

    await openOptionalSettings(user);
    await user.clear(screen.getByLabelText("Max Budget (USD)"));
    fireEvent.change(screen.getByLabelText("Max Budget (USD)"), { target: { value: "42.567" } });

    await chooseSelectOption(user, screen.getByRole("combobox"), "monthly");

    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const expected = {
      budget_id: "budget-alpha",
      tpm_limit: 500.57,
      rpm_limit: 7,
      max_budget: 42.57,
      budget_duration: "30d",
    };

    expect(updateMock.mock.calls[0][0]).toEqual(expected);
  });

  it("keeps a typed Optional Setting when the section is collapsed and reopened, as antd's store did", async () => {
    const user = userEvent.setup();
    renderModal();

    await openOptionalSettings(user);
    const maxBudget = screen.getByLabelText("Max Budget (USD)");
    await user.clear(maxBudget);
    fireEvent.change(maxBudget, { target: { value: "99.25" } });

    await user.click(screen.getByText("Optional Settings"));
    await user.click(screen.getByText("Optional Settings"));

    expect(await screen.findByLabelText("Max Budget (USD)")).toHaveValue(99.25);

    await save(user);

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock.mock.calls[0][0]).toMatchObject({ max_budget: 99.25 });
  });

  it("renders the Chinese form copy under zh", async () => {
    await i18n.changeLanguage("zh");
    renderModal();

    expect(screen.getByText("编辑预算")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByLabelText("预算 ID")).toBeInTheDocument();
    expect(screen.getByText("预算 ID 创建后无法更改")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟最大 Token 数")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟最大请求数")).toBeInTheDocument();
    expect(screen.getAllByText("留空表示不设 LiteLLM 上限。模型提供方的速率限制仍然生效。")).toHaveLength(2);
    expect(screen.getByText("可选设置")).toBeInTheDocument();

    expect(screen.queryByText("Edit Budget")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Budget ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Budget ID cannot be changed after creation")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("renders the Chinese optional settings and selected duration under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderModal();

    await user.click(screen.getByText("可选设置"));
    expect(await screen.findByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.getByLabelText("重置预算")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("每周");

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "每天" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每月" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "daily" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "monthly" })).not.toBeInTheDocument();

    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reset Budget")).not.toBeInTheDocument();
  });

  it("renders the Chinese update toasts under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderModal();

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(toast.info).toHaveBeenCalledWith("正在发起 API 调用");
    expect(toast.success).toHaveBeenCalledWith("预算更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Budget Updated");
  });

  it("renders the Chinese update failure toast under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    updateMock.mockRejectedValue(new Error("boom"));
    renderModal();

    await user.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新预算出错：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error updating the budget: Error: boom");
  });
});
