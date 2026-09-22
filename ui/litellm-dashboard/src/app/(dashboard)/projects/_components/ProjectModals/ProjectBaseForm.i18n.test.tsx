import React from "react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { act, cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import { useZodForm } from "@/lib/forms/useZodForm";

import { ProjectBaseForm } from "./ProjectBaseForm";
import { emptyProjectFormValues, projectFormSchema } from "./projectFormSchema";

const mockUseTeams = vi.fn();
vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => mockUseTeams(),
}));

vi.mock("@/components/organisms/create_key_button", () => ({
  fetchTeamModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/networking", () => ({
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
}));

vi.mock("@/components/key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: (model: string) => model,
}));

function FormWrapper() {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const { t } = useTranslation("projects");
  const form = useZodForm(projectFormSchema(t), { defaultValues: emptyProjectFormValues });
  return <ProjectBaseForm form={form} advancedOpen={advancedOpen} onAdvancedOpenChange={setAdvancedOpen} />;
}

const renderForm = async () => {
  const view = renderWithProviders(<FormWrapper />);
  await act(async () => {});
  return view;
};

const openAdvanced = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("高级设置"));
  await screen.findByText("模型特定限制");
};

const pickTeam = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText("团队"));
  await user.click(await screen.findByText("Engineering"));
};

describe("ProjectBaseForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseTeams.mockReturnValue({ data: [], isLoading: false });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese basic-information section with the English originals absent", async () => {
    await renderForm();

    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.queryByText("Basic Information")).not.toBeInTheDocument();
    expect(screen.getByLabelText("项目名称")).toBeInTheDocument();
    expect(screen.queryByLabelText("Project Name")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 客户支持机器人")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g. Customer Support Bot")).not.toBeInTheDocument();
    expect(screen.getByLabelText("团队")).toBeInTheDocument();
    expect(screen.queryByLabelText("Team")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索或选择团队")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or select a team")).not.toBeInTheDocument();
    expect(screen.getByLabelText("描述")).toBeInTheDocument();
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("描述此项目的用途")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Describe the purpose of this project")).not.toBeInTheDocument();
    expect(screen.getByLabelText("允许的模型（范围限定为所选团队的模型）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Allowed Models (scoped to selected team's models)")).not.toBeInTheDocument();
    expect(screen.getByText("先选择团队以查看可用模型")).toBeInTheDocument();
    expect(screen.queryByText("Select a team first to see available models")).not.toBeInTheDocument();
    expect(screen.getByText("请先选择团队")).toBeInTheDocument();
    expect(screen.queryByText("Select a team first")).not.toBeInTheDocument();
    expect(screen.getByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.queryByLabelText("Max Budget (USD)")).not.toBeInTheDocument();
    expect(screen.getByText("高级设置")).toBeInTheDocument();
    expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
  });

  it("renders the Chinese models placeholder and the all-team-models option once a team is chosen", async () => {
    const user = userEvent.setup();
    mockUseTeams.mockReturnValue({
      data: [{ team_id: "team-1", team_alias: "Engineering", models: ["gpt-4"] }],
      isLoading: false,
    });
    await renderForm();

    await pickTeam(user);

    await waitFor(() => {
      expect(screen.getByText("选择模型")).toBeInTheDocument();
    });
    expect(screen.queryByText("Select models")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("允许的模型（范围限定为所选团队的模型）"));

    expect(await screen.findByTitle("所有团队模型")).toBeInTheDocument();
    expect(screen.queryByTitle("All Team Models")).not.toBeInTheDocument();
  });

  it("renders the Chinese advanced-settings chrome with the English originals absent", async () => {
    const user = userEvent.setup();
    await renderForm();

    await openAdvanced(user);

    expect(screen.getByText("模型特定限制")).toBeInTheDocument();
    expect(screen.queryByText("Model-Specific Limits")).not.toBeInTheDocument();
    expect(screen.getByText("封锁项目")).toBeInTheDocument();
    expect(screen.queryByText("Block Project")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("选择现有 Guardrails 或输入新的 Guardrails")).toBeInTheDocument();
    expect(screen.queryByText("Select existing guardrails or enter new ones")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择或输入 Guardrails")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select or enter guardrails")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加模型限制" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Model Limit" })).not.toBeInTheDocument();
  });

  it("renders the Chinese blocked-project warning once the switch is on", async () => {
    const user = userEvent.setup();
    await renderForm();

    await openAdvanced(user);
    await user.click(screen.getByRole("switch"));

    expect(screen.getByText("使用此项目下密钥的所有 API 请求都将被拒绝。")).toBeInTheDocument();
    expect(
      screen.queryByText("All API requests using keys under this project will be rejected."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese model-limit row labels, placeholders and remove control", async () => {
    const user = userEvent.setup();
    await renderForm();

    await openAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加模型限制" }));

    expect(screen.getByLabelText("模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("模型名称（例如 gpt-4）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Model name (e.g. gpt-4)")).not.toBeInTheDocument();
    expect(screen.getByLabelText("TPM 限制")).toBeInTheDocument();
    expect(screen.queryByLabelText("TPM Limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("RPM 限制")).toBeInTheDocument();
    expect(screen.queryByLabelText("RPM Limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("输入 TPM 限制")).toBeInTheDocument();
    expect(screen.queryByLabelText("Input TPM Limit")).not.toBeInTheDocument();
    expect(screen.getByLabelText("输出 TPM 限制")).toBeInTheDocument();
    expect(screen.queryByLabelText("Output TPM Limit")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除模型限制 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove model limit 1" })).not.toBeInTheDocument();
  });

  it("renders the Chinese metadata row labels, placeholders and remove control", async () => {
    const user = userEvent.setup();
    await renderForm();

    await openAdvanced(user);
    await user.click(screen.getByRole("button", { name: "添加键值对" }));

    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.queryByText("Metadata")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("键")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("值")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Value")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除元数据对 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove metadata pair 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加键值对" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Key-Value Pair" })).not.toBeInTheDocument();
  });
});
