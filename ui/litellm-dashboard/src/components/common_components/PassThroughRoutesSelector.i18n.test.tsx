import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { getPassThroughEndpointsCall } from "../networking";

import PassThroughRoutesSelector from "./PassThroughRoutesSelector";

vi.mock("../networking", () => ({
  getPassThroughEndpointsCall: vi.fn(),
}));

const mockGetEndpoints = vi.mocked(getPassThroughEndpointsCall);

describe("PassThroughRoutesSelector Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetEndpoints.mockResolvedValue({ endpoints: [] } as never);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese placeholder and hides the English default", async () => {
    renderWithProviders(<PassThroughRoutesSelector accessToken="token" />);

    expect(await screen.findByPlaceholderText("选择透传路由")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select pass through routes")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty text and hides the English original", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PassThroughRoutesSelector accessToken="token" />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("未找到透传路由")).toBeInTheDocument();
    expect(screen.queryByText("No pass through routes found")).not.toBeInTheDocument();
  });
});
