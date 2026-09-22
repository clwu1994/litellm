import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import RouterSettings from "./index";

vi.mock("@/components/networking", () => ({
  getCallbacksCall: vi.fn(),
  getRouterSettingsCall: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

import { getCallbacksCall, getRouterSettingsCall, setCallbacksCall } from "@/components/networking";
import { toast } from "@/lib/toast";

const defaultProps = {
  accessToken: "test-token",
  userRole: "Admin",
  userID: "user-1",
};

const findStrategySelect = () => screen.findByRole("combobox");

describe("RouterSettings page Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getCallbacksCall).mockResolvedValue({
      router_settings: { routing_strategy: "simple-shuffle", num_retries: 3 },
    });
    vi.mocked(getRouterSettingsCall).mockResolvedValue({
      fields: [
        {
          field_name: "routing_strategy",
          ui_field_name: "Routing Strategy",
          field_description: "How requests are distributed",
          options: ["simple-shuffle"],
          link: null,
        },
      ],
      routing_strategy_descriptions: {},
    });
    vi.mocked(setCallbacksCall).mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the page actions in Chinese", async () => {
    renderWithProviders(<RouterSettings {...defaultProps} />);
    await findStrategySelect();

    expect(screen.getByRole("button", { name: "重置" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });

  it("reports a successful save in Chinese", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterSettings {...defaultProps} />);
    await findStrategySelect();

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("路由设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("router settings updated successfully");
  });

  it("reports a failed save in Chinese", async () => {
    const user = userEvent.setup();
    vi.mocked(setCallbacksCall).mockRejectedValue(new Error("422 Unprocessable Entity"));
    renderWithProviders(<RouterSettings {...defaultProps} />);
    await findStrategySelect();

    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() =>
      expect(toast.fromError).toHaveBeenCalledWith("更新路由设置失败：Error: 422 Unprocessable Entity"),
    );
    expect(toast.fromError).not.toHaveBeenCalledWith(
      "Failed to update router settings: Error: 422 Unprocessable Entity",
    );
  });
});
