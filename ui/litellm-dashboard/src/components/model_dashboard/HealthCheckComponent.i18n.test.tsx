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
});
