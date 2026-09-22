import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { Plugin } from "@/components/claude_code_plugins/types";

import SkillHubDashboard from "./SkillHubDashboard";

const skill = (overrides: Partial<Plugin> = {}): Plugin => ({
  id: "skill-1",
  name: "pdf-tools",
  description: "Work with PDF files",
  source: { source: "github", repo: "org/pdf-tools" },
  category: "documents",
  domain: "Productivity",
  enabled: true,
  ...overrides,
});

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("SkillHubDashboard Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the stats, heading and filter copy in Chinese and hides the English originals", () => {
    renderWithProviders(<SkillHubDashboard skills={[skill(), skill({ id: "s2", name: "other" })]} isLoading={false} />);

    expectLocalized("技能总数", "Total Skills");
    expectLocalized("命名空间", "Namespaces");
    expectLocalized("领域", "Domains");
    expectLocalized("所有技能", "All Skills");
    expectLocalized("所有领域", "All Domains");
    expectLocalized("正在显示 2 个技能中的 2 个", "Showing 2 of 2 skills");
    expect(screen.getByPlaceholderText("按名称、命名空间或标签搜索…")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search by name, namespace, or tag…")).not.toBeInTheDocument();
  });

  it("renders the singular skill count in Chinese and hides the English original", () => {
    renderWithProviders(<SkillHubDashboard skills={[skill()]} isLoading={false} />);

    expectLocalized("正在显示 1 个技能中的 1 个", "Showing 1 of 1 skill");
  });

  it("renders the public hub heading in Chinese and hides the English original", () => {
    renderWithProviders(<SkillHubDashboard skills={[skill()]} isLoading={false} publicPage />);

    expectLocalized("所有公开技能", "All Public Skills");
  });

  it("renders the loading message in Chinese and hides the English original", () => {
    renderWithProviders(<SkillHubDashboard skills={[]} isLoading />);

    expectLocalized("正在加载技能…", "Loading skills…");
  });

  it("renders the empty state in Chinese and hides the English originals", () => {
    renderWithProviders(<SkillHubDashboard skills={[]} isLoading={false} />);

    expectLocalized("暂无技能", "No skills yet");
    expectLocalized("在此添加的技能将展示给开发者。", "Skills added here will appear for developers.");
  });

  it("renders the no-match state and the clear-search control in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SkillHubDashboard skills={[skill()]} isLoading={false} />);

    await user.type(screen.getByPlaceholderText("按名称、命名空间或标签搜索…"), "zzzz");

    expectLocalized("没有匹配的技能", "No matching skills");
    expectLocalized("调整搜索或领域筛选以查看更多技能。", "Adjust the search or domain filter to see more skills.");
    expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });
});

describe("SkillHubDashboard English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural skill counts byte-identical", () => {
    renderWithProviders(<SkillHubDashboard skills={[skill()]} isLoading={false} />);
    expect(screen.getByText("Showing 1 of 1 skill")).toBeInTheDocument();
    cleanup();

    renderWithProviders(<SkillHubDashboard skills={[skill(), skill({ id: "s2", name: "other" })]} isLoading={false} />);
    expect(screen.getByText("Showing 2 of 2 skills")).toBeInTheDocument();
  });
});
