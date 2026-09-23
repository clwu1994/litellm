/* eslint-disable testing-library/no-node-access -- the accordion trigger wraps its title and description, so the trigger is reached from its title text */
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import CostTrackingSettings from "./cost_tracking_settings";

const mocks = vi.hoisted(() => ({
  discountConfig: { current: {} as Record<string, number> },
  marginConfig: { current: {} as Record<string, number | { percentage?: number; fixed_amount?: number }> },
  fetchDiscount: vi.fn(async () => {}),
  fetchMargin: vi.fn(async () => {}),
  fetchBlock: vi.fn(async () => {}),
  removeDiscount: vi.fn(async () => {}),
  removeMargin: vi.fn(async () => {}),
}));

vi.mock("./use_discount_config", () => ({
  useDiscountConfig: () => ({
    discountConfig: mocks.discountConfig.current,
    setDiscountConfig: vi.fn(),
    fetchDiscountConfig: mocks.fetchDiscount,
    saveDiscountConfig: vi.fn(),
    handleAddProvider: vi.fn().mockResolvedValue(true),
    handleRemoveProvider: mocks.removeDiscount,
    handleDiscountChange: vi.fn(),
  }),
}));

vi.mock("./use_margin_config", () => ({
  useMarginConfig: () => ({
    marginConfig: mocks.marginConfig.current,
    setMarginConfig: vi.fn(),
    fetchMarginConfig: mocks.fetchMargin,
    saveMarginConfig: vi.fn(),
    handleAddMargin: vi.fn().mockResolvedValue(true),
    handleRemoveMargin: mocks.removeMargin,
    handleMarginChange: vi.fn(),
  }),
}));

vi.mock("./use_block_unpriced_config", () => ({
  useBlockUnpricedConfig: () => ({
    blockUnpriced: false,
    isUpdating: false,
    fetchBlockUnpriced: mocks.fetchBlock,
    setBlockUnpriced: vi.fn(),
  }),
}));

vi.mock("./provider_discount_table", () => ({
  default: ({ onRemoveProvider }: { onRemoveProvider: (provider: string, displayName: string) => void }) => (
    <button type="button" onClick={() => onRemoveProvider("openai", "OpenAI")}>
      stub-remove-discount
    </button>
  ),
}));

vi.mock("./provider_margin_table", () => ({
  default: ({ onRemoveProvider }: { onRemoveProvider: (provider: string, displayName: string) => void }) => (
    <button type="button" onClick={() => onRemoveProvider("global", "Global")}>
      stub-remove-margin
    </button>
  ),
}));

vi.mock("./add_provider_form", () => ({ default: () => <div data-testid="add-provider-form" /> }));
vi.mock("./add_margin_form", () => ({ default: () => <div data-testid="add-margin-form" /> }));
vi.mock("./pricing_calculator/index", () => ({ default: () => <div data-testid="pricing-calculator" /> }));
vi.mock("./how_it_works", () => ({ default: () => <div data-testid="how-it-works" /> }));
vi.mock("@/components/llm_calls/fetch_models", () => ({ fetchAvailableModels: vi.fn().mockResolvedValue([]) }));

const ADMIN_PROPS = { userID: "user-1", userRole: "proxy_admin", accessToken: "test-token" };

const expand = async (user: ReturnType<typeof userEvent.setup>, title: string) => {
  await user.click(screen.getByText(title).closest("button")!);
};

