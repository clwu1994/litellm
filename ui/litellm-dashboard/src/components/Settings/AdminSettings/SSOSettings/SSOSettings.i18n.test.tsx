import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import SSOSettings from "./SSOSettings";
import RedactableField from "./RedactableField";

const mockUseSSOSettings = vi.fn();

vi.mock("@/app/(dashboard)/hooks/sso/useSSOSettings", () => ({
  useSSOSettings: () => mockUseSSOSettings(),
}));

const OKTA_VALUES = {
  google_client_id: null,
  google_client_secret: null,
  microsoft_client_id: null,
  microsoft_client_secret: null,
  microsoft_tenant: null,
  generic_client_id: "okta-client-id",
  generic_client_secret: "okta-client-secret",
  generic_authorization_endpoint: "https://okta.example.com/authorize",
  generic_token_endpoint: "https://okta.example.com/token",
  generic_userinfo_endpoint: "https://okta.example.com/userinfo",
  generic_scope: "openid email profile",
  proxy_base_url: "https://proxy.example.com",
  user_email: "admin@example.com",
  role_mappings: {
    group_claim: "groups",
    default_role: "proxy_admin",
    roles: {
      proxy_admin: ["team-a"],
      proxy_admin_viewer: [],
      internal_user: [],
      internal_user_viewer: [],
    },
  },
  team_mappings: { team_ids_jwt_field: "team_ids" },
};

const MICROSOFT_VALUES = {
  google_client_id: null,
  google_client_secret: null,
  microsoft_client_id: "ms-client-id",
  microsoft_client_secret: "ms-client-secret",
  microsoft_tenant: "tenant-id",
  generic_client_id: null,
  generic_client_secret: null,
  generic_authorization_endpoint: null,
  generic_token_endpoint: null,
  generic_userinfo_endpoint: null,
  proxy_base_url: "https://proxy.example.com",
  user_email: null,
  role_mappings: null,
  team_mappings: null,
};

const SAML_VALUES = {
  google_client_id: null,
  google_client_secret: null,
  microsoft_client_id: null,
  microsoft_client_secret: null,
  microsoft_tenant: null,
  generic_client_id: null,
  generic_client_secret: null,
  generic_authorization_endpoint: null,
  generic_token_endpoint: null,
  generic_userinfo_endpoint: null,
  proxy_base_url: "https://proxy.example.com",
  user_email: null,
  role_mappings: null,
  team_mappings: null,
  saml_idp_metadata_url: null,
  saml_idp_metadata_xml: "<EntityDescriptor/>",
  saml_sp_entity_id: "https://proxy.example.com/sso/saml/metadata",
  saml_allow_unsolicited: "false",
};

