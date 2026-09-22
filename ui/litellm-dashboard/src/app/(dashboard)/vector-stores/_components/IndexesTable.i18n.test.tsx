import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import type { VectorStoreIndex } from "./IndexesTab";
import IndexesTable from "./IndexesTable";

vi.mock("next/navigation", async () => ({
  ...(await vi.importActual("next/navigation")),
  useRouter: () => ({ push: vi.fn() }),
}));

const index: VectorStoreIndex = {
  id: "idx-1",
  index_name: "newer-index",
  litellm_params: { vector_store_index: "provider-newer", vector_store_name: "newer-store" },
  created_by: "admin@example.com",
  created_at: "2024-02-20T10:30:00Z",
};

const renderTable = (data: VectorStoreIndex[], isLoading = false) =>
  renderWithProviders(
    <IndexesTable
      data={data}
      resolveVectorStoreId={() => undefined}
      onViewVectorStore={vi.fn()}
      isLoading={isLoading}
    />,
  );

describe("IndexesTable Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every Chinese column header with the English original absent", () => {
    renderTable([index]);

    for (const [zh, en] of [
      ["索引名称", "Index Name"],
      ["向量存储", "Vector Store"],
      ["提供方索引", "Provider Index"],
      ["创建者", "Created By"],
      ["创建时间", "Created At"],
    ] as const) {
      expect(screen.getByRole("columnheader", { name: zh })).toBeInTheDocument();
      expect(screen.queryByRole("columnheader", { name: en })).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese empty state with the English originals absent", () => {
    renderTable([]);

    expect(screen.getByText("尚未注册任何索引")).toBeInTheDocument();
    expect(screen.queryByText("No indexes registered yet")).not.toBeInTheDocument();
    expect(screen.getByText("在此代理上注册的索引将显示在这里。")).toBeInTheDocument();
    expect(screen.queryByText("Indexes registered on this proxy will appear here.")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading message with the English original absent", () => {
    renderTable([], true);

    expect(screen.getByText("正在加载索引…")).toBeInTheDocument();
    expect(screen.queryByText("Loading indexes…")).not.toBeInTheDocument();
  });
});
