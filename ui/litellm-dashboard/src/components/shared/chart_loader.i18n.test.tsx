import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { ChartLoader } from "./chart_loader";

describe("ChartLoader Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading copy and hides the English originals", () => {
    renderWithProviders(<ChartLoader />);

    expect(screen.getByText("正在加载图表数据...")).toBeInTheDocument();
    expect(screen.getByText("正在获取数据")).toBeInTheDocument();
    expect(screen.queryByText("Loading chart data...")).not.toBeInTheDocument();
    expect(screen.queryByText("Fetching your data")).not.toBeInTheDocument();
  });

  it("renders the Chinese date-selection copy and hides the English originals", () => {
    renderWithProviders(<ChartLoader isDateChanging />);

    expect(screen.getByText("正在处理日期选择...")).toBeInTheDocument();
    expect(screen.getByText("请稍候")).toBeInTheDocument();
    expect(screen.queryByText("Processing date selection...")).not.toBeInTheDocument();
    expect(screen.queryByText("This will only take a moment")).not.toBeInTheDocument();
  });
});
