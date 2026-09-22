/* eslint-disable testing-library/no-node-access -- The row action triggers are icon-only, so reaching their tooltips needs the DOM */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import Fallbacks from "./Fallbacks";
import * as networkingModule from "../../../networking";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("../../../networking", () => ({
  getCallbacksCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/app/(dashboard)/hooks/models/useModelCostMap", () => ({
  useModelCostMap: vi.fn().mockReturnValue({ data: null }),
}));

vi.mock("openai", () => ({
  default: {
    OpenAI: vi.fn().mockImplementation(function () {
      return { chat: { completions: { create: createMock } } };
    }),
  },
}));

const ROUTER_SETTINGS = { fallbacks: [{ "gpt-4": ["gpt-3.5-turbo"] }] };

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const renderFallbacks = () => renderWithProviders(<Fallbacks accessToken="token" userRole="Admin" userID="user-1" />);

const openTooltip = async (selector: string) => {
  const trigger = document.querySelector(selector);
  await user().hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

const openDeleteDialog = async () => {
  await screen.findByTestId("delete-fallback-button");
  await user().click(screen.getByTestId("delete-fallback-button"));
  return screen.findByRole("dialog");
};

const resetMocks = () => {
  vi.clearAllMocks();
  vi.mocked(networkingModule.getCallbacksCall).mockResolvedValue({ router_settings: ROUTER_SETTINGS });
  vi.mocked(networkingModule.setCallbacksCall).mockResolvedValue(undefined);
  vi.mocked(fetchAvailableModels).mockResolvedValue([]);
};

beforeEach(resetMocks);

describe("Fallbacks Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the table headers in Chinese and hides the English originals", async () => {
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    expect(screen.getByText("模型名称")).toBeInTheDocument();
    expect(screen.queryByText("Model Name")).not.toBeInTheDocument();
    expect(screen.getByText("回退")).toBeInTheDocument();
    expect(screen.queryByText("Fallbacks")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", async () => {
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValueOnce({ router_settings: { fallbacks: [] } });
    renderFallbacks();

    expect(await screen.findByText("未配置回退。添加回退后，当主模型失败时会自动尝试另一个模型。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No fallbacks configured. Add fallbacks to automatically try another model when the primary fails.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the test-fallback tooltip in Chinese while it is open and hides the English original", async () => {
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    const tooltip = await openTooltip(".lucide-play");
    expect(tooltip.textContent?.trim()).toBe("测试回退");
    expect(within(tooltip).queryByText("Test fallback")).not.toBeInTheDocument();
  });

  it("renders the edit-fallback tooltip in Chinese while it is open and hides the English original", async () => {
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    const tooltip = await openTooltip('[data-testid="edit-fallback-button"]');
    expect(tooltip.textContent?.trim()).toBe("编辑回退");
    expect(within(tooltip).queryByText("Edit fallback")).not.toBeInTheDocument();
  });

  it("renders the delete-fallback tooltip in Chinese while it is open and hides the English original", async () => {
    renderFallbacks();
    await screen.findByTestId("delete-fallback-button");

    const tooltip = await openTooltip('[data-testid="delete-fallback-button"]');
    expect(tooltip.textContent?.trim()).toBe("删除回退");
    expect(within(tooltip).queryByText("Delete fallback")).not.toBeInTheDocument();
  });

  it("renders the delete dialog copy in Chinese and hides the English originals", async () => {
    renderFallbacks();
    const dialog = await openDeleteDialog();

    expect(within(dialog).getByText("删除回退？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Fallback?")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此回退吗？此操作无法撤销。")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Are you sure you want to delete this fallback? This action cannot be undone."),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText("回退信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Fallback Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("模型名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Model Name")).not.toBeInTheDocument();
  });

  it("reports a successful router settings update in Chinese and not in English", async () => {
    renderFallbacks();
    const dialog = await openDeleteDialog();

    await user().click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("路由设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Router settings updated successfully");
  });

  it("reports a failed router settings update in Chinese and not in English", async () => {
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedValueOnce(new Error("nope"));
    renderFallbacks();
    const dialog = await openDeleteDialog();

    await user().click(within(dialog).getByRole("button", { name: "删除" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新路由设置失败：Error: nope"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update router settings: Error: nope");
  });

  it("reports the fallback test result in Chinese and hides the English original", async () => {
    createMock.mockResolvedValue({ model: "gpt-3.5-turbo" });
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    await user().click(document.querySelector(".lucide-play") as Element);

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("正在测试回退模型响应..."));
    expect(toast.info).not.toHaveBeenCalledWith("Testing fallback model response...");

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const node = vi.mocked(toast.success).mock.calls[0][0] as React.ReactElement;
    const { container } = renderWithProviders(node);
    expect(container).toHaveTextContent("测试模型=gpt-4，收到模型=gpt-3.5-turbo。请参阅 curl");
    expect(container).not.toHaveTextContent("Test model=gpt-4, received model=gpt-3.5-turbo. See curl");
  });

  it("reports a failed fallback test in Chinese and not in English", async () => {
    createMock.mockRejectedValue(new Error("boom"));
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    await user().click(document.querySelector(".lucide-play") as Element);

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("生成模型响应时出错。请重试。错误：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Error occurred while generating model response. Please try again. Error: Error: boom",
    );
  });
});

describe("Fallbacks English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the table headers and the empty state byte-identical", async () => {
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");

    expect(screen.getByText("Model Name")).toBeInTheDocument();
    expect(screen.getByText("Fallbacks")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    cleanup();
    vi.mocked(networkingModule.getCallbacksCall).mockResolvedValueOnce({ router_settings: { fallbacks: [] } });
    renderFallbacks();
    expect(
      await screen.findByText(
        "No fallbacks configured. Add fallbacks to automatically try another model when the primary fails.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps every row action tooltip byte-identical while it is open", async () => {
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");
    expect((await openTooltip(".lucide-play")).textContent?.trim()).toBe("Test fallback");

    cleanup();
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");
    expect((await openTooltip('[data-testid="edit-fallback-button"]')).textContent?.trim()).toBe("Edit fallback");

    cleanup();
    renderFallbacks();
    await screen.findByTestId("delete-fallback-button");
    expect((await openTooltip('[data-testid="delete-fallback-button"]')).textContent?.trim()).toBe("Delete fallback");
  });

  it("keeps the delete dialog copy byte-identical", async () => {
    renderFallbacks();
    const dialog = await openDeleteDialog();

    expect(within(dialog).getByText("Delete Fallback?")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Are you sure you want to delete this fallback? This action cannot be undone."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Fallback Information")).toBeInTheDocument();
    expect(within(dialog).getByText("Model Name")).toBeInTheDocument();
  });

  it("keeps the router settings toasts byte-identical", async () => {
    renderFallbacks();
    const dialog = await openDeleteDialog();
    await user().click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Router settings updated successfully"));

    cleanup();
    vi.mocked(networkingModule.setCallbacksCall).mockRejectedValueOnce(new Error("nope"));
    renderFallbacks();
    const retryDialog = await openDeleteDialog();
    await user().click(within(retryDialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("Failed to update router settings: Error: nope"));
  });

  it("keeps the fallback test toasts byte-identical", async () => {
    createMock.mockResolvedValue({ model: "gpt-3.5-turbo" });
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");
    await user().click(document.querySelector(".lucide-play") as Element);

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("Testing fallback model response..."));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const node = vi.mocked(toast.success).mock.calls[0][0] as React.ReactElement;
    const { container } = renderWithProviders(node);
    expect(container).toHaveTextContent("Test model=gpt-4, received model=gpt-3.5-turbo. See curl");

    cleanup();
    createMock.mockRejectedValue(new Error("boom"));
    renderFallbacks();
    await screen.findByTestId("edit-fallback-button");
    await user().click(document.querySelector(".lucide-play") as Element);
    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith(
        "Error occurred while generating model response. Please try again. Error: Error: boom",
      ),
    );
  });
});
