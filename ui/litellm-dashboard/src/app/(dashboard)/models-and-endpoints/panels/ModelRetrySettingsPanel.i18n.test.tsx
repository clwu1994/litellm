import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import ModelRetrySettingsPanel from "./ModelRetrySettingsPanel";

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/components/networking", () => ({
  getCallbacksCall: vi.fn().mockResolvedValue({ router_settings: {} }),
}));

vi.mock("@/app/(dashboard)/hooks/routerSettings/useUpdateRetryPolicy", () => ({
  useUpdateRetryPolicy: () => ({ mutate, isPending: false }),
}));

vi.mock("@/app/(dashboard)/models-and-endpoints/useModelDashboardData", () => ({
  useModelDashboardData: () => ({ availableModelGroups: [] }),
}));

describe("ModelRetrySettingsPanel Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("reports the save success in Chinese", async () => {
    const user = userEvent.setup();
    render(<ModelRetrySettingsPanel />);

    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    const options = mutate.mock.calls.at(-1)![1] as { onSuccess: () => void };
    options.onSuccess();

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("重试设置保存成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Retry settings saved successfully");
  });

  it("reports the save failure in Chinese", async () => {
    const user = userEvent.setup();
    render(<ModelRetrySettingsPanel />);

    await user.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(mutate).toHaveBeenCalled());

    const options = mutate.mock.calls.at(-1)![1] as { onError: () => void };
    options.onError();

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存重试设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save retry settings");
  });
});
