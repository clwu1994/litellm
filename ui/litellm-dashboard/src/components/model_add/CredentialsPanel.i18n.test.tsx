import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { CredentialItem } from "@/components/networking";

import CredentialsPanel from "./CredentialsPanel";

const mockUseAuthorized = vi.fn();
const mockUseCredentials = vi.fn();

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => mockUseAuthorized() }));
vi.mock("@/app/(dashboard)/hooks/credentials/useCredentials", () => ({
  useCredentials: () => mockUseCredentials(),
}));
vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return {
    ...actual,
    credentialCreateCall: vi.fn(),
    credentialUpdateCall: vi.fn(),
    credentialDeleteCall: vi.fn(),
  };
});
vi.mock("./CredentialModal", () => ({ default: () => null }));

const credentials: CredentialItem[] = [
  { credential_name: "openai-key", credential_values: {}, credential_info: { custom_llm_provider: "openai" } },
];

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CredentialsPanel />
    </QueryClientProvider>,
  );

describe("CredentialsPanel Chinese copy", () => {
  beforeEach(async () => {
    mockUseAuthorized.mockReturnValue({ accessToken: "token", userRole: "Admin" });
    mockUseCredentials.mockReturnValue({ data: { credentials }, isLoading: false, refetch: vi.fn() });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese description and add button", () => {
    renderPanel();

    expect(screen.getByText("为不同 AI 提供商配置的凭证。添加并管理你的 API 凭证。")).toBeInTheDocument();
    expect(
      screen.queryByText("Configured credentials for different AI providers. Add and manage your API credentials."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加凭证" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Credential" })).not.toBeInTheDocument();
  });

  it("renders the Chinese delete dialog inside the open state", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByLabelText("打开凭证操作"));
    await user.click(await screen.findByTestId("credential-action-delete"));

    expect(await screen.findByText("删除凭证？")).toBeInTheDocument();
    expect(screen.queryByText("Delete Credential?")).not.toBeInTheDocument();
    expect(screen.getByText("确定要删除此凭证吗？此操作无法撤销，并可能破坏现有的集成。")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Are you sure you want to delete this credential? This action cannot be undone and may break existing integrations.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("凭证信息")).toBeInTheDocument();
    expect(screen.queryByText("Credential Information")).not.toBeInTheDocument();
  });
});
