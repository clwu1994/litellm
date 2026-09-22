import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { act, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VectorStoreSelector from "./VectorStoreSelector";

vi.mock("../networking", () => ({
  vectorStoreListCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/components/shared/MultiSelect", () => ({
  MultiSelect: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="vector-store-select" data-placeholder={placeholder} />
  ),
}));

describe("VectorStoreSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese default placeholder with the English original absent", async () => {
    renderWithProviders(<VectorStoreSelector onChange={vi.fn()} accessToken="sk-test" />);

    expect(screen.getByTestId("vector-store-select")).toHaveAttribute("data-placeholder", "选择向量存储");
    expect(screen.getByTestId("vector-store-select")).not.toHaveAttribute("data-placeholder", "Select vector stores");
    await act(async () => {});
  });

  it("keeps an explicit placeholder override", async () => {
    renderWithProviders(<VectorStoreSelector onChange={vi.fn()} accessToken="sk-test" placeholder="Choose stores" />);

    expect(screen.getByTestId("vector-store-select")).toHaveAttribute("data-placeholder", "Choose stores");
    await act(async () => {});
  });
});
