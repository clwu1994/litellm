import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VectorStore } from "@/components/vector_store_management/types";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import TestVectorStoreTab from "./TestVectorStoreTab";

vi.mock("./VectorStoreTester", () => ({
  VectorStoreTester: () => <div data-testid="vector-store-tester" />,
}));

const mockVectorStores: VectorStore[] = [
  {
    vector_store_id: "vs_123",
    custom_llm_provider: "openai",
    vector_store_name: "Test Store 1",
    vector_store_description: "Description 1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    vector_store_id: "vs_456",
    custom_llm_provider: "bedrock",
    vector_store_name: "Test Store 2",
    vector_store_description: "Description 2",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

const renderTab = (accessToken: string | null = "test-token", vectorStores = mockVectorStores) =>
  renderWithProviders(<TestVectorStoreTab accessToken={accessToken} vectorStores={vectorStores} />);

describe("TestVectorStoreTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese store selector chrome with the English originals absent", () => {
    renderTab();

    expect(screen.getByRole("heading", { name: "选择向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Select Vector Store" })).not.toBeInTheDocument();
    expect(screen.getByText("选择要对其测试搜索查询的向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Choose a vector store to test search queries against")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择向量存储")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select a vector store")).not.toBeInTheDocument();
  });

  it("renders the Chinese access-token empty state with the English original absent", () => {
    renderTab(null);

    expect(screen.getByText("测试向量存储需要 access token。")).toBeInTheDocument();
    expect(screen.queryByText("Access token is required to test vector stores.")).not.toBeInTheDocument();
  });

  it("renders the Chinese no-stores empty state with the English original absent", () => {
    renderTab("test-token", []);

    expect(screen.getByText("没有可用的向量存储。请先创建一个再进行测试。")).toBeInTheDocument();
    expect(screen.queryByText("No vector stores available. Create one first to test it.")).not.toBeInTheDocument();
  });

  it("renders the Chinese combobox empty state while the popup is open", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderTab();

    const input = screen.getByPlaceholderText("选择向量存储");
    await user.click(input);
    await user.type(input, "zzz");

    expect(await screen.findByText("未找到匹配的向量存储")).toBeInTheDocument();
    expect(screen.queryByText("No matching vector stores")).not.toBeInTheDocument();
  });
});