const renderSSOSettings = (values: Record<string, unknown> | null) => {
  mockUseSSOSettings.mockReturnValue({ data: values ? { values } : null, isLoading: false, refetch: vi.fn() });
  return renderWithProviders(<SSOSettings />);
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("SSOSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the card and detail rows in Chinese and hides the English originals", () => {
    renderSSOSettings(OKTA_VALUES);

    for (const [zh, en] of [
      ["SSO 配置", "SSO Configuration"],
      ["管理 SSO 认证设置", "Manage Single Sign-On authentication settings"],
      ["编辑 SSO 设置", "Edit SSO Settings"],
      ["删除 SSO 设置", "Delete SSO Settings"],
      ["提供商", "Provider"],
      ["代理 Base URL", "Proxy Base URL"],
      ["授权 Endpoint", "Authorization Endpoint"],
      ["用户信息 Endpoint", "User Info Endpoint"],
      ["作用域", "Scopes"],
      ["团队 ID JWT 字段", "Team IDs JWT Field"],
    ] as const) {
      expectLocalized(zh, en);
    }

    expect(screen.getAllByRole("button", { name: "复制值" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Copy value" })).toHaveLength(0);

    for (const value of ["Client ID", "Client Secret", "Token Endpoint"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  it("renders the microsoft detail rows in Chinese and hides the English originals", () => {
    renderSSOSettings(MICROSOFT_VALUES);

    expect(screen.getByText("Microsoft SSO")).toBeInTheDocument();
    expectLocalized("租户", "Tenant");
    for (const value of ["Client ID", "Client Secret"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  it("reports the copied-to-clipboard message in Chinese and not in English", async () => {
    renderSSOSettings(OKTA_VALUES);

    await userEvent.setup().click(screen.getAllByRole("button", { name: "复制值" })[0]);

    expect(toast.success).toHaveBeenCalledWith("已复制到剪贴板");
    expect(toast.success).not.toHaveBeenCalledWith("Copied to clipboard");
  });

  it("renders the Chinese role mappings table and hides the English originals", () => {
    renderSSOSettings(OKTA_VALUES);

    for (const [zh, en] of [
      ["角色映射", "Role Mappings"],
      ["组声明", "Group Claim"],
      ["默认角色", "Default Role"],
      ["代理管理员", "Proxy Admin"],
      ["代理管理员查看者", "Proxy Admin Viewer"],
      ["内部用户", "Internal User"],
      ["内部查看者", "Internal Viewer"],
    ] as const) {
      expectLocalized(zh, en);
    }

    expect(screen.getByRole("columnheader", { name: "角色" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Role" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "映射的组" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Mapped Groups" })).not.toBeInTheDocument();
    expect(screen.getAllByText("未映射任何组")).toHaveLength(3);
    expect(screen.queryByText("No groups mapped")).not.toBeInTheDocument();
  });

  it("renders the SAML detail rows and the disabled badge in Chinese", () => {
    renderSSOSettings(SAML_VALUES);

    for (const [zh, en] of [
      ["IdP 元数据 URL", "IdP Metadata URL"],
      ["IdP 元数据 XML", "IdP Metadata XML"],
      ["SP 实体 ID", "SP Entity ID"],
      ["允许 IdP 发起的（非请求）响应", "Allow IdP-initiated (unsolicited) responses"],
      ["已提供", "Provided"],
      ["已禁用", "Disabled"],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the enabled badge in Chinese when unsolicited responses are allowed", () => {
    renderSSOSettings({ ...SAML_VALUES, saml_allow_unsolicited: "true" });

    expectLocalized("已启用", "Enabled");
  });

  it("renders the empty placeholder in Chinese and hides the English originals", () => {
    renderSSOSettings(null);

    for (const [zh, en] of [
      ["未找到 SSO 配置", "No SSO Configuration Found"],
      [
        "配置 SSO，让团队成员可以使用你的身份提供商无缝认证。",
        "Configure Single Sign-On (SSO) to enable seamless authentication for your team members using your identity provider.",
      ],
      ["配置 SSO", "Configure SSO"],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the loading skeleton in Chinese and hides the English originals", () => {
    mockUseSSOSettings.mockReturnValue({ data: null, isLoading: true, refetch: vi.fn() });
    renderWithProviders(<SSOSettings />);

    expect(screen.getByRole("status", { name: "正在加载 SSO 配置" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading SSO configuration" })).not.toBeInTheDocument();
    for (const [zh, en] of [
      ["SSO 配置", "SSO Configuration"],
      ["管理 SSO 认证设置", "Manage Single Sign-On authentication settings"],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the redactable field labels in Chinese and hides the English originals", () => {
    renderWithProviders(<RedactableField value={null} />);

    expectLocalized("未配置", "Not configured");
  });

  it("renders the redactable field toggle labels in Chinese and hides the English originals", () => {
    const hidden = renderWithProviders(<RedactableField value="secret" />);

    expect(screen.getByRole("button", { name: "显示值" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show value" })).not.toBeInTheDocument();
    hidden.unmount();

    renderWithProviders(<RedactableField value="secret" defaultHidden={false} />);

    expect(screen.getByRole("button", { name: "隐藏值" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide value" })).not.toBeInTheDocument();
  });
});

describe("SSOSettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    renderSSOSettings(OKTA_VALUES);

    for (const value of [
      "SSO Configuration",
      "Manage Single Sign-On authentication settings",
      "Edit SSO Settings",
      "Delete SSO Settings",
      "Provider",
      "Client ID",
      "Client Secret",
      "Proxy Base URL",
      "Authorization Endpoint",
      "Token Endpoint",
      "User Info Endpoint",
      "Scopes",
      "Team IDs JWT Field",
      "Okta / Auth0 SSO",
      "Role Mappings",
      "Group Claim",
      "Default Role",
      "Proxy Admin",
      "Proxy Admin Viewer",
      "Internal User",
      "Internal Viewer",
      "No groups mapped",
    ]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }

    expect(screen.getAllByRole("button", { name: "Copy value" }).length).toBeGreaterThan(0);
  });

  it("keeps the English loading and empty states byte-identical", () => {
    mockUseSSOSettings.mockReturnValue({ data: null, isLoading: true, refetch: vi.fn() });
    const { unmount } = renderWithProviders(<SSOSettings />);
    expect(screen.getByRole("status", { name: "Loading SSO configuration" })).toBeInTheDocument();
    unmount();

    renderSSOSettings(null);
    expect(screen.getByText("No SSO Configuration Found")).toBeInTheDocument();
    expect(screen.getByText("Configure SSO")).toBeInTheDocument();
  });
});
