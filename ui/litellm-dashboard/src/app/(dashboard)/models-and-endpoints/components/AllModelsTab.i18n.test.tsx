import * as useAuthorizedModule from "@/app/(dashboard)/hooks/useAuthorized";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AllModelsTab from "./AllModelsTab";

const mockModelDeleteCall = vi.fn().mockResolvedValue({});
const mockModelPatchUpdateCall = vi.fn().mockResolvedValue({});
vi.mock("@/components/networking", () => ({
  serverRootPath: "/",
  modelDeleteCall: (...args: unknown[]) => mockModelDeleteCall(...args),
  modelPatchUpdateCall: (...args: unknown[]) => mockModelPatchUpdateCall(...args),
}));

vi.mock("@/components/model_dashboard/ModelSettingsModal/ModelSettingsModal", () => ({
  default: () => null,
}));

const mockInvalidateQueries = vi.fn();
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }) };
});

let modelsInfoResult: Record<string, unknown> = {};

vi.mock("../../hooks/models/useModels", () => ({
  useModelsInfo: () => ({ ...modelsInfoResult, refetch: vi.fn() }),
}));

vi.mock("../../hooks/models/useModelCostMap", () => ({
  useModelCostMap: () => ({ data: { "gpt-4": { litellm_provider: "openai" } }, isLoading: false, error: null }),
}));

vi.mock("../../hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [{ team_id: "team-1", team_alias: "Engineering" }], isLoading: false, error: null }),
}));

const BASE_MODEL_INFO = {
  id: "model-1",
  db_model: true,
  created_by: "user-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
  team_id: "team-1",
  access_groups: [],
};

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  model_name: "gpt-4",
  litellm_params: { model: "openai/gpt-4", custom_llm_provider: "openai" },
  ...overrides,
  model_info: { ...BASE_MODEL_INFO, ...((overrides.model_info as Record<string, unknown>) ?? {}) },
});

const setModelsInfo = (rows: Record<string, unknown>[], totalCount = rows.length, isLoading = false) => {
  modelsInfoResult = {
    data: { data: rows, total_count: totalCount, current_page: 1, total_pages: 1, size: 50 },
    isLoading,
    isFetching: false,
    error: null,
  };
};

const MOCK_AUTHORIZED = {
  isLoading: false,
  isAuthorized: true,
  token: "mock-token",
  accessToken: "mock-access-token",
  userId: "user-123",
  userEmail: "test@example.com",
  userRole: "Admin",
  userRoleLabel: "Admin",
  premiumUser: true,
  disabledPersonalKeyCreation: false,
  showSSOBanner: false,
  isViewOnly: false,
};

const defaultProps = {
  selectedModelGroup: "all",
  setSelectedModelGroup: vi.fn(),
  availableModelGroups: ["gpt-4", "gpt-3.5-turbo"],
  availableModelAccessGroups: ["sales-team"],
  setSelectedModelId: vi.fn(),
  setSelectedTeamId: vi.fn(),
};

describe("AllModelsTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setModelsInfo([makeRow()]);
    vi.spyOn(useAuthorizedModule, "default").mockReturnValue(MOCK_AUTHORIZED);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese personal team label in the team selector", () => {
    render(<AllModelsTab {...defaultProps} />);

    expect(screen.getByTestId("models-team-select")).toHaveTextContent("个人");
    expect(screen.queryByText("Personal")).not.toBeInTheDocument();
  });

  it("renders the Chinese personal virtual key hint and its link text", () => {
    render(<AllModelsTab {...defaultProps} />);

    expect(screen.getByText("要访问这些模型，请在创建一个未选择团队的 Virtual Key。")).toBeInTheDocument();
    expect(screen.queryByText(/create a Virtual Key without selecting a team/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Virtual Key 页面" })).toHaveAttribute("href", "/ui/api-keys");
    expect(screen.queryByRole("link", { name: "Virtual Keys page" })).not.toBeInTheDocument();
  });

  it("renders the Chinese team virtual key hint naming the selected team", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(screen.getByTestId("models-team-select"));
    await user.click(await screen.findByRole("option", { name: "Engineering" }));

    expect(
      await screen.findByText("要访问这些模型，请创建一个 Virtual Key，并在将团队选择为“Engineering”。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/select Team as "Engineering"/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Virtual Key 页面" })).toBeInTheDocument();
  });

  it("renders the Chinese delete dialog chrome and resource labels", async () => {
    const user = userEvent.setup();
    setModelsInfo([makeRow({ model_name: "" })]);
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("model-delete-model-1"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("删除模型")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Model")).not.toBeInTheDocument();
    expect(within(dialog).getByText("此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText("This action cannot be undone.")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此模型吗？")).toBeInTheDocument();
    expect(within(dialog).queryByText("Are you sure you want to delete this model?")).not.toBeInTheDocument();
    expect(within(dialog).getByText("模型信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Model Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("模型名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Model Name")).not.toBeInTheDocument();
    expect(within(dialog).getByText("LiteLLM 模型名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("LiteLLM Model Name")).not.toBeInTheDocument();
    expect(within(dialog).getByText("提供方")).toBeInTheDocument();
    expect(within(dialog).queryByText("Provider")).not.toBeInTheDocument();
    expect(within(dialog).getByText("创建者")).toBeInTheDocument();
    expect(within(dialog).queryByText("Created By")).not.toBeInTheDocument();
    expect(within(dialog).getByText("未设置")).toBeInTheDocument();
    expect(within(dialog).queryByText("Not Set")).not.toBeInTheDocument();
  });

  it("reports the Chinese model-deleted toast", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("model-delete-model-1"));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("模型删除成功");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Model deleted successfully");
  });

  it("reports the Chinese model-paused toast", async () => {
    const user = userEvent.setup();
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("model-pause-toggle-model-1"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("模型已暂停");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Model paused");
  });

  it("reports the Chinese model-resumed toast", async () => {
    const user = userEvent.setup();
    setModelsInfo([makeRow({ model_info: { blocked: true } })]);
    render(<AllModelsTab {...defaultProps} />);

    await user.click(await screen.findByTestId("model-pause-toggle-model-1"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("模型已恢复");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Model resumed");
  });
});
