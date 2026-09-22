import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testCyberArkConnection } from "@/app/(dashboard)/hooks/configOverrides/cyberArkApi";
import { useCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig";
import { useDeleteCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkConfig";
import { useUpdateCyberArkConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import CyberArk from "./CyberArk";
import EditCyberArkModal from "./EditCyberArkModal";

vi.mock("@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig", () => ({ useCyberArkConfig: vi.fn() }));
vi.mock("@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkConfig", () => ({
  useDeleteCyberArkConfig: vi.fn(),
}));
vi.mock("@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig", () => ({
  useUpdateCyberArkConfig: vi.fn(),
}));
vi.mock("@/app/(dashboard)/hooks/configOverrides/cyberArkApi", () => ({ testCyberArkConnection: vi.fn() }));

const CYBERARK_FIELDS = [
  "cyberark_api_base",
  "cyberark_account",
  "cyberark_username",
  "cyberark_api_key",
  "client_cert",
  "client_key",
  "ssl_verify",
  "refresh_interval",
] as const;

const ALL_VALUES = {
  cyberark_api_base: "https://conjur.example.com",
  cyberark_account: "account",
  cyberark_username: "username",
  cyberark_api_key: "api-key",
  client_cert: "cert",
  client_key: "key",
  ssl_verify: "true",
  refresh_interval: "60",
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
  vi.mocked(useCyberArkConfig).mockReturnValue({
    data: {
      values,
      field_schema: { properties: Object.fromEntries(CYBERARK_FIELDS.map((name) => [name, {}])) },
    },
    isLoading,
    isError,
    error: isError ? new Error("boom") : null,
  } as unknown as ReturnType<typeof useCyberArkConfig>);
  vi.mocked(useDeleteCyberArkConfig).mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteCyberArkConfig>);
  vi.mocked(useUpdateCyberArkConfig).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateCyberArkConfig>);
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("CyberArk Chinese copy", () => {
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
    renderWithProviders(<CyberArk />);

    expectLocalized("未找到 CyberArk 配置", "No CyberArk Configuration Found");
    expectLocalized(
      "配置 CyberArk Conjur，为你的 LiteLLM 部署安全管理提供商 API Key 和密钥。",
      "Configure CyberArk Conjur to securely manage provider API keys and secrets for your LiteLLM deployment.",
    );
    expectLocalized("配置 CyberArk", "Configure CyberArk");
  });

  it("renders the loading state in Chinese and hides the English original", () => {
    settle({ isLoading: true });
    renderWithProviders(<CyberArk />);

    expect(screen.getByRole("status", { name: "正在加载 CyberArk 配置" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading CyberArk configuration" })).not.toBeInTheDocument();
  });

  it("renders the load error in Chinese and hides the English original", () => {
    settle({ isError: true });
    renderWithProviders(<CyberArk />);

    expectLocalized("无法加载 CyberArk 配置", "Could not load CyberArk configuration");
  });

  it("renders the configured card, field labels and auth method in Chinese", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<CyberArk />);

    expectLocalized("管理密钥管理器配置", "Manage secret manager configuration");
    expectLocalized("测试连接", "Test Connection");
    expectLocalized("编辑配置", "Edit Configuration");
    expectLocalized("删除配置", "Delete Configuration");
    expectLocalized(
      "配置更改会在所有代理实例之间热重载",
      "Configuration changes are hot-reloaded across all proxy instances",
    );
    expectLocalized("查看文档", "View documentation");
    expectLocalized("认证方式", "Auth Method");
    expectLocalized("Conjur 服务器 URL", "Conjur Server URL");
    expectLocalized("账户", "Account");
    expectLocalized("用户名", "Username");
    expectLocalized("客户端证书", "Client Certificate");
    expectLocalized("客户端密钥", "Client Key");
    expectLocalized("SSL 验证", "SSL Verification");
    expectLocalized("Token 刷新间隔（秒）", "Token Refresh Interval (seconds)");

    expect(screen.getByText("CyberArk Conjur")).toBeInTheDocument();
    // The auth-method row and the cyberark_api_key field label both read "API Key".
    expect(screen.getAllByText("API Key")).toHaveLength(2);
  });

  it("renders the TLS certificate and no-auth auth methods in Chinese", () => {
    settle({ values: { cyberark_api_base: "https://conjur.example.com", client_cert: "cert", client_key: "key" } });
    const tls = renderWithProviders(<CyberArk />);
    expectLocalized("TLS 证书", "TLS Certificate");
    expect(screen.getAllByText("TLS 证书")).toHaveLength(1);
    tls.unmount();

    settle({ values: { cyberark_api_base: "https://conjur.example.com" } });
    renderWithProviders(<CyberArk />);
    expectLocalized("无", "None");
    expect(screen.getAllByText("无")).toHaveLength(1);
  });

  it("renders the clear-field confirmation in Chinese in the same open state", async () => {
    const updateMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, updateMutate });
    renderWithProviders(<CyberArk />);

    await user().click(screen.getByRole("button", { name: "清除API Key" }));

    expect(screen.queryByRole("button", { name: "Clear API Key" })).not.toBeInTheDocument();
    expectLocalized("清除API Key？", "Clear API Key?");
    expectLocalized("这将删除已存储的值。", "This will remove the stored value.");
    expectLocalized("字段", "Field");

    await user().click(screen.getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith("API Key 已清除");
    expect(toast.success).not.toHaveBeenCalledWith("API Key cleared");
  });

  it("renders the delete confirmation in Chinese in the same open state", async () => {
    const deleteMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, deleteMutate });
    renderWithProviders(<CyberArk />);

    await user().click(screen.getByRole("button", { name: "删除配置" }));

    expectLocalized("删除 CyberArk 配置？", "Delete CyberArk Configuration?");
    expectLocalized(
      "使用 CyberArk 密钥的模型在新配置保存前将无法访问其 API Key。",
      "Models using CyberArk secrets will lose access to their API keys until a new configuration is saved.",
    );
    expectLocalized("CyberArk 配置", "CyberArk Configuration");

    await user().click(screen.getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith("CyberArk 配置已删除");
    expect(toast.success).not.toHaveBeenCalledWith("CyberArk configuration deleted");
  });

  it("reports a successful connection in Chinese and not in English", async () => {
    vi.mocked(testCyberArkConnection).mockResolvedValue({ status: "success", message: "" });
    settle({ values: ALL_VALUES });
    renderWithProviders(<CyberArk />);

    await user().click(screen.getByRole("button", { name: "测试连接" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("CyberArk Conjur 连接成功！");
    });
    expect(toast.success).not.toHaveBeenCalledWith("Connection to CyberArk Conjur successful!");
  });

  it("renders the edit modal in Chinese and hides the English originals", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditCyberArkModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    const dialog = screen.getByRole("dialog");

    for (const [zh, en] of [
      ["编辑 CyberArk 配置", "Edit CyberArk Configuration"],
      ["连接", "Connection"],
      ["API Key 认证", "API Key Authentication"],
      [
        "使用 Conjur API Key 进行认证。只需一种认证方式。",
        "Use a Conjur API key to authenticate. Only one auth method is required.",
      ],
      ["证书认证", "Certificate Authentication"],
      [
        "使用客户端 TLS 证书和密钥进行认证。只需一种认证方式。",
        "Use a client TLS certificate and key to authenticate. Only one auth method is required.",
      ],
      ["高级", "Advanced"],
      ["可选的 TLS 和 Token 缓存设置。", "Optional TLS and token caching settings."],
      ["取消", "Cancel"],
      ["保存", "Save"],
    ] as const) {
      expect(within(dialog).getAllByText(zh).length).toBeGreaterThan(0);
      expect(within(dialog).queryAllByText(en)).toHaveLength(0);
    }
  });

  it("renders the keep-existing placeholder in Chinese and hides the English original", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditCyberArkModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByPlaceholderText("留空以保留现有值（api-key）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Leave blank to keep existing (api-key)")).not.toBeInTheDocument();
  });

  it("renders the edit validation message in Chinese and hides the English original", async () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditCyberArkModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Conjur 服务器 URL"), { target: { value: "notaurl" } });
    await user().click(screen.getByRole("button", { name: "保存" }));

    expectLocalized("必须以 http:// 或 https:// 开头", "Must start with http:// or https://");
  });

  it("reports a successful update in Chinese and not in English", async () => {
    const updateMutate = vi.fn((_config, options: { onSuccess: () => void }) => options.onSuccess());
    settle({ values: ALL_VALUES, updateMutate });
    renderWithProviders(<EditCyberArkModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "保存" }));

    expect(toast.success).toHaveBeenCalledWith("CyberArk 配置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("CyberArk configuration updated successfully");
  });
});

describe("CyberArk English copy", () => {
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
    const cyberark = renderWithProviders(<CyberArk />);

    for (const value of [
      "CyberArk Conjur",
      "Manage secret manager configuration",
      "Test Connection",
      "Edit Configuration",
      "Delete Configuration",
      "View documentation",
      "Auth Method",
      "Conjur Server URL",
      "Account",
      "Username",
      "Client Certificate",
      "Client Key",
      "SSL Verification",
      "Token Refresh Interval (seconds)",
    ]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    cyberark.unmount();

    settle();
    renderWithProviders(<CyberArk />);
    expect(screen.getByText("No CyberArk Configuration Found")).toBeInTheDocument();
    expect(screen.getByText("Configure CyberArk")).toBeInTheDocument();
  });

  it("keeps the English edit modal copy byte-identical", () => {
    settle({ values: ALL_VALUES });
    renderWithProviders(<EditCyberArkModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByText("Edit CyberArk Configuration")).toBeInTheDocument();
    expect(screen.getByText("Connection")).toBeInTheDocument();
    expect(screen.getByText("API Key Authentication")).toBeInTheDocument();
    expect(screen.getByText("Certificate Authentication")).toBeInTheDocument();
    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
