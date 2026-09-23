import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import McpOAuthCallbackPage from "./page";

const never = new Promise<never>(() => {});

const searchParams = vi.fn(() => new URLSearchParams("code=abc&state=xyz"));

const realLocation = window.location;
const mockLocationReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams(),
}));

vi.mock("@/utils/secureStorage", () => ({
  getSecureItem: () => null,
  setSecureItem: () => {},
}));

describe("MCP OAuth callback page Chinese copy", () => {
  beforeEach(async () => {
    searchParams.mockImplementation(() => new URLSearchParams("code=abc&state=xyz"));
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        href: "http://localhost:3000/ui/mcp/oauth/callback",
        pathname: "/ui/mcp/oauth/callback",
        replace: mockLocationReplace,
      },
    });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    Object.defineProperty(window, "location", { configurable: true, value: realLocation });
    mockLocationReplace.mockClear();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and body and hides the English originals", () => {
    renderWithProviders(<McpOAuthCallbackPage />);

    expect(screen.getByRole("heading", { name: "LiteLLM MCP OAuth" })).toBeInTheDocument();
    expect(screen.getByText("授权已完成。您可以关闭此窗口并返回 LiteLLM 仪表盘。")).toBeInTheDocument();
    expect(
      screen.queryByText("Authorization complete. You may close this window and return to the LiteLLM dashboard."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("如果窗口未自动关闭，一切仍已保存，您可以手动关闭。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "If the window does not close automatically, everything is still saved—you can close it manually.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese suspense fallback and hides the English original", () => {
    searchParams.mockImplementation(() => {
      throw never;
    });

    renderWithProviders(<McpOAuthCallbackPage />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
