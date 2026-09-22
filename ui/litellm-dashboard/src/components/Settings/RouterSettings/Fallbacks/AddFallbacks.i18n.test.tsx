import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AddFallbacks from "./AddFallbacks";
import type { FallbackGroup } from "./FallbackGroupConfig";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("./FallbackSelectionForm", () => ({
  FallbackSelectionForm: ({
    groups,
    onGroupsChange,
  }: {
    groups: FallbackGroup[];
    onGroupsChange: (groups: FallbackGroup[]) => void;
  }) => (
    <button
      type="button"
      data-testid="complete-groups"
      onClick={() =>
        onGroupsChange(groups.map((group) => ({ ...group, primaryModel: "gpt-4", fallbackModels: ["gpt-3.5-turbo"] })))
      }
    >
      complete groups
    </button>
  ),
}));

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const openModal = async (name: string) => {
  await user().click(screen.getByRole("button", { name }));
  await screen.findByRole("dialog");
};

describe("AddFallbacks Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the add button and the modal chrome in Chinese and hides the English originals", async () => {
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "+添加回退" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+Add Fallbacks" })).not.toBeInTheDocument();

    await openModal("+添加回退");

    expect(screen.getByText("配置模型回退")).toBeInTheDocument();
    expect(screen.queryByText("Configure Model Fallbacks")).not.toBeInTheDocument();
    expect(screen.getByText("为不同模型管理多个回退链（一次最多 5 个分组）")).toBeInTheDocument();
    expect(
      screen.queryByText("Manage multiple fallback chains for different models (up to 5 groups at a time)"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存所有配置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save All Configurations" })).not.toBeInTheDocument();
  });

  it("renders the saving state in Chinese and hides the English original", async () => {
    let resolveChange: (() => void) | undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
    );
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={onChange} />);
    await openModal("+添加回退");
    await user().click(screen.getByTestId("complete-groups"));

    await user().click(screen.getByRole("button", { name: "保存所有配置" }));

    expect(await screen.findByRole("button", { name: "正在保存配置..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving Configuration..." })).not.toBeInTheDocument();

    resolveChange?.();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("reports incomplete groups in Chinese and not in English", async () => {
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={vi.fn()} />);
    await openModal("+添加回退");

    await user().click(screen.getByRole("button", { name: "保存所有配置" }));

    expect(toast.error).toHaveBeenCalledWith("请完成所有分组的配置。还有 1 个分组未完成。");
    expect(toast.error).not.toHaveBeenCalledWith(
      "Please complete configuration for all groups. 1 group(s) incomplete.",
    );
  });

  it("reports a successful save in Chinese and not in English", async () => {
    const onChange = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={onChange} />);
    await openModal("+添加回退");
    await user().click(screen.getByTestId("complete-groups"));

    await user().click(screen.getByRole("button", { name: "保存所有配置" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已成功添加 1 个回退配置！"));
    expect(toast.success).not.toHaveBeenCalledWith("1 fallback configuration(s) added successfully!");
  });

  it("reports the missing onChange callback in Chinese and not in English", async () => {
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} />);
    await openModal("+添加回退");
    await user().click(screen.getByTestId("complete-groups"));

    await user().click(screen.getByRole("button", { name: "保存所有配置" }));

    expect(toast.fromError).toHaveBeenCalledWith("未提供 onChange 回调");
    expect(toast.fromError).not.toHaveBeenCalledWith("onChange callback not provided");
  });
});

describe("AddFallbacks English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the add button and the modal chrome byte-identical", async () => {
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "+Add Fallbacks" })).toBeInTheDocument();

    await openModal("+Add Fallbacks");

    expect(screen.getByText("Configure Model Fallbacks")).toBeInTheDocument();
    expect(
      screen.getByText("Manage multiple fallback chains for different models (up to 5 groups at a time)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save All Configurations" })).toBeInTheDocument();
  });

  it("keeps the saving state byte-identical", async () => {
    let resolveChange: (() => void) | undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
    );
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={onChange} />);
    await openModal("+Add Fallbacks");
    await user().click(screen.getByTestId("complete-groups"));

    await user().click(screen.getByRole("button", { name: "Save All Configurations" }));

    expect(await screen.findByRole("button", { name: "Saving Configuration..." })).toBeInTheDocument();
    resolveChange?.();
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("keeps the incomplete-groups and successful-save toasts byte-identical", async () => {
    const onChange = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} onChange={onChange} />);
    await openModal("+Add Fallbacks");

    await user().click(screen.getByRole("button", { name: "Save All Configurations" }));
    expect(toast.error).toHaveBeenCalledWith("Please complete configuration for all groups. 1 group(s) incomplete.");

    await user().click(screen.getByTestId("complete-groups"));
    await user().click(screen.getByRole("button", { name: "Save All Configurations" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("1 fallback configuration(s) added successfully!"));
  });

  it("keeps the missing-onChange toast byte-identical", async () => {
    renderWithProviders(<AddFallbacks accessToken="token" value={[]} />);
    await openModal("+Add Fallbacks");
    await user().click(screen.getByTestId("complete-groups"));

    await user().click(screen.getByRole("button", { name: "Save All Configurations" }));

    expect(toast.fromError).toHaveBeenCalledWith("onChange callback not provided");
  });
});
