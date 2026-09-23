/* eslint-disable testing-library/no-node-access -- The hint triggers are icons with no accessible name, so reaching their tooltips needs the DOM */
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAvailableModels } from "@/components/llm_calls/fetch_models";
import { vectorStoreProviderFields } from "@/components/vector_store_providers";
import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import VectorStoreForm from "./VectorStoreForm";

vi.mock("@/components/networking", () => ({
  vectorStoreCreateCall: vi.fn(),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn(),
}));

interface ProviderFieldCopy {
  label: string;
  tooltip: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  pg_vector: "PostgreSQL pgvector (LiteLLM Connector)",
  "vertex_ai/search_api": "Vertex AI Search",
  openai: "OpenAI",
  azure: "Azure OpenAI",
  milvus: "Milvus",
  mongodb: "MongoDB (BETA)",
  valkey: "Valkey",
  s3_vectors: "Amazon S3 Vectors",
};

const ZH_COPY: Record<string, Record<string, ProviderFieldCopy>> = {
  pg_vector: {
    api_base: {
      label: "API Base",
      tooltip: "输入你部署的 litellm-pgvector 服务器的 Base URL（例如 http://your-server:8000）",
    },
    api_key: { label: "API Key", tooltip: "输入你部署的 litellm-pgvector 服务器的 API Key" },
  },
  "vertex_ai/search_api": {
    vertex_project: { label: "Vertex 项目", tooltip: "托管 Vertex AI Search 数据存储的 Google Cloud 项目 ID。" },
    vertex_location: {
      label: "Vertex 位置",
      tooltip: "Vertex AI Search 数据存储位置。必须是 global、us 或 eu 之一。",
    },
    vertex_collection_id: {
      label: "Collection ID（可选）",
      tooltip: "Discovery Engine Collection ID。留空以使用默认 Collection。",
    },
    vertex_engine_id: {
      label: "Engine ID（可选）",
      tooltip:
        "搜索应用（Engine）ID。网站、医疗和基于连接器的数据存储（Workspace、Slack、Jira 等）必须填写，因为这些数据源通过 Engine 路由搜索。留空则直接查询数据存储。",
    },
  },
  openai: {
    api_key: { label: "API Key", tooltip: "输入你的 OpenAI API Key" },
  },
  azure: {
    api_key: { label: "API Key", tooltip: "输入你的 Azure OpenAI API Key" },
    api_base: {
      label: "API Base",
      tooltip: "输入你的 Azure OpenAI Endpoint（例如 https://your-resource.openai.azure.com/）",
    },
  },
  milvus: {
    api_key: {
      label: "API Key",
      tooltip: "要获取 Token，请用冒号（:）连接你访问 Milvus 实例所用的用户名和密码（例如 username:password）",
    },
    api_base: { label: "API Base", tooltip: "输入你的 Milvus Endpoint（例如 https://your-milvus-endpoint.com/）" },
    embedding_model: { label: "Embedding 模型", tooltip: "选择要使用的 Embedding 模型" },
  },
  mongodb: {
    api_base: {
      label: "Sidecar URL",
      tooltip: "远程 Sidecar 使用 HTTPS，同一主机或 Pod 上的 Sidecar 使用带回环 IP 的 HTTP",
    },
    api_key: { label: "Sidecar API Key", tooltip: "在你的 MongoDB Sidecar 中配置的 MONGODB_SIDECAR_API_KEY" },
    mongodb_database: { label: "数据库", tooltip: "包含你要搜索的 Collection 的 MongoDB 数据库" },
    mongodb_collection: { label: "Collection", tooltip: "你的 MongoDB Vector Search 索引所基于的 Collection" },
    embedding_model: {
      label: "Embedding 模型",
      tooltip:
        "此代理上创建了你 Collection 中已存储向量的 Embedding 模型。LiteLLM 会用它为每个搜索查询生成 Embedding，因此必须是同一个模型。相同尺寸的不同模型不会报错，只会返回错误的结果。如果列表中没有，请先在 Models 下添加",
    },
    mongodb_embedding_field: {
      label: "向量字段名",
      tooltip:
        "每个文档中存储其 Embedding 的字段。它必须与创建 MongoDB Vector Search 索引时使用的路径一致（默认：embedding）",
    },
    mongodb_text_field: {
      label: "文本字段",
      tooltip:
        "每个文档中存储其可读文本的字段。LiteLLM 会在搜索结果中返回此文本，它支持 metadata.body 这样的点分路径（默认：text）",
    },
    mongodb_num_candidates: {
      label: "候选数量",
      tooltip:
        "MongoDB 在返回最佳结果之前检查的最近邻数量。值越大越准确，但速度越慢。留空则由 LiteLLM 根据请求的结果数量自动调整",
    },
  },
  valkey: {
    valkey_host: {
      label: "Valkey 主机",
      tooltip: "你的 Valkey 服务器的主机名或 IP，不含 redis:// 或端口（例如 my-valkey.example.com）",
    },
    valkey_port: { label: "Valkey 端口", tooltip: "你的 Valkey 服务器监听的端口。除非你改过，否则保持 6379" },
    valkey_password: {
      label: "Valkey 密码",
      tooltip: "用于登录你的 Valkey 服务器的密码。如果没有密码，请留空",
    },
    valkey_ssl: {
      label: "使用 TLS",
      tooltip: "如果你的 Valkey 服务器需要加密（TLS）连接，请设为 true，例如开启了传输中加密的 AWS ElastiCache",
    },
    embedding_model: {
      label: "Embedding 模型",
      tooltip:
        "此代理上用于创建你 Valkey 索引中已存储 Embedding 的 Embedding 模型。LiteLLM 会用它为每个搜索查询生成 Embedding，因此必须是同一个模型，否则结果会出错。如果列表中没有，请先在 Models 下添加",
    },
    valkey_text_field: {
      label: "文本字段",
      tooltip:
        "每个已存储文档中保存其可读文本的字段。LiteLLM 会在搜索结果中返回此文本。必须与文档的存储方式一致（默认：text）",
    },
    valkey_embedding_field: {
      label: "向量字段名",
      tooltip:
        "每个已存储文档中保存其 Embedding 的字段。LiteLLM 会针对此字段进行搜索，因此必须与创建索引时使用的字段一致（默认：embedding）",
    },
  },
  s3_vectors: {
    vector_bucket_name: {
      label: "向量存储桶名称",
      tooltip: "用于向量存储的 S3 存储桶名称（如果不存在将自动创建）",
    },
    index_name: { label: "索引名称", tooltip: "向量索引的名称（可选，未提供时将自动生成）" },
    aws_region_name: { label: "AWS 区域", tooltip: "S3 存储桶所在的 AWS 区域（例如 us-west-2）" },
    embedding_model: { label: "Embedding 模型", tooltip: "选择用于生成向量的 Embedding 模型" },
  },
};

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

