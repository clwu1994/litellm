import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { UnpricedNote } from "./UnpricedNote";

describe("UnpricedNote Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese note and pricing link for several unpriced units", () => {
    renderWithProviders(<UnpricedNote unpriced={{ someFutureCounter: 7 }} provider="Bedrock" />);

    const note = screen.getByText(/7 个单位没有已知价格/);
    expect(note).toHaveTextContent("7 个单位没有已知价格，未计入成本。在 GitHub 上申请定价");
    expect(note).not.toHaveTextContent("7 units with no known price are left out of the cost.");
    expect(screen.getByRole("link", { name: "在 GitHub 上申请定价" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request pricing on GitHub" })).not.toBeInTheDocument();
  });

  it("renders the Chinese note for a single unpriced unit", () => {
    renderWithProviders(<UnpricedNote unpriced={{ someFutureCounter: 1 }} />);

    const note = screen.getByText(/1 个单位没有已知价格/);
    expect(note).toHaveTextContent("1 个单位没有已知价格，未计入成本。在 GitHub 上申请定价");
    expect(note).not.toHaveTextContent("1 unit with no known price is left out of the cost.");
  });

  it("keeps the English singular and plural notes distinct under en", async () => {
    await i18n.changeLanguage("en");

    const { unmount } = renderWithProviders(<UnpricedNote unpriced={{ someFutureCounter: 7 }} provider="Bedrock" />);
    expect(screen.getByText(/7 units with no known price/)).toHaveTextContent(
      "7 units with no known price are left out of the cost. Request pricing on GitHub",
    );
    unmount();

    renderWithProviders(<UnpricedNote unpriced={{ someFutureCounter: 1 }} />);
    expect(screen.getByText(/1 unit with no known price/)).toHaveTextContent(
      "1 unit with no known price is left out of the cost. Request pricing on GitHub",
    );
  });

  it("keeps the pricing link pointing at the GitHub issue template", () => {
    renderWithProviders(<UnpricedNote unpriced={{ someFutureCounter: 7 }} provider="Bedrock" />);

    const link = screen.getByRole("link", { name: /GitHub/ });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.origin + url.pathname).toBe("https://github.com/BerriAI/litellm/issues/new");
  });
});
