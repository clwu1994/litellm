import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, screen } from "@/../tests/test-utils";

import { AutoRouterModelGroupsProvider, AutoRouterTag } from "./AutoRouterTag";

vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useAutoRouterModelGroups: vi.fn(),
}));

import { useAutoRouterModelGroups } from "@/app/(dashboard)/hooks/models/useModels";

const mockUseAutoRouterModelGroups = vi.mocked(useAutoRouterModelGroups);

describe("AutoRouterTag Chinese copy", () => {
  beforeEach(async () => {
    mockUseAutoRouterModelGroups.mockReturnValue(new Set(["smart-router"]));
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese router title and hides the English original", () => {
    render(
      <AutoRouterModelGroupsProvider>
        <AutoRouterTag modelGroup="smart-router" />
      </AutoRouterModelGroupsProvider>,
    );

    expect(screen.getByTitle('由 auto-router 路由 "smart-router"')).toBeInTheDocument();
    expect(screen.queryByTitle('Routed by auto-router "smart-router"')).not.toBeInTheDocument();
  });
});
