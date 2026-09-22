import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import Memory from "./page";

const { useAuthorizedMock } = vi.hoisted(() => ({ useAuthorizedMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: useAuthorizedMock,
}));

const fetchMock = vi.fn();

const okResponse = {
  ok: true,
  status: 200,
  statusText: "OK",
  text: async () => "",
  json: async () => ({ memories: [], total: 0 }),
};

const renderAs = (userRole: string) => {
  useAuthorizedMock.mockReturnValue({ accessToken: "sk-test", userId: "u1", userRole });
  return renderWithProviders(<Memory />);
};

describe("Memory page Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    fetchMock.mockResolvedValue(okResponse);
    vi.stubGlobal("fetch", fetchMock);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese admin-only notice and hides the English original", async () => {
    renderAs("Internal User");

    expect(await screen.findByText("记忆 仅对管理员用户可用。")).toBeInTheDocument();
    expect(screen.queryByText("Memory is only available to admin users.")).not.toBeInTheDocument();
  });
});

describe("Memory page English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    testQueryClient.clear();
    fetchMock.mockResolvedValue(okResponse);
    vi.stubGlobal("fetch", fetchMock);
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    vi.unstubAllGlobals();
    await i18n.changeLanguage("en");
  });

  it("keeps the original English admin-only notice byte-identical", async () => {
    renderAs("Internal User");

    expect(await screen.findByText("Memory is only available to admin users.")).toBeInTheDocument();
  });
});
