import React, { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";

import KeyLifecycleSettings from "./KeyLifecycleSettings";

const Harness: React.FC<{ isCreateMode?: boolean }> = ({ isCreateMode = true }) => {
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(false);
  const [rotationInterval, setRotationInterval] = useState("");
  const [neverExpire, setNeverExpire] = useState(false);
  return (
    <KeyLifecycleSettings
      value=""
      onChange={vi.fn()}
      autoRotationEnabled={autoRotationEnabled}
      onAutoRotationChange={setAutoRotationEnabled}
      rotationInterval={rotationInterval}
      onRotationIntervalChange={setRotationInterval}
      isCreateMode={isCreateMode}
      neverExpire={neverExpire}
      onNeverExpireChange={setNeverExpire}
    />
  );
};

describe("KeyLifecycleSettings Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese expiry copy and hides the English originals", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByText("密钥过期设置")).toBeInTheDocument();
    expect(screen.getByText("密钥过期")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "设置此密钥的过期时间。格式：30s（秒）、30m（分钟）、30h（小时）、30d（天）。留空则保持当前过期时间不变。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 30d，或留空表示永不过期")).toBeInTheDocument();

    expect(screen.queryByText("Key Expiry Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Expire Key")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., 30d or leave empty to never expire")).not.toBeInTheDocument();
  });

  it("renders the Chinese never-expire label and edit placeholder and hides the English originals", () => {
    renderWithProviders(<Harness isCreateMode={false} />);

    expect(screen.getByText("永不过期")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 30d")).toBeInTheDocument();
    expect(screen.queryByText("Never Expire")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., 30d")).not.toBeInTheDocument();
  });

  it("renders the Chinese rotation settings and interval options and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(screen.getByText("自动轮换设置")).toBeInTheDocument();
    expect(screen.getByText("启用自动轮换")).toBeInTheDocument();
    expect(screen.getByLabelText("密钥将按指定间隔自动重新生成，以增强安全性。")).toBeInTheDocument();
    expect(screen.queryByText("Auto-Rotation Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Enable Auto-Rotation")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch"));

    expect(screen.getByText("轮换间隔")).toBeInTheDocument();
    expect(screen.getByText("选择间隔")).toBeInTheDocument();
    expect(screen.getByLabelText("密钥自动轮换的频率。请选择最符合你安全需求的间隔。")).toBeInTheDocument();
    expect(screen.getByText("轮换发生时，你会收到包含新密钥的通知。旧密钥将在短暂宽限期后停用。")).toBeInTheDocument();
    expect(screen.queryByText("Rotation Interval")).not.toBeInTheDocument();
    expect(screen.queryByText(/When rotation occurs/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("7 天")).toBeInTheDocument();
    expect(screen.getByText("30 天")).toBeInTheDocument();
    expect(screen.getByText("90 天")).toBeInTheDocument();
    expect(screen.getByText("180 天")).toBeInTheDocument();
    expect(screen.getByText("365 天")).toBeInTheDocument();
    expect(screen.getByText("自定义间隔")).toBeInTheDocument();
    expect(screen.queryByText("7 days")).not.toBeInTheDocument();
    expect(screen.queryByText("Custom interval")).not.toBeInTheDocument();
  });

  it("renders the Chinese custom-interval copy and hides the English originals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("自定义间隔"));

    expect(await screen.findByPlaceholderText("例如 1s, 5m, 2h, 14d")).toBeInTheDocument();
    expect(screen.getByText("支持的格式：秒 (s)、分钟 (m)、小时 (h)、天 (d)")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., 1s, 5m, 2h, 14d")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Supported formats: seconds (s), minutes (m), hours (h), days (d)"),
    ).not.toBeInTheDocument();
  });
});
