import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import type { ComparisonInstance } from "../CompareUI";
import { EndpointId, ENDPOINT_CONFIGS } from "../endpoint_config";
import { ComparisonPanel } from "./ComparisonPanel";

vi.mock("./MessageDisplay", () => ({
  MessageDisplay: () => <div data-testid="message-display" />,
}));

vi.mock("./UnifiedSelector", () => ({
  UnifiedSelector: () => <div data-testid="unified-selector" />,
}));

vi.mock("@/components/tag_management/TagSelector", () => ({
  default: () => <div data-testid="tag-selector" />,
}));

vi.mock("@/components/vector_store_management/VectorStoreSelector", () => ({
  default: () => <div data-testid="vector-store-selector" />,
}));

vi.mock("@/components/guardrails/GuardrailSelector", () => ({
  default: () => <div data-testid="guardrail-selector" />,
}));

const mockComparison: ComparisonInstance = {
  id: "1",
  model: "gpt-4",
  agent: "",
  messages: [],
  isLoading: false,
  tags: [],
  mcpTools: [],
  vectorStores: [],
  guardrails: [],
  temperature: 1,
  maxTokens: 2048,
  applyAcrossModels: false,
  useAdvancedParams: false,
};

const mockProps = {
  comparison: mockComparison,
  onUpdate: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
  selectorOptions: [{ value: "gpt-4", label: "gpt-4" }],
  isLoadingOptions: false,
  endpointConfig: ENDPOINT_CONFIGS[EndpointId.CHAT_COMPLETIONS],
  apiKey: "test-api-key",
};

const openSettings = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.tab();
  await user.keyboard("{Enter}");
  await screen.findByText("常规设置");
};

describe("ComparisonPanel Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese settings popover chrome", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ComparisonPanel {...mockProps} />);

    await openSettings(user);

    expect(screen.getByText("常规设置")).toBeInTheDocument();
    expect(screen.queryByText("General Settings")).not.toBeInTheDocument();
    expect(screen.getByText("高级设置")).toBeInTheDocument();
    expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
    expect(screen.getByText("标签")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Vector Stores")).not.toBeInTheDocument();
    expect(screen.getByText("Guardrails")).toBeInTheDocument();
    expect(screen.getByText("最大 Token 数")).toBeInTheDocument();
    expect(screen.queryByText("Max Tokens")).not.toBeInTheDocument();
    expect(screen.getByText("Temperature")).toBeInTheDocument();
  });

  it("labels the sync checkbox in Chinese on both the control and the text", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ComparisonPanel {...mockProps} />);

    await openSettings(user);

    expect(screen.getByRole("checkbox", { name: "跨模型同步设置" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Sync Settings Across Models" })).not.toBeInTheDocument();
    expect(screen.getByText("跨模型同步设置")).toBeInTheDocument();
    expect(screen.queryByText("Sync Settings Across Models")).not.toBeInTheDocument();
  });

  it("labels the advanced-parameters checkbox in Chinese on both the control and the text", async () => {
    const user = userEvent.setup({ delay: null });
    render(<ComparisonPanel {...mockProps} />);

    await openSettings(user);

    expect(screen.getByRole("checkbox", { name: "使用高级参数" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Use Advanced Parameters" })).not.toBeInTheDocument();
    expect(screen.getByText("使用高级参数")).toBeInTheDocument();
    expect(screen.queryByText("Use Advanced Parameters")).not.toBeInTheDocument();
  });
});
