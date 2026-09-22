import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import EmptyState from "./EmptyState";

describe("EmptyState Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese variable guidance and hides the English original", () => {
    renderWithProviders(<EmptyState hasVariables />);

    expect(screen.getByText("请先填写上方变量，然后输入消息开始测试")).toBeInTheDocument();
    expect(
      screen.queryByText("Fill in the variables above, then type a message to start testing"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese empty guidance and hides the English original", () => {
    renderWithProviders(<EmptyState hasVariables={false} />);

    expect(screen.getByText("在下方输入消息以开始测试你的提示词")).toBeInTheDocument();
    expect(screen.queryByText("Type a message below to start testing your prompt")).not.toBeInTheDocument();
  });
});