describe("CostTrackingSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.discountConfig.current = {};
    mocks.marginConfig.current = {};
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page header and docs menu entries", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    expect(screen.getByText("成本跟踪设置")).toBeInTheDocument();
    expect(screen.queryByText("Cost Tracking Settings")).not.toBeInTheDocument();
    expect(screen.getByText("为不同的 LLM 提供商配置成本折扣和加价。更改会自动保存。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Configure cost discounts and margins for different LLM providers. Changes are saved automatically.",
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "文档" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Docs" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "文档" }));

    expect(screen.getByRole("link", { name: "模型自定义定价" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "支出跟踪" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Custom pricing for models" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Spend tracking" })).not.toBeInTheDocument();
  });

  it("renders the Chinese accordion headers, section copy and tabs", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    expect(screen.getByText("提供商折扣")).toBeInTheDocument();
    expect(screen.getByText("对特定提供商应用基于百分比的折扣以降低成本")).toBeInTheDocument();
    expect(screen.getByText("费用/价格加价")).toBeInTheDocument();
    expect(screen.getByText("为 LLM 成本添加费用或加价，用于内部计费和成本回收")).toBeInTheDocument();
    expect(screen.getByText("阻止未定价模型")).toBeInTheDocument();
    expect(screen.getByText("拒绝成本映射中没有定价的模型请求，而不是将其记录为 $0 支出")).toBeInTheDocument();
    expect(screen.getByText("定价计算器")).toBeInTheDocument();
    expect(screen.getByText("根据预期的 Token 用量和请求量估算 LLM 成本")).toBeInTheDocument();
    expect(
      screen.queryByText("Apply percentage-based discounts to reduce costs for specific providers"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Add fees or margins to LLM costs for internal billing and cost recovery"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Reject requests for models that have no pricing in the cost map instead of logging them as $0 spend",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Estimate LLM costs based on expected token usage and request volume"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Provider Discounts")).not.toBeInTheDocument();
    expect(screen.queryByText("Fee/Price Margin")).not.toBeInTheDocument();
    expect(screen.queryByText("Block Unpriced Models")).not.toBeInTheDocument();
    expect(screen.queryByText("Pricing Calculator")).not.toBeInTheDocument();

    await expand(user, "提供商折扣");

    expect(screen.getByRole("tab", { name: "折扣" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "测试" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Discounts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Test It" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 添加提供商折扣" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Provider Discount" })).not.toBeInTheDocument();
  });

  it("renders the Chinese block-unpriced copy and toggle label", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "阻止未定价模型");

    expect(screen.getByText("阻止没有定价的模型请求")).toBeInTheDocument();
    expect(
      screen.getByText("启用后，解析出的模型没有成本映射的请求会以 403 被拒绝，以便管理员为其添加定价。默认关闭"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Block requests for models without pricing")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "When enabled, a request whose resolved model has no cost mapping is rejected with a 403 so an admin can add pricing for it. Off by default",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese loading and empty-state copy", async () => {
    mocks.fetchDiscount.mockReturnValue(new Promise<void>(() => {}));
    mocks.fetchMargin.mockReturnValue(new Promise<void>(() => {}));

    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "提供商折扣");
    expect(screen.getByText("正在加载配置...")).toBeInTheDocument();
    expect(screen.queryByText("Loading configuration...")).not.toBeInTheDocument();
    unmount();

    mocks.fetchDiscount.mockResolvedValue(undefined);
    mocks.fetchMargin.mockResolvedValue(undefined);

    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);
    await expand(user, "提供商折扣");
    expect(await screen.findByText("尚未配置提供商折扣")).toBeInTheDocument();
    expect(screen.getByText("点击「添加提供商折扣」开始配置")).toBeInTheDocument();
    expect(screen.queryByText("No provider discounts configured")).not.toBeInTheDocument();
    expect(screen.queryByText('Click "Add Provider Discount" to get started')).not.toBeInTheDocument();

    await expand(user, "费用/价格加价");
    expect(await screen.findByText("尚未配置提供商加价")).toBeInTheDocument();
    expect(screen.getByText("点击「添加提供商加价」开始配置")).toBeInTheDocument();
    expect(screen.queryByText("No provider margins configured")).not.toBeInTheDocument();
    expect(screen.queryByText('Click "Add Provider Margin" to get started')).not.toBeInTheDocument();
  });

  it("renders the Chinese add-discount dialog copy", async () => {
    mocks.discountConfig.current = { openai: 0.05 };
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "提供商折扣");
    await user.click(await screen.findByRole("button", { name: "+ 添加提供商折扣" }));

    const dialog = await screen.findByRole("dialog", { name: "添加提供商折扣" });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByText("选择提供商并设置其折扣百分比。请输入 0% 到 100% 之间的值（例如 5 表示 5% 折扣）。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add Provider Discount" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select a provider and set its discount percentage. Enter a value between 0% and 100% (e.g., 5 for a 5% discount).",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese add-margin dialog copy", async () => {
    mocks.marginConfig.current = { openai: 0.1 };
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "费用/价格加价");
    await user.click(await screen.findByRole("button", { name: "+ 添加提供商加价" }));

    expect(screen.queryByRole("button", { name: "+ Add Provider Margin" })).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog", { name: "添加提供商加价" })).toBeInTheDocument();
    expect(
      screen.getByText("选择提供商（或选择「全局」应用于所有提供商）并配置加价。可以使用基于百分比或固定金额。"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add Provider Margin" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Select a provider (or "Global" for all providers) and configure the margin. You can use percentage-based or fixed amount.',
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese discount removal confirmation and actions", async () => {
    mocks.discountConfig.current = { openai: 0.05 };
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "提供商折扣");
    await user.click(await screen.findByRole("button", { name: "stub-remove-discount" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("移除提供商折扣");
    expect(dialog).toHaveTextContent("确定要移除 OpenAI 的折扣吗？");
    expect(dialog).not.toHaveTextContent("Remove Provider Discount");
    expect(dialog).not.toHaveTextContent("Are you sure you want to remove the discount for OpenAI?");
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("renders the Chinese margin removal confirmation with its own noun and title", async () => {
    mocks.marginConfig.current = { global: 0.05 };
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "费用/价格加价");
    await user.click(await screen.findByRole("button", { name: "stub-remove-margin" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("移除提供商加价");
    expect(dialog).toHaveTextContent("确定要移除 Global 的加价吗？");
    expect(dialog).not.toHaveTextContent("Remove Provider Margin");
    expect(dialog).not.toHaveTextContent("Are you sure you want to remove the margin for Global?");
  });

  it("renders the Chinese removing label while the removal is in flight", async () => {
    mocks.discountConfig.current = { openai: 0.05 };
    mocks.removeDiscount.mockReturnValue(new Promise<void>(() => {}));

    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await expand(user, "提供商折扣");
    await user.click(await screen.findByRole("button", { name: "stub-remove-discount" }));
    await user.click(await screen.findByRole("button", { name: "移除" }));

    expect(await screen.findByRole("button", { name: "正在移除…" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Removing…" })).not.toBeInTheDocument();
  });
});
