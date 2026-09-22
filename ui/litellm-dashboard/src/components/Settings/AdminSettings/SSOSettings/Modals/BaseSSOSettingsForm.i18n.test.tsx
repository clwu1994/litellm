import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import BaseSSOSettingsForm, { useSSOSettingsForm } from "./BaseSSOSettingsForm";

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const renderForm = () => {
  const TestWrapper = () => {
    const form = useSSOSettingsForm("sso-settings");
    return <BaseSSOSettingsForm form={form} onFormSubmit={vi.fn()} />;
  };

  return renderWithProviders(<TestWrapper />);
};

const selectProvider = async (name: RegExp, label = "SSO 提供商") => {
  await user().click(screen.getByLabelText(label));
  await user().click(await screen.findByText(name));
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("BaseSSOSettingsForm Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the shared fields in Chinese and hides the English originals", () => {
    renderForm();

    expectLocalized("SSO 提供商", "SSO Provider");
    expectLocalized("代理管理员邮箱", "Proxy Admin Email");
    expectLocalized("代理 Base URL", "Proxy Base URL");
  });

  it("renders the provider-specific fields and mapping toggles in Chinese", async () => {
    renderForm();
    await selectProvider(/okta/i);

    await waitFor(() => {
      expectLocalized("授权 Endpoint", "Authorization Endpoint");
    });
    expectLocalized("作用域", "Scopes");
    expectLocalized("使用角色映射", "Use Role Mappings");
    expectLocalized("使用团队映射", "Use Team Mappings");
  });

  it("renders every provider option in Chinese and hides the English original", async () => {
    renderForm();
    await user().click(screen.getByLabelText("SSO 提供商"));

    for (const value of ["Google SSO", "Microsoft SSO", "Okta / Auth0 SSO", "SAML SSO"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    expectLocalized("通用 SSO", "Generic SSO");
  });

  it("renders the provider field labels in Chinese and hides the English originals", async () => {
    const google = renderForm();
    await selectProvider(/google/i);
    for (const value of ["Google Client ID", "Google Client Secret"]) {
      expect(await screen.findByText(value)).toBeInTheDocument();
    }
    google.unmount();

    const microsoft = renderForm();
    await selectProvider(/microsoft/i);
    for (const value of ["Microsoft Client ID", "Microsoft Client Secret"]) {
      expect(await screen.findByText(value)).toBeInTheDocument();
    }
    expectLocalized("Microsoft 租户", "Microsoft Tenant");
    microsoft.unmount();

    renderForm();
    await selectProvider(/okta/i);
    for (const value of ["Generic Client ID", "Generic Client Secret", "Userinfo Endpoint"]) {
      expect(await screen.findByText(value)).toBeInTheDocument();
    }
  });

  it("renders the role and team mapping fields in Chinese and hides the English originals", async () => {
    renderForm();
    await selectProvider(/okta/i);

    await user().click(await screen.findByRole("checkbox", { name: "使用角色映射" }));
    await waitFor(() => {
      expectLocalized("组声明", "Group Claim");
    });
    expectLocalized("默认角色", "Default Role");
    expectLocalized("代理管理员团队", "Proxy Admin Teams");
    expectLocalized("管理员查看者团队", "Admin Viewer Teams");
    expectLocalized("内部用户团队", "Internal User Teams");
    expectLocalized("内部查看者团队", "Internal Viewer Teams");

    await user().click(screen.getByRole("checkbox", { name: "使用团队映射" }));
    await waitFor(() => {
      expectLocalized("团队 ID JWT 字段", "Team IDs JWT Field");
    });
  });

  it("renders the default role options in Chinese and hides the English originals", async () => {
    renderForm();
    await selectProvider(/okta/i);
    await user().click(await screen.findByRole("checkbox", { name: "使用角色映射" }));

    await user().click(await screen.findByLabelText("默认角色"));

    for (const [zh, en] of [
      ["内部查看者", "Internal Viewer"],
      ["内部用户", "Internal User"],
      ["管理员查看者", "Admin Viewer"],
      ["代理管理员", "Proxy Admin"],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the SAML fields and placeholders in Chinese and hides the English originals", async () => {
    renderForm();
    await selectProvider(/saml/i);

    await waitFor(() => {
      expectLocalized("IdP 元数据 URL", "IdP Metadata URL");
    });
    expectLocalized("IdP 元数据 XML", "IdP Metadata XML");
    expectLocalized("SP 实体 ID", "SP Entity ID");
    expectLocalized("允许 IdP 发起的（非请求）响应", "Allow IdP-initiated (unsolicited) responses");

    for (const [zh, en] of [
      [
        "https://idp.example.com/metadata（使用此项或下方的元数据 XML）",
        "https://idp.example.com/metadata (use this or the metadata XML below)",
      ],
      [
        "如果没有元数据 URL，请在此粘贴 IdP 元数据 XML",
        "Paste the IdP metadata XML here if you do not have a metadata URL",
      ],
      ["默认为 <proxy base url>/sso/saml/metadata", "Defaults to <proxy base url>/sso/saml/metadata"],
    ] as const) {
      expect(screen.getByPlaceholderText(zh)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the validation messages in Chinese and hides the English originals", async () => {
    renderForm();

    const emailInput = screen.getByLabelText("代理管理员邮箱");
    const urlInput = screen.getByPlaceholderText("https://example.com");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "a" } });
      fireEvent.change(emailInput, { target: { value: "" } });
    });
    await waitFor(() => {
      expect(screen.getByText("请输入代理管理员的邮箱")).toBeInTheDocument();
    });
    expect(screen.queryByText("Please enter the email of the proxy admin")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(urlInput, { target: { value: "invalid-url" } });
      fireEvent.blur(urlInput);
    });
    await waitFor(() => {
      expect(screen.getByText("URL 必须以 http:// 或 https:// 开头")).toBeInTheDocument();
    });
    expect(screen.queryByText("URL must start with http:// or https://")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(urlInput, { target: { value: "https://example.com/" } });
      fireEvent.blur(urlInput);
    });
    await waitFor(() => {
      expect(screen.getByText("URL 不能以斜杠结尾")).toBeInTheDocument();
    });
    expect(screen.queryByText("URL must not end with a trailing slash")).not.toBeInTheDocument();
  });

  it("renders the per-field required message in Chinese with the field name interpolated", async () => {
    renderForm();
    await selectProvider(/google/i);

    const clientId = await screen.findByLabelText("Google Client ID");
    await act(async () => {
      fireEvent.change(clientId, { target: { value: "x" } });
      fireEvent.change(clientId, { target: { value: "" } });
      fireEvent.blur(clientId);
    });

    await waitFor(() => {
      expect(screen.getByText("请输入google client id")).toBeInTheDocument();
    });
    expect(screen.queryByText("Please enter the google client id")).not.toBeInTheDocument();
  });
});

