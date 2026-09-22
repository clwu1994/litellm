import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import EntityUsageExportModal from "./EntityUsageExportModal";
import ExportFormatSelector from "./ExportFormatSelector";
import ExportSummary from "./ExportSummary";
import ExportTypeSelector from "./ExportTypeSelector";
import UsageExportHeader from "./UsageExportHeader";
import type { EntitySpendData } from "./types";

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn(), info: vi.fn() },
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [], isLoading: false }),
}));

const SPEND_DATA: EntitySpendData = {
  results: [],
  metadata: {
    total_spend: 0,
    total_api_requests: 0,
    total_successful_requests: 0,
    total_failed_requests: 0,
    total_tokens: 0,
  },
};

describe("EntityUsageExport Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the format selector in Chinese", () => {
    renderWithProviders(<ExportFormatSelector value="csv" onChange={vi.fn()} />);

    expect(screen.getByText("格式")).toBeInTheDocument();
    expect(screen.queryByText("Format")).not.toBeInTheDocument();
    expect(screen.getByText("CSV（Excel、Google Sheets）")).toBeInTheDocument();
    expect(screen.queryByText("CSV (Excel, Google Sheets)")).not.toBeInTheDocument();
  });

  it("renders the export type selector in Chinese", () => {
    renderWithProviders(<ExportTypeSelector value="daily" onChange={vi.fn()} entityType="team" />);

    expect(screen.getByText("导出类型")).toBeInTheDocument();
    expect(screen.queryByText("Export type")).not.toBeInTheDocument();
    expect(screen.getByText("按团队逐日细分")).toBeInTheDocument();
    expect(screen.queryByText("Day-by-day breakdown by team")).not.toBeInTheDocument();
    expect(screen.getByText("每个团队的每日指标")).toBeInTheDocument();
    expect(screen.queryByText("Daily metrics for each team")).not.toBeInTheDocument();
    expect(screen.getByText("按团队和密钥逐日细分")).toBeInTheDocument();
    expect(screen.queryByText("Day-by-day breakdown by team and key")).not.toBeInTheDocument();
    expect(screen.getByText("每个团队的每日指标，按 API Key 拆分")).toBeInTheDocument();
    expect(screen.queryByText("Daily metrics for each team, split by API key")).not.toBeInTheDocument();
    expect(screen.getByText("按团队和模型逐日")).toBeInTheDocument();
    expect(screen.queryByText("Day-by-day by team and model")).not.toBeInTheDocument();
    expect(screen.getByText("按模型拆分的每日指标")).toBeInTheDocument();
    expect(screen.queryByText("Daily metrics split by model")).not.toBeInTheDocument();
  });

  it("renders the export summary filter counts in Chinese", () => {
    renderWithProviders(
      <ExportSummary
        dateRange={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        selectedFilters={["a"]}
      />,
    );

    const from = new Date("2025-01-01").toLocaleDateString();
    const to = new Date("2025-01-02").toLocaleDateString();
    const summary = screen.getByText(/1 个筛选条件/);
    expect(summary).toHaveTextContent(`${from} - ${to} · 1 个筛选条件`);
    expect(summary).not.toHaveTextContent("filter");
  });

  it("renders the export header in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UsageExportHeader
        dateValue={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        entityType="team"
        spendData={SPEND_DATA}
        showFilters
        filterLabel="Team"
        filterPlaceholder="Select team"
        selectedFilters={["team-1"]}
        onFiltersChange={vi.fn()}
        filterOptions={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "导出数据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export Data" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("此范围内没有有使用量的团队")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("No teams with usage in this range")).not.toBeInTheDocument();
    expect(screen.getByLabelText("清除Team")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear Team")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出数据" }));
    expect(await screen.findByText("导出团队用量")).toBeInTheDocument();
    expect(screen.queryByText("Export Team Usage")).not.toBeInTheDocument();
  });

  it("renders the empty filter combobox in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UsageExportHeader
        dateValue={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        entityType="team"
        spendData={SPEND_DATA}
        showFilters
        filterLabel="Team"
        filterPlaceholder="Select team"
        selectedFilters={["team-1"]}
        onFiltersChange={vi.fn()}
        filterOptions={[]}
      />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到选项")).toBeInTheDocument();
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("renders the JSON format option and a JSON export in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EntityUsageExportModal
        isOpen
        onClose={vi.fn()}
        entityType="team"
        spendData={SPEND_DATA}
        dateRange={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        selectedFilters={[]}
      />,
    );

    expect(await screen.findByText("导出团队用量")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "JSON（包含元数据）" }));

    expect(screen.getAllByText("JSON（包含元数据）").length).toBeGreaterThan(0);
    expect(screen.queryByText("JSON (includes metadata)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(toast.success).toHaveBeenCalledWith("团队用量数据已成功导出为 JSON");
    expect(toast.success).not.toHaveBeenCalledWith("Team usage data exported successfully as JSON");
  });

  it("reports an export failure in Chinese", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.spyOn(window.URL, "createObjectURL").mockImplementation(() => {
      throw new Error("boom");
    });
    renderWithProviders(
      <EntityUsageExportModal
        isOpen
        onClose={vi.fn()}
        entityType="team"
        spendData={SPEND_DATA}
        dateRange={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        selectedFilters={[]}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "导出 CSV" }));

    expect(toast.fromError).toHaveBeenCalledWith("导出数据失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to export data");
    createObjectURL.mockRestore();
  });

  it("renders the export modal actions and toasts in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EntityUsageExportModal
        isOpen
        onClose={vi.fn()}
        entityType="team"
        spendData={SPEND_DATA}
        dateRange={{ from: new Date("2025-01-01"), to: new Date("2025-01-02") }}
        selectedFilters={[]}
      />,
    );

    expect(await screen.findByText("导出团队用量")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出 CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(toast.success).toHaveBeenCalledWith("团队用量数据已成功导出为 CSV");
    expect(toast.success).not.toHaveBeenCalledWith("Team usage data exported successfully as CSV");
  });
});
