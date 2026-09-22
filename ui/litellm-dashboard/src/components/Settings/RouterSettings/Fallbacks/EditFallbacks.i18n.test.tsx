import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import EditFallbacks, { Fallbacks } from "./EditFallbacks";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

const FALLBACK_ENTRY = { "gpt-4": ["gpt-3.5-turbo"] };
const VALUE: Fallbacks = [{ "gpt-4": ["gpt-3.5-turbo"] }];

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const renderEdit = (onChange = vi.fn().mockResolvedValue(undefined), onClose = vi.fn()) => {
  renderWithProviders(
    <EditFallbacks
      accessToken="token"
      fallbackEntry={FALLBACK_ENTRY}
      value={VALUE}
      onChange={onChange}
      onClose={onClose}
    />,
  );
  return { onChange, onClose };
};

describe("EditFallbacks Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the modal chrome and the save button in Chinese and hides the English originals", async () => {
    renderEdit();
    await screen.findByRole("dialog");

    expect(screen.getByText("配置模型回退")).toBeInTheDocument();
    expect(screen.queryByText("Configure Model Fallbacks")).not.toBeInTheDocument();
    expect(screen.getByText("为不同模型管理多个回退链（一次最多 5 个分组）")).toBeInTheDocument();
    expect(
      screen.queryByText("Manage multiple fallback chains for different models (up to 5 groups at a time)"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("renders the saving state in Chinese and hides the English original", async () => {
    let resolveChange: (() => void) | undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
    );
    renderEdit(onChange);
    await screen.findByRole("dialog");

    await user().click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByRole("button", { name: "正在保存更改..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving Changes..." })).not.toBeInTheDocument();

    resolveChange?.();
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  it("reports a successful update in Chinese and not in English", async () => {
    renderEdit();
    await screen.findByRole("dialog");

    await user().click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("gpt-4 的回退更新成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Fallbacks for gpt-4 updated successfully!");
  });
});

describe("EditFallbacks English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the modal chrome and the save button byte-identical", async () => {
    renderEdit();
    await screen.findByRole("dialog");

    expect(screen.getByText("Configure Model Fallbacks")).toBeInTheDocument();
    expect(
      screen.getByText("Manage multiple fallback chains for different models (up to 5 groups at a time)"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("keeps the saving state and the update toast byte-identical", async () => {
    let resolveChange: (() => void) | undefined;
    const onChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
    );
    renderEdit(onChange);
    await screen.findByRole("dialog");

    await user().click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByRole("button", { name: "Saving Changes..." })).toBeInTheDocument();

    resolveChange?.();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Fallbacks for gpt-4 updated successfully!"));
  });
});
