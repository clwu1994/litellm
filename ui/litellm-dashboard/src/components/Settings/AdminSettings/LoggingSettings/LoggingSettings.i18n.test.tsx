/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteProxyConfigField, useProxyConfig } from "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig";
import { useStoreRequestInSpendLogs } from "@/app/(dashboard)/hooks/storeRequestInSpendLogs/useStoreRequestInSpendLogs";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { parseErrorMessage } from "@/components/shared/errorUtils";

import LoggingSettings from "./LoggingSettings";

vi.mock("@/app/(dashboard)/hooks/storeRequestInSpendLogs/useStoreRequestInSpendLogs");
vi.mock("@/app/(dashboard)/hooks/proxyConfig/useProxyConfig", async () => {
  const actual = await vi.importActual<typeof import("@/app/(dashboard)/hooks/proxyConfig/useProxyConfig")>(
    "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig",
  );
  return { ...actual, useProxyConfig: vi.fn(), useDeleteProxyConfigField: vi.fn() };
});
vi.mock("@/components/shared/errorUtils", () => ({ parseErrorMessage: vi.fn() }));

const mockUseStoreRequestInSpendLogs = vi.mocked(useStoreRequestInSpendLogs);
const mockUseProxyConfig = vi.mocked(useProxyConfig);
const mockUseDeleteProxyConfigField = vi.mocked(useDeleteProxyConfigField);

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const settle = ({
  mutate = vi.fn(),
  isPending = false,
  proxyConfig = [],
  isLoadingConfig = false,
  deleteField = vi.fn(),
  isDeleting = false,
}: {
  mutate?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  proxyConfig?: unknown[];
  isLoadingConfig?: boolean;
  deleteField?: ReturnType<typeof vi.fn>;
  isDeleting?: boolean;
} = {}) => {
  mockUseStoreRequestInSpendLogs.mockReturnValue({
    mutate,
    isPending,
  } as unknown as ReturnType<typeof useStoreRequestInSpendLogs>);
  mockUseProxyConfig.mockReturnValue({
    data: proxyConfig,
    isLoading: isLoadingConfig,
  } as unknown as ReturnType<typeof useProxyConfig>);
  mockUseDeleteProxyConfigField.mockReturnValue({
    mutate: deleteField,
    isPending: isDeleting,
  } as unknown as ReturnType<typeof useDeleteProxyConfigField>);
};

const openTooltip = async (label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  await user().hover(trigger as Element);
  return waitFor(() => {
    const tooltip = document.querySelector('[data-slot="tooltip-content"][data-open]');
    if (tooltip === null) throw new Error("tooltip did not open");
    return tooltip as HTMLElement;
  });
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const FIELD_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["在 Spend Logs 中存储提示词", "Store Prompts in Spend Logs"],
  ["Spend Logs 最长保留期（可选）", "Maximum Spend Logs Retention Period (Optional)"],
  ["Spend Logs 清理批次大小（可选）", "Spend Logs Cleanup Batch Size (Optional)"],
  ["Spend Logs 清理最大批次数（可选）", "Spend Logs Cleanup Max Batches (Optional)"],
  ["Spend Logs 清理运行预算（可选）", "Spend Logs Cleanup Run Budget (Optional)"],
  ["Spend Logs 清理批次超时（可选）", "Spend Logs Cleanup Batch Timeout (Optional)"],
];

