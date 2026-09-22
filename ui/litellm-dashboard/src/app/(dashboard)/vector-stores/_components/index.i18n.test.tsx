import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { credentialListCall, vectorStoreDeleteCall, vectorStoreListCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { act, cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";

import VectorStoreManagement from "./index";

vi.mock("@/components/networking", () => ({
  vectorStoreListCall: vi.fn(),
  vectorStoreDeleteCall: vi.fn(),
  credentialListCall: vi.fn(),
  indexesListCall: vi.fn(),
}));

vi.mock("./VectorStoreForm", () => ({ __esModule: true, default: () => null }));
vi.mock("./CreateVectorStore", () => ({ __esModule: true, default: () => null }));
vi.mock("./TestVectorStoreTab", () => ({ __esModule: true, default: () => null }));
vi.mock("./IndexesTab", () => ({ __esModule: true, default: () => null }));
vi.mock("./vector_store_info", () => ({ __esModule: true, default: () => null }));

const mockVectorStoreListCall = vi.mocked(vectorStoreListCall);
const mockVectorStoreDeleteCall = vi.mocked(vectorStoreDeleteCall);
const mockCredentialListCall = vi.mocked(credentialListCall);

const store = {
  vector_store_id: "vs-1",
  vector_store_name: "support-docs-store",
  custom_llm_provider: "bedrock",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const renderPanel = () =>
  renderWithProviders(
    <VectorStoreManagement accessToken="sk-test" userID="user-1" userRole="Admin" isViewOnly={false} />,
  );

const openManageTab = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("tab", { name: "管理向量存储" }));
};

describe("VectorStoreManagement Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockVectorStoreListCall.mockResolvedValue({ data: [store] });
    mockCredentialListCall.mockResolvedValue({ credentials: [] });
    mockVectorStoreDeleteCall.mockResolvedValue({});
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese header, description, tabs and add button", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(await screen.findByRole("heading", { name: "向量存储管理" })).toBeInTheDocument();
    expect(screen.queryByText("Vector Store Management")).not.toBeInTheDocument();
    expect(screen.getByText("你可以使用向量存储来存储和检索 LLM Embedding。")).toBeInTheDocument();
    expect(
      screen.queryByText("You can use vector stores to store and retrieve LLM embeddings."),
    ).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["创建向量存储", "Create Vector Store"],
      ["管理向量存储", "Manage Vector Stores"],
      ["测试向量存储", "Test Vector Store"],
      ["索引", "Indexes"],
    ] as const) {
      expect(screen.getByRole("tab", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: en })).not.toBeInTheDocument();
    }

    const refresh = screen.getByLabelText("刷新");
    expect(refresh).toBeInTheDocument();
    expect(screen.queryByLabelText("Refresh")).not.toBeInTheDocument();

    await openManageTab(user);
    expect(screen.getByRole("button", { name: "+ 添加向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add Vector Store" })).not.toBeInTheDocument();
  });

  it("renders the Chinese last-refreshed timestamp after a refresh", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByLabelText("刷新"));

    expect(screen.getByText(/^上次刷新：\d{4}-\d{2}-\d{2} /)).toBeInTheDocument();
    expect(screen.queryByText(/^Last Refreshed:/)).not.toBeInTheDocument();
  });

  it("renders the Chinese delete dialog and shows the Chinese deleted toast after confirming", async () => {
    const user = userEvent.setup();
    renderPanel();
    await openManageTab(user);

    await user.click(screen.getByTestId("vector-store-actions-vs-1"));
    await user.click(await screen.findByTestId("vector-store-action-delete"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("删除向量存储")).toBeInTheDocument();
    expect(within(dialog).queryByText("Delete Vector Store")).not.toBeInTheDocument();
    expect(within(dialog).getByText("确定要删除此向量存储？此操作无法撤销。")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Are you sure you want to delete this vector store/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("向量存储信息")).toBeInTheDocument();
    expect(within(dialog).queryByText("Vector Store Information")).not.toBeInTheDocument();
    expect(within(dialog).getByText("向量存储 ID")).toBeInTheDocument();
    expect(within(dialog).queryByText("Vector Store ID")).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("向量存储删除成功"));
    });
    expect(toast.success).not.toHaveBeenCalledWith("Vector store deleted successfully");
  });

  it("shows the Chinese vector-store fetch failure toast", async () => {
    mockVectorStoreListCall.mockRejectedValue(new Error("boom"));
    renderPanel();

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取向量存储失败：Error: boom"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching vector stores: Error: boom");
  });

  it("shows the Chinese credentials fetch failure toast", async () => {
    mockCredentialListCall.mockRejectedValue(new Error("boom"));
    renderPanel();

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("获取凭证失败：Error: boom"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Error fetching credentials: Error: boom");
  });

  it("shows the Chinese delete failure toast", async () => {
    const user = userEvent.setup();
    mockVectorStoreDeleteCall.mockRejectedValue(new Error("boom"));
    renderPanel();
    await openManageTab(user);

    await user.click(screen.getByTestId("vector-store-actions-vs-1"));
    await user.click(await screen.findByTestId("vector-store-action-delete"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /删除/ }));

    await act(async () => {
      await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("删除向量存储失败：Error: boom"));
    });
    expect(toast.fromError).not.toHaveBeenCalledWith("Error deleting vector store: Error: boom");
  });
});
