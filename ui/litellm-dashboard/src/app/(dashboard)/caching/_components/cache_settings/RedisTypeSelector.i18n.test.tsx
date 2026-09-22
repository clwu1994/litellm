import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import RedisTypeSelector from "./RedisTypeSelector";
import { REDIS_TYPE_DESCRIPTION_KEYS } from "./cacheSettingsFields";

describe("RedisTypeSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese control label and the selected node label", () => {
    renderWithProviders(
      <RedisTypeSelector redisType="node" redisTypeDescriptions={REDIS_TYPE_DESCRIPTION_KEYS} onTypeChange={vi.fn()} />,
    );

    expect(screen.getByText("Redis 类型")).toBeInTheDocument();
    expect(screen.queryByText("Redis Type")).not.toBeInTheDocument();
    expect(screen.getByText("Node（单实例）")).toBeInTheDocument();
    expect(screen.queryByText("Node (Single Instance)")).not.toBeInTheDocument();
    expect(screen.getByText("标准 Redis 节点/单实例")).toBeInTheDocument();
    expect(screen.queryByText("Standard Redis node/single instance")).not.toBeInTheDocument();
  });

  it("renders every Chinese redis type option and description", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <RedisTypeSelector
        redisType="cluster"
        redisTypeDescriptions={REDIS_TYPE_DESCRIPTION_KEYS}
        onTypeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("用于高可用和水平扩展的 Redis Cluster 模式")).toBeInTheDocument();
    expect(
      screen.queryByText("Redis Cluster mode for high availability and horizontal scaling"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("Sentinel")).toBeInTheDocument();
    expect(screen.getByText("Semantic")).toBeInTheDocument();

    rerender(
      <RedisTypeSelector
        redisType="sentinel"
        redisTypeDescriptions={REDIS_TYPE_DESCRIPTION_KEYS}
        onTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("用于高可用和自动故障转移的 Redis Sentinel 模式")).toBeInTheDocument();

    rerender(
      <RedisTypeSelector
        redisType="semantic"
        redisTypeDescriptions={REDIS_TYPE_DESCRIPTION_KEYS}
        onTypeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("为相似提示词复用响应的语义缓存")).toBeInTheDocument();
    expect(screen.queryByText("Semantic caching that reuses responses for similar prompts")).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback description when a redis type has no description", () => {
    renderWithProviders(<RedisTypeSelector redisType="cluster" redisTypeDescriptions={{}} onTypeChange={vi.fn()} />);

    expect(screen.getByText("选择你正在使用的 Redis 部署类型")).toBeInTheDocument();
    expect(screen.queryByText("Select the type of Redis deployment you're using")).not.toBeInTheDocument();
  });
});
