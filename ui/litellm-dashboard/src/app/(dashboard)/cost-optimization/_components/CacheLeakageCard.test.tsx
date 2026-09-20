import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import type { DailyData, KeyMetricWithMetadata, SpendMetrics } from "@/components/UsagePage/types";
import type { DailyActivityRange } from "./useDailyActivityRange";

vi.mock("@/components/shared/advanced_date_picker", () => ({
  __esModule: true,
  default: () => <div data-testid="date-picker" />,
}));

import CacheLeakageCard from "./CacheLeakageCard";

const baseMetrics = (overrides: Partial<SpendMetrics>): SpendMetrics => ({
  spend: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  api_requests: 0,
  successful_requests: 0,
  failed_requests: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  ...overrides,
});

const key = (alias: string, metrics: Partial<SpendMetrics>): KeyMetricWithMetadata => ({
  metrics: baseMetrics(metrics),
  metadata: { key_alias: alias, team_id: null },
});

const dayWithKeys = (date: string, apiKeys: Record<string, KeyMetricWithMetadata>): DailyData => ({
  date,
  metrics: baseMetrics({}),
  breakdown: {
    models: {},
    model_groups: {},
    mcp_servers: {},
    providers: {},
    api_keys: apiKeys,
    entities: {},
  },
});

const dayWithModels = (date: string, models: Record<string, Partial<SpendMetrics>>): DailyData => ({
  date,
  metrics: baseMetrics({}),
  breakdown: {
    models: Object.fromEntries(
      Object.entries(models).map(([name, m]) => [
        name,
        { metrics: baseMetrics(m), metadata: {}, api_key_breakdown: {} },
      ]),
    ),
    model_groups: {},
    mcp_servers: {},
    providers: {},
    api_keys: {},
    entities: {},
  },
});

const renderWith = (results: DailyData[], overrides: Partial<DailyActivityRange> = {}) =>
  render(
    <CacheLeakageCard
      activity={{
        dateValue: {},
        onDateChange: vi.fn(),
        results,
        loading: false,
        isFetchingMore: false,
        progress: { currentPage: 1, totalPages: 1 },
        cancelled: false,
        cancel: vi.fn(),
        ...overrides,
      }}
    />,
  );

