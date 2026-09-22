import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { AgentMultiSelect, AgentTagsInput } from "./AgentFormKit";

describe("AgentFormKit Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese empty-options copy for the tags input and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AgentTagsInput id="tags" value={[]} onValueChange={vi.fn()} placeholder="Add a tag" options={[]} />,
    );

    await user.click(screen.getByPlaceholderText("Add a tag"));

    expect(await screen.findByText("没有匹配的选项")).toBeInTheDocument();
    expect(screen.queryByText("No matching options")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty-options copy for the multi-select and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AgentMultiSelect id="agents" value={[]} onValueChange={vi.fn()} placeholder="Add an agent" options={[]} />,
    );

    await user.click(screen.getByPlaceholderText("Add an agent"));

    expect(await screen.findByText("没有匹配的选项")).toBeInTheDocument();
    expect(screen.queryByText("No matching options")).not.toBeInTheDocument();
  });
});
