import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import { CredentialItem } from "@/components/networking";

import CredentialsPanel from "./CredentialsPanel";

const mockUseAuthorized = vi.fn();
const mockUseCredentials = vi.fn();

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: () => mockUseAuthorized() }));
vi.mock("@/app/(dashboard)/hooks/credentials/useCredentials", () => ({
  useCredentials: () => mockUseCredentials(),
}));
vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn(), fromError: vi.fn(), dismiss: vi.fn() },
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
vi.mock("./CredentialModal", () => ({
  default: ({ mode, onSubmit }: { mode: "add" | "edit"; onSubmit: (values: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onSubmit({ credential_name: `cred-${mode}`, custom_llm_provider: "openai" })}>
      {mode}-submit
    </button>
  ),
}));

const credentials: CredentialItem[] = [
  { credential_name: "openai-key", credential_values: {}, credential_info: { custom_llm_provider: "openai" } },
];

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CredentialsPanel />
    </QueryClientProvider>,
  );

const openRowAction = async (user: ReturnType<typeof userEvent.setup>, testId: string) => {
  await user.click(screen.getByLabelText("打开凭证操作"));
  await user.click(await screen.findByTestId(testId));
};

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

    await openRowAction(user, "credential-action-delete");

    const dialog = await screen.findByRole("dialog");
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
    expect(within(dialog).getByText("凭证名称")).toBeInTheDocument();
    expect(within(dialog).queryByText("Credential Name")).not.toBeInTheDocument();
    expect(within(dialog).getByText("提供商")).toBeInTheDocument();
    expect(within(dialog).queryByText("Provider")).not.toBeInTheDocument();
  });

  it("reports the Chinese add toasts on success and failure", async () => {
    const user = userEvent.setup();
    const networking = await import("@/components/networking");
    vi.mocked(networking.credentialCreateCall).mockResolvedValue({} as never);
    renderPanel();

    await user.click(screen.getByRole("button", { name: "添加凭证" }));
    await user.click(screen.getByRole("button", { name: "add-submit" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("凭证添加成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Credential added successfully");

    cleanup();
    vi.mocked(networking.credentialCreateCall).mockRejectedValue(new Error("nope"));
    renderPanel();

    await user.click(screen.getByRole("button", { name: "添加凭证" }));
    await user.click(screen.getByRole("button", { name: "add-submit" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("添加凭证失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to add credential");
  });

  it("reports the Chinese update toasts on success and failure", async () => {
    const user = userEvent.setup();
    const networking = await import("@/components/networking");
    vi.mocked(networking.credentialUpdateCall).mockResolvedValue({} as never);
    renderPanel();

    await openRowAction(user, "credential-action-edit");
    await user.click(screen.getByRole("button", { name: "edit-submit" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("凭证更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Credential updated successfully");

    cleanup();
    vi.mocked(networking.credentialUpdateCall).mockRejectedValue(new Error("nope"));
    renderPanel();

    await openRowAction(user, "credential-action-edit");
    await user.click(screen.getByRole("button", { name: "edit-submit" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("更新凭证失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to update credential");
  });

  it("reports the Chinese delete toasts on success and failure", async () => {
    const user = userEvent.setup();
    const networking = await import("@/components/networking");
    vi.mocked(networking.credentialDeleteCall).mockResolvedValue({} as never);
    renderPanel();

    await openRowAction(user, "credential-action-delete");
    await user.type(await screen.findByPlaceholderText("openai-key"), "openai-key");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("凭证删除成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Credential deleted successfully");

    cleanup();
    vi.mocked(networking.credentialDeleteCall).mockRejectedValue(new Error("nope"));
    renderPanel();

    await openRowAction(user, "credential-action-delete");
    await user.type(await screen.findByPlaceholderText("openai-key"), "openai-key");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("删除凭证失败"));
    expect(toast.error).not.toHaveBeenCalledWith("Failed to delete credential");
  });
});
