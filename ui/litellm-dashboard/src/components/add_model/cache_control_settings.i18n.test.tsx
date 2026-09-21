import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";

import CacheControlInjectionPoints, { type CacheControlInjectionPoint } from "./cache_control_settings";

const ONE_POINT: CacheControlInjectionPoint[] = [{ location: "message" }];

describe("CacheControlInjectionPoints Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese description, field labels and add button", () => {
    render(<CacheControlInjectionPoints value={ONE_POINT} onChange={vi.fn()} />);

    expect(
      screen.getByText(
        "Anthropic、Bedrock API 等提供商要求用户指定注入缓存控制检查点的位置，litellm 可以自动为你添加，作为一项节省成本的功能。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Providers like Anthropic, Bedrock API require users to specify where to inject cache control checkpoints, litellm can automatically add them for you as a cost saving feature.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.queryByText("Type")).not.toBeInTheDocument();
    expect(screen.getByText("角色")).toBeInTheDocument();
    expect(screen.getByText("索引")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("可选")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Optional")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加注入点" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Injection Point" })).not.toBeInTheDocument();
  });

  it("renders the Chinese role hint and its Chinese help aria label inside the open tooltip", async () => {
    const user = userEvent.setup();
    render(<CacheControlInjectionPoints value={ONE_POINT} onChange={vi.fn()} />);

    const help = screen.getByRole("button", { name: "角色帮助" });
    expect(screen.queryByRole("button", { name: "Role help" })).not.toBeInTheDocument();

    await user.hover(help);

    expect(await screen.findByText("LiteLLM 会将此角色的所有消息标记为可缓存")).toBeInTheDocument();
    expect(screen.queryByText("LiteLLM will mark all messages of this role as cacheable")).not.toBeInTheDocument();
  });

  it("renders the Chinese index hint inside the open tooltip", async () => {
    const user = userEvent.setup();
    render(<CacheControlInjectionPoints value={ONE_POINT} onChange={vi.fn()} />);

    await user.hover(screen.getByRole("button", { name: "索引帮助" }));

    expect(await screen.findByText("（可选）设置后，litellm 会将该索引处的消息标记为可缓存")).toBeInTheDocument();
    expect(
      screen.queryByText("(Optional) If set litellm will mark the message at this index as cacheable"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese remove aria label only while a second row exists", () => {
    render(
      <CacheControlInjectionPoints value={[{ location: "message" }, { location: "message" }]} onChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "移除注入点 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove injection point 1" })).not.toBeInTheDocument();

    cleanup();
    render(<CacheControlInjectionPoints value={ONE_POINT} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "移除注入点 1" })).not.toBeInTheDocument();
  });
});
