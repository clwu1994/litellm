/* @vitest-environment jsdom */
import type { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { cleanup, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { HealthChecksTable } from "./HealthChecksTable";
import type { HealthCheckData, HealthStatus } from "./HealthChecksTableColumns";

const makeRow = (overrides: Partial<HealthCheckData> & { id: string }): HealthCheckData => {
  const { id, ...rest } = overrides;
  return {
    model_name: `model-${id}`,
    model_info: { id },
    health_status: "none",
    last_check: "None",
    last_success: "None",
    health_loading: false,
    ...rest,
  };
};

const STATUS_NONE_ROW = {
  id: "status-none",
  health_status: "none",
  last_check: "2024-01-01T00:00:00Z",
  last_success: "2024-01-01T00:00:00Z",
};

function Harness({
  data,
  modelHealthStatuses = {},
  isLoading = false,
}: {
  data: HealthCheckData[];
  modelHealthStatuses?: Record<string, HealthStatus>;
  isLoading?: boolean;
}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <HealthChecksTable
      data={data}
      rowCount={data.length}
      isLoading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      modelHealthStatuses={modelHealthStatuses}
      getDisplayModelName={(model) => model.model_name}
      onRunHealthCheck={vi.fn()}
      onShowError={vi.fn()}
      onShowSuccess={vi.fn()}
    />
  );
}

describe("HealthChecksTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese column headers and the Chinese empty state", () => {
    render(<Harness data={[]} />);

    expect(screen.getByText("模型 ID")).toBeInTheDocument();
    expect(screen.queryByText("Model ID")).not.toBeInTheDocument();
    expect(screen.getByText("模型名称")).toBeInTheDocument();
    expect(screen.getByText("团队别名")).toBeInTheDocument();
    expect(screen.getByText("健康状态")).toBeInTheDocument();
    expect(screen.getByText("错误详情")).toBeInTheDocument();
    expect(screen.getByText("上次检查")).toBeInTheDocument();
    expect(screen.getByText("上次成功")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.getByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("No models found")).not.toBeInTheDocument();
    expect(screen.getByText("添加到此代理的模型将在此显示其健康状态。")).toBeInTheDocument();
    expect(screen.queryByText("Models added to this proxy will show their health here.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message", () => {
    render(<Harness data={[]} isLoading />);

    expect(screen.getByText("正在加载模型…")).toBeInTheDocument();
    expect(screen.queryByText("Loading models…")).not.toBeInTheDocument();
  });

  it("renders each health status through its Chinese alias", () => {
    render(
      <Harness
        data={[
          makeRow({ id: "a", health_status: "healthy" }),
          makeRow({ id: "b", health_status: "unhealthy" }),
          makeRow({ id: "c", health_status: "checking" }),
          makeRow({ id: "d", health_status: "mystery" }),
        ]}
      />,
    );

    expect(screen.getByText("健康")).toBeInTheDocument();
    expect(screen.queryByText("healthy")).not.toBeInTheDocument();
    expect(screen.getByText("异常")).toBeInTheDocument();
    expect(screen.getByText("检查中")).toBeInTheDocument();
    expect(screen.queryByText("checking")).not.toBeInTheDocument();
    expect(screen.getByText("未知")).toBeInTheDocument();
    expect(screen.queryByText("unknown")).not.toBeInTheDocument();
  });

  it("renders the Chinese sentinels the backend returns in place of a timestamp", () => {
    render(
      <Harness
        data={[
          makeRow({ id: "none" }),
          makeRow({ id: "never", last_check: "Never checked", last_success: "Never succeeded" }),
        ]}
        modelHealthStatuses={{
          never: { status: "none", lastCheck: "Never checked", lastSuccess: "Never succeeded", loading: false },
        }}
      />,
    );

    expect(screen.queryByText("None")).not.toBeInTheDocument();
    expect(screen.getByText("从未检查")).toBeInTheDocument();
    expect(screen.queryByText("Never checked")).not.toBeInTheDocument();
    expect(screen.getByText("从未成功")).toBeInTheDocument();
    expect(screen.queryByText("Never succeeded")).not.toBeInTheDocument();
  });

  it("renders the Chinese none sentinel for the status badge and the timestamp column separately", () => {
    render(
      <Harness
        data={[makeRow(STATUS_NONE_ROW), makeRow({ id: "stamp-none", health_status: "healthy", last_check: "None" })]}
        modelHealthStatuses={{
          "status-none": {
            status: "none",
            lastCheck: "2024-01-01T00:00:00Z",
            lastSuccess: "2024-01-01T00:00:00Z",
            loading: false,
          },
          "stamp-none": {
            status: "healthy",
            lastCheck: "None",
            lastSuccess: "Never succeeded",
            loading: false,
          },
        }}
      />,
    );

    const statusRow = screen.getByRole("row", { name: /model-status-none/ });
    expect(within(statusRow).getByText("无")).toBeInTheDocument();
    expect(within(statusRow).queryByText("None")).not.toBeInTheDocument();

    const stampRow = screen.getByRole("row", { name: /model-stamp-none/ });
    expect(within(stampRow).getByText("无")).toBeInTheDocument();
    expect(within(stampRow).queryByText("None")).not.toBeInTheDocument();
  });

  it("renders the Chinese checking label on the status cell and the run action", () => {
    render(<Harness data={[makeRow({ id: "loading", health_loading: true })]} />);

    expect(screen.getByText("正在检查...")).toBeInTheDocument();
    expect(screen.queryByText("Check in progress...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "检查中..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Checking..." })).not.toBeInTheDocument();
  });

  it("renders the Chinese run and rerun aria labels on the row action", () => {
    render(<Harness data={[makeRow({ id: "fresh" }), makeRow({ id: "done", health_status: "healthy" })]} />);

    expect(screen.getByRole("button", { name: "运行健康检查" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run Health Check" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重新运行健康检查" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Re-run Health Check" })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-errors cell and the Chinese detail aria labels", () => {
    render(
      <Harness
        data={[
          makeRow({ id: "clean", health_status: "healthy" }),
          makeRow({ id: "broken", health_status: "unhealthy" }),
        ]}
        modelHealthStatuses={{
          clean: { status: "healthy", lastCheck: "x", lastSuccess: "x", loading: false, successResponse: { ok: true } },
          broken: {
            status: "unhealthy",
            lastCheck: "x",
            lastSuccess: "None",
            loading: false,
            error: "boom",
            fullError: "boom details",
          },
        }}
      />,
    );

    expect(screen.getByText("无错误")).toBeInTheDocument();
    expect(screen.queryByText("No errors")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看响应详情" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View response details" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看完整错误详情" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View full error details" })).not.toBeInTheDocument();
  });

  it("renders the Chinese row-selection aria label", () => {
    render(<Harness data={[makeRow({ id: "row-1" })]} />);

    expect(screen.getByRole("checkbox", { name: "选择 row-1" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select row-1" })).not.toBeInTheDocument();
  });
});
