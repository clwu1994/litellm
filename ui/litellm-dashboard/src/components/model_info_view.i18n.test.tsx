import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { findTooltipTriggerBeside } from "@/../tests/i18nTooltip";

import ModelInfoView from "./model_info_view";
import * as networking from "./networking";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../tests/mocks/complexityScorerDefaults"),
);
vi.mock("../../utils/dataUtils", () => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
}));
vi.mock("./networking", () => ({
  modelInfoV1Call: vi.fn(),
  credentialGetCall: vi.fn(),
  credentialListCall: vi.fn(),
  getGuardrailsList: vi.fn(),
  tagListCall: vi.fn(),
  testConnectionRequest: vi.fn(),
  testModelGroupConnection: vi.fn(),
  modelPatchUpdateCall: vi.fn(),
  modelDeleteCall: vi.fn(),
  credentialCreateCall: vi.fn(),
  vectorStoreListCall: vi.fn(),
}));

const mockUseModelsInfo = vi.fn();
const mockUseModelHub = vi.fn();
vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useModelsInfo: (...args: unknown[]) => mockUseModelsInfo(...args),
  useModelHub: (...args: unknown[]) => mockUseModelHub(...args),
}));
const mockUseModelCostMap = vi.fn();
vi.mock("@/app/(dashboard)/hooks/models/useModelCostMap", () => ({
  useModelCostMap: (...args: unknown[]) => mockUseModelCostMap(...args),
}));
const mockUsePtuCostAttributionEnabled = vi.fn();
vi.mock("@/app/(dashboard)/hooks/uiSettings/usePtuCostAttributionEnabled", () => ({
  usePtuCostAttributionEnabled: () => mockUsePtuCostAttributionEnabled(),
}));

const BASE_MODEL_INFO = {
  id: "123",
  created_by: "123",
  created_at: "2024-01-01T00:00:00Z",
  db_model: true,
  input_cost_per_token: 0.00003,
  output_cost_per_token: 0.00006,
};

const BASE_LITELLM_PARAMS = {
  model: "gpt-4",
  api_base: "https://api.openai.com/v1",
  custom_llm_provider: "openai",
  litellm_credential_name: "selected-credential",
};

const modelData = {
  model_name: "GPT-4",
  litellm_params: BASE_LITELLM_PARAMS,
  model_info: BASE_MODEL_INFO,
};

const noCredentialModelData = {
  ...modelData,
  litellm_params: { ...BASE_LITELLM_PARAMS, litellm_credential_name: undefined },
};

const autoRouterModelData = {
  model_name: "tri-tier-router",
  litellm_params: {
    model: "auto_router/complexity_router",
    complexity_router_config: { tiers: { SIMPLE: ["gpt-4o-mini"] } },
  },
  model_info: { ...BASE_MODEL_INFO, id: "auto-1" },
};

const emptyTiersModelData = {
  ...autoRouterModelData,
  litellm_params: {
    model: "auto_router/complexity_router",
    complexity_router_config: { tiers: {} },
  },
};

const PROPS = {
  modelId: "123",
  onClose: vi.fn(),
  accessToken: "test-token",
  userID: "123",
  userRole: "Admin",
  isViewOnly: false,
  onModelUpdate: vi.fn(),
  modelAccessGroups: ["group1"],
};

const useModel = (data: unknown) => {
  mockUseModelsInfo.mockReturnValue({ data: { data: [data] }, isLoading: false, error: null });
};

