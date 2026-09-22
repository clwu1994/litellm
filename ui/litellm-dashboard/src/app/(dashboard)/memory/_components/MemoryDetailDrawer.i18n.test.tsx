import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { MemoryRow } from "@/components/networking";

import { MemoryDetailDrawer } from "./MemoryDetailDrawer";

const makeMemory = (overrides: Partial<MemoryRow> = {}): MemoryRow => ({
  memory_id: "mem-1",
  key: "user:profile",
  value: "The user prefers concise answers.",
  metadata: { tags: ["example"] },
  user_id: "user-42",
  team_id: "team-7",
  created_at: "2024-05-01T12:00:00Z",
  updated_at: "2024-05-02T12:00:00Z",
  created_by: "alice",
  updated_by: "bob",
  ...overrides,
});

const createdTimestamp = (): string => new Date("2024-05-01T12:00:00Z").toLocaleString();
const updatedTimestamp = (): string => new Date("2024-05-02T12:00:00Z").toLocaleString();

const noTimestamps = {
  created_at: undefined,
  created_by: undefined,
  updated_at: undefined,
  updated_by: undefined,
};

describe("MemoryDetailDrawer Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese detail labels and hides the English originals", () => {
    renderWithProviders(<MemoryDetailDrawer row={makeMemory()} onClose={vi.fn()} />);

    expect(screen.getByText("记忆 ID")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("团队 ID")).toBeInTheDocument();
    expect(screen.getByText("值")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();

    expect(screen.queryByText("Memory ID")).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Team ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    expect(screen.queryByText("Metadata")).not.toBeInTheDocument();
  });

  it("renders the Chinese created and updated lines with their interpolated timestamps", () => {
    renderWithProviders(<MemoryDetailDrawer row={makeMemory()} onClose={vi.fn()} />);

    const created = screen.getByText(`创建于 ${createdTimestamp()}，操作者 alice`);
    expect(created).toHaveTextContent(`创建于 ${createdTimestamp()}`);
    expect(created).toHaveTextContent("，操作者 alice");
    expect(created).not.toHaveTextContent(`Created ${createdTimestamp()}`);
    expect(created).not.toHaveTextContent(" by alice");

    const updated = screen.getByText(`更新于 ${updatedTimestamp()}，操作者 bob`);
    expect(updated).toHaveTextContent(`更新于 ${updatedTimestamp()}`);
    expect(updated).toHaveTextContent("，操作者 bob");
    expect(updated).not.toHaveTextContent(`Updated ${updatedTimestamp()}`);
    expect(updated).not.toHaveTextContent(" by bob");
  });

  it("keeps the raw value, metadata and identifiers as data", () => {
    renderWithProviders(<MemoryDetailDrawer row={makeMemory()} onClose={vi.fn()} />);

    expect(screen.getByText("user:profile")).toBeInTheDocument();
    expect(screen.getByText("mem-1")).toBeInTheDocument();
    expect(screen.getByText("user-42")).toBeInTheDocument();
    expect(screen.getByText("team-7")).toBeInTheDocument();
    expect(screen.getByText("The user prefers concise answers.")).toBeInTheDocument();
    expect(screen.getByText('{ "tags": [ "example" ] }')).toBeInTheDocument();
  });
});

describe("MemoryDetailDrawer English copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    renderWithProviders(<MemoryDetailDrawer row={makeMemory()} onClose={vi.fn()} />);

    expect(screen.getByText("Memory ID")).toBeInTheDocument();
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText("Team ID")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Metadata")).toBeInTheDocument();
    expect(screen.getByText(`Created ${createdTimestamp()} by alice`)).toBeInTheDocument();
    expect(screen.getByText(`Updated ${updatedTimestamp()} by bob`)).toBeInTheDocument();
    expect(screen.getByText('{ "tags": [ "example" ] }')).toBeInTheDocument();
  });

  it("keeps the original English em-dash fallback byte-identical", () => {
    renderWithProviders(<MemoryDetailDrawer row={makeMemory(noTimestamps)} onClose={vi.fn()} />);

    expect(screen.getByText("Created —")).toBeInTheDocument();
    expect(screen.getByText("Updated —")).toBeInTheDocument();
  });
});
