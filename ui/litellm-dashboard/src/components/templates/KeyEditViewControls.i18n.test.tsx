import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import { KeyAgentAndSkillFields, KeyTypeSelect } from "./KeyEditViewControls";
import { KeyEditFormValues } from "./keyEditFormValues";

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render }: { render?: ReactElement }) => <span data-testid="tooltip-trigger">{render}</span>,
  TooltipContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock("../agent_management/AgentSelector", () => ({
  default: ({ placeholder }: { placeholder?: string }) => <div data-testid="agent-selector">{placeholder}</div>,
}));

vi.mock("../skills/SkillSelector", () => ({
  default: () => <div data-testid="skill-selector" />,
}));

const AgentSkillHarness = () => {
  const { control } = useForm<KeyEditFormValues>();
  return <KeyAgentAndSkillFields control={control} accessToken="token" />;
};

describe("KeyTypeSelect Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the selected label in Chinese and hides the English original", () => {
    renderWithProviders(<KeyTypeSelect id="key-type" value="default" onChange={vi.fn()} />);

    expect(screen.getByText("完全访问")).toBeInTheDocument();
    expect(screen.queryByText("Full Access")).not.toBeInTheDocument();
  });

  it("renders every key type label and hint in Chinese in the open state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyTypeSelect id="key-type" value="default" onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("可以调用所有路由（AI API、管理路由和只读路由）")).toBeInTheDocument();
    expect(screen.queryByText("Can call all routes (AI APIs, Management, and read-only)")).not.toBeInTheDocument();
    expect(screen.getByText("AI API")).toBeInTheDocument();
    expect(screen.getByText("只能调用 AI API 路由（chat/completions、embeddings 等）")).toBeInTheDocument();
    expect(
      screen.queryByText("Can call only AI API routes (chat/completions, embeddings, etc.)"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("管理")).toBeInTheDocument();
    expect(screen.getByText("只能调用管理路由（用户/团队/密钥管理）")).toBeInTheDocument();
    expect(screen.queryByText("Can call only management routes (user/team/key management)")).not.toBeInTheDocument();
  });

  it("renders the placeholder in Chinese and hides the English original", () => {
    renderWithProviders(<KeyTypeSelect id="key-type" value="" onChange={vi.fn()} />);

    expect(screen.getByText("选择密钥类型")).toBeInTheDocument();
    expect(screen.queryByText("Select key type")).not.toBeInTheDocument();
  });
});

describe("KeyAgentAndSkillFields Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the field labels, skill hint and placeholder in Chinese and hides the English originals", () => {
    renderWithProviders(<AgentSkillHarness />);

    expect(screen.getByText("Agents / 访问组")).toBeInTheDocument();
    expect(screen.queryByText("Agents / Access Groups")).not.toBeInTheDocument();
    expect(screen.getByText("技能")).toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.getByText("选择 agents 或访问组（可选）")).toBeInTheDocument();
    expect(screen.queryByText("Select agents or access groups (optional)")).not.toBeInTheDocument();
  });

  it("renders the skills hint tooltip in Chinese in the open state", () => {
    renderWithProviders(<AgentSkillHarness />);

    expect(screen.getAllByTestId("tooltip-trigger").length).toBeGreaterThan(0);
    expect(
      screen.getByText("已启用的技能对所有密钥可见。在此为该密钥授予已禁用的（私有）Claude Code 插件。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here.",
      ),
    ).not.toBeInTheDocument();
  });
});
