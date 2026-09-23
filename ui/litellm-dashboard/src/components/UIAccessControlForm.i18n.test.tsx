import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor, within } from "@/../tests/test-utils";
import { findTooltipTriggerBeside } from "@/../tests/i18nTooltip";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { getSSOSettings, updateSSOSettings } from "./networking";
import UIAccessControlForm from "./UIAccessControlForm";

vi.mock("./networking", () => ({
  getSSOSettings: vi.fn(),
  updateSSOSettings: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

const renderForm = (accessToken: string | null = "sk-test") => {
  renderWithProviders(<UIAccessControlForm accessToken={accessToken} onSuccess={vi.fn()} />);
  return userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
};

const openAccessModeList = async (user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> => {
  await user.click(screen.getByRole("combobox"));
  return screen.findByRole("listbox");
};

const chooseAccessMode = async (user: ReturnType<typeof userEvent.setup>, optionName: string): Promise<void> => {
  const listbox = await openAccessModeList(user);
  await user.click(within(listbox).getByRole("option", { name: optionName }));
};

const openTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string): Promise<HTMLElement> => {
  await user.hover(findTooltipTriggerBeside(screen.getByText(label)));
  return waitFor(() => {
    // eslint-disable-next-line testing-library/no-node-access -- the Base UI tooltip popup exposes no role, so the open content is matched by its data-slot
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

describe("UIAccessControlForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getSSOSettings).mockResolvedValue({ values: {} });
    vi.mocked(updateSSOSettings).mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese description and hides the English original", () => {
    renderForm();

    expect(screen.getByText("配置谁可以访问 UI 界面，以及如何从 JWT Token 中提取群组信息。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Configure who can access the UI interface and how group information is extracted from JWT tokens.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese access mode label and placeholder and hides the English originals", () => {
    renderForm();

    expect(screen.getByText("UI 访问模式")).toBeInTheDocument();
    expect(screen.queryByText("UI Access Mode")).not.toBeInTheDocument();
    expect(screen.getByText("选择访问模式")).toBeInTheDocument();
    expect(screen.queryByText("Select access mode")).not.toBeInTheDocument();
  });

  it("renders the Chinese access mode tooltip in the same open state and hides the English original", async () => {
    const user = renderForm();

    const tooltip = await openTooltip(user, "UI 访问模式");

    expect(tooltip).toHaveTextContent("控制谁可以访问 UI 界面");
    expect(tooltip).not.toHaveTextContent("Controls who can access the UI interface");
  });

  it("renders the Chinese access mode options and hides the English originals", async () => {
    const user = renderForm();

    const listbox = await openAccessModeList(user);

    expect(within(listbox).getByRole("option", { name: "所有已认证用户" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "受限 SSO 群组" })).toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "All Authenticated Users" })).not.toBeInTheDocument();
    expect(within(listbox).queryByRole("option", { name: "Restricted SSO Group" })).not.toBeInTheDocument();
  });

  it("renders the Chinese restricted group field and hides the English original", async () => {
    const user = renderForm();

    await chooseAccessMode(user, "受限 SSO 群组");

    expect(await screen.findByPlaceholderText("ui-access-group")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Restricted SSO Group")).not.toBeInTheDocument();
  });

  it("renders the Chinese JWT field label, placeholder and tooltip and hides the English originals", async () => {
    const user = renderForm();

    expect(screen.getByText("SSO 群组 JWT 字段")).toBeInTheDocument();
    expect(screen.queryByText("SSO Group JWT Field")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("groups")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("JWT field name")).not.toBeInTheDocument();

    const tooltip = await openTooltip(user, "SSO 群组 JWT 字段");
    expect(tooltip).toHaveTextContent("包含团队/群组信息的 JWT 字段名。使用点号访问嵌套字段。");
    expect(tooltip).not.toHaveTextContent(
      "JWT field name that contains team/group information. Use dot notation to access nested fields.",
    );
  });

  it("renders the Chinese submit action and hides the English original", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "更新 UI 访问控制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update UI Access Control" })).not.toBeInTheDocument();
  });

  it("renders the Chinese group-required message and hides the English original", async () => {
    const user = renderForm();

    await chooseAccessMode(user, "受限 SSO 群组");
    await user.click(screen.getByRole("button", { name: "更新 UI 访问控制" }));

    expect(await screen.findByText("请输入受限 SSO 群组")).toBeInTheDocument();
    expect(screen.queryByText("Please enter the restricted SSO group")).not.toBeInTheDocument();
  });

  it("reports the Chinese missing-token toast and hides the English original", async () => {
    const user = renderForm(null);

    await user.click(screen.getByRole("button", { name: "更新 UI 访问控制" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("没有可用的访问 Token"));
    expect(toast.fromError).not.toHaveBeenCalledWith("No access token available");
  });

  it("reports the Chinese save-failure toast and hides the English original", async () => {
    vi.mocked(updateSSOSettings).mockRejectedValue(new Error("boom"));
    const user = renderForm();

    await user.click(screen.getByRole("button", { name: "更新 UI 访问控制" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("保存 UI 访问设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save UI access settings");
  });
});
