import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { indexesListCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import IndexesTab from "./IndexesTab";

vi.mock("@/components/networking", () => ({
  indexesListCall: vi.fn(),
}));

vi.mock("./IndexesTable", () => ({ __esModule: true, default: () => null }));

const mockIndexesListCall = vi.mocked(indexesListCall);

describe("IndexesTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockIndexesListCall.mockResolvedValue({ object: "list", data: [] });
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese about paragraph with the English original absent", async () => {
    renderWithProviders(<IndexesTab accessToken="sk-test" vectorStores={[]} onViewVectorStore={vi.fn()} />);

    const paragraph = await screen.findByText(/向量存储索引通过/);
    expect(paragraph).toHaveTextContent(
      "向量存储索引通过 /v1/indexes API 在此代理上注册。有关工作原理，请参阅向量存储索引文档。目前 Azure AI Search 和 Milvus 支持索引透传；未来可以添加对更多提供方的支持，因此如果你希望支持你的提供方，请提交 GitHub Issue。",
    );
    expect(screen.queryByText(/Vector store indexes registered on this proxy/)).not.toBeInTheDocument();
    expect(screen.getByText("/v1/indexes")).toBeInTheDocument();
  });

  it("renders the Chinese documentation and issue links with the English originals absent", async () => {
    renderWithProviders(<IndexesTab accessToken="sk-test" vectorStores={[]} onViewVectorStore={vi.fn()} />);

    expect(await screen.findByRole("link", { name: "向量存储索引文档" })).toHaveAttribute(
      "href",
      "https://docs.litellm.ai/docs/providers/azure_ai/azure_ai_vector_stores_passthrough",
    );
    expect(screen.queryByRole("link", { name: "vector store index docs" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "提交 GitHub Issue" })).toHaveAttribute(
      "href",
      "https://github.com/BerriAI/litellm/issues",
    );
    expect(screen.queryByRole("link", { name: "file a GitHub issue" })).not.toBeInTheDocument();
  });
});
