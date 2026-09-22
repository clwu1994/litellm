import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VectorStore } from "@/components/vector_store_management/types";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VectorStoreTable from "./VectorStoreTable";

vi.mock("@/components/vector_store_providers", () => ({
  getVectorStoreProviderLogoAndName: (provider: string) => ({
    displayName: provider === "openai" ? "OpenAI" : provider,
    logo: "",
  }),
}));

const mockVectorStores: VectorStore[] = [
  {
    vector_store_id: "vs-two-files",
    custom_llm_provider: "openai",
    vector_store_name: "Two Files Store",
    vector_store_description: "A store with two files",
    vector_store_metadata: {
      ingested_files: [
        { filename: "a.pdf", ingested_at: "2024-01-15T10:00:00Z" },
        { filename: "b.pdf", ingested_at: "2024-01-15T10:00:00Z" },
      ],
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T11:00:00Z",
  },
  {
    vector_store_id: "vs-unknown-file",
    custom_llm_provider: "openai",
    vector_store_name: "Unknown File Store",
    vector_store_metadata: {
      ingested_files: [{ ingested_at: "2024-01-15T10:00:00Z" }],
    },
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-12T14:20:00Z",
  },
];

const renderTable = (props: Partial<ComponentProps<typeof VectorStoreTable>> = {}) =>
  renderWithProviders(
    <VectorStoreTable data={mockVectorStores} onView={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} {...props} />,
  );

describe("VectorStoreTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderTable();

    for (const [zh, en] of [
      ["向量存储 ID", "Vector Store ID"],
      ["名称", "Name"],
      ["描述", "Description"],
      ["文件", "Files"],
      ["提供方", "Provider"],
      ["创建时间", "Created At"],
      ["更新时间", "Updated At"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty state with the English original absent", () => {
    renderTable({ data: [] });

    expect(screen.getByText("未找到向量存储")).toBeInTheDocument();
    expect(screen.queryByText("No vector stores")).not.toBeInTheDocument();
    expect(screen.getByText("连接向量存储以启用检索增强生成。")).toBeInTheDocument();
    expect(
      screen.queryByText("Connect a vector store to enable retrieval-augmented generation."),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message with the English original absent", () => {
    renderTable({ data: [], isLoading: true });

    expect(screen.getByText("正在加载向量存储…")).toBeInTheDocument();
    expect(screen.queryByText("Loading vector stores…")).not.toBeInTheDocument();
  });

  it("renders the Chinese file counts with the English originals absent", () => {
    renderTable();

    expect(screen.getByText("2 个文件")).toBeInTheDocument();
    expect(screen.queryByText("2 files")).not.toBeInTheDocument();
    expect(screen.getByText("1 个文件")).toBeInTheDocument();
    expect(screen.queryByText("1 file")).not.toBeInTheDocument();
  });

  it("renders the Chinese unknown-file tooltip while it is open", async () => {
    const user = userEvent.setup({ delay: null });
    renderTable();

    await user.hover(screen.getByText("1 个文件"));

    expect(await screen.findByText("未知")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("renders the Chinese actions menu with the English originals absent", async () => {
    const user = userEvent.setup();
    renderTable();

    const trigger = screen.getByTestId("vector-store-actions-vs-two-files");
    expect(trigger).toHaveAttribute("aria-label", "打开向量存储操作");
    expect(screen.queryByLabelText("Open vector store actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "复制向量存储 ID" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copy vector store ID" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows the Chinese copy toast after copying a vector store ID", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByTestId("vector-store-actions-vs-two-files"));
    await user.click(await screen.findByTestId("vector-store-action-copy"));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制向量存储 ID"));
    expect(toast.success).not.toHaveBeenCalledWith("Vector store ID copied");
  });
});
