import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import type { KeyResponse } from "@/components/key_team_helpers/key_list";

import AgentVirtualKeys from "./agent_virtual_keys";

const makeKey = (overrides: Partial<KeyResponse>): KeyResponse =>
  ({
    token: "hash-abc123def456",
    key_name: "sk-...abcd",
    ...overrides,
  }) as unknown as KeyResponse;

describe("AgentVirtualKeys Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state and hides the English original", () => {
    renderWithProviders(<AgentVirtualKeys keys={[]} isLoading onKeyClick={vi.fn()} />);

    expect(screen.getByText("正在加载密钥...")).toBeInTheDocument();
    expect(screen.queryByText("Loading keys...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state and hides the English original", () => {
    renderWithProviders(<AgentVirtualKeys keys={[]} isLoading={false} onKeyClick={vi.fn()} />);

    expect(screen.getByText("此 Agent 未分配 Virtual Key。")).toBeInTheDocument();
    expect(screen.queryByText("No virtual key assigned to this agent.")).not.toBeInTheDocument();
  });

  it("renders the Chinese unnamed-key fallback and hides the English original", () => {
    renderWithProviders(
      <AgentVirtualKeys keys={[makeKey({ key_alias: undefined })]} isLoading={false} onKeyClick={vi.fn()} />,
    );

    expect(screen.getByText("未命名密钥")).toBeInTheDocument();
    expect(screen.queryByText("Unnamed key")).not.toBeInTheDocument();
  });

  it("renders the Virtual Keys heading", () => {
    // "Virtual Keys" is glossary-locked, so its Chinese value is identical to the English one.
    renderWithProviders(<AgentVirtualKeys keys={[]} isLoading={false} onKeyClick={vi.fn()} />);

    expect(screen.getByText("Virtual Keys")).toBeInTheDocument();
  });
});
