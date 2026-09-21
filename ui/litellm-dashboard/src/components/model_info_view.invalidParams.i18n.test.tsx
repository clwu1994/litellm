import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

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
vi.mock("./ModelInfoEditForm", () => ({
  default: ({
    onSubmit,
  }: {
    onSubmit: (values: Record<string, unknown>, isTouched: (field: string) => boolean) => void;
  }) => (
    <button type="button" onClick={() => onSubmit({ litellm_extra_params: "{ not json" }, () => false)}>
      submit-invalid-params
    </button>
  ),
}));
vi.mock("./networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./networking")>();
  return {
    ...actual,
    modelInfoV1Call: vi.fn(),
    credentialGetCall: vi.fn(),
    credentialListCall: vi.fn(),
    getGuardrailsList: vi.fn(),
    tagListCall: vi.fn(),
    vectorStoreListCall: vi.fn(),
  };
});

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
  litellm_params: { model: "gpt-4", custom_llm_provider: "openai" },
  model_info: { id: "123", db_model: true, input_cost_per_token: 0.00003, output_cost_per_token: 0.00006 },
};

const PROPS = {
  modelId: "123",
  onClose: vi.fn(),
  accessToken: "test-token",
  userID: "123",
  userRole: "Admin",
  isViewOnly: false,
  onModelUpdate: vi.fn(),
  modelAccessGroups: [],
};

describe("ModelInfoView invalid LiteLLM params toast", () => {
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
    vi.mocked(networking.credentialGetCall).mockResolvedValue({
      credential_name: "selected-credential",
      credential_values: {},
      credential_info: {},
    } as never);
    vi.mocked(networking.credentialListCall).mockResolvedValue({ credentials: [] } as never);
    vi.mocked(networking.getGuardrailsList).mockResolvedValue({ guardrails: [] } as never);
    vi.mocked(networking.tagListCall).mockResolvedValue({} as never);
    vi.mocked(networking.vectorStoreListCall).mockResolvedValue({ data: [] } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("reports the Chinese invalid LiteLLM params toast from the save handler", async () => {
    const user = userEvent.setup();
    render(<ModelInfoView {...PROPS} />, { wrapper });

    await user.click(await screen.findByRole("button", { name: "submit-invalid-params" }));

    await waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("LiteLLM 参数中的 JSON 无效"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON in LiteLLM Params");
  });
});
