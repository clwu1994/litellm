import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import Workflows from "./page";

const { useAuthorizedMock } = vi.hoisted(() => ({ useAuthorizedMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: useAuthorizedMock,
}));

const fetchMock = vi.fn();

const okResponse = {
  ok: true,
  status: 200,
  statusText: "OK",
  json: async () => ({ runs: [], count: 0 }),
};

const renderAs = (userRole: string) => {
  useAuthorizedMock.mockReturnValue({ accessToken: "sk-test", userId: "u1", userRole });
  return renderWithProviders(<Workflows />);
};

describe("Workflows page Chinese copy", () => {
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

    expect(await screen.findByText("工作流运行 仅对管理员用户可用。")).toBeInTheDocument();
    expect(screen.queryByText("Workflow Runs is only available to admin users.")).not.toBeInTheDocument();
  });
});

describe("Workflows page English copy", () => {
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

    expect(await screen.findByText("Workflow Runs is only available to admin users.")).toBeInTheDocument();
  });
});
