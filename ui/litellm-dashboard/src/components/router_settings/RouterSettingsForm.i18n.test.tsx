import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import RouterSettingsForm from "./RouterSettingsForm";

const renderForm = (overrides: Partial<React.ComponentProps<typeof RouterSettingsForm>> = {}) =>
  renderWithProviders(
    <RouterSettingsForm
      value={{ routerSettings: { num_retries: 3 }, selectedStrategy: "simple-shuffle", enableTagFiltering: false }}
      onChange={() => {}}
      routerFieldsMetadata={{}}
      availableRoutingStrategies={["simple-shuffle", "latency-based-routing"]}
      routingStrategyDescriptions={{}}
      {...overrides}
    />,
  );

describe("RouterSettingsForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the section headings and descriptions in Chinese", () => {
    renderForm();

    expect(screen.getByText("路由设置")).toBeInTheDocument();
    expect(screen.queryByText("Routing Settings")).not.toBeInTheDocument();
    expect(screen.getByText("配置请求如何路由到部署")).toBeInTheDocument();
    expect(screen.queryByText("Configure how requests are routed to deployments")).not.toBeInTheDocument();
    expect(screen.getByText("可靠性与重试")).toBeInTheDocument();
    expect(screen.queryByText("Reliability & Retries")).not.toBeInTheDocument();
    expect(screen.getByText("配置重试逻辑与故障处理")).toBeInTheDocument();
    expect(screen.queryByText("Configure retry logic and failure handling")).not.toBeInTheDocument();
  });

  it("renders the metadata fallbacks and the documentation link in Chinese", () => {
    renderForm({
      routerFieldsMetadata: { enable_tag_filtering: { link: "https://docs.example.com/tags" } },
    });

    expect(screen.getByText("路由策略")).toBeInTheDocument();
    expect(screen.queryByText("Routing Strategy")).not.toBeInTheDocument();
    expect(screen.getByText("启用标签筛选")).toBeInTheDocument();
    expect(screen.queryByText("Enable Tag Filtering")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "了解更多" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Learn more" })).not.toBeInTheDocument();
  });

  it("renders the latency configuration copy in Chinese", () => {
    renderForm({
      value: { routerSettings: {}, selectedStrategy: "latency-based-routing", enableTagFiltering: false },
    });

    expect(screen.getByText("基于延迟的配置")).toBeInTheDocument();
    expect(screen.queryByText("Latency-Based Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("微调基于延迟的路由行为")).toBeInTheDocument();
    expect(screen.queryByText("Fine-tune latency-based routing behavior")).not.toBeInTheDocument();
    expect(screen.getByText("计算部署平均延迟时回溯的滑动窗口。默认 1 小时（以秒为单位）。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Sliding window to look back over when calculating the average latency of a deployment. Default - 1 hour (in seconds).",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("在最低延迟此百分比范围内的部署之间随机选择。默认 0（即始终选择最低延迟）。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Shuffle between deployments within this % of the lowest latency. Default - 0 (i.e. always pick lowest latency).",
      ),
    ).not.toBeInTheDocument();
  });
});
