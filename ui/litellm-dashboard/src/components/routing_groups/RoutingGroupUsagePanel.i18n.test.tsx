import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { RoutingGroupUsagePanel } from "./RoutingGroupUsagePanel";
import type { RoutingGroup } from "./types";

const group: RoutingGroup = {
  group_name: "gpt-4o-group",
  models: ["gpt-4o", "gpt-4o-mini"],
  routing_strategy: "simple-shuffle",
};

describe("RoutingGroupUsagePanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese snippet language tabs and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RoutingGroupUsagePanel group={group} baseUrl="http://localhost:4000" />);

    expect(await screen.findByRole("tab", { name: "Python（OpenAI SDK）" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Python (OpenAI SDK)" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "JavaScript（OpenAI SDK）" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "JavaScript (OpenAI SDK)" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "JavaScript（OpenAI SDK）" }));
    expect(screen.getByRole("tab", { name: "JavaScript（OpenAI SDK）" })).toBeInTheDocument();
  });
});
