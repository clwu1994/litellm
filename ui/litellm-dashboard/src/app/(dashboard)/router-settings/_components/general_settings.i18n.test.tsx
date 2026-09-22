import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import GeneralSettings from "./general_settings";
import { getGeneralSettingsCall, updateConfigFieldSetting, deleteConfigFieldSetting } from "@/components/networking";

vi.mock("@/components/networking", () => ({
  getGeneralSettingsCall: vi.fn(),
  updateConfigFieldSetting: vi.fn().mockResolvedValue({}),
  deleteConfigFieldSetting: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/components/router_settings", () => ({ default: () => null }));
vi.mock("@/components/Settings/RouterSettings/Fallbacks/Fallbacks", () => ({ default: () => null }));
vi.mock("@/components/routing_groups", () => ({ default: () => null }));

const SETTINGS_FIXTURE = [
  {
    field_name: "budget_exceeded_throttle_percentage",
    field_type: "Float",
    field_value: null,
    field_description: "throttle fraction",
    stored_in_db: null,
    field_default_value: null,
  },
  {
    field_name: "enable_anthropic_prompt_caching",
    field_type: "Boolean",
    field_value: true,
    field_description: "prompt caching toggle",
    stored_in_db: true,
    field_tab: "prompt_caching",
    field_default_value: false,
  },
  {
    field_name: "anthropic_prompt_caching_ttl",
    field_type: "Select",
    field_value: null,
    field_description: "prompt caching ttl",
    stored_in_db: true,
    field_options: ["5m", "1h"],
    field_tab: "prompt_caching",
    field_default_value: null,
  },
  {
    field_name: "max_ui_session_budget",
    field_type: "Dollar",
    field_value: 7.5,
    field_description: "dashboard session budget",
    stored_in_db: true,
    field_default_value: 1.0,
  },
  {
    field_name: "cooldown_time",
    field_type: "Select",
    field_value: null,
    field_description: "cooldown",
    stored_in_db: false,
    field_options: ["5", "10"],
    field_default_value: null,
  },
];

const renderSettings = () => {
  vi.mocked(getGeneralSettingsCall).mockResolvedValue(SETTINGS_FIXTURE.map((setting) => ({ ...setting })));
  vi.mocked(updateConfigFieldSetting).mockClear();
  vi.mocked(deleteConfigFieldSetting).mockClear();
  return renderWithProviders(<GeneralSettings accessToken="token" userRole="Admin" userID="user" />);
};

const openTab = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole("tab", { name }));
  return screen.getByRole("tabpanel", { name });
};

describe("GeneralSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese tab labels and hides the English originals", async () => {
    renderSettings();
    await screen.findByText("cooldown_time");

    expect(screen.getByRole("tab", { name: "负载均衡" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Loadbalancing" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "路由组" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Routing Groups" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "回退" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Fallbacks" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "提示词缓存" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Prompt Caching" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "通用" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "General" })).not.toBeInTheDocument();
  });

  it("renders the Chinese prompt caching panel copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();

    const panel = await openTab(user, "提示词缓存");

    expect(within(panel).getByText("提示词缓存")).toBeInTheDocument();
    expect(within(panel).queryByText("Prompt Caching")).not.toBeInTheDocument();
    expect(within(panel).getByText("自动 Anthropic 提示词缓存")).toBeInTheDocument();
    expect(within(panel).queryByText("Automatic Anthropic prompt caching")).not.toBeInTheDocument();
    expect(within(panel).getByText("缓存有效期（TTL）")).toBeInTheDocument();
    expect(within(panel).queryByText("Cache lifetime (TTL)")).not.toBeInTheDocument();
    expect(within(panel).getByText("5m（默认）")).toBeInTheDocument();
    expect(within(panel).queryByText("5m (default)")).not.toBeInTheDocument();
  });

  it("renders the Chinese general table headers and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();

    const panel = await openTab(user, "通用");

    expect(within(panel).getByRole("columnheader", { name: "设置项" })).toBeInTheDocument();
    expect(within(panel).queryByRole("columnheader", { name: "Setting" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("columnheader", { name: "值" })).toBeInTheDocument();
    expect(within(panel).queryByRole("columnheader", { name: "Value" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("columnheader", { name: "状态" })).toBeInTheDocument();
    expect(within(panel).queryByRole("columnheader", { name: "Status" })).not.toBeInTheDocument();
    expect(within(panel).getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(within(panel).queryByRole("columnheader", { name: "Action" })).not.toBeInTheDocument();
  });

  it("renders the Chinese status badges and update action and hides the English originals", async () => {
    const user = userEvent.setup();
    renderSettings();

    const panel = await openTab(user, "通用");

    expect(within(panel).getByText("数据库中")).toBeInTheDocument();
    expect(within(panel).queryByText("In DB")).not.toBeInTheDocument();
    expect(within(panel).getByText("配置文件中")).toBeInTheDocument();
    expect(within(panel).queryByText("In Config")).not.toBeInTheDocument();
    expect(within(panel).getByText("未设置")).toBeInTheDocument();
    expect(within(panel).queryByText("Not Set")).not.toBeInTheDocument();

    const row = within(panel).getByRole("row", { name: /max_ui_session_budget/ });
    expect(within(row).getByRole("button", { name: "更新" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
  });

  it("renders the Chinese default select option and hides the English original", async () => {
    const user = userEvent.setup();
    renderSettings();

    const panel = await openTab(user, "通用");
    const row = within(panel).getByRole("row", { name: /cooldown_time/ });

    expect(within(row).getByText("默认")).toBeInTheDocument();
    expect(within(row).queryByText("Default")).not.toBeInTheDocument();
  });
});

describe("GeneralSettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    const user = userEvent.setup();
    renderSettings();
    await screen.findByText("cooldown_time");

    for (const name of ["Loadbalancing", "Routing Groups", "Fallbacks", "Prompt Caching", "General"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }

    const cachingPanel = await openTab(user, "Prompt Caching");
    expect(within(cachingPanel).getByText("Prompt Caching")).toBeInTheDocument();
    expect(within(cachingPanel).getByText("Automatic Anthropic prompt caching")).toBeInTheDocument();
    expect(within(cachingPanel).getByText("Cache lifetime (TTL)")).toBeInTheDocument();
    expect(within(cachingPanel).getByText("5m (default)")).toBeInTheDocument();

    const generalPanel = await openTab(user, "General");
    for (const name of ["Setting", "Value", "Status", "Action"]) {
      expect(within(generalPanel).getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(within(generalPanel).getByText("In DB")).toBeInTheDocument();
    expect(within(generalPanel).getByText("In Config")).toBeInTheDocument();
    expect(within(generalPanel).getByText("Not Set")).toBeInTheDocument();

    const row = within(generalPanel).getByRole("row", { name: /cooldown_time/ });
    expect(within(row).getByText("Default")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Update" })).toBeInTheDocument();
  });
});
