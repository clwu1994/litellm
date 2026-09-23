import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { getClaudeCodePluginsList } from "../networking";
import SkillSelector from "./SkillSelector";

vi.mock("../networking", () => ({ getClaudeCodePluginsList: vi.fn() }));

const mockPlugins = vi.mocked(getClaudeCodePluginsList);

describe("SkillSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English original", () => {
    renderWithProviders(<SkillSelector accessToken="" onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择技能（可选）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select skills (optional)")).not.toBeInTheDocument();
  });

  it("renders the Chinese clear-all control and hides the English original", () => {
    renderWithProviders(<SkillSelector accessToken="" value={["public-skill"]} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "清除所有技能" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all skills" })).not.toBeInTheDocument();
  });

  it("renders the Chinese private marker and accessible name and hides the English originals", async () => {
    mockPlugins.mockResolvedValue({ plugins: [{ name: "private-skill", enabled: false }], count: 1 });
    const user = userEvent.setup();
    renderWithProviders(<SkillSelector accessToken="token" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "private-skill（私有）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "private-skill (private)" })).not.toBeInTheDocument();
    expect(screen.getByText("私有")).toBeInTheDocument();
    expect(screen.queryByText("private")).not.toBeInTheDocument();
  });
});
