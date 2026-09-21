import { useProxyConfig } from "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig";
import { useStoreModelInDB } from "@/app/(dashboard)/hooks/storeModelInDB/useStoreModelInDB";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { findTooltipTrigger } from "../../../../tests/i18nTooltip";
import { renderWithProviders } from "../../../../tests/test-utils";
import ModelSettingsModal from "./ModelSettingsModal";

vi.mock("@/app/(dashboard)/hooks/storeModelInDB/useStoreModelInDB");
vi.mock("@/app/(dashboard)/hooks/proxyConfig/useProxyConfig");
vi.mock("@/components/shared/errorUtils", () => ({ parseErrorMessage: vi.fn() }));
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
}));

const mockUseStoreModelInDB = vi.mocked(useStoreModelInDB);
const mockUseProxyConfig = vi.mocked(useProxyConfig);

const renderModal = () => renderWithProviders(<ModelSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

describe("ModelSettingsModal Chinese copy", () => {
  beforeEach(async () => {
    mockUseStoreModelInDB.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as never);
    mockUseProxyConfig.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese title, store label and cancel button", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("模型设置")).toBeInTheDocument();
    expect(screen.queryByText("Model Settings")).not.toBeInTheDocument();
    expect(screen.getByText("将模型存储到数据库")).toBeInTheDocument();
    expect(screen.queryByText("Store Model in DB")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Settings" })).not.toBeInTheDocument();
  });

  it("renders the Chinese loading aria label while the config loads", () => {
    mockUseProxyConfig.mockReturnValue({ data: [], isLoading: true, refetch: vi.fn() } as never);
    renderModal();

    expect(screen.getByRole("status", { name: "正在加载模型设置" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading model settings" })).not.toBeInTheDocument();
  });

  it("renders the Chinese saving label while the save is pending", () => {
    mockUseStoreModelInDB.mockReturnValue({ mutateAsync: vi.fn(), isPending: true } as never);
    renderModal();

    expect(screen.getByRole("button", { name: "正在保存..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saving..." })).not.toBeInTheDocument();
  });

  it("renders the Chinese store description inside the open tooltip", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.hover(findTooltipTrigger(screen.getByText("将模型存储到数据库")));

    expect(await screen.findByText("启用后，模型和配置将存储到数据库并从中加载。")).toBeInTheDocument();
    expect(
      screen.queryByText("If enabled, models and config are stored in and loaded from the database."),
    ).not.toBeInTheDocument();
  });

  it("reports the Chinese save toasts on success and failure", async () => {
    const user = userEvent.setup();
    const errorUtils = await import("@/components/shared/errorUtils");
    vi.mocked(errorUtils.parseErrorMessage).mockReturnValue("boom");
    const mutateAsync = vi.fn().mockImplementation(async (_values, options) => {
      options?.onSuccess?.();
    });
    mockUseStoreModelInDB.mockReturnValue({ mutateAsync, isPending: false } as never);
    renderModal();

    await user.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("模型存储设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Model storage settings updated successfully");

    cleanup();
    const failingMutate = vi.fn().mockImplementation(async (_values, options) => {
      options?.onError?.(new Error("nope"));
    });
    mockUseStoreModelInDB.mockReturnValue({ mutateAsync: failingMutate, isPending: false } as never);
    renderModal();

    await user.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存模型存储设置失败：boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save model storage settings: boom");
  });
});
