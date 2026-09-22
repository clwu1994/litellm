/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import i18n from "@/i18n/bootstrapI18n";
import { act, cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import S3VectorsConfig from "./S3VectorsConfig";

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

const mockFetchModels = vi.mocked(fetchAvailableModels);

const renderConfig = (providerParams: Record<string, unknown> = {}) =>
  renderWithProviders(
    <S3VectorsConfig accessToken="test-token" providerParams={providerParams} onParamsChange={vi.fn()} />,
  );

const renderSettled = async (providerParams: Record<string, unknown> = {}) => {
  renderConfig(providerParams);
  await act(async () => {});
};

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
};

const renderedText = (text: string) => (_content: string, element: Element | null) => element?.textContent === text;

const expectZhNotEn = (zh: string, en: string) => {
  expect(screen.getByText(zh)).toBeInTheDocument();
  expect(screen.queryByText(en)).not.toBeInTheDocument();
};

describe("S3VectorsConfig Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchModels.mockResolvedValue([]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese setup alert with the English originals absent", async () => {
    await renderSettled();

    expect(screen.getByText(renderedText("了解更多：AWS S3 Vectors 文档"))).toBeInTheDocument();
    expect(screen.queryByText(renderedText("Learn more: AWS S3 Vectors Documentation"))).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["AWS S3 Vectors 设置", "AWS S3 Vectors Setup"],
      [
        "AWS S3 Vectors 允许你直接在 S3 中存储和查询向量 Embedding：",
        "AWS S3 Vectors allows you to store and query vector embeddings directly in S3:",
      ],
      [
        "如果不存在，向量存储桶和索引将自动创建",
        "Vector buckets and indexes will be automatically created if they don't exist",
      ],
      [
        "向量维度会根据你选择的 Embedding 模型自动检测",
        "Vector dimensions are auto-detected from your selected embedding model",
      ],
      [
        "确保你的 AWS 凭证具有 S3 Vectors 操作的权限",
        "Ensure your AWS credentials have permissions for S3 Vectors operations",
      ],
    ] as const) {
      expectZhNotEn(zh, en);
    }
  });

  it("renders the Chinese field labels with the English originals absent", async () => {
    await renderSettled();

    for (const [zh, en] of [
      ["向量存储桶名称", "Vector Bucket Name"],
      ["索引名称", "Index Name"],
      ["AWS 区域", "AWS Region"],
      ["Embedding 模型", "Embedding Model"],
    ] as const) {
      expectZhNotEn(zh, en);
    }
  });

  it("renders the Chinese field hints while they are open", async () => {
    const user = setupUser();
    await renderSettled();

    await hoverHint(user, "向量存储桶名称");
    expect(
      await screen.findByText(
        "用于向量存储的 S3 存储桶名称（必须至少 3 个字符，只能包含小写字母、数字、连字符和句点）",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "S3 bucket name for vector storage (must be at least 3 characters, lowercase letters, numbers, hyphens, and periods only)",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "索引名称");
    expect(
      await screen.findByText("向量索引的名称（可选，未提供时将自动生成）。如果提供，必须至少 3 个字符。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Name for the vector index (optional, will be auto-generated if not provided). If provided, must be at least 3 characters.",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "AWS 区域");
    expect(await screen.findByText("S3 存储桶所在的 AWS 区域（例如 us-west-2）")).toBeInTheDocument();
    expect(screen.queryByText("AWS region where the S3 bucket is located (e.g., us-west-2)")).not.toBeInTheDocument();

    await hoverHint(user, "Embedding 模型");
    expect(await screen.findByText("选择用于生成向量的 Embedding 模型")).toBeInTheDocument();
    expect(screen.queryByText("Select the embedding model to use for vector generation")).not.toBeInTheDocument();
  });

  it("renders the Chinese placeholders with the English originals absent", async () => {
    await renderSettled();

    expect(screen.getByPlaceholderText("my-vector-bucket（至少 3 个字符）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("my-vector-bucket (min 3 chars)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("my-vector-index（可选，至少 3 个字符）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("my-vector-index (optional, min 3 chars)")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择 Embedding 模型")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Select an embedding model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("us-west-2")).toBeInTheDocument();
  });

  it("renders the Chinese validation errors with the English originals absent", async () => {
    await renderSettled({ vector_bucket_name: "ab", index_name: "cd" });

    expect(screen.getByText("存储桶名称必须至少 3 个字符")).toBeInTheDocument();
    expect(screen.queryByText("Bucket name must be at least 3 characters")).not.toBeInTheDocument();
    expect(screen.getByText("如果提供索引名称，必须至少 3 个字符")).toBeInTheDocument();
    expect(screen.queryByText("Index name must be at least 3 characters if provided")).not.toBeInTheDocument();
  });

  it("renders the Chinese loading state for the embedding model list", async () => {
    const user = setupUser();
    mockFetchModels.mockImplementation(() => new Promise(() => {}));
    renderConfig();

    await user.click(screen.getByPlaceholderText("选择 Embedding 模型"));

    expect(await screen.findByText("正在加载模型...")).toBeInTheDocument();
    expect(screen.queryByText("Loading models...")).not.toBeInTheDocument();
  });

  it("renders the Chinese empty state for the embedding model list", async () => {
    const user = setupUser();
    await renderSettled();

    await user.click(screen.getByPlaceholderText("选择 Embedding 模型"));

    expect(await screen.findByText("未找到 Embedding 模型。")).toBeInTheDocument();
    expect(screen.queryByText("No embedding models found.")).not.toBeInTheDocument();
  });
});
