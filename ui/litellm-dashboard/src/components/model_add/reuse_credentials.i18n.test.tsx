import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { renderWithProviders } from "@/../tests/test-utils";

import type { CredentialItem } from "../networking";
import ReuseCredentialsModal from "./reuse_credentials";

const EXISTING_CREDENTIAL: CredentialItem = {
  credential_name: "openai-prod",
  credential_values: { api_key: "sk-stored-value", api_base: "https://api.example.com" },
  credential_info: { custom_llm_provider: "openai" },
};

const renderModal = () =>
  renderWithProviders(
    <ReuseCredentialsModal
      isVisible
      onCancel={vi.fn()}
      onAddCredential={vi.fn()}
      existingCredential={EXISTING_CREDENTIAL}
      setIsCredentialModalOpen={vi.fn()}
    />,
  );

describe("ReuseCredentialsModal Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese heading, field copy and submit button", () => {
    renderModal();

    expect(screen.getByRole("heading", { name: "复用凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Reuse Credentials" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("凭证名称：")).toBeInTheDocument();
    expect(screen.queryByLabelText("Credential Name:")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("为这些凭证输入一个易识别的名称")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter a friendly name for these credentials")).not.toBeInTheDocument();
    expect(screen.getByText("需要帮助？")).toBeInTheDocument();
    expect(screen.queryByText("Need Help?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复用凭证" })).toBeInTheDocument();
  });

  it("renders the Chinese per-field placeholder for each stored value", () => {
    renderModal();

    expect(screen.getByPlaceholderText("输入 api_key")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter api_key")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 api_base")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter api_base")).not.toBeInTheDocument();
  });
});
