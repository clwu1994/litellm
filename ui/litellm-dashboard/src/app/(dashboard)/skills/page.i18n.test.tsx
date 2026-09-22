import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { getClaudeCodePluginsList } from "@/components/networking";

import Skills from "./page";

vi.mock("@/components/networking", () => ({
  getClaudeCodePluginsList: vi.fn(),
  deleteClaudeCodePlugin: vi.fn(),
  registerClaudeCodePlugin: vi.fn(),
}));

const mockGetClaudeCodePluginsList = vi.mocked(getClaudeCodePluginsList);

describe("Skills route Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: [], count: 0 });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the route through the Chinese panel and hides the English original", async () => {
    renderWithProviders(<Skills />);

    expect(await screen.findByRole("heading", { name: "技能" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
  });
});

describe("Skills route English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetClaudeCodePluginsList.mockResolvedValue({ plugins: [], count: 0 });
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English heading byte-identical", async () => {
    renderWithProviders(<Skills />);

    expect(await screen.findByRole("heading", { name: "Skills" })).toBeInTheDocument();
  });
});
