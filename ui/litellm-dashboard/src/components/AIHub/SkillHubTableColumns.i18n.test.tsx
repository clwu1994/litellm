import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "@/lib/toast";
import { Plugin } from "@/components/claude_code_plugins/types";

import { getSkillHubTableColumns } from "./SkillHubTableColumns";

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

const renderTable = (data: Plugin[]) => {
  const t = i18n.getFixedT(i18n.language, "modelHub");
  render(
    <DataTable
      data={data}
      columns={getSkillHubTableColumns({ onSkillClick: vi.fn(), t })}
      getRowId={(row, index) => row.id || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("SkillHubTableColumns Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.mocked(toast.success).mockClear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every column header in Chinese and hides the English originals", () => {
    renderTable([skill()]);

    expectLocalized("技能名称", "Skill Name");
    expectLocalized("描述", "Description");
    expectLocalized("分类", "Category");
    expectLocalized("领域", "Domain");
    expectLocalized("来源", "Source");
    expectLocalized("状态", "Status");
    expectLocalized("操作", "Actions");
  });

  it("renders the public and draft status badges in Chinese and hides the English originals", () => {
    renderTable([skill(), skill({ id: "skill-2", name: "draft-skill", enabled: false })]);

    expectLocalized("公开", "Public");
    expectLocalized("草稿", "Draft");
  });

  it("keeps skill names, categories, domains and source links in English", () => {
    renderTable([skill()]);

    expect(screen.getByText("pdf-tools")).toBeInTheDocument();
    expect(screen.getByText("documents")).toBeInTheDocument();
    expect(screen.getByText("Productivity")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /org\/pdf-tools/ })).toBeInTheDocument();
  });

  it("renders the row actions menu in Chinese and hides the English originals", async () => {
    const user = userEvent.setup();
    renderTable([skill()]);

    await user.click(screen.getByLabelText("打开技能操作"));

    expect(await screen.findByText("查看详情")).toBeInTheDocument();
    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(screen.getByText("复制技能名称")).toBeInTheDocument();
    expect(screen.queryByText("Copy skill name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Open skill actions")).not.toBeInTheDocument();
  });

  it("reports the copy confirmation in Chinese and not in English", async () => {
    const user = userEvent.setup();
    renderTable([skill()]);

    await user.click(screen.getByLabelText("打开技能操作"));
    await user.click(await screen.findByTestId("skill-hub-action-copy"));

    expect(toast.success).toHaveBeenCalledWith("已复制技能名称");
    expect(toast.success).not.toHaveBeenCalledWith("Skill name copied");
  });
});
