import React from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";

import EmailSettings from "./email_settings";

const { serviceHealthCheck, setCallbacksCall } = vi.hoisted(() => ({
  serviceHealthCheck: vi.fn(),
  setCallbacksCall: vi.fn(),
}));

vi.mock("@/components/networking", () => ({ serviceHealthCheck, setCallbacksCall }));

vi.mock("./email_events", () => ({
  EmailEventSettings: () => <div>email event settings</div>,
}));

const alerts = [
  {
    name: "email",
    variables: {
      SMTP_HOST: "smtp.example.com",
      SMTP_PASSWORD: "********",
    },
  },
];

describe("EmailSettings Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setCallbacksCall.mockResolvedValue({});
    serviceHealthCheck.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese required marker and hides the English", () => {
    renderWithProviders(<EmailSettings accessToken="sk-test" premiumUser alerts={alerts} />);

    expect(screen.getAllByText("必填 *").length).toBeGreaterThan(0);
    expect(screen.queryByText("Required *")).not.toBeInTheDocument();
  });

  it("toasts the Chinese save confirmation and hides the English", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmailSettings accessToken="sk-test" premiumUser alerts={alerts} />);

    fireEvent.change(screen.getByDisplayValue("smtp.example.com"), { target: { value: "new.example.com" } });
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("邮件设置更新成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Email settings updated successfully");
  });
});
