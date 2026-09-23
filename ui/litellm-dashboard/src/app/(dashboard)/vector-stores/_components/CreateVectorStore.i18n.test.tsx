/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import { ragIngestCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import CreateVectorStore from "./CreateVectorStore";

vi.mock("@/components/networking", () => ({
  ragIngestCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

const mockIngest = vi.mocked(ragIngestCall);
const mockFetchModels = vi.mocked(fetchAvailableModels);

const renderCreate = (accessToken: string | null = "test-token") =>
  renderWithProviders(<CreateVectorStore accessToken={accessToken} />);

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

const documentInput = () => screen.getByLabelText(/点击或将文件拖到此处上传/);

const addDocument = async () => {
  fireEvent.change(documentInput(), {
    target: { files: [new File(["content"], "test.pdf", { type: "application/pdf" })] },
  });
  await screen.findByText("已上传的文档（1）");
};

const chooseProvider = async (user: ReturnType<typeof userEvent.setup>, providerLabel: string) => {
  const trigger = screen.getAllByRole("combobox")[0];
  await user.click(trigger);
  if (trigger.getAttribute("aria-expanded") !== "true") {
    trigger.focus();
    await user.keyboard("{Enter}");
  }
  const options = await screen.findAllByText(providerLabel);
  await user.click(options[options.length - 1]);
};

const createButton = () => screen.getByRole("button", { name: "创建向量存储" });

const ingestResponse = { id: "i", status: "completed", vector_store_id: "vs_123", file_id: "f" };

describe("CreateVectorStore Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchModels.mockResolvedValue([]);
    mockIngest.mockResolvedValue(ingestResponse);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese page chrome with the English originals absent", async () => {
    renderCreate();

    expect(screen.getByRole("heading", { name: "创建向量存储" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create Vector Store" })).not.toBeInTheDocument();
    expect(createButton()).toBeInTheDocument();

    for (const [zh, en] of [
      [
        "上传文档并选择提供方，以创建包含 Embedding 内容的新向量存储。",
        "Upload documents and select a provider to create a new vector store with embedded content.",
      ],
      ["第 1 步：上传文档", "Step 1: Upload Documents"],
      [
        "上传一个或多个文档（PDF、TXT、DOCX、MD）。每个文件最大 50MB。",
        "Upload one or more documents (PDF, TXT, DOCX, MD). Maximum file size: 50MB per file.",
      ],
      ["点击或将文件拖到此处上传", "Click or drag files to this area to upload"],
      [
        "支持单个或批量上传。支持的格式：PDF、TXT、DOCX、MD",
        "Support for single or bulk upload. Supported formats: PDF, TXT, DOCX, MD",
      ],
      ["第 2 步：配置向量存储", "Step 2: Configure Vector Store"],
      [
        "选择提供方，并可选地为你的向量存储填写名称和描述。",
        "Choose the provider and optionally provide a name and description for your vector store.",
      ],
      ["向量存储名称", "Vector Store Name"],
      ["描述", "Description"],
      ["提供方", "Provider"],
    ] as const) {
      expect(screen.getByText(zh)).toBeInTheDocument();
      expect(screen.queryByText(en)).not.toBeInTheDocument();
    }
  });

  it("renders the Chinese field hints while they are open", async () => {
    const user = setupUser();
    renderCreate();

    const hoverHint = async (label: string) => {
      const trigger = screen.getByText(label).parentElement?.querySelector("svg");
      if (!trigger) throw new Error(`no hint trigger for ${label}`);
      await user.hover(trigger);
    };

    await hoverHint("向量存储名称");
    expect(await screen.findByText("可选：为你的向量存储起一个有意义的名称")).toBeInTheDocument();
    expect(screen.queryByText("Optional: Give your vector store a meaningful name")).not.toBeInTheDocument();

    await hoverHint("描述");
    expect(await screen.findByText("可选：描述此向量存储的内容")).toBeInTheDocument();
    expect(screen.queryByText("Optional: Describe what this vector store contains")).not.toBeInTheDocument();

    await hoverHint("提供方");
    expect(await screen.findByText("选择用于 Embedding 和向量存储操作的提供方")).toBeInTheDocument();
    expect(screen.queryByText("Select the provider for embedding and vector store operations")).not.toBeInTheDocument();
  });

  it("renders a provider field's Chinese label and hint from the provider table", async () => {
    const user = setupUser();
    renderCreate();
    await chooseProvider(user, "Milvus");

    const label = screen.getByText("Embedding 模型");
    expect(label).toBeInTheDocument();
    expect(screen.queryByText("Embedding Model")).not.toBeInTheDocument();

    const trigger = label.querySelector("svg");
    if (!trigger) throw new Error("no hint trigger for Embedding 模型");
    await user.hover(trigger);

    expect(await screen.findByText("选择要使用的 Embedding 模型")).toBeInTheDocument();
    expect(screen.queryByText("Select the embedding model to use")).not.toBeInTheDocument();
  });

  it("renders the Chinese name and description placeholders with the English originals absent", () => {
    renderCreate();

    expect(screen.getByPlaceholderText("例如：产品文档、客户支持知识库")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("e.g., Product Documentation, Customer Support KB")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：包含所有产品文档和用户指南")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("e.g., Contains all product documentation and user guides"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese uploaded-documents count with the English original absent", async () => {
    renderCreate();

    await addDocument();

    expect(screen.getByText("已上传的文档（1）")).toBeInTheDocument();
    expect(screen.queryByText("Uploaded Documents (1)")).not.toBeInTheDocument();
  });

  it("rejects an unsupported file with the Chinese toast", () => {
    renderCreate();

    fireEvent.change(documentInput(), {
      target: { files: [new File(["content"], "report.csv", { type: "text/csv" })] },
    });

    expect(toast.error).toHaveBeenCalledWith("report.csv 不是受支持的文件类型。请上传 PDF、TXT、DOCX 或 MD 文件。");
    expect(toast.error).not.toHaveBeenCalledWith(
      "report.csv is not a supported file type. Please upload PDF, TXT, DOCX, or MD files.",
    );
  });

  it("rejects an oversized file with the Chinese toast", () => {
    renderCreate();

    const oversized = new File(["content"], "huge.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 50 * 1024 * 1024 });
    fireEvent.change(documentInput(), { target: { files: [oversized] } });

    expect(toast.error).toHaveBeenCalledWith("huge.pdf 必须小于 50MB！");
    expect(toast.error).not.toHaveBeenCalledWith("huge.pdf must be smaller than 50MB!");
  });

  it("shows the Chinese missing-provider-field toast with the English original absent", async () => {
    const user = setupUser();
    renderCreate();
    await addDocument();
    await chooseProvider(user, "PostgreSQL pgvector (LiteLLM Connector)");

    await user.click(createButton());

    await vi.waitFor(() => expect(toast.warning).toHaveBeenCalledWith("请提供 API Base"));
    expect(toast.warning).not.toHaveBeenCalledWith("Please provide API Base");
    expect(mockIngest).not.toHaveBeenCalled();
  });

  it("shows the Chinese no-access-token toast with the English original absent", async () => {
    const user = setupUser();
    renderCreate(null);
    await addDocument();

    await user.click(createButton());

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("没有可用的 access token"));
    expect(toast.error).not.toHaveBeenCalledWith("No access token available");
  });

  it("shows the Chinese creating label while the ingest is in flight", async () => {
    const user = setupUser();
    mockIngest.mockImplementation(() => new Promise(() => {}));
    renderCreate();
    await addDocument();

    await user.click(createButton());

    expect(await screen.findByRole("button", { name: "正在创建向量存储..." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Creating Vector Store..." })).not.toBeInTheDocument();
  });

  it("shows the Chinese success alert and created toast with the English originals absent", async () => {
    const user = setupUser();
    renderCreate();
    await addDocument();

    await user.click(createButton());

    expect(await screen.findByText("向量存储已成功创建")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store Created Successfully")).not.toBeInTheDocument();
    expect(screen.getByText("向量存储 ID：")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store ID:")).not.toBeInTheDocument();
    expect(screen.getByText("已导入文档数：")).toBeInTheDocument();
    expect(screen.queryByText("Documents Ingested:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("成功创建向量存储，包含 1 个文档。向量存储 ID：vs_123"),
    );
    expect(toast.success).not.toHaveBeenCalledWith(
      "Successfully created vector store with 1 document(s). Vector Store ID: vs_123",
    );
  });

  it("shows the Chinese ingest-failure toast with the English original absent", async () => {
    const user = setupUser();
    mockIngest.mockRejectedValue(new Error("boom"));
    renderCreate();
    await addDocument();

    await user.click(createButton());

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("无法创建向量存储：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Failed to create vector store: Error: boom");
  });
});
