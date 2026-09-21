import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import { EndpointId, ENDPOINT_CONFIGS } from "../endpoint_config";
import { UnifiedSelector } from "./UnifiedSelector";

const CHAT = ENDPOINT_CONFIGS[EndpointId.CHAT_COMPLETIONS];
const AGENTS = ENDPOINT_CONFIGS[EndpointId.A2A_AGENTS];

const openList = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("combobox"));
};

describe("UnifiedSelector Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese model placeholder", () => {
    render(<UnifiedSelector value="" options={[]} loading={false} config={CHAT} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择一个模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a model")).not.toBeInTheDocument();
  });

  it("renders the Chinese agent placeholder", () => {
    render(<UnifiedSelector value="" options={[]} loading={false} config={AGENTS} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("选择一个 Agent")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an agent")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholder built from the model label", () => {
    render(<UnifiedSelector value="" options={[]} loading config={CHAT} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading placeholder built from the agent label", () => {
    render(<UnifiedSelector value="" options={[]} loading config={AGENTS} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText("正在加载Agent...")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Loading agents...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty list built from the model label", async () => {
    const user = userEvent.setup({ delay: null });
    render(<UnifiedSelector value="" options={[]} loading={false} config={CHAT} onChange={vi.fn()} />);

    await openList(user);

    expect(await screen.findByText("没有可用的模型")).toBeInTheDocument();
    expect(screen.queryByText("No models available")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty list built from the agent label", async () => {
    const user = userEvent.setup({ delay: null });
    render(<UnifiedSelector value="" options={[]} loading={false} config={AGENTS} onChange={vi.fn()} />);

    await openList(user);

    expect(await screen.findByText("没有可用的Agent")).toBeInTheDocument();
    expect(screen.queryByText("No agents available")).not.toBeInTheDocument();
  });
});
