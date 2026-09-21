import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import {
  cancelModelCostMapReload,
  getModelCostMapReloadStatus,
  getModelCostMapSource,
  reloadModelCostMap,
  scheduleModelCostMapReload,
} from "./networking";
import PriceDataReload from "./price_data_reload";

vi.mock("./networking", () => ({
  cancelModelCostMapReload: vi.fn(),
  getModelCostMapReloadStatus: vi.fn(),
  getModelCostMapSource: vi.fn(),
  reloadModelCostMap: vi.fn(),
  scheduleModelCostMapReload: vi.fn(),
}));

const unscheduledStatus = { scheduled: false, interval_hours: null, last_run: null, next_run: null };
const scheduledStatus = {
  scheduled: true,
  interval_hours: 6,
  last_run: null,
  next_run: "2026-01-21T00:00:00Z",
};
const activeStatus = {
  scheduled: true,
  interval_hours: 6,
  last_run: "2026-01-20T00:00:00Z",
  next_run: "2026-01-21T00:00:00Z",
};
const remoteSource = {
  source: "remote",
  url: "https://pricing.example.test/model_prices.json",
  is_env_forced: false,
  fallback_reason: null,
  loaded_at: null,
  source_revision: null,
  etag: null,
  model_count: 1234,
};

describe("PriceDataReload Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getModelCostMapReloadStatus).mockResolvedValue(unscheduledStatus);
    vi.mocked(getModelCostMapSource).mockResolvedValue(remoteSource as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese reload buttons and pricing source card", async () => {
    render(<PriceDataReload accessToken="sk-test" />);

    expect(await screen.findByText("价格数据源")).toBeInTheDocument();
    expect(screen.queryByText("Pricing Data Source")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重载价格数据/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reload Price Data/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /设置定期重载/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Set Up Periodic Reload/ })).not.toBeInTheDocument();
    expect(screen.getByText("远程")).toBeInTheDocument();
    expect(screen.queryByText("Remote")).not.toBeInTheDocument();
    expect(screen.getByText("已加载模型：")).toBeInTheDocument();
    expect(screen.getByText("加载来源：")).toBeInTheDocument();
    expect(screen.getByText("未安排定期重载")).toBeInTheDocument();
    expect(screen.getByText("上次运行：")).toBeInTheDocument();
  });

  it("renders the Chinese local source badge and attempted URL label", async () => {
    vi.mocked(getModelCostMapSource).mockResolvedValue({ ...remoteSource, source: "local" } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    expect(await screen.findByText("本地")).toBeInTheDocument();
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
    expect(screen.getByText("尝试的 URL：")).toBeInTheDocument();
    expect(screen.queryByText("Attempted URL:")).not.toBeInTheDocument();
  });

  it("renders the Chinese provenance rows", async () => {
    vi.mocked(getModelCostMapSource).mockResolvedValue({
      ...remoteSource,
      loaded_at: "2026-09-07T10:00:00Z",
      source_revision: "4273ec544726bf255ea920533e209e6022653bb4",
      etag: 'W/"eb8e9a53f4cc284b"',
    } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    expect(await screen.findByText("源版本：")).toBeInTheDocument();
    expect(screen.queryByText("Source revision:")).not.toBeInTheDocument();
    expect(screen.getByText("ETag:")).toBeInTheDocument();
    expect(screen.getByText("加载时间：")).toBeInTheDocument();
    expect(screen.queryByText("Loaded at:")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "由响应此请求的 worker 报告。其他 worker 会在下次轮询时获取重载，上次运行时间是任何 worker 记录的最新重载时间",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/worker that answered this request/)).not.toBeInTheDocument();
  });

  it("renders the Chinese forced-local and fallback hints", async () => {
    vi.mocked(getModelCostMapSource).mockResolvedValue({
      ...remoteSource,
      is_env_forced: true,
      fallback_reason: "remote unavailable",
    } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    expect(await screen.findByText(/强制使用本地模式/)).toBeInTheDocument();
    expect(screen.getByText("LITELLM_LOCAL_MODEL_COST_MAP=True")).toBeInTheDocument();
    expect(screen.queryByText(/Local mode forced via/)).not.toBeInTheDocument();
    expect(screen.getByText("已回退到本地：remote unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Fell back to local:/)).not.toBeInTheDocument();
  });

  it("renders the Chinese scheduled status, next run and active state", async () => {
    vi.mocked(getModelCostMapReloadStatus).mockResolvedValue(activeStatus);
    render(<PriceDataReload accessToken="sk-test" />);

    expect(await screen.findByText("每 6 小时调度一次")).toBeInTheDocument();
    expect(screen.queryByText(/Scheduled every 6 hours/)).not.toBeInTheDocument();
    expect(screen.getByText("下次运行：")).toBeInTheDocument();
    expect(screen.getByText("状态：")).toBeInTheDocument();
    expect(screen.getByText("运行中")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /取消定期重载/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel Periodic Reload/ })).not.toBeInTheDocument();
  });

  it("renders the Chinese hard-refresh confirmation", async () => {
    const user = userEvent.setup();
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /重载价格数据/ }));

    expect(screen.getByText("强制刷新价格数据")).toBeInTheDocument();
    expect(screen.queryByText("Hard Refresh Price Data")).not.toBeInTheDocument();
    expect(screen.getByText("这会立即从远程源获取最新的价格信息。是否继续？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "否" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "是" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yes" })).not.toBeInTheDocument();
  });

  it("renders the Chinese schedule dialog chrome", async () => {
    const user = userEvent.setup();
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /设置定期重载/ }));

    expect(screen.getByRole("dialog", { name: "设置定期重载" })).toBeInTheDocument();
    expect(screen.getByText("设置 LiteLLM 从远程源获取最新价格数据的频率。")).toBeInTheDocument();
    expect(screen.getByText("设置价格数据自动重载的频率：")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "重载间隔（小时）" })).toBeInTheDocument();
    expect(screen.getByText("小时")).toBeInTheDocument();
    expect(screen.getByText("这会每 6 小时自动从远程源获取最新的价格数据。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "调度" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Schedule" })).not.toBeInTheDocument();
  });

  it("reports the reload result in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(reloadModelCostMap).mockResolvedValue({ status: "success", models_count: 42 } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /重载价格数据/ }));
    await user.click(screen.getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("价格数据重载成功！已更新 42 个模型。"));
    expect(toast.success).not.toHaveBeenCalledWith("Price data reloaded successfully! 42 models updated.");
  });

  it("reports a failed reload in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(reloadModelCostMap).mockRejectedValue(new Error("boom"));
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /重载价格数据/ }));
    await user.click(screen.getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("重载价格数据失败。请重试。"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to reload price data. Please try again.");
  });

  it("reports a non-success reload status in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(reloadModelCostMap).mockResolvedValue({ status: "error" } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /重载价格数据/ }));
    await user.click(screen.getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("重载价格数据失败"));
  });

  it("reports a missing access token in Chinese", async () => {
    const user = userEvent.setup();
    render(<PriceDataReload accessToken="" />);

    await user.click(await screen.findByRole("button", { name: /重载价格数据/ }));
    await user.click(screen.getByRole("button", { name: "是" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("没有可用的访问 Token"));
    expect(reloadModelCostMap).not.toHaveBeenCalled();
  });

  it("reports the scheduled interval in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(scheduleModelCostMapReload).mockResolvedValue({ status: "success" } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /设置定期重载/ }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    await user.click(screen.getByRole("button", { name: "调度" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("已安排每 12 小时定期重载"));
    expect(toast.success).not.toHaveBeenCalledWith("Periodic reload scheduled for every 12 hours");
  });

  it("reports an invalid schedule interval in Chinese", async () => {
    const user = userEvent.setup();
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /设置定期重载/ }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "-1" } });
    await user.click(screen.getByRole("button", { name: "调度" }));

    expect(toast.fromError).toHaveBeenCalledWith("小时数必须是 1 到 168 之间的整数");
    expect(scheduleModelCostMapReload).not.toHaveBeenCalled();
  });

  it("reports a failed schedule in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(scheduleModelCostMapReload).mockRejectedValue(new Error("boom"));
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /设置定期重载/ }));
    await user.click(screen.getByRole("button", { name: "调度" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("安排定期重载失败。请重试。"));
  });

  it("reports a cancelled schedule in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(getModelCostMapReloadStatus).mockResolvedValue(scheduledStatus);
    vi.mocked(cancelModelCostMapReload).mockResolvedValue({ status: "success" } as never);
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /取消定期重载/ }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("定期重载已成功取消"));
    expect(toast.success).not.toHaveBeenCalledWith("Periodic reload cancelled successfully");
  });

  it("reports a failed cancellation in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(getModelCostMapReloadStatus).mockResolvedValue(scheduledStatus);
    vi.mocked(cancelModelCostMapReload).mockRejectedValue(new Error("boom"));
    render(<PriceDataReload accessToken="sk-test" />);

    await user.click(await screen.findByRole("button", { name: /取消定期重载/ }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("取消定期重载失败。请重试。"));
  });
});
