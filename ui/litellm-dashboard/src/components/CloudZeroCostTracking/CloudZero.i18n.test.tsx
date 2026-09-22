import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import CloudZeroCostTracking from "./CloudZeroCostTracking";
import CloudZeroCreationModal from "./CloudZeroCreateModal";
import CloudZeroEmptyPlaceholder from "./CloudZeroEmptyPlaceholder";
import { CloudZeroIntegrationSettings } from "./CloudZeroIntegrationSettings";
import CloudZeroUpdateModal from "./CloudZeroUpdateModal";
import type { CloudZeroSettings } from "./types";

const useCloudZeroSettings = vi.fn();
const useCloudZeroCreate = vi.fn();
const useCloudZeroUpdateSettings = vi.fn();
const useCloudZeroDryRun = vi.fn();
const useCloudZeroExport = vi.fn();
const useCloudZeroDeleteSettings = vi.fn();

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings", () => ({
  useCloudZeroSettings: (...args: unknown[]) => useCloudZeroSettings(...args),
  useCloudZeroUpdateSettings: (...args: unknown[]) => useCloudZeroUpdateSettings(...args),
  useCloudZeroDeleteSettings: (...args: unknown[]) => useCloudZeroDeleteSettings(...args),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroCreate", () => ({
  useCloudZeroCreate: (...args: unknown[]) => useCloudZeroCreate(...args),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroDryRun", () => ({
  useCloudZeroDryRun: (...args: unknown[]) => useCloudZeroDryRun(...args),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroExport", () => ({
  useCloudZeroExport: (...args: unknown[]) => useCloudZeroExport(...args),
}));

const mutation = (overrides: Record<string, unknown> = {}) => ({
  mutate: vi.fn(),
  isPending: false,
  data: null,
  ...overrides,
});

const settings: CloudZeroSettings = {
  connection_id: "conn-1",
  api_key_masked: "sk-****",
  timezone: "UTC",
  status: "Active",
};

const hoverTooltip = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  // eslint-disable-next-line testing-library/no-node-access -- the tooltip trigger is an unlabelled icon next to the label
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user.hover(trigger as Element);
};

