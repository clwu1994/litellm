import React from "react";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { renderWithProviders } from "@/../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGuardrailProviderSpecificParams } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import GuardrailProviderFields from "./guardrail_provider_fields";
import { populateGuardrailProviderMap } from "./guardrail_info_helpers";
import type { GuardrailFormValues } from "./GuardrailFormField";

vi.mock("@/lib/toast", () => ({ toast: { error: vi.fn() } }));

vi.mock("@/components/networking", () => ({ getGuardrailProviderSpecificParams: vi.fn() }));

const mockGetProviderParams = vi.mocked(getGuardrailProviderSpecificParams);

const HIDE_SECRETS_PARAMS = {
  "hide-secrets": {
    ui_friendly_name: "Hide Secrets",
    detect_secrets_config: {
      param: "detect_secrets_config",
      description: "Optional detect-secrets configuration",
      required: false,
      type: "object",
    },
  },
};

const Harness: React.FC<{ onValid: (values: GuardrailFormValues) => void }> = ({ onValid }) => {
  const form = useForm<GuardrailFormValues>();
  return (
    <form onSubmit={form.handleSubmit(onValid)}>
      <GuardrailProviderFields
        selectedProvider="Hide-secrets"
        control={form.control}
        providerParams={HIDE_SECRETS_PARAMS}
      />
      <button type="submit">save</button>
    </form>
  );
};

const renderHarness = () => {
  populateGuardrailProviderMap(HIDE_SECRETS_PARAMS);
  const onValid = vi.fn();
  renderWithProviders(<Harness onValid={onValid} />);
  const textarea = screen.getByLabelText(/detect_secrets_config/) as HTMLTextAreaElement;
  return { onValid, textarea };
};

describe("GuardrailProviderFields object field", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("commits a valid JSON object as a parsed dict", async () => {
    const { onValid, textarea } = renderHarness();

    fireEvent.change(textarea, { target: { value: '{"plugins_used": [{"name": "AWSKeyDetector"}]}' } });
    fireEvent.blur(textarea);
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0][0].detect_secrets_config).toEqual({
      plugins_used: [{ name: "AWSKeyDetector" }],
    });
  });

  it("blocks submission while the field holds malformed JSON", async () => {
    const { onValid, textarea } = renderHarness();

    fireEvent.change(textarea, { target: { value: "{not json" } });
    fireEvent.blur(textarea);
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await screen.findByText("detect_secrets_config must be a valid JSON object");
    expect(onValid).not.toHaveBeenCalled();
    expect(textarea.value).toBe("{not json");
  });

  it.each(['["array"]', '"scalar"', "null", "42"])("blocks non-object JSON %s", async (raw) => {
    const { onValid, textarea } = renderHarness();

    fireEvent.change(textarea, { target: { value: raw } });
    fireEvent.blur(textarea);
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await screen.findByText("detect_secrets_config must be a valid JSON object");
    expect(onValid).not.toHaveBeenCalled();
  });

  it("treats a cleared field as unset and submits", async () => {
    const { onValid, textarea } = renderHarness();

    fireEvent.change(textarea, { target: { value: '{"a": 1}' } });
    fireEvent.blur(textarea);
    fireEvent.change(textarea, { target: { value: "" } });
    fireEvent.blur(textarea);
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0][0].detect_secrets_config).toBeUndefined();
  });
});

type ProviderParamsProp = React.ComponentProps<typeof GuardrailProviderFields>["providerParams"];

const ZhHarness: React.FC<{ params?: ProviderParamsProp; accessToken?: string | null }> = ({ params, accessToken }) => {
  const form = useForm<GuardrailFormValues>();
  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <GuardrailProviderFields
        selectedProvider="Hide-secrets"
        control={form.control}
        providerParams={params}
        accessToken={accessToken}
      />
      <button type="submit">save</button>
    </form>
  );
};

const BOOL_PARAMS: ProviderParamsProp = {
  "hide-secrets": {
    detect_bool: { param: "detect_bool", description: "A boolean flag", required: false, type: "bool" },
  },
};

const REQUIRED_PARAMS: ProviderParamsProp = {
  "hide-secrets": {
    api_key: { param: "api_key", description: "The API key", required: true, type: null },
  },
};

describe("GuardrailProviderFields Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
    mockGetProviderParams.mockResolvedValue({});
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese boolean options and required validation and hides the English ones", async () => {
    const user = userEvent.setup({ delay: null });
    populateGuardrailProviderMap(BOOL_PARAMS);
    const { unmount } = renderWithProviders(<ZhHarness params={BOOL_PARAMS} />);

    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: "是" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "否" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "True" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "False" })).not.toBeInTheDocument();

    unmount();
    populateGuardrailProviderMap(REQUIRED_PARAMS);
    renderWithProviders(<ZhHarness params={REQUIRED_PARAMS} />);
    fireEvent.click(screen.getByRole("button", { name: "save" }));
    expect(await screen.findByText("api_key 为必填项")).toBeInTheDocument();
    expect(screen.queryByText("api_key is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese invalid JSON validation and toast and hides the English ones", async () => {
    const { textarea } = renderHarness();

    fireEvent.change(textarea, { target: { value: "{not json" } });
    fireEvent.blur(textarea);
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("detect_secrets_config 必须是有效的 JSON 对象")).toBeInTheDocument();
    expect(screen.queryByText("detect_secrets_config must be a valid JSON object")).not.toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: '"scalar"' } });
    fireEvent.blur(textarea);
    expect(toast.error).toHaveBeenCalledWith("请输入有效的 JSON 对象作为此配置");
    expect(toast.error).not.toHaveBeenCalledWith("Enter a valid JSON object for this configuration");
  });

  it("renders the Chinese loading, load-failure and empty-provider states", async () => {
    mockGetProviderParams.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderWithProviders(<ZhHarness accessToken="test-token" />);
    expect(await screen.findByText("正在加载提供商参数...")).toBeInTheDocument();
    expect(screen.queryByText("Loading provider parameters...")).not.toBeInTheDocument();

    unmount();
    mockGetProviderParams.mockRejectedValue(new Error("nope"));
    renderWithProviders(<ZhHarness accessToken="test-token" />);
    expect(await screen.findByText("加载提供商参数失败")).toBeInTheDocument();
    expect(screen.queryByText("Failed to load provider parameters")).not.toBeInTheDocument();

    unmount();
    populateGuardrailProviderMap({ "hide-secrets": {} });
    renderWithProviders(<ZhHarness params={{ "hide-secrets": {} }} />);
    expect(screen.getByText("此提供商没有可用的配置字段。")).toBeInTheDocument();
    expect(screen.queryByText("No configuration fields available for this provider.")).not.toBeInTheDocument();
  });
});
