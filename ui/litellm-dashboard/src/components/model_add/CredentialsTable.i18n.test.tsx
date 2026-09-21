import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import { CredentialItem } from "@/components/networking";

import CredentialsTable from "./CredentialsTable";

vi.mock("@/components/provider_info_helpers", () => ({
  getProviderLogoAndName: (provider: string) => ({ displayName: provider, logo: "" }),
}));

const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn().mockResolvedValue(true) }));
vi.mock("@/utils/dataUtils", () => ({ copyToClipboard: mockCopyToClipboard }));

const credentials: CredentialItem[] = [
  { credential_name: "openai-key", credential_values: {}, credential_info: { custom_llm_provider: "openai" } },
];

describe("CredentialsTable Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  it("renders the Chinese column headers and actions aria label", () => {
    render(<CredentialsTable credentials={credentials} canModifyCredentials onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("凭证名称")).toBeInTheDocument();
    expect(screen.queryByText("Credential Name")).not.toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.getByLabelText("打开凭证操作")).toBeInTheDocument();
    expect(screen.queryByLabelText("Open credential actions")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message", () => {
    render(
      <CredentialsTable credentials={credentials} canModifyCredentials onEdit={vi.fn()} onDelete={vi.fn()} isLoading />,
    );

    expect(screen.getByText("正在加载凭证…")).toBeInTheDocument();
    expect(screen.queryByText("Loading credentials…")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state", () => {
    render(<CredentialsTable credentials={[]} canModifyCredentials onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText("尚未配置凭证")).toBeInTheDocument();
    expect(screen.queryByText("No credentials configured")).not.toBeInTheDocument();
    expect(screen.getByText("添加凭证以连接 AI 提供商。")).toBeInTheDocument();
    expect(screen.queryByText("Add a credential to connect an AI provider.")).not.toBeInTheDocument();
  });

  it("renders the Chinese copy action and reports the Chinese copied toast", async () => {
    const user = userEvent.setup();
    render(<CredentialsTable credentials={credentials} canModifyCredentials onEdit={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByLabelText("打开凭证操作"));
    const copyItem = await screen.findByTestId("credential-action-copy");

    expect(copyItem).toHaveTextContent("复制凭证名称");
    expect(screen.queryByText("Copy credential name")).not.toBeInTheDocument();

    await user.click(copyItem);

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalledWith("openai-key", "凭证名称已复制"));
    expect(mockCopyToClipboard).not.toHaveBeenCalledWith("openai-key", "Credential name copied");
  });
});
