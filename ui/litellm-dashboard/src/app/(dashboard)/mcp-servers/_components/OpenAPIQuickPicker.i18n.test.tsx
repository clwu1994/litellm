import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { fetchOpenAPIRegistry } from "@/components/networking";

import OpenAPIQuickPicker, { type OpenAPIRegistryEntry } from "./OpenAPIQuickPicker";

vi.mock("@/components/networking", () => ({
  fetchOpenAPIRegistry: vi.fn(),
}));

const stripe: OpenAPIRegistryEntry = {
  name: "stripe",
  title: "Stripe",
  description: "Payments API",
  icon_url: "https://cdn.example.com/stripe.svg",
  spec_url: "https://example.com/stripe.json",
};

const renderPicker = () => render(<OpenAPIQuickPicker accessToken="tok" selectedName={null} onSelect={vi.fn()} />);

describe("OpenAPIQuickPicker Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and hint and hides the English originals", async () => {
    vi.mocked(fetchOpenAPIRegistry).mockResolvedValue({ apis: [stripe] });
    renderPicker();

    expect(await screen.findByText("常用 API")).toBeInTheDocument();
    expect(screen.queryByText("Popular APIs")).not.toBeInTheDocument();
    expect(
      screen.getByText("选择一个 API 以预填规范 URL 和 OAuth 2.0 设置，或在下方输入你自己的规范 URL。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select an API to pre-fill the spec URL and OAuth 2.0 settings, or enter your own spec URL below.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese heading while the registry is still loading and hides the English original", () => {
    vi.mocked(fetchOpenAPIRegistry).mockReturnValue(new Promise(() => {}));
    renderPicker();

    expect(screen.getByText("常用 API")).toBeInTheDocument();
    expect(screen.queryByText("Popular APIs")).not.toBeInTheDocument();
  });
});
