import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

vi.mock("@/contexts/PluginModeContext", () => ({
  usePluginMode: () => ({
    activePlugin: { name: "my-plugin", display_name: "Plugin X", url: "" },
    mode: "my-plugin",
    plugins: [],
    setMode: vi.fn(),
  }),
  PluginModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ accessToken: "tok" }),
}));

vi.mock("@/lib/http/client", () => ({
  createApiClient: () => ({ get: vi.fn().mockResolvedValue({}) }),
}));

import { AgentControlPlaneView } from "./layout";

describe("AgentControlPlaneView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese plugin placeholder and hides the English originals", () => {
    renderWithProviders(<AgentControlPlaneView />);

    expect(screen.getByText("插件")).toBeInTheDocument();
    expect(screen.queryByText("Plugin")).not.toBeInTheDocument();
    expect(screen.getByText("在设置中配置插件 URL")).toBeInTheDocument();
    expect(screen.queryByText("Configure the plugin URL in settings")).not.toBeInTheDocument();
  });
});
