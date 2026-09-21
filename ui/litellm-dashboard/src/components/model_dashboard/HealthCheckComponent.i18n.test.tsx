/* @vitest-environment jsdom */
import type { PaginationState } from "@tanstack/react-table";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import HealthCheckComponent from "./HealthCheckComponent";

const mockIndividualModelHealthCheckCall = vi.fn();
const mockLatestHealthChecksCall = vi.fn();

vi.mock("../networking", () => ({
  individualModelHealthCheckCall: (...args: unknown[]) => mockIndividualModelHealthCheckCall(...args),
  latestHealthChecksCall: (...args: unknown[]) => mockLatestHealthChecksCall(...args),
}));

const makeModel = (id: string, name = "gpt-4") => ({
  model_name: name,
  model_info: { id },
  litellm_model_name: name,
});

function Harness({ allModelsOnProxy }: { allModelsOnProxy: string[] }) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });

  return (
    <HealthCheckComponent
      accessToken="token"
      modelData={{ data: [makeModel("1"), makeModel("2", "claude-3")] }}
      all_models_on_proxy={allModelsOnProxy}
      getDisplayModelName={(model: { model_name?: string }) => model.model_name ?? ""}
      pagination={pagination}
      onPaginationChange={setPagination}
      rowCount={2}
    />
  );
}

const renderHealthCheck = async (allModelsOnProxy: string[]) => {
  await act(async () => {
    render(<Harness allModelsOnProxy={allModelsOnProxy} />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("HealthCheckComponent Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockLatestHealthChecksCall.mockResolvedValue({ latest_health_checks: {} });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and description", async () => {
    await renderHealthCheck(["gpt-4", "claude-3"]);

    expect(screen.getByText("模型健康状态")).toBeInTheDocument();
    expect(screen.queryByText("Model Health Status")).not.toBeInTheDocument();
    expect(screen.getByText("对单个模型运行健康检查，以确认它们工作正常")).toBeInTheDocument();
    expect(
      screen.queryByText("Run health checks on individual models to verify they are working correctly"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese run-all and run-selected buttons", async () => {
    const user = userEvent.setup();
    await renderHealthCheck(["gpt-4", "claude-3"]);

    expect(screen.getByRole("button", { name: "运行所有检查" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run All Checks" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "选择 1" }));

    expect(await screen.findByRole("button", { name: "运行选中的检查" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Run Selected Checks" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除选择" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Selection" })).not.toBeInTheDocument();
  });

  it("renders the Chinese fallback error message when a check fails without an endpoint error", async () => {
    const user = userEvent.setup();
    mockIndividualModelHealthCheckCall.mockResolvedValue({
      unhealthy_count: 1,
      unhealthy_endpoints: [{}],
    });
    await renderHealthCheck(["gpt-4", "claude-3"]);

    await user.click(screen.getAllByRole("button", { name: "运行健康检查" })[0]);

    expect(await screen.findByText("健康检查失败")).toBeInTheDocument();
    expect(screen.queryByText("Health check failed")).not.toBeInTheDocument();
  });

  it("renders the Chinese error dialog inside the open state", async () => {
    const user = userEvent.setup();
    mockLatestHealthChecksCall.mockResolvedValue({
      latest_health_checks: {
        "1": {
          status: "unhealthy",
          checked_at: "2024-01-01T00:00:00Z",
          error_message: "AuthenticationError: 401 invalid key",
        },
      },
    });
    await renderHealthCheck(["gpt-4", "claude-3"]);

    await user.click(await screen.findByRole("button", { name: "查看完整错误详情" }));

    expect(await screen.findByText("健康检查错误 - gpt-4")).toBeInTheDocument();
    expect(screen.queryByText(/Health Check Error/)).not.toBeInTheDocument();
    expect(screen.getByText("错误：")).toBeInTheDocument();
    expect(screen.queryByText("Error:")).not.toBeInTheDocument();
    expect(screen.getByText("完整错误详情：")).toBeInTheDocument();
    expect(screen.queryByText("Full Error Details:")).not.toBeInTheDocument();
    expect(screen.getByText("模型健康检查返回的详细信息。")).toBeInTheDocument();
    expect(screen.queryByText("Details returned by the model health check.")).not.toBeInTheDocument();
  });

  it("renders the Chinese success dialog inside the open state", async () => {
    const user = userEvent.setup();
    mockLatestHealthChecksCall.mockResolvedValue({
      latest_health_checks: { "1": { status: "healthy", checked_at: "2024-01-01T00:00:00Z" } },
    });
    await renderHealthCheck(["gpt-4", "claude-3"]);

    await user.click(await screen.findByRole("button", { name: "查看响应详情" }));

    expect(await screen.findByText("健康检查响应 - gpt-4")).toBeInTheDocument();
    expect(screen.queryByText(/Health Check Response/)).not.toBeInTheDocument();
    expect(screen.getByText("成功的模型健康检查返回的响应。")).toBeInTheDocument();
    expect(screen.queryByText("Response returned by the successful model health check.")).not.toBeInTheDocument();
    expect(screen.getByText("健康检查已通过")).toBeInTheDocument();
    expect(screen.queryByText("Health check passed successfully")).not.toBeInTheDocument();
    expect(screen.getByText("响应详情：")).toBeInTheDocument();
  });
});
