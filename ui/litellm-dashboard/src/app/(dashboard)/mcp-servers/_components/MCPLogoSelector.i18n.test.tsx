import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import MCPLogoSelector from "./MCPLogoSelector";

describe("MCPLogoSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese field label and custom URL placeholder and hides the English originals", () => {
    renderWithProviders(<MCPLogoSelector />);

    expect(screen.getByText("标志")).toBeInTheDocument();
    expect(screen.queryByText("Logo")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("或粘贴自定义标志 URL…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Or paste a custom logo URL...")).not.toBeInTheDocument();
  });

  it("renders the Chinese logo tooltip in the same open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MCPLogoSelector />);

    await user.hover(screen.getByLabelText("关于标志"));

    expect(screen.queryByLabelText("About the logo")).not.toBeInTheDocument();
    expect(
      await screen.findByText("选择一个常见标志，或粘贴任意图片的 URL。该标志会显示在管理页面和聊天页面。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Select a well-known logo or paste a URL to any image. The logo is shown on the admin and chat pages.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese selected-logo alt text and hides the English original", () => {
    renderWithProviders(<MCPLogoSelector value="/ui/assets/logos/github.svg" />);

    expect(screen.getByAltText("已选择 logo")).toBeInTheDocument();
    expect(screen.queryByAltText("Selected logo")).not.toBeInTheDocument();
  });
});
