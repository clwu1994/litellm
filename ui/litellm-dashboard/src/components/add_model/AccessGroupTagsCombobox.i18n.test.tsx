import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import AccessGroupTagsCombobox from "./AccessGroupTagsCombobox";

describe("AccessGroupTagsCombobox Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder", () => {
    render(
      <AccessGroupTagsCombobox
        id="model_access_group"
        value={[]}
        onChange={vi.fn()}
        options={[]}
        ariaInvalid={undefined}
        ariaDescribedBy={undefined}
      />,
    );

    expect(screen.getByPlaceholderText("选择现有组，或输入以创建新组")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select existing groups or type to create new ones")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state inside the open listbox", async () => {
    const user = userEvent.setup();
    render(
      <AccessGroupTagsCombobox
        id="model_access_group"
        value={[]}
        onChange={vi.fn()}
        options={[]}
        ariaInvalid={undefined}
        ariaDescribedBy={undefined}
      />,
    );

    await user.click(screen.getByPlaceholderText("选择现有组，或输入以创建新组"));

    expect(await screen.findByText("未找到访问组")).toBeInTheDocument();
    expect(screen.queryByText("No access groups found")).not.toBeInTheDocument();
  });
});
