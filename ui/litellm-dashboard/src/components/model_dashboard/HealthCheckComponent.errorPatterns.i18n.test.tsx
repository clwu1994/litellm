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

function Harness() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });

  return (
    <HealthCheckComponent
      accessToken="token"
      modelData={{ data: [makeModel("1")] }}
      all_models_on_proxy={["gpt-4"]}
      getDisplayModelName={(model: { model_name?: string }) => model.model_name ?? ""}
      pagination={pagination}
      onPaginationChange={setPagination}
      rowCount={1}
    />
  );
}

const renderFailure = async (error: string) => {
  const user = userEvent.setup();
  mockIndividualModelHealthCheckCall.mockResolvedValue({
    unhealthy_count: 1,
    unhealthy_endpoints: [{ error }],
  });

  await act(async () => {
    render(<Harness />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await user.click(screen.getAllByRole("button", { name: "运行健康检查" })[0]);
};

describe("HealthCheckComponent Chinese error patterns", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockLatestHealthChecksCall.mockResolvedValue({ latest_health_checks: {} });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it.each([
    ["Missing OpenAI API Key", "缺少 API Key", "Missing API Key"],
    ["Connection timeout", "连接超时", "Connection timeout"],
    ["Network response was not ok", "网络连接失败", "Network connection failed"],
  ])("renders %s as %s and hides %s", async (raw, zh, en) => {
    await renderFailure(raw);

    expect(await screen.findByText(zh)).toBeInTheDocument();
    expect(screen.queryByText(en)).not.toBeInTheDocument();
  });
});
