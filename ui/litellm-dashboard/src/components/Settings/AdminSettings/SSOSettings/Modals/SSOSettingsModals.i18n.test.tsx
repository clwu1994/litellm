import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireEvent, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import AddSSOSettingsModal from "./AddSSOSettingsModal";
import DeleteSSOSettingsModal from "./DeleteSSOSettingsModal";
import EditSSOSettingsModal from "./EditSSOSettingsModal";

const mockUseSSOSettings = vi.fn();
const mockUseEditSSOSettings = vi.fn();

vi.mock("@/app/(dashboard)/hooks/sso/useSSOSettings", () => ({
  useSSOSettings: () => mockUseSSOSettings(),
}));

vi.mock("@/app/(dashboard)/hooks/sso/useEditSSOSettings", () => ({
  useEditSSOSettings: () => mockUseEditSSOSettings(),
}));

vi.mock("../utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils")>();
  return { ...actual, processSSOSettingsPayload: vi.fn(actual.processSSOSettingsPayload) };
});

import { processSSOSettingsPayload } from "../utils";

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const settle = (values: Record<string, unknown>, isPending = false) => {
  mockUseSSOSettings.mockReturnValue({ data: { values }, isLoading: false, refetch: vi.fn() });
  mockUseEditSSOSettings.mockReturnValue({ mutateAsync: vi.fn(), isPending });
};

const GOOGLE_VALUES = { google_client_id: "client-id", google_client_secret: "client-secret" };

