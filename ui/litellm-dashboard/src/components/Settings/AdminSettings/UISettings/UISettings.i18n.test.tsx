import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import UISettings from "./UISettings";
import PageVisibilitySettings from "./PageVisibilitySettings";

const mockUseUISettings = vi.fn();
const mockUseUpdateUISettings = vi.fn();

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: () => mockUseUISettings(),
}));

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUpdateUISettings", () => ({
  useUpdateUISettings: () => mockUseUpdateUISettings(),
}));

vi.mock("@/components/page_utils", () => ({
  getAvailablePages: (t: (key: string) => string) => [
    {
      page: "usage",
      label: t("items.usage"),
      description: "View usage stats",
      groupKey: "section.observability",
    },
    {
      page: "models",
      label: t("items.modelsAndEndpoints"),
      description: "Manage models",
      groupKey: "section.observability",
    },
    {
      page: "keys",
      label: t("items.keys"),
      description: "Manage API keys",
      groupKey: "section.accessControl",
    },
  ],
}));

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const buildResponse = (overrides: Record<string, unknown> = {}) => ({
  data: { field_schema: { properties: { enable_projects_ui: {} } }, values: {} },
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
});

const settle = (overrides: Record<string, unknown> = {}, mutate = vi.fn()) => {
  mockUseUISettings.mockReturnValue(buildResponse(overrides));
  mockUseUpdateUISettings.mockReturnValue({ mutate, isPending: false, error: null });
  return mutate;
};

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const SETTING_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["禁止内部用户添加模型", "Disable model add for internal users"],
  ["禁止团队管理员删除团队用户", "Disable team admin delete team user"],
  ["要求对公共 AI Hub 进行身份验证", "Require authentication for public AI Hub"],
  ["将客户端请求头转发到 LLM API", "Forward client headers to LLM API"],
  ["转发 LLM 提供商认证请求头", "Forward LLM provider auth headers"],
  ["[BETA] 启用 Projects（页面将刷新）", "[BETA] Enable Projects (page will refresh)"],
  ["[BETA] 启用 Chat 页面（页面将刷新）", "[BETA] Enable Chat page (page will refresh)"],
  ["禁止内部用户使用 Agents", "Disable agents for internal users"],
  ["允许团队管理员使用 Agents", "Allow agents for team admins"],
  ["禁止内部用户使用向量存储", "Disable vector stores for internal users"],
  ["允许团队管理员使用向量存储", "Allow vector stores for team admins"],
  ["将用户搜索限制在组织范围内", "Scope user search to organization"],
  ["禁用自定义 Virtual key 值", "Disable custom Virtual key values"],
];

// The Projects and Chat switches carry an accessible name that differs from their visible label.
const SWITCH_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["禁止内部用户添加模型", "Disable model add for internal users"],
  ["禁止团队管理员删除团队用户", "Disable team admin delete team user"],
  ["要求对公共 AI Hub 进行身份验证", "Require authentication for public AI Hub"],
  ["将客户端请求头转发到 LLM API", "Forward client headers to LLM API"],
  ["转发 LLM 提供商认证请求头", "Forward LLM provider auth headers"],
  ["启用 Projects UI", "Enable Projects UI"],
  ["启用 Chat 页面", "Enable Chat page"],
  ["禁止内部用户使用 Agents", "Disable agents for internal users"],
  ["允许团队管理员使用 Agents", "Allow agents for team admins"],
  ["禁止内部用户使用向量存储", "Disable vector stores for internal users"],
  ["允许团队管理员使用向量存储", "Allow vector stores for team admins"],
  ["将用户搜索限制在组织范围内", "Scope user search to organization"],
  ["禁用自定义 Virtual key 值", "Disable custom Virtual key values"],
];

