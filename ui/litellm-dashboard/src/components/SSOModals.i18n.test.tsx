import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import SSOModals from "./SSOModals";
import { useSSOSettingsForm } from "./Settings/AdminSettings/SSOSettings/Modals/BaseSSOSettingsForm";
import { updateSSOSettings } from "./networking";

vi.mock("./networking", () => ({
  getSSOSettings: vi.fn().mockResolvedValue(null),
  updateSSOSettings: vi.fn().mockResolvedValue({}),
}));

vi.mock("./shared/errorUtils", () => ({
  parseErrorMessage: vi.fn((error: { message?: string }) => error?.message || "An error occurred"),
}));

interface WrapperProps {
  accessToken?: string | null;
  ssoConfigured?: boolean;
  isInstructionsModalVisible?: boolean;
  handleAddSSOOk?: () => void;
  formValues?: Parameters<typeof useSSOSettingsForm>[1];
}

const renderModals = ({
  accessToken = null,
  ssoConfigured = false,
  isInstructionsModalVisible = false,
  handleAddSSOOk = vi.fn(),
  formValues,
}: WrapperProps = {}) => {
  const TestWrapper = () => {
    const form = useSSOSettingsForm("admin-panel", formValues);

    return (
      <SSOModals
        isAddSSOModalVisible
        isInstructionsModalVisible={isInstructionsModalVisible}
        handleAddSSOOk={handleAddSSOOk}
        handleAddSSOCancel={vi.fn()}
        handleShowInstructions={vi.fn()}
        handleInstructionsOk={vi.fn()}
        handleInstructionsCancel={vi.fn()}
        form={form}
        accessToken={accessToken}
        ssoConfigured={ssoConfigured}
      />
    );
  };

  return renderWithProviders(<TestWrapper />);
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

describe("SSOModals Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the add dialog in Chinese and hides the English originals", () => {
    renderModals();

    expectLocalized("添加 SSO", "Add SSO");
    expectLocalized("保存", "Save");
    expectLocalized("代理管理员邮箱", "Proxy Admin Email");
  });

  it("renders the edit dialog with the clear action in Chinese", () => {
    renderModals({ ssoConfigured: true });

    expectLocalized("编辑 SSO 设置", "Edit SSO Settings");
    expectLocalized("清除", "Clear");
  });

  it("renders the clear confirmation in Chinese in the same open state", () => {
    renderModals({ ssoConfigured: true, accessToken: "token" });

    fireEvent.click(screen.getByText("清除"));

    expectLocalized("确认清除 SSO 设置", "Confirm Clear SSO Settings");
    expectLocalized(
      "确定要清除所有 SSO 设置吗？此操作无法撤销。",
      "Are you sure you want to clear all SSO settings? This action cannot be undone.",
    );
    expectLocalized(
      "此更改后用户将无法再使用 SSO 登录。",
      "Users will no longer be able to login using SSO after this change.",
    );
    expectLocalized("取消", "Cancel");
    expectLocalized("是，清除", "Yes, Clear");
  });

  it("renders the setup instructions in Chinese and hides the English originals", () => {
    renderModals({ isInstructionsModalVisible: true });

    expectLocalized("SSO 设置说明", "SSO Setup Instructions");
    expectLocalized("按照以下步骤完成 SSO 设置：", "Follow these steps to complete the SSO setup:");
    expectLocalized("1. 不要退出此标签页", "1. DO NOT Exit this TAB");
    expectLocalized("2. 打开一个新标签页，访问你的代理 base url", "2. Open a new tab, visit your proxy base url");
    expectLocalized(
      "3. 确认 SSO 配置正确，并且可以在新标签页中登录",
      "3. Confirm your SSO is configured correctly and you can login on the new Tab",
    );
    expectLocalized("4. 如果第 3 步成功，可以关闭此标签页", "4. If Step 3 is successful, you can close this tab");
    expectLocalized("完成", "Done");
  });

  it("reports the clear outcome in Chinese and not in English", async () => {
    renderModals({ ssoConfigured: true, accessToken: "token" });

    fireEvent.click(screen.getByText("清除"));
    fireEvent.click(screen.getByText("是，清除"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("SSO 设置已成功清除");
    });
    expect(toast.success).not.toHaveBeenCalledWith("SSO settings cleared successfully");
  });

  it("reports the clear failure in Chinese and not in English", async () => {
    vi.mocked(updateSSOSettings).mockRejectedValueOnce(new Error("boom"));
    renderModals({ ssoConfigured: true, accessToken: "token" });

    fireEvent.click(screen.getByText("清除"));
    fireEvent.click(screen.getByText("是，清除"));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("清除 SSO 设置失败");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to clear SSO settings");
  });

  it("reports the missing access token in Chinese and not in English", async () => {
    renderModals({
      accessToken: null,
      formValues: {
        sso_provider: "google",
        google_client_id: "client-id",
        google_client_secret: "client-secret",
        user_email: "admin@example.com",
        proxy_base_url: "https://proxy.example.com",
      },
    });

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(toast.fromError).toHaveBeenCalledWith("没有可用的访问 Token");
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("No access token available");
  });
});

describe("SSOModals English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    const add = renderModals();
    expect(screen.getByText("Add SSO")).toBeInTheDocument();
    expect(screen.getByText("Proxy Admin Email")).toBeInTheDocument();
    add.unmount();

    renderModals({ ssoConfigured: true });
    expect(screen.getByText("Edit SSO Settings")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("keeps the English confirmation and instructions byte-identical", () => {
    const confirm = renderModals({ ssoConfigured: true });
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByText("Confirm Clear SSO Settings")).toBeInTheDocument();
    expect(screen.getByText("Yes, Clear")).toBeInTheDocument();
    confirm.unmount();

    renderModals({ isInstructionsModalVisible: true });
    expect(screen.getByText("SSO Setup Instructions")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
