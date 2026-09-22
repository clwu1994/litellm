import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentUpload } from "@/components/vector_store_management/types";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import DocumentsTable from "./DocumentsTable";

const mockDocuments: DocumentUpload[] = [
  { uid: "1", name: "test1.pdf", status: "done", size: 1024000, type: "application/pdf" },
  { uid: "2", name: "test2.txt", status: "uploading", size: 2048000, type: "text/plain" },
  { uid: "3", name: "test3.docx", status: "error", size: 512000, type: "text/plain" },
];

describe("DocumentsTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderWithProviders(<DocumentsTable documents={mockDocuments} onRemove={vi.fn()} />);

    for (const [zh, en] of [
      ["名称", "Name"],
      ["状态", "Status"],
      ["操作", "Actions"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese status badges with the English originals absent", () => {
    renderWithProviders(<DocumentsTable documents={mockDocuments} onRemove={vi.fn()} />);

    for (const [zh, en] of [
      ["就绪", "Ready"],
      ["上传中", "Uploading"],
      ["错误", "Error"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty state with the English originals absent", () => {
    renderWithProviders(<DocumentsTable documents={[]} onRemove={vi.fn()} />);

    expect(screen.getByText("尚未上传任何文档")).toBeInTheDocument();
    expect(screen.queryByText("No documents uploaded yet")).not.toBeInTheDocument();
    expect(screen.getByText("请在上方上传文档以开始。")).toBeInTheDocument();
    expect(screen.queryByText("Upload documents above to get started.")).not.toBeInTheDocument();
  });

  it("renders the Chinese actions menu with the English originals absent", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithProviders(<DocumentsTable documents={mockDocuments} onRemove={onRemove} />);

    const trigger = screen.getByTestId("document-actions-1");
    expect(trigger).toHaveAttribute("aria-label", "打开文档操作");
    expect(screen.queryByLabelText("Open document actions")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: "复制文档 ID" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Copy document ID" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "移除" }));
    expect(onRemove).toHaveBeenCalledWith("1");
    expect(screen.queryByRole("menuitem", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows the Chinese copy toast after copying a document ID", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DocumentsTable documents={mockDocuments} onRemove={vi.fn()} />);

    await user.click(screen.getByTestId("document-actions-2"));
    await user.click(await screen.findByTestId("document-action-copy"));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("已复制文档 ID 到剪贴板"));
    expect(toast.success).not.toHaveBeenCalledWith("Document ID copied to clipboard");
  });
});