describe("UISettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    settle();
  });

  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await i18n.changeLanguage("en");
  });

  it("renders every setting row in Chinese and hides the English originals", () => {
    renderWithProviders(<UISettings />);

    expectLocalized("UI 设置", "UI Settings");
    for (const [zh, en] of SETTING_LABELS) {
      expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(en)).toHaveLength(0);
    }
    for (const [zh, en] of SWITCH_NAMES) {
      expect(screen.getByRole("switch", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("switch", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the setting descriptions in Chinese and hides the English originals", () => {
    renderWithProviders(<UISettings />);

    for (const [zh, en] of [
      [
        "将客户端请求头（Authorization、anthropic-beta 以及 x-* 自定义请求头）转发到上游 LLM。为使用 Max 订阅的 Claude Code 启用（转发 OAuth Token），或将自定义/追踪请求头传递给提供商。与 BYOK 开关相互独立，只启用你需要的那个。",
        "Forwards client headers (Authorization, anthropic-beta, and x-* custom headers) to the upstream LLM. Enable for Claude Code with a Max subscription (forwards the OAuth token) or to pass custom/tracing headers through to the provider. Independent of the BYOK toggle — enable only the one(s) you need.",
      ],
      [
        "将提供商认证请求头（x-api-key、x-goog-api-key、api-key、ocp-apim-subscription-key）转发到上游 LLM，并覆盖该请求中部署配置的密钥。为 Claude Code BYOK 启用（客户端自带 API Key）。与客户端请求头开关相互独立，只启用你需要的那个。",
        "Forwards provider auth headers (x-api-key, x-goog-api-key, api-key, ocp-apim-subscription-key) to the upstream LLM, overriding any deployment-configured key for that request. Enable for Claude Code BYOK (clients bring their own API key). Independent of the client-headers toggle — enable only the one(s) you need.",
      ],
      [
        "启用后，会在 UI 侧边栏显示 Projects 功能，并在密钥管理中显示项目字段。",
        "If enabled, shows the Projects feature in the UI sidebar and the project field in key management.",
      ],
      [
        "启用后，会在 UI 侧边栏显示 Chat 页面，让用户与 LLM 对话，并通过 OAuth 连接自己的 MCP 服务器凭据。",
        "If enabled, shows the Chat page in the UI sidebar, letting users chat with an LLM and connect their own MCP server credentials via OAuth.",
      ],
      [
        "启用后，用户搜索接口会按组织限制结果。关闭时，任何已认证用户都可以搜索所有用户。",
        "If enabled, the user search endpoint restricts results by organization. When off, any authenticated user can search all users.",
      ],
      [
        "如果为 true，用户无法指定自定义 Key 值。所有 Key 都必须自动生成。",
        "If true, users cannot specify custom key values. All keys must be auto-generated.",
      ],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the loading state in Chinese and hides the English original", () => {
    settle({ isLoading: true });
    renderWithProviders(<UISettings />);

    expect(screen.getByRole("status", { name: "正在加载 UI 设置" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading UI settings" })).not.toBeInTheDocument();
  });

  it("renders the load and update errors in Chinese and hides the English originals", () => {
    settle({ isError: true, error: new Error("boom") });
    const load = renderWithProviders(<UISettings />);
    expectLocalized("无法加载 UI 设置", "Could not load UI settings");
    load.unmount();

    settle({}, vi.fn());
    mockUseUpdateUISettings.mockReturnValue({ mutate: vi.fn(), isPending: false, error: new Error("boom") });
    renderWithProviders(<UISettings />);
    expectLocalized("无法更新 UI 设置", "Could not update UI settings");
  });

  it("reports a successful update in Chinese and not in English", () => {
    const mutate = settle(
      {},
      vi.fn((_settings, options: { onSuccess: () => void }) => {
        options.onSuccess();
      }),
    );
    renderWithProviders(<UISettings />);

    act(() => {
      fireEvent.click(screen.getByRole("switch", { name: "禁止内部用户添加模型" }));
    });

    expect(mutate).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("UI 设置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("UI settings updated successfully");
  });

  it("reports the refresh-required update in Chinese and not in English", () => {
    vi.useFakeTimers();
    settle(
      {},
      vi.fn((_settings, options: { onSuccess: () => void }) => {
        options.onSuccess();
      }),
    );
    renderWithProviders(<UISettings />);

    act(() => {
      fireEvent.click(screen.getByRole("switch", { name: "启用 Projects UI" }));
    });

    expect(toast.success).toHaveBeenCalledWith("UI 设置更新成功。正在刷新页面...");
    expect(toast.success).not.toHaveBeenCalledWith("UI settings updated successfully. Refreshing page...");
  });

  it("reports a page visibility update in Chinese and not in English", async () => {
    const mutate = settle(
      {},
      vi.fn((_settings, options: { onSuccess: () => void }) => {
        options.onSuccess();
      }),
    );
    renderWithProviders(<UISettings />);

    await user().click(screen.getByRole("button", { name: "配置页面可见性" }));
    await user().click(await screen.findByRole("button", { name: "保存页面可见性设置" }));

    expect(mutate).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("页面可见性设置更新成功");
    expect(toast.success).not.toHaveBeenCalledWith("Page visibility settings updated successfully");
  });
});

describe("PageVisibilitySettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the panel copy in Chinese and hides the English originals", () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={null} isUpdating={false} onUpdate={vi.fn()} />,
    );

    for (const [zh, en] of [
      ["内部用户页面可见性", "Internal User Page Visibility"],
      ["未设置（所有页面可见）", "Not set (all pages visible)"],
      [
        "默认情况下，所有页面对内部用户可见。选择特定页面以限制可见性。",
        "By default, all pages are visible to internal users. Select specific pages to restrict visibility.",
      ],
      [
        "注意：此处仅显示内部用户角色可访问的页面。仅管理员可访问的页面会被排除，因为无论此设置如何，它们都无法对内部用户可见。",
        "Note: Only pages accessible to internal user roles are shown here. Admin-only pages are excluded as they cannot be made visible to internal users regardless of this setting.",
      ],
      ["配置页面可见性", "Configure Page Visibility"],
    ] as const) {
      expectLocalized(zh, en);
    }
  });

  it("renders the plural and singular selection counts in Chinese and hides the English originals", () => {
    const multiple = renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage", "keys"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expectLocalized("已选择 2 个页面", "2 pages selected");
    multiple.unmount();

    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expectLocalized("已选择 1 个页面", "1 page selected");
  });

  it("renders the save and reset actions in Chinese and hides the English originals", async () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={vi.fn()} />,
    );

    await user().click(screen.getByRole("button", { name: "配置页面可见性" }));

    expectLocalized("保存页面可见性设置", "Save Page Visibility Settings");
    expectLocalized("重置为默认（所有页面）", "Reset to Default (All Pages)");
  });
});

describe("UISettings English copy", () => {
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
    renderWithProviders(<UISettings />);

    expect(screen.getByText("UI Settings")).toBeInTheDocument();
    for (const [, en] of SETTING_LABELS) {
      expect(screen.getAllByText(en).length).toBeGreaterThan(0);
    }
    for (const [, en] of SWITCH_NAMES) {
      expect(screen.getByRole("switch", { name: en })).toBeInTheDocument();
    }
  });
});

describe("PageVisibilitySettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps the singular and plural page counts byte-identical", () => {
    const multiple = renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage", "keys"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expect(screen.getByText("2 pages selected")).toBeInTheDocument();
    multiple.unmount();

    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={vi.fn()} />,
    );
    expect(screen.getByText("1 page selected")).toBeInTheDocument();
  });

  it("keeps the not-set and action copy byte-identical", async () => {
    renderWithProviders(
      <PageVisibilitySettings enabledPagesInternalUsers={["usage"]} isUpdating={false} onUpdate={vi.fn()} />,
    );

    expect(screen.getByText("Internal User Page Visibility")).toBeInTheDocument();
    await user().click(screen.getByRole("button", { name: "Configure Page Visibility" }));
    expect(screen.getByText("Save Page Visibility Settings")).toBeInTheDocument();
    expect(screen.getByText("Reset to Default (All Pages)")).toBeInTheDocument();
  });
});
