import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import CoordinationRedisTypeSelector from "./CoordinationRedisTypeSelector";

describe("CoordinationRedisTypeSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese control label, selected node label and node description", () => {
    renderWithProviders(<CoordinationRedisTypeSelector redisType="node" onTypeChange={vi.fn()} />);

    expect(screen.getByText("Redis 类型")).toBeInTheDocument();
    expect(screen.queryByText("Redis Type")).not.toBeInTheDocument();
    expect(screen.getByText("Node（单实例）")).toBeInTheDocument();
    expect(screen.queryByText("Node (Single Instance)")).not.toBeInTheDocument();
    expect(screen.getByText("标准 Redis 节点/单实例")).toBeInTheDocument();
    expect(screen.queryByText("Standard Redis node/single instance")).not.toBeInTheDocument();
  });

  it("renders the Chinese cluster and sentinel descriptions", () => {
    const { rerender } = renderWithProviders(
      <CoordinationRedisTypeSelector redisType="cluster" onTypeChange={vi.fn()} />,
    );

    expect(screen.getByText("用于高可用和水平扩展的 Redis Cluster 模式")).toBeInTheDocument();
    expect(screen.getAllByText("Cluster").length).toBeGreaterThan(0);

    rerender(<CoordinationRedisTypeSelector redisType="sentinel" onTypeChange={vi.fn()} />);

    expect(screen.getByText("用于高可用和自动故障转移的 Redis Sentinel 模式")).toBeInTheDocument();
    expect(screen.getAllByText("Sentinel").length).toBeGreaterThan(0);
  });
});
