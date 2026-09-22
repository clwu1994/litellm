import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { GuardrailDetail } from "./GuardrailDetail";

const mockUseGuardrailsUsageDetail = vi.fn();
vi.mock("@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage", () => ({
  useGuardrailsUsageDetail: (...args: unknown[]) => mockUseGuardrailsUsageDetail(...args),
}));

const mockGetGuardrailsUsageLogs = vi.fn();
vi.mock("@/components/networking", () => ({
  getGuardrailsUsageLogs: (...args: unknown[]) => mockGetGuardrailsUsageLogs(...args),
}));

vi.mock("@/components/GuardrailsMonitor/LogViewer", () => ({
  LogViewer: ({ guardrailName }: { guardrailName: string }) => <div data-testid="log-viewer">{guardrailName}</div>,
}));

vi.mock("./EvaluationSettingsModal", () => ({
  EvaluationSettingsModal: ({ open }: { open: boolean }) => (open ? <div data-testid="evaluation-modal" /> : null),
}));

const detail: GuardrailUsageDetail = {
  guardrail_id: "pii-detector",
  guardrail_name: "pii-detector",
  description: "Blocks personally identifiable information",
  status: "warning",
  provider: "presidio",
  type: "pii",
  requestsEvaluated: 12345,
  failRate: 20,
  avgScore: 0.4,
  avgLatency: 180,
  trend: "stable",
  time_series: [],
  usage_units: { sensitiveInformationPolicyUnits: 4 },
  usage_units_daily: [],
  usage_units_by_team: { "": { sensitiveInformationPolicyUnits: 4 } },
  usage_units_by_key: { "hash-1": { sensitiveInformationPolicyUnits: 4 } },
  cost: 0.0004,
  cost_by_unit: { sensitiveInformationPolicyUnits: 0.0004 },
  cost_by_team: { "": 0.0004 },
  cost_by_key: { "hash-1": 0.0004 },
  untracked_usage_units: {},
  untracked_usage_units_by_team: {},
  untracked_usage_units_by_key: {},
};

const loaded = (data: GuardrailUsageDetail | undefined) => ({ data, isLoading: false, error: null });

const defaultProps = {
  guardrailId: "pii-detector",
  onBack: vi.fn(),
  accessToken: "test-token" as string | null,
  startDate: "2026-07-01",
  endDate: "2026-07-24",
};

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderDetail = (props: Partial<typeof defaultProps> = {}) =>
  renderWithProviders(<GuardrailDetail {...defaultProps} {...props} />, {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });

describe("GuardrailDetail Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseGuardrailsUsageDetail.mockReturnValue(loaded(detail));
    mockGetGuardrailsUsageLogs.mockResolvedValue({ logs: [], total: 0 });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese back button and the aliased Chinese status badge", async () => {
    renderDetail();

    expect(await screen.findByRole("button", { name: "返回概览" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Overview" })).not.toBeInTheDocument();
    expect(screen.getByText("警告")).toBeInTheDocument();
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
    expect(screen.getByText("presidio")).toBeInTheDocument();
  });

  it("renders the Chinese loading label while the detail request is in flight", () => {
    mockUseGuardrailsUsageDetail.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderDetail();

    expect(screen.getByRole("status", { name: "加载中" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
  });

  it("renders the Chinese failure state and its way back", async () => {
    mockUseGuardrailsUsageDetail.mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom") });
    renderDetail();

    expect(await screen.findByText("Guardrail 详情加载失败。")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load guardrail details.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回概览" })).toBeInTheDocument();
  });

  it("renders the Chinese tabs", async () => {
    renderDetail();

    expect(await screen.findByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "日志" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Logs" })).not.toBeInTheDocument();
  });

  it("renders the Chinese metric labels and the derived blocked count", async () => {
    renderDetail();

    expect(await screen.findByText("已评估请求数")).toBeInTheDocument();
    expect(screen.queryByText("Requests Evaluated")).not.toBeInTheDocument();
    expect(screen.getByText("失败率")).toBeInTheDocument();
    expect(screen.queryByText("Fail Rate")).not.toBeInTheDocument();
    expect(screen.getByText("2,469 次拦截")).toBeInTheDocument();
    expect(screen.queryByText("2,469 blocked")).not.toBeInTheDocument();
    expect(screen.getByText("平均增加延迟")).toBeInTheDocument();
    expect(screen.queryByText("Avg. latency added")).not.toBeInTheDocument();
    expect(screen.getByText("每请求（平均）")).toBeInTheDocument();
    expect(screen.queryByText("Per request (avg)")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-data latency subtitle", async () => {
    mockUseGuardrailsUsageDetail.mockReturnValue(loaded({ ...detail, avgLatency: null }));
    renderDetail();

    expect(await screen.findByText("无数据")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });

  it("renders the Chinese evaluation settings title", async () => {
    renderDetail();

    expect(await screen.findByTitle("评估设置")).toBeInTheDocument();
    expect(screen.queryByTitle("Evaluation settings")).not.toBeInTheDocument();
  });
});
