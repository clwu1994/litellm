import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import ProjectDropdown from "./ProjectDropdown";

describe("ProjectDropdown Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese search placeholder and hides the English original", () => {
    renderWithProviders(<ProjectDropdown projects={[]} />);

    expect(screen.getByPlaceholderText("搜索或选择项目")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or select a project")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectDropdown projects={[]} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到项目")).toBeInTheDocument();
    expect(screen.queryByText("No projects found")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectDropdown projects={[]} loading />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("正在加载项目…")).toBeInTheDocument();
    expect(screen.queryByText("Loading projects…")).not.toBeInTheDocument();
  });
});
