import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import type { TopModelData } from "../types";
import KeyModelUsageView from "./KeyModelUsageView";

const mockTopModels: TopModelData[] = [
  {
    model: "gpt-4",
    spend: 150.5,
    requests: 105,
    successful_requests: 100,
    failed_requests: 5,
    tokens: 50000,
  },
];

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en), `English "${en}" still present for zh "${zh}"`).toHaveLength(0);
};

describe("KeyModelUsageView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese title, view buttons and table headers", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyModelUsageView topModels={mockTopModels} />);

    expectLocalized("模型用量", "Model Usage");
    expectLocalized("表格", "Table");
    expectLocalized("图表", "Chart");
    expectLocalized("模型", "Model");
    expectLocalized("支出（USD）", "Spend (USD)");
    expectLocalized("成功", "Successful");
    expectLocalized("失败", "Failed");
    expectLocalized("Token 数", "Tokens");

    await user.click(screen.getByRole("button", { name: "图表" }));
    await user.click(screen.getByRole("button", { name: "表格" }));
    expect(screen.queryByRole("button", { name: "Table" })).not.toBeInTheDocument();
  });
});
