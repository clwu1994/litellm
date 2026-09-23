import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import HowItWorks from "./how_it_works";

vi.mock("@/components/CodeBlock", () => ({
  default: ({ code }: { code: string }) => <pre data-testid="code-block">{code}</pre>,
}));

describe("HowItWorks Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese calculation, example, range and validation copy", () => {
    renderWithProviders(<HowItWorks />);

    expect(screen.getByText("成本计算")).toBeInTheDocument();
    expect(screen.getByText(/折扣会应用到提供商成本：/)).toBeInTheDocument();
    expect(screen.getByText("示例")).toBeInTheDocument();
    expect(screen.getByText("对 $10.00 的请求打 5% 折扣的结果为：$10.00 × (1 - 0.05) = $9.50")).toBeInTheDocument();
    expect(screen.getByText("有效范围")).toBeInTheDocument();
    expect(screen.getByText("折扣百分比必须在 0% 到 100% 之间")).toBeInTheDocument();
    expect(screen.getByText("验证折扣")).toBeInTheDocument();
    expect(screen.getByText("发起一个测试请求并检查响应头，以验证折扣是否已应用：")).toBeInTheDocument();
    expect(screen.getByText("请在响应中查找以下响应头：")).toBeInTheDocument();

    expect(screen.queryByText("Cost Calculation")).not.toBeInTheDocument();
    expect(screen.queryByText(/Discounts are applied to provider costs:/)).not.toBeInTheDocument();
    expect(screen.queryByText("Example")).not.toBeInTheDocument();
    expect(
      screen.queryByText("A 5% discount on a $10.00 request results in: $10.00 × (1 - 0.05) = $9.50"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Valid Range")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount percentages must be between 0% and 100%")).not.toBeInTheDocument();
    expect(screen.queryByText("Validating Discounts")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Make a test request and check the response headers to verify discounts are applied:"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Look for these headers in the response:")).not.toBeInTheDocument();
  });

  it("renders the Chinese response header descriptions", () => {
    renderWithProviders(<HowItWorks />);

    expect(screen.getByText("折扣后的最终成本")).toBeInTheDocument();
    expect(screen.getByText("折扣前的原始成本")).toBeInTheDocument();
    expect(screen.getByText("折扣金额")).toBeInTheDocument();
    expect(screen.queryByText("Final cost after discount")).not.toBeInTheDocument();
    expect(screen.queryByText("Original cost before discount")).not.toBeInTheDocument();
    expect(screen.queryByText("Amount discounted")).not.toBeInTheDocument();
  });

  it("renders the Chinese calculator labels", () => {
    renderWithProviders(<HowItWorks />);

    expect(screen.getByText("折扣计算器")).toBeInTheDocument();
    expect(screen.getByText("输入响应头中的值以验证折扣：")).toBeInTheDocument();
    expect(screen.getByText("响应成本（x-litellm-response-cost）")).toBeInTheDocument();
    expect(screen.getByText("折扣金额（x-litellm-response-cost-discount-amount）")).toBeInTheDocument();
    expect(screen.queryByText("Discount Calculator")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Enter values from your response headers to verify the discount:"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Response Cost (x-litellm-response-cost)")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount Amount (x-litellm-response-cost-discount-amount)")).not.toBeInTheDocument();
  });

  it("renders the Chinese calculated results and hides the English originals", async () => {
    renderWithProviders(<HowItWorks />);

    fireEvent.change(screen.getByPlaceholderText("0.0171938125"), { target: { value: "0.0171938125" } });
    fireEvent.change(screen.getByPlaceholderText("0.0009049375"), { target: { value: "0.0009049375" } });

    expect(await screen.findByText("计算结果")).toBeInTheDocument();
    expect(screen.getByText("原始成本：")).toBeInTheDocument();
    expect(screen.getByText("最终成本：")).toBeInTheDocument();
    expect(screen.getByText("折扣金额：")).toBeInTheDocument();
    expect(screen.getByText("已应用折扣：")).toBeInTheDocument();
    expect(screen.queryByText("Calculated Results")).not.toBeInTheDocument();
    expect(screen.queryByText("Original Cost:")).not.toBeInTheDocument();
    expect(screen.queryByText("Final Cost:")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount Amount:")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount Applied:")).not.toBeInTheDocument();
  });
});