describe("CloudZero Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useCloudZeroSettings.mockReturnValue({ data: undefined, isLoading: false, error: null });
    useCloudZeroCreate.mockReturnValue(mutation());
    useCloudZeroUpdateSettings.mockReturnValue(mutation());
    useCloudZeroDryRun.mockReturnValue(mutation());
    useCloudZeroExport.mockReturnValue(mutation());
    useCloudZeroDeleteSettings.mockReturnValue(mutation());
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the loading and error states in Chinese", () => {
    useCloudZeroSettings.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderWithProviders(<CloudZeroCostTracking />);

    expect(screen.getByText("正在加载 CloudZero 设置...")).toBeInTheDocument();
    expect(screen.queryByText("Loading CloudZero settings...")).not.toBeInTheDocument();

    cleanup();
    useCloudZeroSettings.mockReturnValue({ data: undefined, isLoading: false, error: new Error("boom") });
    renderWithProviders(<CloudZeroCostTracking />);

    expect(screen.getByText("加载 CloudZero 设置出错：boom")).toBeInTheDocument();
    expect(screen.queryByText(/Error loading CloudZero settings/)).not.toBeInTheDocument();
  });

  it("renders the empty placeholder in Chinese", () => {
    renderWithProviders(<CloudZeroEmptyPlaceholder startCreation={vi.fn()} />);

    expect(screen.getByText("未找到 CloudZero 集成")).toBeInTheDocument();
    expect(screen.queryByText("No CloudZero Integration Found")).not.toBeInTheDocument();
    expect(screen.getByText("连接你的 CloudZero 账户，即可直接在 LiteLLM 中跟踪和分析云成本。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Connect your CloudZero account to start tracking and analyzing your cloud costs directly from LiteLLM.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 CloudZero 集成" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add CloudZero Integration" })).not.toBeInTheDocument();
  });

  it("renders the create modal in Chinese", () => {
    renderWithProviders(<CloudZeroCreationModal open onOk={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("创建 CloudZero 集成")).toBeInTheDocument();
    expect(screen.queryByText("Create CloudZero Integration")).not.toBeInTheDocument();
    expect(screen.getByLabelText("CloudZero API Key")).toBeInTheDocument();
    expect(screen.getByLabelText("连接 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Connection ID")).not.toBeInTheDocument();
    expect(screen.getByLabelText("时区")).toBeInTheDocument();
    expect(screen.queryByLabelText("Timezone")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 CloudZero API Key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter your CloudZero API key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入你的 CloudZero 连接 ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
  });

  it("renders the create modal validation messages in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloudZeroCreationModal open onOk={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(await screen.findByText("请输入你的 CloudZero API Key")).toBeInTheDocument();
    expect(screen.queryByText("Please enter your CloudZero API key")).not.toBeInTheDocument();
    expect(screen.getByText("请输入你的 CloudZero 连接 ID")).toBeInTheDocument();
    expect(screen.queryByText("Please enter your CloudZero connection ID")).not.toBeInTheDocument();
  });

  it("renders the create modal timezone hint in Chinese in the same open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloudZeroCreationModal open onOk={vi.fn()} onCancel={vi.fn()} />);

    await hoverTooltip(user, "时区");

    expect(await screen.findByText("用于日期处理的时区（未提供时默认为 UTC）")).toBeInTheDocument();
    expect(screen.queryByText("Timezone for date handling (defaults to UTC if not provided)")).not.toBeInTheDocument();
  });

  it("renders the update modal in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloudZeroUpdateModal open onOk={vi.fn()} onCancel={vi.fn()} settings={settings} />);

    expect(screen.getByText("编辑 CloudZero 集成")).toBeInTheDocument();
    expect(screen.queryByText("Edit CloudZero Integration")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("留空以保留现有值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave empty to keep existing")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();

    await hoverTooltip(user, "CloudZero API Key");

    expect(await screen.findByText("留空以保留现有 API Key")).toBeInTheDocument();
    expect(screen.queryByText("Leave empty to keep the existing API key")).not.toBeInTheDocument();
  });

  it("renders the integration settings in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloudZeroIntegrationSettings settings={settings} onSettingsUpdated={vi.fn()} />);

    expect(screen.getByText("CloudZero 配置")).toBeInTheDocument();
    expect(screen.queryByText("CloudZero Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("活跃")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByText("API Key（已脱敏）")).toBeInTheDocument();
    expect(screen.queryByText("API Key (Redacted)")).not.toBeInTheDocument();
    expect(screen.getAllByText("连接 ID").length).toBeGreaterThan(0);
    expect(screen.queryByText("Connection ID")).not.toBeInTheDocument();
    expect(screen.getByText("时区")).toBeInTheDocument();
    expect(screen.queryByText("Timezone")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "运行试运行模拟" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run Dry Run Simulation" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "立即导出数据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export Data Now" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "立即导出数据" }));

    expect(await screen.findByText("将数据导出到 CloudZero")).toBeInTheDocument();
    expect(screen.queryByText("Export Data to CloudZero")).not.toBeInTheDocument();
    expect(screen.getByText("这会将当前累计的成本数据推送到 CloudZero。是否继续？")).toBeInTheDocument();
    expect(
      screen.queryByText("This will push the current accumulated cost data to CloudZero. Continue?"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
  });

  it("renders the not-configured and default-timezone fallbacks in Chinese", () => {
    renderWithProviders(
      <CloudZeroIntegrationSettings
        settings={{ connection_id: "", api_key_masked: "", timezone: "", status: "" }}
        onSettingsUpdated={vi.fn()}
      />,
    );

    expect(screen.getAllByText("未配置").length).toBeGreaterThan(0);
    expect(screen.queryByText("Not configured")).not.toBeInTheDocument();
    expect(screen.getByText("默认（UTC）")).toBeInTheDocument();
    expect(screen.queryByText("Default (UTC)")).not.toBeInTheDocument();
  });

  it("renders the delete-integration dialog in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CloudZeroIntegrationSettings settings={settings} onSettingsUpdated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "删除" }));

    expect(await screen.findByText("删除 CloudZero 集成？")).toBeInTheDocument();
    expect(screen.queryByText("Delete CloudZero Integration?")).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此 CloudZero 集成吗？所有相关设置和配置都将被永久移除。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Are you sure you want to delete this CloudZero integration? All associated settings and configurations will be permanently removed.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("集成详情")).toBeInTheDocument();
    expect(screen.queryByText("Integration Details")).not.toBeInTheDocument();
  });

  it("renders the api-key reveal control in Chinese", () => {
    renderWithProviders(<CloudZeroCreationModal open onOk={vi.fn()} onCancel={vi.fn()} />);

    const show = screen.getByRole("button", { name: "显示 API Key" });
    expect(show).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show API key" })).not.toBeInTheDocument();
  });
});
