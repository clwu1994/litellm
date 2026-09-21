import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import React, { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import ModelInfoView from "./model_info_view";
import * as networking from "./networking";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../tests/mocks/complexityScorerDefaults"),
);
vi.mock("../../utils/dataUtils", () => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }));
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

const modelData = {
  model_name: "GPT-4",
  litellm_params: {
    model: "gpt-4",
    api_base: "https://api.openai.com/v1",
    custom_llm_provider: "openai",
    litellm_credential_name: "selected-credential",
  },
  model_info: {
    id: "123",
    created_by: "123",
    created_at: "2024-01-01T00:00:00Z",
    db_model: true,
    input_cost_per_token: 0.00003,
    output_cost_per_token: 0.00006,
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

describe("ModelInfoView Chinese copy", () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(async () => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
    mockUsePtuCostAttributionEnabled.mockReturnValue(false);
    mockUseModelsInfo.mockReturnValue({ data: { data: [modelData] }, isLoading: false, error: null });
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
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese loading state", () => {
    mockUseModelsInfo.mockReturnValue({ data: null, isLoading: true, error: null });
    render(<ModelInfoView {...PROPS} />, { wrapper });

    expect(screen.getByText("加载中...")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回模型" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Models" })).not.toBeInTheDocument();
  });

  it("renders the Chinese not-found state", async () => {
    mockUseModelsInfo.mockReturnValue({ data: { data: [] }, isLoading: false, error: null });
    render(<ModelInfoView {...PROPS} />, { wrapper });

    expect(await screen.findByText("未找到模型")).toBeInTheDocument();
    expect(screen.queryByText("Model not found")).not.toBeInTheDocument();
  });

  it("renders the Chinese header and tab labels", async () => {
    render(<ModelInfoView {...PROPS} />, { wrapper });

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
    render(<ModelInfoView {...PROPS} />, { wrapper });

    await screen.findByText("公开模型名称：GPT-4");
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("LiteLLM 模型")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM Model")).not.toBeInTheDocument();
    expect(screen.getByText("定价")).toBeInTheDocument();
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
    expect(screen.getByText("创建时间 Jan 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("创建者 123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Settings" })).not.toBeInTheDocument();
  });
});