describe("LoggingSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    vi.mocked(parseErrorMessage).mockReturnValue("Backend error");
    settle();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the card copy and every field label in Chinese and hides the English originals", () => {
    renderWithProviders(<LoggingSettings />);

    expectLocalized("日志设置", "Logging Settings");
    expectLocalized(
      "控制请求和响应数据如何写入 Spend Logs 的代理级设置。",
      "Proxy-wide settings that control how request and response data are written to spend logs.",
    );
    for (const [zh, en] of FIELD_LABELS) {
      expectLocalized(zh, en);
    }
    expectLocalized("保存设置", "Save Settings");
  });

  it("renders every field placeholder in Chinese and hides the English originals", () => {
    renderWithProviders(<LoggingSettings />);

    for (const [zh, en] of [
      ["例如：7d、30d", "e.g., 7d, 30d"],
      ["例如：1000", "e.g., 1000"],
      ["例如：500", "e.g., 500"],
      ["例如：5m", "e.g., 5m"],
      ["例如：30s", "e.g., 30s"],
    ] as const) {
      expect(screen.getByPlaceholderText(zh)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(en)).not.toBeInTheDocument();
    }
  });

  it("renders every tooltip in Chinese while it is open and hides the English originals", async () => {
    renderWithProviders(<LoggingSettings />);

    const cases: ReadonlyArray<readonly [string, string]> = [
      [
        "在 Spend Logs 中存储提示词",
        "启用后，提示词将存储在 Spend Logs 中，用于跟踪和分析。",
        "When enabled, prompts will be stored in spend logs for tracking and analysis purposes.",
      ],
      [
        "Spend Logs 最长保留期（可选）",
        "设置 Spend Logs 的最长保留期（例如 '7d' 表示 7 天，'30d' 表示 30 天）。留空表示不限制。",
        "Set the maximum retention period for spend logs (e.g., '7d' for 7 days, '30d' for 30 days). Leave empty for no limit.",
      ],
      [
        "Spend Logs 清理批次大小（可选）",
        "清理期间每条 DELETE 语句删除的行数。留空则使用默认值 1000。",
        "Rows deleted per DELETE statement during cleanup. Leave empty to use the default of 1000.",
      ],
      [
        "Spend Logs 清理最大批次数（可选）",
        "每次清理运行中每张表执行的 DELETE 语句最大数量。留空则使用默认值 500。",
        "Maximum number of DELETE statements run per table per cleanup run. Leave empty to use the default of 500.",
      ],
      [
        "Spend Logs 清理运行预算（可选）",
        "整个清理运行的墙钟时间预算，由它清理的每张表共享（例如 '5m'）。留空则使用默认值 5m。",
        "Wall-clock budget for a whole cleanup run, shared across every table it cleans (e.g., '5m'). Leave empty to use the default of 5m.",
      ],
      [
        "Spend Logs 清理批次超时（可选）",
        "应用于每个清理批次的 Postgres 语句和锁超时，确保清理不会独占连接（例如 '30s'）。留空则使用默认值 30s。",
        "Postgres statement and lock timeout applied to each cleanup batch, so cleanup never monopolizes a connection (e.g., '30s'). Leave empty to use the default of 30s.",
      ],
    ];

    for (const [label, zh, en] of cases) {
      const tooltip = await openTooltip(label);
      expect(tooltip.textContent?.trim()).toBe(zh);
      expect(within(tooltip).queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the saving state in Chinese and hides the English original", () => {
    settle({ isPending: true });
    renderWithProviders(<LoggingSettings />);

    expectLocalized("保存中...", "Saving...");
    expect(screen.getByRole("img", { name: "加载中" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "loading" })).not.toBeInTheDocument();
  });

  it("reports a successful save in Chinese and not in English", async () => {
    const mutate = vi.fn((_params, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ mutate });
    renderWithProviders(<LoggingSettings />);

    await user().click(screen.getByRole("button", { name: "保存设置" }));

    expect(toast.success).toHaveBeenCalledWith("Spend Logs 设置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Spend logs settings updated successfully");
  });

  it("reports a failed save in Chinese and not in English", async () => {
    const mutate = vi.fn((_params, options: { onError: (error: Error) => void }) => options.onError(new Error("boom")));
    settle({ mutate });
    renderWithProviders(<LoggingSettings />);

    await user().click(screen.getByRole("button", { name: "保存设置" }));

    expect(toast.fromError).toHaveBeenCalledWith("保存 Spend Logs 设置失败：Backend error");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save spend logs settings: Backend error");
  });

  it("reports a failed clear in Chinese and not in English", async () => {
    const deleteField = vi.fn((_request, options: { onError: () => void; onSettled: () => void }) => {
      options.onError();
      options.onSettled();
    });
    settle({
      proxyConfig: [
        {
          field_name: "maximum_spend_logs_cleanup_batch_size",
          field_type: "Integer",
          field_description: "Batch size",
          field_value: "abc",
          stored_in_db: true,
        },
      ],
      deleteField,
    });
    renderWithProviders(<LoggingSettings />);

    await user().click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("清除已保存的值失败：maximum_spend_logs_cleanup_batch_size");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Failed to clear saved value for: maximum_spend_logs_cleanup_batch_size",
    );
  });
});

describe("LoggingSettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    vi.mocked(parseErrorMessage).mockReturnValue("Backend error");
    settle();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    renderWithProviders(<LoggingSettings />);

    expect(screen.getByText("Logging Settings")).toBeInTheDocument();
    for (const [, en] of FIELD_LABELS) {
      expect(screen.getByText(en)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Save Settings" })).toBeInTheDocument();
  });

  it("keeps the English tooltips byte-identical while they are open", async () => {
    renderWithProviders(<LoggingSettings />);

    const tooltip = await openTooltip("Store Prompts in Spend Logs");
    expect(tooltip.textContent?.trim()).toBe(
      "When enabled, prompts will be stored in spend logs for tracking and analysis purposes.",
    );
  });
});
