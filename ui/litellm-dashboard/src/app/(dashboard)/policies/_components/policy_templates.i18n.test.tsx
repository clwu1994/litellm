import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import * as networking from "@/components/networking";

import PolicyTemplates from "./policy_templates";

vi.mock("@/components/networking");

const makeTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: "tpl-1",
  title: "Test Template",
  description: "A test template",
  icon: "ShieldCheckIcon",
  iconColor: "text-success",
  iconBg: "bg-success/10",
  guardrails: ["guardrail-a"],
  tags: [],
  complexity: "Low" as const,
  ...overrides,
});

const defaultProps = {
  onUseTemplate: vi.fn(),
  onOpenAiSuggestion: vi.fn(),
  accessToken: "test-token",
};

describe("PolicyTemplates Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, description and AI suggestion button", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([]);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    expect(await screen.findByText("策略模板")).toBeInTheDocument();
    expect(screen.queryByText("Policy Templates")).not.toBeInTheDocument();
    expect(screen.getByText("从预配置的策略模板开始，快速为你的组织设置 Guardrails。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Start with a pre-configured policy template to quickly set up guardrails for your organization.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 AI 查找模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use AI to find templates" })).not.toBeInTheDocument();
  });

  it("renders the Chinese template card chrome", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([makeTemplate({ inherits: "base-policy" })]);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    expect(await screen.findByText("低复杂度")).toBeInTheDocument();
    expect(screen.queryByText("Low Complexity")).not.toBeInTheDocument();
    expect(screen.getByText("继承自：")).toBeInTheDocument();
    expect(screen.queryByText("Inherits from:")).not.toBeInTheDocument();
    expect(screen.getByText("包含的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Included Guardrails")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用模板" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use Template" })).not.toBeInTheDocument();
  });

  it("renders the Chinese complexity label for every tier", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([
      makeTemplate({ id: "tpl-1", complexity: "Low" }),
      makeTemplate({ id: "tpl-2", complexity: "Medium" }),
      makeTemplate({ id: "tpl-3", complexity: "High" }),
    ]);
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    expect(await screen.findByText("低复杂度")).toBeInTheDocument();
    expect(screen.getByText("中复杂度")).toBeInTheDocument();
    expect(screen.getByText("高复杂度")).toBeInTheDocument();
    expect(screen.queryByText("Low Complexity")).not.toBeInTheDocument();
    expect(screen.queryByText("Medium Complexity")).not.toBeInTheDocument();
    expect(screen.queryByText("High Complexity")).not.toBeInTheDocument();
  });

  it("renders the Chinese category filters and the filtered count", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([
      makeTemplate({ id: "tpl-1", title: "Compliance Template", tags: ["compliance"] }),
      makeTemplate({ id: "tpl-2", title: "Security Template", tags: ["security"] }),
      makeTemplate({ id: "tpl-3", title: "Other Template", tags: ["other"] }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    expect(await screen.findByText("分类")).toBeInTheDocument();
    expect(screen.queryByText("Categories")).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /compliance/i }));

    expect(screen.getByRole("button", { name: "清除全部" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(screen.getByText("显示 3 个模板中的 1 个")).toBeInTheDocument();
    expect(screen.queryByText("Showing 1 of 3 templates")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-match state and clear-all-filters action", async () => {
    vi.mocked(networking.getPolicyTemplates).mockResolvedValue([
      makeTemplate({ id: "tpl-1", title: "Compliance Template", tags: ["compliance"] }),
      makeTemplate({ id: "tpl-2", title: "Security Template", tags: ["security"] }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    await screen.findByText("Compliance Template");
    await user.click(screen.getByRole("checkbox", { name: /compliance/i }));
    await user.click(screen.getByRole("checkbox", { name: /security/i }));

    expect(screen.getByText("没有模板符合所选筛选条件。")).toBeInTheDocument();
    expect(screen.queryByText("No templates match the selected filters.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清除所有筛选条件" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all filters" })).not.toBeInTheDocument();
  });

  it("shows the Chinese toast when templates fail to load", async () => {
    vi.mocked(networking.getPolicyTemplates).mockRejectedValue(new Error("boom"));
    renderWithProviders(<PolicyTemplates {...defaultProps} />);

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("获取策略模板失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to fetch policy templates");
    expect(await screen.findByText("策略模板")).toBeInTheDocument();
  });
});
