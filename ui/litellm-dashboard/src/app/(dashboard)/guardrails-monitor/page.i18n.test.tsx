import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import GuardrailsMonitor from "./page";

const { useAuthorizedMock, useCanMock } = vi.hoisted(() => ({
  useAuthorizedMock: vi.fn(),
  useCanMock: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: useAuthorizedMock }));
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({ default: useCanMock }));

describe("GuardrailsMonitor page Chinese copy", () => {
  beforeEach(async () => {
    useAuthorizedMock.mockReturnValue({ accessToken: "sk-test" });
    useCanMock.mockReturnValue(false);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese admin-only notice title", () => {
    renderWithProviders(<GuardrailsMonitor />);

    expect(screen.getByRole("heading", { name: "Guardrails 监控", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Guardrails Monitor" })).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails 监控 仅对管理员用户可用。")).toBeInTheDocument();
    expect(screen.queryByText("Guardrails Monitor is only available to admin users.")).not.toBeInTheDocument();
  });
});
