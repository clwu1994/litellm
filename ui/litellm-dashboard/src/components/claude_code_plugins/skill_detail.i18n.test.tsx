import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import SkillDetail from "./skill_detail";
import type { Plugin } from "./types";

const skill: Plugin = {
  id: "skill-1",
  name: "my-skill",
  version: "1.2.3",
  description: "A skill",
  source: { source: "github", repo: "org/repo" },
  author: { name: "Ada" },
  keywords: ["docs"],
  category: "docs",
  domain: "engineering",
  namespace: "core",
  enabled: true,
  created_at: "2026-01-02T00:00:00Z",
};

describe("SkillDetail Chinese copy", () => {
  beforeEach(async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the overview tab in Chinese", () => {
    renderWithProviders(<SkillDetail skill={skill} onBack={vi.fn()} />);

    expect(screen.getByText("技能")).toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.getByText("概览")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.getByText("使用方法")).toBeInTheDocument();
    expect(screen.queryByText("How to Use")).not.toBeInTheDocument();
    expect(screen.getByText("技能详情")).toBeInTheDocument();
    expect(screen.queryByText("Skill Details")).not.toBeInTheDocument();
    expect(screen.getByText("注册到此技能的元数据")).toBeInTheDocument();
    expect(screen.queryByText("Metadata registered with this skill")).not.toBeInTheDocument();
    expect(screen.getByText("属性")).toBeInTheDocument();
    expect(screen.queryByText("Property")).not.toBeInTheDocument();

    expect(screen.getByText("分类")).toBeInTheDocument();
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.getByText("领域")).toBeInTheDocument();
    expect(screen.queryByText("Domain")).not.toBeInTheDocument();
    expect(screen.getByText("命名空间")).toBeInTheDocument();
    expect(screen.queryByText("Namespace")).not.toBeInTheDocument();
    expect(screen.getByText("版本")).toBeInTheDocument();
    expect(screen.queryByText("Version")).not.toBeInTheDocument();
    expect(screen.getByText("作者")).toBeInTheDocument();
    expect(screen.queryByText("Author")).not.toBeInTheDocument();
    expect(screen.getByText("添加时间")).toBeInTheDocument();
    expect(screen.queryByText("Added")).not.toBeInTheDocument();

    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.getByText("公开")).toBeInTheDocument();
    expect(screen.queryByText("Public")).not.toBeInTheDocument();
    expect(screen.getByText("来源")).toBeInTheDocument();
    expect(screen.queryByText("Source")).not.toBeInTheDocument();
    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.getByText("技能 ID")).toBeInTheDocument();
    expect(screen.queryByText("Skill ID")).not.toBeInTheDocument();
  });

  it("renders the draft status in Chinese", () => {
    renderWithProviders(<SkillDetail skill={{ ...skill, enabled: false }} onBack={vi.fn()} />);

    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("renders the usage tab in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SkillDetail skill={skill} onBack={vi.fn()} />);

    await user.click(screen.getByText("使用方法"));

    expect(screen.getByText("使用此技能")).toBeInTheDocument();
    expect(screen.queryByText("Using this skill")).not.toBeInTheDocument();
    expect(
      screen.getByText("将代理设置为 marketplace 后，在 Claude Code 中用一条命令启用此技能："),
    ).toBeInTheDocument();
    expect(screen.getAllByText("在 Claude Code 中运行").length).toBeGreaterThan(0);
    expect(screen.queryByText("Run in Claude Code")).not.toBeInTheDocument();
    expect(screen.getByText('如果看到 "Plugin my-skill not found in marketplace"，请先更新目录：')).toBeInTheDocument();
    expect(screen.getByText("还没有配置 marketplace？")).toBeInTheDocument();
    expect(screen.queryByText("Don't have the marketplace configured yet?")).not.toBeInTheDocument();
    expect(screen.getByText("查看一次性设置 →")).toBeInTheDocument();

    const copyButtons = screen.getAllByRole("button", { name: "复制" });
    expect(copyButtons.length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Copy" })).toHaveLength(0);

    await user.click(copyButtons[0]);

    expect(screen.getByRole("button", { name: "已复制" })).toBeInTheDocument();
  });

  it("renders the setup tab in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SkillDetail skill={skill} onBack={vi.fn()} />);

    await user.click(screen.getByText("使用方法"));
    await user.click(screen.getByText("查看一次性设置 →"));

    expect(screen.getByText("一次性 marketplace 设置")).toBeInTheDocument();
    expect(screen.queryByText("One-time marketplace setup")).not.toBeInTheDocument();
    expect(screen.getByText("在 Claude Code 中运行此命令以注册 marketplace：")).toBeInTheDocument();
    expect(screen.queryByText("Run this command in Claude Code to register the marketplace:")).not.toBeInTheDocument();

    const paragraph = screen.getByText(/或将此项添加到/);
    expect(paragraph).toHaveTextContent("或将此项添加到 ~/.claude/settings.json 以实现持久配置：");
    expect(paragraph).not.toHaveTextContent("for a persistent configuration");
  });
});
