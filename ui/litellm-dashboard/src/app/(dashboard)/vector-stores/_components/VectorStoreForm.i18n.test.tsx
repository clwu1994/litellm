/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import { vectorStoreCreateCall } from "@/components/networking";
import i18n from "@/i18n/bootstrapI18n";
import { toast } from "@/lib/toast";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VectorStoreForm from "./VectorStoreForm";

vi.mock("@/components/networking", () => ({
  vectorStoreCreateCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

const mockCreate = vi.mocked(vectorStoreCreateCall);
const mockFetchModels = vi.mocked(fetchAvailableModels);

const renderForm = () =>
  renderWithProviders(
    <VectorStoreForm
      isVisible={true}
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      accessToken="test-token"
      credentials={[]}
    />,
  );

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

const hoverHint = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const trigger = screen.getByText(label).parentElement?.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger for ${label}`);
  await user.hover(trigger);
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

const renderedText = (text: string) => (_content: string, element: Element | null) => element?.textContent === text;

const expectZhNotEn = (zh: string, en: string) => {
  expect(screen.getByText(zh)).toBeInTheDocument();
  expect(screen.queryByText(en)).not.toBeInTheDocument();
};

const expectRenderedZhNotEn = (zh: string, en: string) => {
  expect(screen.getByText(renderedText(zh))).toBeInTheDocument();
  expect(screen.queryByText(renderedText(en))).not.toBeInTheDocument();
};

describe("VectorStoreForm Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(undefined);
    mockFetchModels.mockResolvedValue([]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese dialog chrome with the English originals absent", async () => {
    renderForm();

    expect(await screen.findByText("添加新的向量存储")).toBeInTheDocument();
    expect(screen.queryByText("Add New Vector Store")).not.toBeInTheDocument();

    for (const [zh, en] of [
      ["提供方", "Provider"],
      ["向量存储 ID", "Vector Store ID"],
      ["向量存储名称", "Vector Store Name"],
      ["描述", "Description"],
      ["现有凭证", "Existing Credentials"],
      ["元数据", "Metadata"],
    ] as const) {
      expectZhNotEn(zh, en);
    }

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
  });

  it("renders the Chinese hint tooltips while they are open", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await hoverHint(user, "提供方");
    expect(await screen.findByText("选择此向量存储的提供方")).toBeInTheDocument();
    expect(screen.queryByText("Select the provider for this vector store")).not.toBeInTheDocument();

    await hoverHint(user, "向量存储 ID");
    expect(await screen.findByText("输入来自你的 API 提供方的向量存储 ID")).toBeInTheDocument();
    expect(screen.queryByText("Enter the vector store ID from your api provider")).not.toBeInTheDocument();

    await hoverHint(user, "向量存储名称");
    expect(await screen.findByText("你为此向量存储自定义的名称，该名称将显示在 LiteLLM UI 中")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Custom name you want to give to the vector store, this name will be rendered on the LiteLLM UI",
      ),
    ).not.toBeInTheDocument();

    await hoverHint(user, "现有凭证");
    expect(await screen.findByText("可选：为此向量存储选择 API 提供方凭证，例如 Bedrock API Key")).toBeInTheDocument();
    expect(
      screen.queryByText("Optionally select API provider credentials for this vector store eg. Bedrock API KEY"),
    ).not.toBeInTheDocument();

    await hoverHint(user, "元数据");
    expect(await screen.findByText("向量存储的 JSON 元数据（可选）")).toBeInTheDocument();
    expect(screen.queryByText("JSON metadata for the vector store (optional)")).not.toBeInTheDocument();
  });

  it("renders the Chinese credential combobox with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    const input = screen.getByPlaceholderText("选择或搜索现有凭证");
    expect(screen.queryByPlaceholderText("Select or search for existing credentials")).not.toBeInTheDocument();

    await user.click(input);
    expect(await screen.findByText("无")).toBeInTheDocument();
    expect(screen.queryByText("None")).not.toBeInTheDocument();

    await user.type(input, "zzz");
    expect(await screen.findByText("未找到匹配的凭证")).toBeInTheDocument();
    expect(screen.queryByText("No matching credentials")).not.toBeInTheDocument();
  });

  it("renders the Chinese default vector store id placeholder with the English original absent", async () => {
    renderForm();

    expect(await screen.findByPlaceholderText("输入你的提供方提供的向量存储 ID")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter vector store ID from your provider")).not.toBeInTheDocument();
  });

  it("renders each provider's Chinese vector store id placeholder with the English original absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await chooseProvider(user, "Valkey");
    expect(screen.getByPlaceholderText("my-search-index（Valkey 中的 FT 索引名称）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("my-search-index (FT index name in Valkey)")).not.toBeInTheDocument();

    await chooseProvider(user, "MongoDB (BETA)");
    expect(screen.getByPlaceholderText("my-vector-index（MongoDB Vector Search 索引名称）")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("my-vector-index (MongoDB Vector Search index name)")).not.toBeInTheDocument();

    await chooseProvider(user, "Vertex AI Search");
    expect(
      screen.getByPlaceholderText("my-datastore_1234567890（来自 Vertex AI / “Agent Search” 控制台的数据存储 ID）"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('my-datastore_1234567890 (data store ID from Vertex AI / "Agent Search" console)'),
    ).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("e.g. my-search-app_1234567890"), "engine-1");
    expect(await screen.findByPlaceholderText("你用来在 LiteLLM 中引用它的任意标识符")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Any identifier you'll use to reference this in LiteLLM"),
    ).not.toBeInTheDocument();
  });

  it("renders the Chinese password reveal labels with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");
    await chooseProvider(user, "Milvus");

    const reveal = await screen.findByRole("button", { name: "显示密码" });
    expect(screen.queryByRole("button", { name: "Show Password" })).not.toBeInTheDocument();

    await user.click(reveal);
    expect(await screen.findByRole("button", { name: "隐藏密码" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hide Password" })).not.toBeInTheDocument();
  });

  it("renders the Chinese no-matching-options empty state for a provider select field", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");
    await chooseProvider(user, "Milvus");

    await user.click(screen.getByPlaceholderText("text-embedding-3-small"));

    expect(await screen.findByText("未找到匹配的选项")).toBeInTheDocument();
    expect(screen.queryByText("No matching options")).not.toBeInTheDocument();
  });

  it("renders the Chinese required-id message with the English original absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(await screen.findByText("请输入来自你的 api 提供方的向量存储 ID")).toBeInTheDocument();
    expect(screen.queryByText("Please input the vector store ID from your api provider")).not.toBeInTheDocument();
  });

  it("renders the Chinese provider-field validation messages with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await chooseProvider(user, "PostgreSQL pgvector (LiteLLM Connector)");
    await user.type(screen.getByPlaceholderText("输入你的提供方提供的向量存储 ID"), "vs-pg");
    await user.click(screen.getByRole("button", { name: "创建" }));
    expect(await screen.findByText("请输入 api base")).toBeInTheDocument();
    expect(screen.queryByText("Please input the api base")).not.toBeInTheDocument();

    await chooseProvider(user, "Milvus");
    await user.type(screen.getByPlaceholderText("输入你的提供方提供的向量存储 ID"), "vs-milvus");
    await user.type(screen.getByPlaceholderText("username:password or api key"), "user:pass");
    await user.type(screen.getByPlaceholderText("https://your-milvus-endpoint.com/"), "https://milvus.example.com");
    await user.click(screen.getByRole("button", { name: "创建" }));

    expect(await screen.findByText("请选择 embedding model")).toBeInTheDocument();
    expect(screen.queryByText("Please select the embedding model")).not.toBeInTheDocument();
  });

  it("shows the Chinese created toast with the English original absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await user.type(screen.getByPlaceholderText("输入你的提供方提供的向量存储 ID"), "vs-1");
    await user.click(screen.getByRole("button", { name: "创建" }));

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("向量存储创建成功"));
    expect(toast.success).not.toHaveBeenCalledWith("Vector store created successfully");
  });

  it("shows the Chinese invalid-metadata toast with the English original absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");

    await user.type(screen.getByPlaceholderText("输入你的提供方提供的向量存储 ID"), "vs-1");
    await user.clear(screen.getByPlaceholderText('{"key": "value"}'));
    await user.type(screen.getByPlaceholderText('{"key": "value"}'), "not json");
    await user.click(screen.getByRole("button", { name: "创建" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("元数据字段中的 JSON 无效"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Invalid JSON in metadata field");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows the Chinese create-failure toast with the English original absent", async () => {
    const user = setupUser();
    mockCreate.mockRejectedValue(new Error("boom"));
    renderForm();
    await screen.findByText("添加新的向量存储");

    await user.type(screen.getByPlaceholderText("输入你的提供方提供的向量存储 ID"), "vs-1");
    await user.click(screen.getByRole("button", { name: "创建" }));

    await vi.waitFor(() => expect(toast.fromError).toHaveBeenCalledWith("创建向量存储失败：Error: boom"));
    expect(toast.fromError).not.toHaveBeenCalledWith("Error creating vector store: Error: boom");
  });

  it("renders the Chinese PG Vector alert with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");
    await chooseProvider(user, "PostgreSQL pgvector (LiteLLM Connector)");

    for (const [zh, en] of [
      ["需要设置 PG Vector", "PG Vector Setup Required"],
      [
        "LiteLLM 提供了一个用于连接 PG Vector 的服务器。要使用此提供方：",
        "LiteLLM provides a server to connect to PG Vector. To use this provider:",
      ],
      ["从以下地址部署 litellm-pgvector 服务器：", "Deploy the litellm-pgvector server from:"],
      ["在你的 PostgreSQL 数据库中配置 pgvector 扩展", "Configure your PostgreSQL database with pgvector extension"],
      ["启动服务器并记录 API base URL 和 API key", "Start the server and note the API base URL and API key"],
      ["在下方字段中输入这些信息", "Enter those details in the fields below"],
    ] as const) {
      expectZhNotEn(zh, en);
    }
  });

  it("renders the Chinese Valkey alert with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");
    await chooseProvider(user, "Valkey");

    for (const [zh, en] of [
      ["需要设置 Valkey", "Valkey Setup Required"],
      [
        "LiteLLM 会搜索你已经存储在 Valkey 中的文档。它不会为你创建索引或上传文档。创建此向量存储之前，请确认：",
        "LiteLLM searches documents you have already stored in Valkey. It does not create the index or upload documents for you. Before creating this vector store, make sure:",
      ],
      [
        "你的 Valkey 服务器已启用向量搜索（valkey-search 模块，包含在 valkey-bundle 镜像以及 AWS ElastiCache / MemoryDB for Valkey 中）",
        "Your Valkey server has vector search enabled (the valkey-search module, included in the valkey-bundle image and in AWS ElastiCache / MemoryDB for Valkey)",
      ],
      [
        "你已经创建了搜索索引，并将文档及其 Embedding 加载到其中。将该索引名称填入 Vector Store ID",
        "You have already created a search index and loaded your documents and their embeddings into it. Enter that index name as the Vector Store ID",
      ],
      [
        "你知道是哪个 Embedding 模型生成了这些已存储的 Embedding。该模型必须先在 Models 下添加到此代理，你才能在下方选择它。使用不同的模型会返回错误的结果",
        "You know which embedding model created those stored embeddings. That model must be added to this proxy under Models so you can pick it below. Using a different model returns wrong results",
      ],
      [
        "你知道文档用于文本和 Embedding 的字段名。如果不是 “text” 和 “embedding”，请在下方设置",
        'You know the field names your documents use for their text and their embedding. If they are not "text" and "embedding", set them below',
      ],
      [
        "当查询到来时，LiteLLM 会用下方的模型将其转换为 Embedding，并从你的索引中返回最匹配的文档。",
        "When a query comes in, LiteLLM converts it to an embedding with the model below and returns the closest matching documents from your index.",
      ],
    ] as const) {
      expectZhNotEn(zh, en);
    }
  });

  it("renders the Chinese Vertex AI Search alert with the English originals absent", async () => {
    const user = setupUser();
    renderForm();
    await screen.findByText("添加新的向量存储");
    await chooseProvider(user, "Vertex AI Search");

    expectRenderedZhNotEn(
      "在你的 Google Cloud 项目中启用 Discovery Engine API，并按照指南创建数据存储：创建 Vertex AI Search 数据存储",
      "Enable the Discovery Engine API on your Google Cloud project and create a data store following the guide: Create a Vertex AI Search data store",
    );
    expectRenderedZhNotEn(
      "对于网站、医疗和基于连接器的数据源（Drive、Gmail、Slack、Jira 等）：在数据存储之上创建搜索应用，然后复制 Engine ID 并将其输入 Engine ID 字段。Vector Store ID 仍作为此记录在 LiteLLM 侧的名称而必填，但设置 Engine ID 后它不会用于 GCP URL。",
      "For website, healthcare, and connector-based sources (Drive, Gmail, Slack, Jira, etc.): create a search app on top of the data store, then copy the Engine ID and enter it in the Engine ID field. The Vector Store ID is still required as the LiteLLM-side name for this record, but it isn't used in the GCP URL when Engine ID is set.",
    );

    for (const [zh, en] of [
      ["Vertex AI Search 设置", "Vertex AI Search Setup"],
      ["要使用 Vertex AI Search（Discovery Engine）：", "To use Vertex AI Search (Discovery Engine):"],
      [
        "注意：Google Cloud 已在其控制台中将其重命名为 “Agent Search”，以下步骤仍然适用。",
        'Note: Google Cloud has renamed this to "Agent Search" in its console — the steps below still apply.',
      ],
      ["选择受支持的位置：global、us 或 eu", "Pick a supported location: global, us, or eu"],
      [
        "对于大多数数据存储类型（Cloud Storage、BigQuery、Media）：复制数据存储 ID，并将其输入下方的 Vector Store ID 字段。",
        "For most data store types (Cloud Storage, BigQuery, Media): copy the data store ID and enter it in the Vector Store ID field below.",
      ],
    ] as const) {
      expectZhNotEn(zh, en);
    }
  });
});
