import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import { RateLimitTypeFormItem } from "./RateLimitTypeFormItem";

describe("RateLimitTypeFormItem Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese label and placeholder and hides the English originals", () => {
    renderWithProviders(<RateLimitTypeFormItem type="tpm" name="tpm_type" />);

    expect(screen.getByText("TPM 速率限制类型")).toBeInTheDocument();
    expect(screen.getByText("选择速率限制类型")).toBeInTheDocument();
    expect(
      screen.getByLabelText("当密钥属于具有特定 TPM 限制的团队时，选择 'guaranteed_throughput' 以防止超分 TPM 限制。"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/TPM Rate Limit Type/)).not.toBeInTheDocument();
    expect(screen.queryByText("Select rate limit type")).not.toBeInTheDocument();
  });

  it("renders the Chinese option labels and descriptions and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RateLimitTypeFormItem type="rpm" name="rpm_type" />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("默认")).toBeInTheDocument();
    expect(screen.getByText("保障吞吐量")).toBeInTheDocument();
    expect(screen.getByText("动态")).toBeInTheDocument();
    expect(
      screen.getByText("尽力而为吞吐量：如果超分 rpm 不会报错（团队/密钥限制在运行时检查）。"),
    ).toBeInTheDocument();
    expect(screen.getByText("保障吞吐量：如果超分 rpm 则报错（同时检查模型特定限制）")).toBeInTheDocument();
    expect(
      screen.getByText("如果密钥设置了 RPM（例如 2 RPM）且没有 429 错误，当被调用的模型未报错时，它可以动态超出限制。"),
    ).toBeInTheDocument();

    expect(screen.queryByText("Default")).not.toBeInTheDocument();
    expect(screen.queryByText("Guaranteed throughput")).not.toBeInTheDocument();
    expect(screen.queryByText("Dynamic")).not.toBeInTheDocument();
  });

  it("renders the Chinese plain option labels when detailed descriptions are off", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RateLimitTypeFormItem type="tpm" name="tpm_type" showDetailedDescriptions={false} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("尽力而为吞吐量")).toBeInTheDocument();
    expect(screen.queryByText("Best effort throughput")).not.toBeInTheDocument();
  });
});