describe("ModelInfoView Chinese copy", () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  const renderView = async (props: Partial<typeof PROPS> = {}) => {
    await act(async () => {
      render(<ModelInfoView {...PROPS} {...props} />, { wrapper });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  beforeEach(async () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    mockUsePtuCostAttributionEnabled.mockReturnValue(false);
    useModel(modelData);
    mockUseModelHub.mockReturnValue({ data: { data: [] }, isLoading: false, error: null });
    mockUseModelCostMap.mockReturnValue({ data: {}, isLoading: false, error: null });
    vi.mocked(networking.modelInfoV1Call).mockResolvedValue({ data: [modelData] } as never);
    vi.mocked(networking.credentialGetCall).mockResolvedValue({
      credential_name: "selected-credential",
      credential_values: {},
      credential_info: {},
    } as never);
    vi.mocked(networking.credentialListCall).mockResolvedValue({
      credentials: [{ credential_name: "selected-credential", credential_values: {}, credential_info: {} }],
    } as never);
    vi.mocked(networking.getGuardrailsList).mockResolvedValue({ guardrails: [] } as never);
    vi.mocked(networking.tagListCall).mockResolvedValue({} as never);
    vi.mocked(networking.vectorStoreListCall).mockResolvedValue({ data: [] } as never);
    vi.mocked(networking.modelPatchUpdateCall).mockResolvedValue({} as never);
    vi.mocked(networking.modelDeleteCall).mockResolvedValue({} as never);
    vi.mocked(networking.credentialCreateCall).mockResolvedValue({} as never);
    vi.mocked(networking.testConnectionRequest).mockResolvedValue({ status: "success" } as never);
    vi.mocked(networking.testModelGroupConnection).mockResolvedValue({ status: "success" } as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.restoreAllMocks();
  });

  it("renders the Chinese loading state", async () => {
    mockUseModelsInfo.mockReturnValue({ data: null, isLoading: true, error: null });
    await renderView();

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回模型" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Models" })).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found state", async () => {
    mockUseModelsInfo.mockReturnValue({ data: { data: [] }, isLoading: false, error: null });
    await renderView();

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("Model not found")).not.toBeInTheDocument();
  });

  it("renders the Chinese header and tab labels", async () => {
    await renderView();

    expect(await screen.findByText("公开模型名称：GPT-4")).toBeInTheDocument();
    expect(screen.queryByText(/Public Model Name:/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("复制模型 ID")).toBeInTheDocument();
    expect(screen.queryByLabelText("Copy model ID")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "原始 JSON" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Raw JSON" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Test Connection" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新 API Key" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复用凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Re-use Credentials" })).not.toBeInTheDocument();
  });

  it("renders the Chinese overview cards", async () => {
    await renderView();

    await screen.findByText("公开模型名称：GPT-4");
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 模型")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Model")).not.toBeInTheDocument();
    expect(screen.getByText("定价")).toBeInTheDocument();
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
    expect(screen.getByText("输入：$30.00/1M tokens")).toBeInTheDocument();
    expect(screen.queryByText("Input: $30.00/1M tokens")).not.toBeInTheDocument();
    expect(screen.getByText("输出：$60.00/1M tokens")).toBeInTheDocument();
    expect(screen.queryByText("Output: $60.00/1M tokens")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间 Jan 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("创建者 123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();
  });

  it("renders the Chinese existing-credential dialog inside the open state", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(await screen.findByTestId("reuse-credentials-button"));

    expect(await screen.findByText("使用现有凭证")).toBeInTheDocument();
    expect(screen.queryByText("Using Existing Credential")).not.toBeInTheDocument();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("reports the Chinese storing and stored toasts for a reused credential", async () => {
    const user = userEvent.setup();
    useModel(noCredentialModelData);
    await renderView();

    await user.click(await screen.findByTestId("reuse-credentials-button"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "复用凭证" }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("正在存储凭证.."));
    expect(toast.info).not.toHaveBeenCalledWith("Storing credential..");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("凭证存储成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Credential stored successfully");
  });

  it("reports the Chinese testing and success connection toasts", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(await screen.findByTestId("test-connection-button"));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith("正在测试连接..."));
    expect(toast.info).not.toHaveBeenCalledWith("Testing connection...");
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("连接测试成功！"));
    expect(toast.success).not.toHaveBeenCalledWith("Connection test successful!");
  });

  it("reports the Chinese connection failure toast with the Chinese unknown-error fallback", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.testConnectionRequest).mockResolvedValue({ status: "failure", result: {} } as never);
    await renderView();

    await user.click(await screen.findByTestId("test-connection-button"));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("测试连接时出错：未知错误"));
    expect(toast.error).not.toHaveBeenCalledWith("Error testing connection: Unknown error");
  });

  it("reports the Chinese no-tiers toast for a complexity router with empty tiers", async () => {
    const user = userEvent.setup();
    useModel(emptyTiersModelData);
    await renderView();

    await user.click(await screen.findByTestId("test-connection-button"));

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith("尚未配置复杂度层级，因此没有可测试的内容。"));
    expect(toast.warning).not.toHaveBeenCalledWith(
      "No complexity tiers are configured yet, so there is nothing to test.",
    );
  });

  it("renders the Chinese connection-test dialog title for a complexity router", async () => {
    const user = userEvent.setup();
    useModel(autoRouterModelData);
    await renderView();

    await user.click(await screen.findByTestId("test-connection-button"));

    expect(await screen.findByText("连接测试结果")).toBeInTheDocument();
    expect(screen.queryByText("Connection Test Results")).not.toBeInTheDocument();

    const dialog = await screen.findByRole("dialog");
    // eslint-disable-next-line testing-library/no-node-access -- the footer has no role, so data-slot pins the dialog-owned close instead of the shared sr-only close
    const footer = dialog.querySelector('[data-slot="dialog-footer"]');
    expect(footer).not.toBeNull();
    expect(within(footer as HTMLElement).getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });

  it("renders the Chinese Edit Auto Router action for an auto-router model", async () => {
    useModel(autoRouterModelData);
    await renderView();

    expect(await screen.findByRole("button", { name: "编辑自动路由" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Auto Router" })).not.toBeInTheDocument();
  });

  it("renders the Chinese model delete dialog and reports the Chinese delete failure", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.modelDeleteCall).mockRejectedValue(new Error("boom"));
    await renderView();

    await user.click(await screen.findByTestId("delete-model-button"));

    expect(await screen.findByText("确定要删除此模型吗？")).toBeInTheDocument();
    expect(screen.queryByText("Are you sure you want to delete this model?")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("删除模型时出错：", expect.anything()));
    expect(toast.fromError).toHaveBeenCalledWith("删除模型失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to delete model");
  });

  it("renders the Chinese auto-router delete dialog and label", async () => {
    const user = userEvent.setup();
    useModel(autoRouterModelData);
    await renderView();

    await user.click(await screen.findByTestId("delete-model-button"));

    expect(await screen.findByText("确定要删除此自动路由吗？")).toBeInTheDocument();
    expect(screen.queryByText("Are you sure you want to delete this auto-router?")).not.toBeInTheDocument();

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("删除自动路由")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Auto-Router")).not.toBeInTheDocument();
  });

  it("renders the Chinese edit-disabled tooltip inside the open state", async () => {
    const user = userEvent.setup();
    await renderView({ isViewOnly: true });

    await user.hover(findTooltipTriggerBeside(await screen.findByText("模型设置")));

    expect(await screen.findByText("只有数据库中的模型可以编辑。你必须是管理员或该模型的创建者。")).toBeInTheDocument();
    expect(
      screen.queryByText("Only DB models can be edited. You must be an admin or the creator of the model to edit it."),
    ).not.toBeInTheDocument();
  });

  it("reports the Chinese settings-updated toast on a successful save", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(await screen.findByRole("button", { name: "编辑设置" }));
    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("模型设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Model settings updated successfully");
  });

  it("reports the Chinese settings failure toast and logs the Chinese update failure", async () => {
    const user = userEvent.setup();
    vi.mocked(networking.modelPatchUpdateCall).mockRejectedValue(new Error("boom"));
    await renderView();

    await user.click(await screen.findByRole("button", { name: "编辑设置" }));
    await user.click(await screen.findByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("更新模型时出错：", expect.anything()));
    expect(toast.fromError).toHaveBeenCalledWith("更新模型设置失败");
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to update model settings");
  });

  it("reports the Chinese invalid Model Info toast", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(await screen.findByRole("button", { name: "编辑设置" }));
    fireEvent.change(screen.getByPlaceholderText(/gpt-4/), { target: { value: "{ not json" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("模型信息中的 JSON 无效"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON in Model Info");
  });

  it("logs the Chinese guardrails, tags and credentials fetch failures", async () => {
    vi.mocked(networking.getGuardrailsList).mockRejectedValue(new Error("boom"));
    vi.mocked(networking.tagListCall).mockRejectedValue(new Error("boom"));
    vi.mocked(networking.credentialListCall).mockRejectedValue(new Error("boom"));
    await renderView();

    await waitFor(() => expect(console.error).toHaveBeenCalledWith("获取 Guardrails 失败：", expect.anything()));
    await waitFor(() => expect(console.error).toHaveBeenCalledWith("获取标签失败：", expect.anything()));
    await waitFor(() => expect(console.error).toHaveBeenCalledWith("获取凭证失败：", expect.anything()));
  });
});
