import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import SavingsTiles from "./SavingsTiles";

describe("SavingsTiles Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tile labels and hints and hides the English originals", () => {
    renderWithProviders(<SavingsTiles results={[]} isLoading={false} />);

    expect(screen.getByText("总节省")).toBeInTheDocument();
    expect(screen.getByText("压缩 + 提示缓存 + auto-router")).toBeInTheDocument();
    expect(screen.getByText("压缩节省")).toBeInTheDocument();
    expect(screen.getByText("已压缩 0 个 Token")).toBeInTheDocument();
    expect(screen.getByText("提示缓存节省")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 注入")).toBeInTheDocument();
    expect(screen.getByText("auto-router 节省")).toBeInTheDocument();
    expect(screen.getByText("相比它可能选择的最贵模型")).toBeInTheDocument();
    expect(screen.getByText("总计")).toBeInTheDocument();

    expect(screen.queryByText("Total saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Compression savings")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt caching savings")).not.toBeInTheDocument();
    expect(screen.queryByText("Auto-router savings")).not.toBeInTheDocument();
    expect(screen.queryByText("LiteLLM injected")).not.toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading hint and hides the English original", () => {
    renderWithProviders(<SavingsTiles results={[]} isLoading={true} />);

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the Chinese tile explanations and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SavingsTiles results={[]} isLoading={false} />);

    await user.click(screen.getByTestId("summary-card-info-total-saved"));
    expect(
      await screen.findByText(
        "旁边三个卡片的合计。其中的缓存部分是 LiteLLM 注入带来的节省，因此这个总计代表网关自身交付的节省；客户端或提供商自带的缓存只会计入缓存卡片的 Total 数值。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/The sum of the three tiles beside it/)).not.toBeInTheDocument();

    await user.click(screen.getByTestId("summary-card-info-compression-savings"));
    expect(await screen.findByText("调用前通过 Headroom 移除的 Token，按模型的输入价格计价。")).toBeInTheDocument();
    expect(screen.queryByText(/Headroom removed before the call/)).not.toBeInTheDocument();

    await user.click(screen.getByTestId("summary-card-info-prompt-caching-savings"));
    expect(
      await screen.findByText(
        "缓存相比为每个 Token 支付输入价格所节省的金额：从缓存提供的 Token 的折扣，减去提供商写入缓存条目收取的溢价。标题数值是 LiteLLM 通过插入断点（配置的注入点或自动提示缓存）所赚取的份额。旁边的总计还会计入自带 cache_control 的请求以及隐式缓存的提供商。对于写入缓存多于复用缓存的流量，两者都可能为负，因此标题数值并不总是两者中较小的那个。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/What caching saved against paying the input rate/)).not.toBeInTheDocument();

    await user.click(screen.getByTestId("summary-card-info-auto-router-savings"));
    expect(
      await screen.findByText(
        "如果每个请求都发往 auto-router 能路由到的最贵模型，这些流量本会产生的成本，减去实际成本。切换后新模型的缓存是冷的，因此需要重新写入提示，而基线按已预热计价；频繁冲刷缓存的路线可能总计为负，而真正的首轮请求（双方都没有缓存）会被低估。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/What this traffic would have cost/)).not.toBeInTheDocument();
  });
});
