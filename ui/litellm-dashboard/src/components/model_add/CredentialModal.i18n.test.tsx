import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { findTooltipTrigger } from "@/../tests/i18nTooltip";

import CredentialModal from "./CredentialModal";

const EXISTING_CREDENTIAL = {
  credential_name: "openai-key",
  credential_values: { api_key: "sk-existing" },
  credential_info: { custom_llm_provider: "openai" },
};

vi.mock("../networking", async () => {
  const actual = await vi.importActual("../networking");
  return {
    ...actual,
    getProviderCreateMetadata: vi.fn().mockResolvedValue([
      {
        provider: "OpenAI",
        provider_display_name: "OpenAI",
        litellm_provider: "openai",
        default_model_placeholder: "gpt-3.5-turbo",
        credential_fields: [{ key: "api_key", label: "OpenAI API Key", field_type: "password", required: true }],
      },
    ]),
  };
});

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderModal = (props: Partial<React.ComponentProps<typeof CredentialModal>> = {}) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CredentialModal open mode="add" onCancel={vi.fn()} onSubmit={vi.fn()} {...props} />
    </QueryClientProvider>,
  );

describe("CredentialModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese add title and submit button", () => {
    renderModal();

    expect(screen.getByText("添加新凭证")).toBeInTheDocument();
    expect(screen.queryByText("Add New Credential")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Credential" })).not.toBeInTheDocument();
  });

  it("renders the Chinese field labels, placeholders and help copy", () => {
    renderModal();

    expect(screen.getByLabelText("凭证名称：")).toBeInTheDocument();
    expect(screen.queryByLabelText("Credential Name:")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("为这些凭证输入一个易识别的名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择提供商")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a provider")).not.toBeInTheDocument();
    expect(screen.getByText("需要帮助？")).toBeInTheDocument();
    expect(screen.getByText("提供商：")).toBeInTheDocument();
    expect(screen.queryByText("Provider:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("renders the Chinese required-field validation message", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "添加凭证" }));

    expect(await screen.findByText("必须填写凭证名称")).toBeInTheDocument();
    expect(screen.queryByText("Credential name is required")).not.toBeInTheDocument();
  });

  it("renders the Chinese provider required validation message", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "添加凭证" }));

    expect(await screen.findByText("必填")).toBeInTheDocument();
  });

  it("renders the Chinese edit title and submit button", () => {
    renderModal({ mode: "edit", existingCredential: EXISTING_CREDENTIAL });

    expect(screen.getByText("编辑凭证")).toBeInTheDocument();
    expect(screen.queryByText("Edit Credential")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Credential" })).not.toBeInTheDocument();
  });

  it("renders the Chinese provider hint inside the open tooltip", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.hover(findTooltipTrigger(screen.getByText("提供商：")));

    expect(await screen.findByText("用于自动填充提供商特定字段的辅助信息")).toBeInTheDocument();
    expect(screen.queryByText("Helper to auto-populate provider specific fields")).not.toBeInTheDocument();
  });

  it("renders the Chinese help tooltip inside the open state", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.hover(screen.getByText("需要帮助？"));

    expect(await screen.findByText("在我们的 GitHub 上获取帮助")).toBeInTheDocument();
    expect(screen.queryByText("Get help on our github")).not.toBeInTheDocument();
  });
});
