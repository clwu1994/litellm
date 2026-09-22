/* eslint-disable testing-library/no-node-access -- the manifest hint splits its copy around an inline code element, so reaching the paragraph needs the DOM */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import PluginSettings from "./PluginSettings";

const { getConfigFieldSettingMock, updateConfigFieldSettingMock } = vi.hoisted(() => ({
  getConfigFieldSettingMock: vi.fn(),
  updateConfigFieldSettingMock: vi.fn(),
}));

vi.mock("@/components/networking", () => ({
  getConfigFieldSetting: getConfigFieldSettingMock,
  updateConfigFieldSetting: updateConfigFieldSettingMock,
}));

const PLUGIN = {
  name: "alpha",
  display_name: "Alpha",
  url: "https://alpha.example.com",
  plugin_key: "***",
};

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

const expectLocalized = (zh: string, en: string) => {
  expect(screen.getAllByText(zh).length).toBeGreaterThan(0);
  expect(screen.queryAllByText(en)).toHaveLength(0);
};

const openDialog = async (name: string) => {
  await user().click(await screen.findByRole("button", { name }));
};

describe("PluginSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
    vi.clearAllMocks();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [PLUGIN] });
    updateConfigFieldSettingMock.mockResolvedValue({});
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the table copy and row actions in Chinese and hides the English originals", async () => {
    renderWithProviders(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    expectLocalized("插件", "Plugins");
    expectLocalized(
      "将外部服务注册为插件。添加后，用户可以通过侧边栏左上角的模式切换器切换到该插件。",
      "Register external services as plugins. Once added, users can toggle to the plugin from the mode switcher in the top-left of the sidebar.",
    );
    expectLocalized("添加插件", "Add Plugin");

    expect(screen.getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "显示名称" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Display Name" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "URL" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Plugin Key" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "编辑 alpha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit alpha" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 alpha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete alpha" })).not.toBeInTheDocument();
  });

  it("renders the empty state in Chinese and hides the English original", async () => {
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [] });
    renderWithProviders(<PluginSettings />);

    expect(await screen.findByText("暂无数据")).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });

  it("renders the manifest hint in Chinese in the same element and hides the English original", async () => {
    renderWithProviders(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    const hint = screen.getByText("GET /api/plugin-manifest").parentElement as HTMLElement;

    expect(hint).toHaveTextContent("每个插件都必须暴露 GET /api/plugin-manifest，返回导航项和功能。");
    expect(hint).not.toHaveTextContent(
      "Each plugin must expose GET /api/plugin-manifest returning nav items and capabilities.",
    );
  });

  it("renders the add dialog in Chinese and hides the English originals", async () => {
    renderWithProviders(<PluginSettings />);
    await screen.findByText("Alpha");

    await openDialog("添加插件");
    const dialog = await screen.findByRole("dialog");

    for (const [zh, en] of [
      ["名称（标识符）", "Name (identifier)"],
      [
        "用于 URL 和配置。不能包含空格。例如 litellm-platform-plugin",
        "Used in URLs and config. No spaces. E.g. litellm-platform-plugin",
      ],
      ["显示名称", "Display Name"],
      ["插件服务的 Base URL", "Base URL of the plugin service"],
      [
        "可选。插件自身的凭据，仅当 litellm 将 API 调用反向代理到插件后端（/plugin-proxy/<name>/*）时，才以 Authorization: Bearer <key> 注入。对于使用转发的 litellm 用户 Token 的插件（例如 iframe 插件）请留空，该路径使用用户的 Token，而不是此 Key。",
        "Optional. The plugin's own credential, injected as Authorization: Bearer <key> only when litellm reverse-proxies API calls to the plugin's backend (/plugin-proxy/<name>/*). Leave blank for plugins that use the forwarded litellm user token (e.g. iframe plugins) — that path uses the user's token, not this key.",
      ],
      ["取消", "Cancel"],
      ["保存", "Save"],
    ] as const) {
      expect(within(dialog).getAllByText(zh).length).toBeGreaterThan(0);
      expect(within(dialog).queryAllByText(en)).toHaveLength(0);
    }

    expect(within(dialog).getByPlaceholderText("sk-...（可选）")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("sk-... (optional)")).not.toBeInTheDocument();
    expect(within(dialog).getAllByText("URL").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Plugin Key").length).toBeGreaterThan(0);
  });

  it("renders the key placeholder and toggle in Chinese and hides the English originals", async () => {
    renderWithProviders(<PluginSettings />);
    await screen.findByText("Alpha");

    await openDialog("编辑 alpha");
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("编辑插件")).toBeInTheDocument();
    expect(within(dialog).queryByText("Edit Plugin")).not.toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("留空以保留当前 Key")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("Leave blank to keep current key")).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("sk-...（可选）")).not.toBeInTheDocument();

    expect(within(dialog).getByRole("button", { name: "显示插件 Key" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Show plugin key" })).not.toBeInTheDocument();

    await user().click(within(dialog).getByRole("button", { name: "显示插件 Key" }));

    expect(within(dialog).getByRole("button", { name: "隐藏插件 Key" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Hide plugin key" })).not.toBeInTheDocument();
  });

  it("renders the validation messages in Chinese and hides the English originals", async () => {
    renderWithProviders(<PluginSettings />);
    await screen.findByText("Alpha");

    await openDialog("添加插件");
    await user().click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(screen.getAllByText("必填")).toHaveLength(3);
    });
    expect(screen.queryByText("Required")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("名称（标识符）"), { target: { value: "beta" } });
    fireEvent.change(screen.getByLabelText("显示名称"), { target: { value: "Beta" } });
    fireEvent.change(screen.getByLabelText("URL"), { target: { value: "notaurl" } });
    await user().click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(screen.getByText("必须是有效的 URL")).toBeInTheDocument();
    });
    expect(screen.queryByText("Must be a valid URL")).not.toBeInTheDocument();
  });
});

describe("PluginSettings English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    getConfigFieldSettingMock.mockResolvedValue({ field_value: [PLUGIN] });
    updateConfigFieldSettingMock.mockResolvedValue({});
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", async () => {
    renderWithProviders(<PluginSettings />);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();

    for (const value of [
      "Plugins",
      "Register external services as plugins. Once added, users can toggle to the plugin from the mode switcher in the top-left of the sidebar.",
      "Add Plugin",
      "Name",
      "Display Name",
      "Plugin Key",
      "Actions",
    ]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    expect(screen.getByRole("button", { name: "Edit alpha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete alpha" })).toBeInTheDocument();

    await openDialog("Edit alpha");
    expect(screen.getByText("Name (identifier)")).toBeInTheDocument();
    expect(screen.getByText("Used in URLs and config. No spaces. E.g. litellm-platform-plugin")).toBeInTheDocument();
    expect(screen.getByText("Base URL of the plugin service")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Leave blank to keep current key")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show plugin key" })).toBeInTheDocument();
  });
});
