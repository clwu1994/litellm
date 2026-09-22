import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { Plugin } from "@/components/claude_code_plugins/types";

import MakeSkillPublicForm from "./MakeSkillPublicForm";

vi.mock("../networking", () => ({
  enableClaudeCodePlugin: vi.fn(),
  disableClaudeCodePlugin: vi.fn(),
}));

import { enableClaudeCodePlugin } from "../networking";

const skill = (overrides: Partial<Plugin> = {}): Plugin => ({
  id: "skill-1",
  name: "pdf-tools",
  description: "Work with PDF files",
  source: { source: "github", repo: "org/pdf-tools" },
  domain: "Productivity",
  enabled: false,
  ...overrides,
});

const baseProps = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "test-token",
  onSuccess: vi.fn(),
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

const findParagraph = (text: string): HTMLElement =>
  screen.getByText((_, el) => el?.tagName === "P" && normalize(el.textContent ?? "") === normalize(text));

const hasParagraph = (pattern: RegExp): boolean =>
  screen.queryAllByText((_, el) => el?.tagName === "P" && pattern.test(el.textContent ?? "")).length > 0;

describe("MakeSkillPublicForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the step one copy in Chinese and hides the English originals", () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill(), skill({ id: "s2", name: "other" })]} />);

    expectLocalized("发布到 Skill Hub", "Publish to Skill Hub");
    expectLocalized("选择要发布的技能", "Select Skills to Publish");
    expectLocalized("选择技能", "Select Skills");
    expectLocalized("确认", "Confirm");
    expectLocalized(
      "选中的技能将对 Skill Hub 中的所有用户可见。取消选中的技能将被取消发布。",
      "Selected skills will be visible to all users in the Skill Hub. Deselected skills will be unpublished.",
    );
    expect(screen.getByRole("checkbox", { name: "全选 (2)" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select All (2)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[]} />);

    expectLocalized("尚未注册任何技能。", "No skills registered yet.");
    expect(screen.getByRole("checkbox", { name: "全选 (0)" })).toBeInTheDocument();
  });

  it("renders the public skill badge in Chinese and hides the English original", () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ enabled: true })]} />);

    expectLocalized("公开", "Public");
  });

  it("renders the singular published count in Chinese with the full rendered string", () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ enabled: true })]} />);

    expect(findParagraph("1 个技能将被发布")).toBeInTheDocument();
    expect(hasParagraph(/1 skill will be published/)).toBe(false);
  });

  it("renders the confirm step in Chinese and hides the English originals", async () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ enabled: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expectLocalized("确认发布到 Skill Hub", "Confirm Publish to Skill Hub");
    expectLocalized("注意：", "Note:");
    expectLocalized(
      "已发布的技能将对 Skill Hub 标签页中的所有用户可见。不在下方列表中的技能将被取消发布。",
      "Published skills will be visible to all users in the Skill Hub tab. Skills not in the list below will be unpublished.",
    );
    expectLocalized("要发布的技能：", "Skills to be published:");
    expectLocalized("发布到 Hub", "Publish to Hub");
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(findParagraph("总计： 1 个技能将被发布")).toBeInTheDocument();
    expect(hasParagraph(/skill will be published/)).toBe(false);
  });

  it("renders the plural published count in Chinese and hides the English original", async () => {
    render(
      <MakeSkillPublicForm
        {...baseProps}
        skillsList={[skill({ enabled: true }), skill({ id: "s2", name: "other", enabled: true })]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    expect(findParagraph("总计： 2 个技能将被发布")).toBeInTheDocument();
    expect(hasParagraph(/skills will be published/)).toBe(false);
  });

  it("reports the success toast in Chinese and not in English", async () => {
    vi.mocked(enableClaudeCodePlugin).mockResolvedValue(undefined as never);
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill()]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "pdf-tools" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "发布到 Hub" }));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Skill Hub 已更新 — 已发布 1 个技能");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Skill Hub updated — 1 skill(s) published");
  });

  it("reports the failure toast in Chinese and not in English", async () => {
    vi.mocked(enableClaudeCodePlugin).mockRejectedValue(new Error("boom"));
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill()]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "pdf-tools" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "发布到 Hub" }));
    });

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("更新技能失败。请重试。");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update skills. Please try again.");
  });

  it("reports the empty-selection guard in Chinese and not in English", async () => {
    const { rerender } = render(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ enabled: true })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    rerender(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ id: "s2", name: "other" })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "发布到 Hub" }));
    });

    expect(toast.fromError).toHaveBeenCalledWith("请至少选择一个技能");
    expect(toast.fromError).not.toHaveBeenCalledWith("Please select at least one skill");
  });
});

describe("MakeSkillPublicForm English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural published counts byte-identical", () => {
    render(<MakeSkillPublicForm {...baseProps} skillsList={[skill({ enabled: true })]} />);
    expect(findParagraph("1 skill will be published")).toBeInTheDocument();
    cleanup();

    render(
      <MakeSkillPublicForm
        {...baseProps}
        skillsList={[skill({ enabled: true }), skill({ id: "s2", name: "other", enabled: true })]}
      />,
    );
    expect(findParagraph("2 skills will be published")).toBeInTheDocument();
  });
});
