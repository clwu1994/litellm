import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import BudgetModal from "./budget_modal";
import { chooseSelectOption } from "../../../../../tests/test-utils";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/budgets/useBudgets", () => ({
  useCreateBudget: () => ({ mutateAsync: createMock }),
}));

const FULL_PAYLOAD = {
  budget_id: "budget-alpha",
  tpm_limit: 500.57,
  rpm_limit: 7,
  max_budget: 42.57,
  budget_duration: "30d",
};

const renderModal = () => render(<BudgetModal isModalVisible={true} setIsModalVisible={vi.fn()} />);

const create = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Create Budget" }));

const openOptionalSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Optional Settings"));
  await screen.findByLabelText("Max Budget (USD)");
};

describe("BudgetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("submits only the mounted fields when Optional Settings stays collapsed", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Budget ID"), { target: { value: "budget-alpha" } });
    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "500.567" } });
    fireEvent.change(screen.getByLabelText("Max Requests per minute"), { target: { value: "7" } });
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({
      budget_id: "budget-alpha",
      tpm_limit: 500.57,
      rpm_limit: 7,
    });
  });

  it("submits every field once Optional Settings is expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Budget ID"), { target: { value: "budget-alpha" } });
    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "500.567" } });
    fireEvent.change(screen.getByLabelText("Max Requests per minute"), { target: { value: "7" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Max Budget (USD)"), { target: { value: "42.567" } });

    await chooseSelectOption(user, screen.getByRole("combobox"), "monthly");

    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual(FULL_PAYLOAD);
  });

  it("drops Optional Settings values again when the section is collapsed before submit", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Budget ID"), { target: { value: "budget-alpha" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Max Budget (USD)"), { target: { value: "42.567" } });
    await chooseSelectOption(user, screen.getByRole("combobox"), "monthly");

    await user.click(screen.getByText("Optional Settings"));
    await waitFor(() => expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument());
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({ budget_id: "budget-alpha" });
  });

  it("submits a cleared number field as null", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Budget ID"), { target: { value: "budget-alpha" } });
    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "5" } });
    await user.clear(screen.getByLabelText("Max Tokens per minute"));
    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toEqual({
      budget_id: "budget-alpha",
      tpm_limit: null,
    });
  });

  it("blocks submit while Budget ID is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText("Max Tokens per minute"), { target: { value: "5" } });
    await create(user);

    await waitFor(() => expect(screen.getByLabelText("Budget ID")).toHaveAttribute("aria-invalid", "true"));
    expect(createMock).not.toHaveBeenCalled();
  });

  it("keeps a typed Optional Setting when the section is collapsed and reopened, as antd's store did", async () => {
    const user = userEvent.setup();
    renderModal();
    fireEvent.change(screen.getByLabelText("Budget ID"), { target: { value: "probe-budget" } });

    await openOptionalSettings(user);
    fireEvent.change(screen.getByLabelText("Max Budget (USD)"), { target: { value: "42.5" } });

    await user.click(screen.getByText("Optional Settings"));
    await user.click(screen.getByText("Optional Settings"));

    expect(await screen.findByLabelText("Max Budget (USD)")).toHaveValue(42.5);

    await create(user);

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toMatchObject({ budget_id: "probe-budget", max_budget: 42.5 });
  });

  it("renders the Chinese form copy under zh", async () => {
    await i18n.changeLanguage("zh");
    renderModal();

    expect(screen.getAllByText("创建预算")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "创建预算" })).toBeInTheDocument();
    expect(screen.getByLabelText("预算 ID")).toBeInTheDocument();
    expect(screen.getByText("便于识别的预算名称")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟最大 Token 数")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟最大请求数")).toBeInTheDocument();
    expect(screen.getAllByText("留空表示不设 LiteLLM 上限。模型提供方的速率限制仍然生效。")).toHaveLength(2);
    expect(screen.getByText("可选设置")).toBeInTheDocument();

    expect(screen.queryByText("Create Budget")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Budget ID")).not.toBeInTheDocument();
    expect(screen.queryByText("A human-friendly name for the budget")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Max Tokens per minute")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Max Requests per minute")).not.toBeInTheDocument();
    expect(screen.queryByText("Optional Settings")).not.toBeInTheDocument();
  });

  it("renders the Chinese optional settings, duration options and placeholder under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderModal();

    await user.click(screen.getByText("可选设置"));
    expect(await screen.findByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.getByLabelText("重置预算")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("无");
    expect(screen.queryByText("n/a")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "每天" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每周" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "每月" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "daily" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "weekly" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "monthly" })).not.toBeInTheDocument();

    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Reset Budget")).not.toBeInTheDocument();
  });

  it("renders the Chinese budget ID validation message under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderModal();

    fireEvent.change(screen.getByLabelText("每分钟最大 Token 数"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "创建预算" }));

    expect(await screen.findByText("请输入便于识别的预算名称")).toBeInTheDocument();
    expect(screen.queryByText("Please input a human-friendly name for the budget")).not.toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("renders the Chinese create toasts under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    renderModal();

    fireEvent.change(screen.getByLabelText("预算 ID"), { target: { value: "budget-alpha" } });
    await user.click(screen.getByRole("button", { name: "创建预算" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(toast.info).toHaveBeenCalledWith("正在发起 API 调用");
    expect(toast.success).toHaveBeenCalledWith("预算创建成功");
    expect(toast.success).not.toHaveBeenCalledWith("Budget Created");
  });

  it("renders the Chinese create failure toast under zh", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh");
    createMock.mockRejectedValue(new Error("boom"));
    renderModal();

    fireEvent.change(screen.getByLabelText("预算 ID"), { target: { value: "budget-alpha" } });
    await user.click(screen.getByRole("button", { name: "创建预算" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建预算出错：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error creating the budget: Error: boom");
  });
});
