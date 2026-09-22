import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import { toast } from "@/lib/toast";

import CreatedKeyDisplay from "./CreatedKeyDisplay";

vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), fromError: vi.fn() } }));

describe("CreatedKeyDisplay Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese warning and hides the English original", () => {
    renderWithProviders(<CreatedKeyDisplay apiKey="sk-test-123" />);

    const warning =
      "请将此密钥保存在安全且可访问的地方。出于安全原因，你将无法再次查看它。如果丢失此密钥，你需要生成一个新的。";
    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === warning),
    ).toBeInTheDocument();
    expect(screen.queryByText(/you will not be able to view it again/i)).not.toBeInTheDocument();
  });

  it("renders the Chinese virtual-key label and copy button and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreatedKeyDisplay apiKey="sk-test-123" />);

    expect(screen.getByText("Virtual Key：")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制 Virtual Key" })).toBeInTheDocument();
    expect(screen.queryByText("Virtual Key:")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy Virtual Key" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "复制 Virtual Key" }));

    expect(screen.getByRole("button", { name: "已复制！" })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("密钥已复制到剪贴板");
  });
});
