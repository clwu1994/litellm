import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import UIThemeSettings from "./UIThemeSettings";

const setLogoUrl = vi.fn();
const setLogoUrlDark = vi.fn();
const setFaviconUrl = vi.fn();

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    logoUrl: null,
    setLogoUrl,
    logoUrlDark: null,
    setLogoUrlDark,
    faviconUrl: null,
    setFaviconUrl,
  }),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "",
  getGlobalLitellmHeaderName: () => "Authorization",
}));

const okResponse = (values: Record<string, string | null> = {}) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ values }) } as Response);

const fetchMock = vi.fn<typeof fetch>();

const renderSettings = () => {
  fetchMock.mockImplementation(() => okResponse());
  return renderWithProviders(<UIThemeSettings userID="user-1" userRole="Admin" accessToken="sk-test" />);
};

describe("UIThemeSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header and hides the English originals", () => {
    renderSettings();

    expect(screen.getByRole("heading", { level: 1, name: "UI 主题自定义" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "UI Theme Customization" })).not.toBeInTheDocument();
    expect(screen.getByText("用自定义标志和 Favicon 个性化你的 LiteLLM 管理仪表盘。")).toBeInTheDocument();
    expect(
      screen.queryByText("Customize your LiteLLM admin dashboard with a custom logo and favicon."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese field labels and hints and hides the English originals", () => {
    renderSettings();

    expect(screen.getByLabelText("自定义标志 URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Custom Logo URL")).not.toBeInTheDocument();
    expect(screen.getByText("输入自定义标志的 URL，留空则使用默认值")).toBeInTheDocument();
    expect(screen.queryByText("Enter a URL for your custom logo or leave empty for default")).not.toBeInTheDocument();

    expect(screen.getByLabelText("自定义标志 URL（深色模式）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Custom Logo URL (dark mode)")).not.toBeInTheDocument();
    expect(screen.getByText("输入适合深色背景的标志 URL，留空则复用上方的标志")).toBeInTheDocument();
    expect(
      screen.queryByText("Enter a URL for a logo suited to dark backgrounds, or leave empty to reuse the logo above"),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText("自定义 Favicon URL")).toBeInTheDocument();
    expect(screen.queryByLabelText("Custom Favicon URL")).not.toBeInTheDocument();
    expect(screen.getByText("输入自定义 Favicon 的 URL（.ico、.png 或 .svg），留空则使用默认值")).toBeInTheDocument();
    expect(
      screen.queryByText("Enter a URL for your custom favicon (.ico, .png, or .svg) or leave empty for default"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese action buttons and hides the English originals", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置为默认值" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset to Default" })).not.toBeInTheDocument();
  });

  it("reports a successful save and reset in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("主题设置更新成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Theme settings updated successfully!");

    await user.click(screen.getByRole("button", { name: "重置为默认值" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("主题设置已重置为默认值！"));
    expect(toast.success).not.toHaveBeenCalledWith("Theme settings reset to default!");
  });

  it("reports a failed save and reset in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false } as Response));

    await user.click(screen.getByRole("button", { name: "保存更改" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("更新主题设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update theme settings");

    await user.click(screen.getByRole("button", { name: "重置为默认值" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("重置主题设置失败"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to reset theme settings");
  });
});

describe("UIThemeSettings English copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps every original English string byte-identical", () => {
    renderSettings();

    expect(screen.getByRole("heading", { level: 1, name: "UI Theme Customization" })).toBeInTheDocument();
    expect(
      screen.getByText("Customize your LiteLLM admin dashboard with a custom logo and favicon."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Custom Logo URL")).toBeInTheDocument();
    expect(screen.getByText("Enter a URL for your custom logo or leave empty for default")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom Logo URL (dark mode)")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a URL for a logo suited to dark backgrounds, or leave empty to reuse the logo above"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Custom Favicon URL")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a URL for your custom favicon (.ico, .png, or .svg) or leave empty for default"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset to Default" })).toBeInTheDocument();
  });

  it("keeps the original English toast copy byte-identical", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Theme settings updated successfully!"));

    await user.click(screen.getByRole("button", { name: "Reset to Default" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Theme settings reset to default!"));

    fetchMock.mockImplementation(() => Promise.resolve({ ok: false } as Response));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("Failed to update theme settings"));

    await user.click(screen.getByRole("button", { name: "Reset to Default" }));
    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("Failed to reset theme settings"));
  });
});
