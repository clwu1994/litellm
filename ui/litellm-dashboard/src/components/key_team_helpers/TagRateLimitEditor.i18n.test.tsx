import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { TagRateLimitEditor } from "./TagRateLimitEditor";

describe("TagRateLimitEditor Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the row accessible names and placeholders in Chinese and hides the English originals", () => {
    renderWithProviders(<TagRateLimitEditor value={[{ id: "1", tag: "cell-1", rpm_limit: 10 }]} onChange={vi.fn()} />);

    expect(screen.getByLabelText("标签")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tag")).not.toBeInTheDocument();
    expect(screen.getByLabelText("RPM 上限")).toBeInTheDocument();
    expect(screen.queryByLabelText("RPM limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("移除标签限制")).toBeInTheDocument();
    expect(screen.queryByLabelText("Remove tag limit")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("标签（例如 cell-1）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Tag (e.g. cell-1)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("RPM")).toBeInTheDocument();
  });

  it("renders the add-row action in Chinese and hides the English original", () => {
    renderWithProviders(<TagRateLimitEditor value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "+ 添加标签限制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Tag Limit" })).not.toBeInTheDocument();
  });
});