const FULL_GOOGLE_VALUES = {
  ...GOOGLE_VALUES,
  user_email: "admin@example.com",
  proxy_base_url: "https://proxy.example.com",
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("SSO modals Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    settle(GOOGLE_VALUES);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the add modal in Chinese and hides the English originals", () => {
    renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("添加 SSO", "Add SSO");
    expectLocalized("取消", "Cancel");
  });

  it("renders the add modal validation messages in Chinese and hides the English originals", async () => {
    renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "添加 SSO" }));

    await waitFor(() => {
      expect(screen.getByText("请选择 SSO 提供商")).toBeInTheDocument();
    });
    expect(screen.queryByText("Please select an SSO provider")).not.toBeInTheDocument();
    expect(screen.getByText("请输入代理 base url")).toBeInTheDocument();
    expect(screen.queryByText("Please enter the proxy base url")).not.toBeInTheDocument();
  });

  it("renders the role and team mapping validation messages in Chinese", async () => {
    renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByLabelText("SSO 提供商"));
    await user().click(await screen.findByText(/okta/i));
    await user().click(await screen.findByRole("checkbox", { name: "使用角色映射" }));
    await user().click(await screen.findByRole("checkbox", { name: "使用团队映射" }));

    await user().click(screen.getByRole("button", { name: "添加 SSO" }));

    await waitFor(() => {
      expect(screen.getByText("请输入组声明")).toBeInTheDocument();
    });
    expect(screen.queryByText("Please enter the group claim")).not.toBeInTheDocument();
    expect(screen.getByText("请输入团队 ID JWT 字段")).toBeInTheDocument();
    expect(screen.queryByText("Please enter the team IDs JWT field")).not.toBeInTheDocument();
  });

  it("renders the edit modal in Chinese and hides the English originals", () => {
    renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("编辑 SSO 设置", "Edit SSO Settings");
    expectLocalized("保存", "Save");
    expectLocalized("取消", "Cancel");
  });

  it("renders the saving state in Chinese and hides the English original", () => {
    settle(GOOGLE_VALUES, true);
    renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("保存中...", "Saving...");
  });

  it("renders the delete confirmation in Chinese and hides the English originals", () => {
    renderWithProviders(<DeleteSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("确认清除 SSO 设置", "Confirm Clear SSO Settings");
    expectLocalized("此操作无法撤销。", "This action cannot be undone.");
    expectLocalized(
      "确定要清除所有 SSO 设置吗？此更改后用户将无法再使用 SSO 登录。",
      "Are you sure you want to clear all SSO settings? Users will no longer be able to login using SSO after this change.",
    );
    expectLocalized("SSO 设置", "SSO Settings");
    expectLocalized("提供商", "Provider");
    expectLocalized("Google SSO", "google");
  });

  it("renders the fallback provider value in Chinese and hides the English original", () => {
    settle({});
    renderWithProviders(<DeleteSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("通用", "Generic");
  });

  it("reports the edit outcome in Chinese and not in English", async () => {
    settle(FULL_GOOGLE_VALUES);
    mockUseEditSSOSettings.mockReturnValue({
      mutateAsync: vi.fn().mockImplementation((_payload, options: { onSuccess: () => void }) => {
        options.onSuccess();
        return Promise.resolve({});
      }),
      isPending: false,
    });
    renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("SSO 设置更新成功");
    });
    expect(toast.success).not.toHaveBeenCalledWith("SSO settings updated successfully");
  });

  it("reports the edit failure in Chinese and not in English", async () => {
    settle(FULL_GOOGLE_VALUES);
    mockUseEditSSOSettings.mockReturnValue({
      mutateAsync: vi.fn().mockImplementation((_payload, options: { onError: (error: Error) => void }) => {
        options.onError(new Error("boom"));
        return Promise.resolve({});
      }),
      isPending: false,
    });
    renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("保存 SSO 设置失败：boom");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to save SSO settings: boom");
  });

  it("reports a processing failure in Chinese and not in English", async () => {
    settle(FULL_GOOGLE_VALUES);
    vi.mocked(processSSOSettingsPayload).mockImplementationOnce(() => {
      throw new Error("boom");
    });
    renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("处理 SSO 设置失败：boom");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to process SSO settings: boom");
  });

  it("renders the adding state in Chinese and hides the English original", () => {
    settle(GOOGLE_VALUES, true);
    renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    expectLocalized("添加中...", "Adding...");
  });

  it("reports a successful add in Chinese and not in English", async () => {
    settle(FULL_GOOGLE_VALUES);
    mockUseEditSSOSettings.mockReturnValue({
      mutateAsync: vi.fn().mockImplementation((_payload, options: { onSuccess: () => void }) => {
        options.onSuccess();
        return Promise.resolve({});
      }),
      isPending: false,
    });
    renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByLabelText("SSO 提供商"));
    await user().click(await screen.findByText(/google/i));
    fireEvent.change(await screen.findByLabelText("Google Client ID"), { target: { value: "client-id" } });
    fireEvent.change(screen.getByLabelText("Google Client Secret"), { target: { value: "client-secret" } });
    fireEvent.change(screen.getByLabelText("代理管理员邮箱"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://proxy.example.com" },
    });

    await user().click(screen.getByRole("button", { name: "添加 SSO" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("SSO 设置添加成功");
    });
    expect(toast.success).not.toHaveBeenCalledWith("SSO settings added successfully");
  });

  it("reports a failed clear with the error in Chinese and not in English", async () => {
    settle(FULL_GOOGLE_VALUES);
    mockUseEditSSOSettings.mockReturnValue({
      mutateAsync: vi.fn().mockImplementation((_payload, options: { onError: (error: Error) => void }) => {
        options.onError(new Error("boom"));
        return Promise.resolve({});
      }),
      isPending: false,
    });
    renderWithProviders(<DeleteSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

    await user().click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("清除 SSO 设置失败：boom");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to clear SSO settings: boom");
  });

  it.each([
    [
      "okta",
      { generic_client_id: "id", generic_authorization_endpoint: "https://okta.example.com" },
      "okta",
      "Okta / Auth0 SSO",
    ],
    ["microsoft", { microsoft_client_id: "id" }, "microsoft", "Microsoft SSO"],
    [
      "generic",
      { generic_client_id: "id", generic_authorization_endpoint: "https://example.com" },
      "generic",
      "通用 SSO",
    ],
    ["saml", { saml_idp_metadata_url: "https://example.com/metadata" }, "saml", "SAML SSO"],
  ])(
    "renders the %s provider id value in Chinese and hides the raw English value",
    async (_name, values, rawValue, zhValue) => {
      settle(values);
      renderWithProviders(<DeleteSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);

      expect(screen.getAllByText(zhValue).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(rawValue)).toHaveLength(0);
    },
  );
});

describe("SSO modals English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    settle(GOOGLE_VALUES);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const add = renderWithProviders(<AddSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getAllByText("Add SSO").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    add.unmount();

    const edit = renderWithProviders(<EditSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Edit SSO Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    edit.unmount();

    renderWithProviders(<DeleteSSOSettingsModal isVisible onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Confirm Clear SSO Settings")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(screen.getByText("SSO Settings")).toBeInTheDocument();
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("google")).toBeInTheDocument();
  });
});
