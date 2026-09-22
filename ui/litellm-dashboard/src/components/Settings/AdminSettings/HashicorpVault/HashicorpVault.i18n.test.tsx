import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testHashicorpVaultConnection } from "@/app/(dashboard)/hooks/configOverrides/hashicorpVaultApi";
import { useDeleteHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteHashicorpVaultConfig";
import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import HashicorpVault from "./HashicorpVault";
import EditHashicorpVaultModal from "./EditHashicorpVaultModal";

vi.mock("@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig", () => ({
  useHashicorpVaultConfig: vi.fn(),
}));
vi.mock("@/app/(dashboard)/hooks/configOverrides/useDeleteHashicorpVaultConfig", () => ({
  useDeleteHashicorpVaultConfig: vi.fn(),
}));
vi.mock("@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig", () => ({
  useUpdateHashicorpVaultConfig: vi.fn(),
}));
vi.mock("@/app/(dashboard)/hooks/configOverrides/hashicorpVaultApi", () => ({
  testHashicorpVaultConnection: vi.fn(),
}));

const VAULT_FIELDS = [
  "vault_addr",
  "vault_namespace",
  "vault_mount_name",
  "vault_path_prefix",
  "vault_token",
  "approle_role_id",
  "approle_secret_id",
  "approle_mount_path",
  "client_cert",
  "client_key",
  "vault_cert_role",
] as const;

const ALL_VALUES = {
  vault_addr: "https://vault.example.com",
  vault_namespace: "ns",
  vault_mount_name: "kv",
  vault_path_prefix: "prefix",
  vault_token: "secret-token",
  approle_role_id: "role",
  approle_secret_id: "secret-id",
  approle_mount_path: "approle",
  client_cert: "cert",
  client_key: "key",
  vault_cert_role: "cert-role",
};

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const settle = ({
  values = {},
  isLoading = false,
  isError = false,
  deleteMutate = vi.fn(),
  updateMutate = vi.fn(),
}: {
  values?: Record<string, unknown>;
  isLoading?: boolean;
  isError?: boolean;
  deleteMutate?: ReturnType<typeof vi.fn>;
  updateMutate?: ReturnType<typeof vi.fn>;
} = {}) => {
  vi.mocked(useHashicorpVaultConfig).mockReturnValue({
    data: {
      values,
      field_schema: { properties: Object.fromEntries(VAULT_FIELDS.map((name) => [name, {}])) },
    },
    isLoading,
    isError,
    error: isError ? new Error("boom") : null,
  } as unknown as ReturnType<typeof useHashicorpVaultConfig>);
  vi.mocked(useDeleteHashicorpVaultConfig).mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteHashicorpVaultConfig>);
  vi.mocked(useUpdateHashicorpVaultConfig).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateHashicorpVaultConfig>);
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("HashicorpVault Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    settle();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the empty placeholder in Chinese and hides the English originals", () => {
    renderWithProviders(<HashicorpVault />);

    expectLocalized("未找到 Vault 配置", "No Vault Configuration Found");
    expectLocalized(
      "配置 Hashicorp Vault，为你的 LiteLLM 部署安全管理提供商 API Key 和密钥。",
      "Configure Hashicorp Vault to securely manage provider API keys and secrets for your LiteLLM deployment.",
    );
    expectLocalized("配置 Vault", "Configure Vault");
  });

  it("renders the loading state in Chinese and hides the English original", () => {
    settle({ isLoading: true });
    renderWithProviders(<HashicorpVault />);

    expect(screen.getByRole("status", { name: "正在加载 Hashicorp Vault 配置" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading Hashicorp Vault configuration" })).not.toBeInTheDocument();
  });

  it("renders the load error in Chinese and hides the English original", () => {
    settle({ isError: true });
    renderWithProviders(<HashicorpVault />);

    expectLocalized("无法加载 Hashicorp Vault 配置", "Could not load Hashicorp Vault configuration");
  });

  it("renders the configured card, field labels and auth method in Chinese", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<HashicorpVault />);

    expectLocalized("管理密钥管理器配置", "Manage secret manager configuration");
    expectLocalized("测试连接", "Test Connection");
    expectLocalized("编辑配置", "Edit Configuration");
    expectLocalized("删除配置", "Delete Configuration");
    expectLocalized('密钥必须以字段名 "key" 存储', 'Secrets must be stored with the field name "key"');
    expectLocalized("查看文档", "View documentation");
    expectLocalized("认证方式", "Auth Method");
    expectLocalized("Vault 地址", "Vault Address");
    expectLocalized("命名空间", "Namespace");
    expectLocalized("KV 挂载名称", "KV Mount Name");
    expectLocalized("路径前缀", "Path Prefix");
    expectLocalized("挂载路径", "Mount Path");
    expectLocalized("客户端证书", "Client Certificate");
    expectLocalized("客户端密钥", "Client Key");
    expectLocalized("证书角色", "Certificate Role");

    for (const value of ["AppRole", "Token", "Role ID", "Secret ID"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  it("renders the token auth method and its clear action in Chinese and hides the English original", () => {
    settle({ values: { vault_addr: "https://vault.example.com", vault_token: "secret-token" } });
    renderWithProviders(<HashicorpVault />);

    expect(screen.getAllByText("Token").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "清除Token" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Token" })).not.toBeInTheDocument();
  });

  it("renders the TLS certificate and no-auth auth methods in Chinese", () => {
    settle({ values: { vault_addr: "https://vault.example.com", client_cert: "cert", client_key: "key" } });
    const tls = renderWithProviders(<HashicorpVault />);
    expectLocalized("TLS 证书", "TLS Certificate");
    tls.unmount();

    settle({ values: { vault_addr: "https://vault.example.com" } });
    renderWithProviders(<HashicorpVault />);
    expectLocalized("无", "None");
  });

  it("renders the clear-field confirmation in Chinese in the same open state", async () => {
    const updateMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, updateMutate });
    renderWithProviders(<HashicorpVault />);

    await user().click(screen.getByRole("button", { name: "清除Token" }));

    expectLocalized("清除Token？", "Clear Token?");
    expectLocalized("这将删除已存储的值。", "This will remove the stored value.");
    expectLocalized("字段", "Field");

    await user().click(screen.getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith("Token 已清除");
    expect(toast.success).not.toHaveBeenCalledWith("Token cleared");
  });

  it("renders the delete confirmation in Chinese in the same open state", async () => {
    const deleteMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, deleteMutate });
    renderWithProviders(<HashicorpVault />);

    await user().click(screen.getByRole("button", { name: "删除配置" }));

    expectLocalized("删除 Hashicorp Vault 配置？", "Delete Hashicorp Vault Configuration?");
    expectLocalized(
      "使用 Vault 密钥的模型在新配置保存前将无法访问其 API Key。",
      "Models using Vault secrets will lose access to their API keys until a new configuration is saved.",
    );
    expectLocalized("Vault 配置", "Vault Configuration");

    await user().click(screen.getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith("Hashicorp Vault 配置已删除");
    expect(toast.success).not.toHaveBeenCalledWith("Hashicorp Vault configuration deleted");
  });

  it("renders the testing state in Chinese and hides the English original", async () => {
    vi.mocked(testHashicorpVaultConnection).mockReturnValue(new Promise(() => {}));
    settle({ values: ALL_VALUES });
    renderWithProviders(<HashicorpVault />);

    await user().click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() => {
      expectLocalized("测试中...", "Testing...");
    });
  });

  it("reports a successful connection in Chinese and not in English", async () => {
    vi.mocked(testHashicorpVaultConnection).mockResolvedValue({ message: "" });
    settle({ values: ALL_VALUES });
    renderWithProviders(<HashicorpVault />);

    await user().click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Vault 连接成功！");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Connection to Vault successful!");
  });

  it("renders the edit modal in Chinese and hides the English originals", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditHashicorpVaultModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    const dialog = screen.getByRole("dialog");

    for (const [zh, en] of [
      ["编辑 Hashicorp Vault 配置", "Edit Hashicorp Vault Configuration"],
      ["连接", "Connection"],
      ["Token 认证", "Token Authentication"],
      [
        "使用 Vault Token 进行认证。只需一种认证方式。",
        "Use a Vault token to authenticate. Only one auth method is required.",
      ],
      ["AppRole 认证", "AppRole Authentication"],
      [
        "使用 AppRole 凭据进行认证。只需一种认证方式。",
        "Use AppRole credentials to authenticate. Only one auth method is required.",
      ],
      ["可选的 mTLS 客户端证书。", "Optional client certificate for mTLS."],
      ["取消", "Cancel"],
      ["保存", "Save"],
    ] as const) {
      expect(within(dialog).getAllByText(zh).length).toBeGreaterThan(0);
      expect(within(dialog).queryAllByText(en)).toHaveLength(0);
    }

    expect(within(dialog).getByText("TLS")).toBeInTheDocument();
  });

  it("renders the keep-existing placeholder in Chinese and hides the English original", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditHashicorpVaultModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByPlaceholderText("留空以保留现有值（secret-token）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave blank to keep existing (secret-token)")).not.toBeInTheDocument();
  });

  it("renders the edit validation message in Chinese and hides the English original", async () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditHashicorpVaultModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Vault 地址"), { target: { value: "notaurl" } });
    await user().click(screen.getByRole("button", { name: "保存" }));

    expectLocalized("必须以 http:// 或 https:// 开头", "Must start with http:// or https://");
  });

  it("reports a successful update in Chinese and not in English", async () => {
    const updateMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, updateMutate });
    renderWithProviders(<EditHashicorpVaultModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "保存" }));

    expect(toast.success).toHaveBeenCalledWith("Hashicorp Vault 配置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Hashicorp Vault configuration updated successfully");
  });
});

describe("HashicorpVault English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    settle();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    settle({ values: ALL_VALUES });
    const vault = renderWithProviders(<HashicorpVault />);

    for (const value of [
      "Hashicorp Vault",
      "Manage secret manager configuration",
      "Test Connection",
      "Edit Configuration",
      "Delete Configuration",
      "View documentation",
      "Auth Method",
      "Vault Address",
      "Namespace",
      "KV Mount Name",
      "Path Prefix",
      "Mount Path",
      "Client Certificate",
      "Client Key",
      "Certificate Role",
    ]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    vault.unmount();

    settle();
    renderWithProviders(<HashicorpVault />);
    expect(screen.getByText("No Vault Configuration Found")).toBeInTheDocument();
    expect(screen.getByText("Configure Vault")).toBeInTheDocument();
  });

  it("keeps the English edit modal copy byte-identical", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditHashicorpVaultModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText("Edit Hashicorp Vault Configuration")).toBeInTheDocument();
    expect(screen.getByText("Connection")).toBeInTheDocument();
    expect(screen.getByText("Token Authentication")).toBeInTheDocument();
    expect(screen.getByText("AppRole Authentication")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
