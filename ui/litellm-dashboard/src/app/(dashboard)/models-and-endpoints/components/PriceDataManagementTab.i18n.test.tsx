/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import PriceDataManagementTab from "./PriceDataManagementTab";

vi.mock("@/components/price_data_reload", () => ({
  default: ({ buttonText }: { buttonText?: string }) => <button type="button">{buttonText}</button>,
}));
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => ({ accessToken: "sk-test" }) }));
vi.mock("@/app/(dashboard)/hooks/models/useModelCostMap", () => ({
  useModelCostMap: () => ({ refetch: vi.fn() }),
}));

describe("PriceDataManagementTab Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading, description and reload button label", () => {
    render(<PriceDataManagementTab />);

    expect(screen.getByRole("heading", { name: "价格数据管理" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Price Data Management" })).not.toBeInTheDocument();
    expect(screen.getByText("管理模型价格数据并配置自动重载计划")).toBeInTheDocument();
    expect(
      screen.queryByText("Manage model pricing data and configure automatic reload schedules"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重载价格数据" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reload Price Data" })).not.toBeInTheDocument();
  });
});