describe("CacheLeakageCard", () => {
  it("ranks leaking keys by uncached prompt tokens and shows cache hit ratio", () => {
    renderWith([
      dayWithKeys("2026-07-12", {
        "hash-caching": key("caching-key", { prompt_tokens: 1000, cache_read_input_tokens: 900 }),
        "hash-leaky": key("leaky-key", { prompt_tokens: 10000, cache_read_input_tokens: 0 }),
      }),
    ]);

    expect(screen.getByText("leaky-key")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("90.0%")).toBeInTheDocument();
    [
      "Input tokens you sent in this range that weren't served from or written to the cache",
      "Share of your input tokens that were served from the cache",
      "About how much you'd save if this uncached input used prompt caching. Estimated as uncached input tokens times what your cached traffic already nets per cached token (realized cache savings, after write premiums, ÷ cache read and write tokens). Blank when caching is not currently saving anything overall.",
    ].forEach((info) => expect(screen.getByLabelText(info)).toBeInTheDocument());
  });

  it("sorts by the clicked column, worst cache hit rate first", () => {
    renderWith([
      dayWithKeys("2026-07-12", {
        "hash-a": key("alpha", {
          prompt_tokens: 10000,
          cache_read_input_tokens: 9000,
          prompt_caching_savings_spend: 9.0,
        }),
        "hash-b": key("bravo", {
          prompt_tokens: 500,
          cache_read_input_tokens: 50,
          prompt_caching_savings_spend: 0.05,
        }),
      }),
    ]);
    const firstDataRow = () => screen.getAllByRole("row")[1];

    expect(firstDataRow()).toHaveTextContent("alpha");

    fireEvent.click(screen.getByText("Cache hit rate"));
    expect(firstDataRow()).toHaveTextContent("bravo");

    fireEvent.click(screen.getByText("Cache hit rate"));
    expect(firstDataRow()).toHaveTextContent("alpha");
  });

  it("switches to the model view and lists only Anthropic models", () => {
    renderWith([
      dayWithModels("2026-07-12", {
        "claude-sonnet-5": { prompt_tokens: 5000, cache_read_input_tokens: 0 },
        "gpt-4o": { prompt_tokens: 8000, cache_read_input_tokens: 0 },
      }),
    ]);

    fireEvent.click(screen.getByText("By model"));

    expect(screen.getByText("Cache leakage by model")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-5")).toBeInTheDocument();
    expect(screen.queryByText("gpt-4o")).not.toBeInTheDocument();
  });

  it("shows an empty state when no key used tokens in the range", () => {
    renderWith([dayWithKeys("2026-07-12", {})]);

    expect(screen.getByText("No key usage in this range.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("tells the user the table is still filling in while fallback pages stream", () => {
    const day = dayWithKeys("2026-07-12", {
      "hash-leaky": key("leaky-key", { prompt_tokens: 10000, cache_read_input_tokens: 0 }),
    });
    renderWith([day], { isFetchingMore: true });

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByText("Data is still loading; rows and totals will update as the rest of the range arrives."),
    ).toBeInTheDocument();
  });

  it("keeps the streaming note off while a fresh range loads over the previous range's rows", () => {
    const day = dayWithKeys("2026-07-12", {
      "hash-leaky": key("leaky-key", { prompt_tokens: 10000, cache_read_input_tokens: 0 }),
    });
    renderWith([day], { loading: true });

    expect(
      screen.queryByText("Data is still loading; rows and totals will update as the rest of the range arrives."),
    ).not.toBeInTheDocument();
  });

  it("drops the streaming note once the range has settled", () => {
    const day = dayWithKeys("2026-07-12", {
      "hash-leaky": key("leaky-key", { prompt_tokens: 10000, cache_read_input_tokens: 0 }),
    });
    renderWith([day]);

    expect(
      screen.queryByText("Data is still loading; rows and totals will update as the rest of the range arrives."),
    ).not.toBeInTheDocument();
  });
});

describe("CacheLeakageCard Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  const leaky = () => [
    dayWithKeys("2026-07-12", {
      "hash-leaky": key("leaky-key", { prompt_tokens: 10000, cache_read_input_tokens: 0 }),
    }),
  ];

  it("renders the Chinese key-view chrome, columns and info labels and hides the English ones", () => {
    renderWith(leaky());

    expect(screen.getByText("按 Virtual Key 统计缓存泄漏")).toBeInTheDocument();
    expect(screen.getByText(/密钥如果发送大量未缓存输入/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按 Virtual Key" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按模型" })).toBeInTheDocument();
    expect(screen.getByText("密钥")).toBeInTheDocument();
    expect(screen.getByText("未缓存输入 Token")).toBeInTheDocument();
    expect(screen.getByText("缓存命中率")).toBeInTheDocument();
    expect(screen.getByText("潜在节省")).toBeInTheDocument();
    expect(screen.getByLabelText("你在该时间范围内发送的、既未从缓存读取也未写入缓存的输入 Token")).toBeInTheDocument();
    expect(screen.getByLabelText("从缓存读取的输入 Token 占比")).toBeInTheDocument();
    expect(screen.getByLabelText(/如果这些未缓存输入使用提示词缓存/)).toBeInTheDocument();

    expect(screen.queryByText("Cache leakage by virtual key")).not.toBeInTheDocument();
    expect(screen.queryByText("Uncached input tokens")).not.toBeInTheDocument();
    expect(screen.queryByText("Cache hit rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Potential savings")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Input tokens you sent in this range that weren't served from or written to the cache"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Share of your input tokens that were served from the cache"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese model view and hides the English one", () => {
    renderWith([
      dayWithModels("2026-07-12", { "claude-sonnet-5": { prompt_tokens: 5000, cache_read_input_tokens: 0 } }),
    ]);
    fireEvent.click(screen.getByRole("tab", { name: "按模型" }));

    expect(screen.getByText("按模型统计缓存泄漏")).toBeInTheDocument();
    expect(screen.getByText(/模型如果发送大量未缓存输入/)).toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();

    expect(screen.queryByText("Cache leakage by model")).not.toBeInTheDocument();
    expect(screen.queryByText("Models sending large volumes of uncached input")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state for keys and models", () => {
    renderWith([dayWithKeys("2026-07-12", {})]);
    expect(screen.getByText("此时间范围内没有密钥用量。")).toBeInTheDocument();
    expect(screen.queryByText("No key usage in this range.")).not.toBeInTheDocument();

    cleanup();
    renderWith([dayWithModels("2026-07-12", {})]);
    fireEvent.click(screen.getByRole("tab", { name: "按模型" }));
    expect(screen.getByText("此时间范围内没有模型用量。")).toBeInTheDocument();
    expect(screen.queryByText("No model usage in this range.")).not.toBeInTheDocument();
  });

  it("renders the Chinese streaming note and loading state and hides the English ones", () => {
    renderWith([dayWithKeys("2026-07-12", { "hash-leaky": key("leaky-key", { prompt_tokens: 10000 }) })], {
      isFetchingMore: true,
    });
    expect(screen.getByText("数据仍在加载；随着时间范围剩余部分返回，行和合计会更新。")).toBeInTheDocument();
    expect(
      screen.queryByText("Data is still loading; rows and totals will update as the rest of the range arrives."),
    ).not.toBeInTheDocument();

    cleanup();
    renderWith([dayWithKeys("2026-07-12", {})], { loading: true });
    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese sort aria-labels and hides the English ones", () => {
    renderWith(leaky());

    expect(screen.getByRole("button", { name: "按未缓存输入 Token排序" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "按缓存命中率排序" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "按潜在节省排序" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Sort by Uncached input tokens" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sort by Cache hit rate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sort by Potential savings" })).not.toBeInTheDocument();
  });
});
