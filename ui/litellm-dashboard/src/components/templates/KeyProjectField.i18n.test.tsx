import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { KeyProjectField } from "./KeyProjectField";

vi.mock("@/app/(dashboard)/hooks/projects/useProjects", () => ({
  useProjects: () => ({ data: [{ project_id: "proj-1", project_alias: "Alpha" }] }),
}));

describe("KeyProjectField Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the label and detach action in Chinese and hides the English originals", () => {
    renderWithProviders(
      <KeyProjectField projectId="proj-1" canDetach pending={false} disabled={false} onToggle={vi.fn()} />,
    );

    expect(screen.getByText("项目")).toBeInTheDocument();
    expect(screen.queryByText("Project")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "从项目分离" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Detach from project" })).not.toBeInTheDocument();
  });

  it("renders the pending note and keep action in Chinese and hides the English originals", () => {
    renderWithProviders(<KeyProjectField projectId="proj-1" canDetach pending disabled={false} onToggle={vi.fn()} />);

    expect(screen.getByText("保存后该项目将被移除。团队、组织和密钥限制保持不变。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "The project will be removed when you save. Team, organization, and key limits will stay the same.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保留项目" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keep project" })).not.toBeInTheDocument();
  });
});