const openHint = async (user: ReturnType<typeof userEvent.setup>, labelElement: HTMLElement) => {
  const trigger = labelElement.querySelector("svg");
  if (!trigger) throw new Error(`no hint trigger on ${labelElement.textContent}`);
  await user.hover(trigger);
};

describe("vector store provider field Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders each provider field label and open tooltip from its own key, with the English original absent", async () => {
    const user = setupUser();
    const tEn = i18n.getFixedT("en", "vectorStores");
    renderForm();
    await screen.findByText("添加新的向量存储");

    const assertedKeys: string[] = [];

    for (const [providerValue, fields] of Object.entries(vectorStoreProviderFields)) {
      if (fields.length === 0) continue;
      const providerLabel = PROVIDER_LABELS[providerValue];
      expect(providerLabel, `provider label for ${providerValue}`).toBeDefined();
      await chooseProvider(user, providerLabel);

      for (const field of fields) {
        const expected = ZH_COPY[providerValue]?.[field.name];
        expect(expected, `copy for ${providerValue}.${field.name}`).toBeDefined();
        if (!expected || !field.labelKey || !field.tooltipKey) {
          throw new Error(`missing expectation or key for ${providerValue}.${field.name}`);
        }

        const labelElement = screen.getByText(expected.label);
        expect(labelElement, `label element ${providerValue}.${field.name}`).toBeInTheDocument();
        assertedKeys.push(field.labelKey);

        const enLabel = tEn(field.labelKey);
        if (enLabel !== expected.label) {
          expect(screen.queryByText(enLabel), `en label ${providerValue}.${field.name}`).not.toBeInTheDocument();
        }

        await openHint(user, labelElement);
        expect(
          await screen.findByText(expected.tooltip),
          `zh tooltip ${providerValue}.${field.name}`,
        ).toBeInTheDocument();
        assertedKeys.push(field.tooltipKey);

        const enTooltip = tEn(field.tooltipKey);
        if (enTooltip !== expected.tooltip) {
          expect(screen.queryByText(enTooltip), `en tooltip ${providerValue}.${field.name}`).not.toBeInTheDocument();
        }
      }
    }

    expect(assertedKeys, "every provider field label and tooltip key is asserted once").toHaveLength(62);
    expect(new Set(assertedKeys).size, "no two fields share a key").toBe(assertedKeys.length);
  });
});