describe("BaseSSOSettingsForm English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    renderForm();

    for (const value of ["SSO Provider", "Proxy Admin Email", "Proxy Base URL"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }

    await selectProvider(/okta/i, "SSO Provider");
    await waitFor(() => {
      expect(screen.getByText("Authorization Endpoint")).toBeInTheDocument();
    });
    for (const value of ["Userinfo Endpoint", "Scopes", "Use Role Mappings", "Use Team Mappings", "Okta / Auth0 SSO"]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
  });

  it("keeps the English SAML placeholders byte-identical", async () => {
    renderForm();
    await selectProvider(/saml/i, "SSO Provider");

    await waitFor(() => {
      expect(screen.getByText("IdP Metadata URL")).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText("https://idp.example.com/metadata (use this or the metadata XML below)"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Paste the IdP metadata XML here if you do not have a metadata URL"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Defaults to <proxy base url>/sso/saml/metadata")).toBeInTheDocument();
  });

  it("keeps the English validation messages byte-identical", async () => {
    renderForm();

    const urlInput = screen.getByPlaceholderText("https://example.com");
    await act(async () => {
      fireEvent.change(urlInput, { target: { value: "invalid-url" } });
      fireEvent.blur(urlInput);
    });

    await waitFor(() => {
      expect(screen.getByText("URL must start with http:// or https://")).toBeInTheDocument();
    });
  });
});
