import type { ParseKeys } from "i18next";
import { getProviderLogoAndName, Providers, providerLogoMap } from "@/components/provider_info_helpers";
import milvusLogo from "../../public/assets/logos/milvus.svg";
import mongodbLogo from "../../public/assets/logos/mongodb.svg";
import postgresqlLogo from "../../public/assets/logos/postgresql.svg";
import s3VectorLogo from "../../public/assets/logos/s3_vector.png";
import valkeyLogo from "../../public/assets/logos/valkey.svg";

export enum VectorStoreProviders {
  Bedrock = "Amazon Bedrock",
  S3Vectors = "Amazon S3 Vectors",
  PgVector = "PostgreSQL pgvector (LiteLLM Connector)",
  VertexRagEngine = "Vertex AI RAG Engine",
  VertexAiSearch = "Vertex AI Search",
  OpenAI = "OpenAI",
  Azure = "Azure OpenAI",
  Milvus = "Milvus",
  MongoDB = "MongoDB (BETA)",
  Valkey = "Valkey",
}

export const vectorStoreProviderMap: Record<string, string> = {
  Bedrock: "bedrock",
  PgVector: "pg_vector",
  VertexRagEngine: "vertex_ai",
  VertexAiSearch: "vertex_ai/search_api",
  OpenAI: "openai",
  Azure: "azure",
  Milvus: "milvus",
  MongoDB: "mongodb",
  S3Vectors: "s3_vectors",
  Valkey: "valkey",
};

export const vectorStoreProviderLogoMap: Record<string, string> = {
  [VectorStoreProviders.Bedrock]: providerLogoMap[Providers.Bedrock] ?? "",
  [VectorStoreProviders.PgVector]: postgresqlLogo.src,
  [VectorStoreProviders.VertexRagEngine]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.VertexAiSearch]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.OpenAI]: providerLogoMap[Providers.OpenAI] ?? "",
  [VectorStoreProviders.Azure]: providerLogoMap[Providers.Azure] ?? "",
  [VectorStoreProviders.Milvus]: milvusLogo.src,
  [VectorStoreProviders.MongoDB]: mongodbLogo.src,
  [VectorStoreProviders.S3Vectors]: s3VectorLogo.src,
  [VectorStoreProviders.Valkey]: valkeyLogo.src,
};

interface VectorStoreFieldConfigBase {
  name: string;
  placeholder?: string;
  required: boolean;
  type?: "text" | "password" | "select";
  options?: { value: string; label: string }[];
  initialValue?: string;
}

/** A field label is either a literal (mock-only or data) or a catalog key, never neither. */
export type VectorStoreFieldLabel =
  | { label: string; labelKey?: never }
  | { label?: never; labelKey: ParseKeys<"vectorStores"> };

/** A field tooltip is either a literal (mock-only or data) or a catalog key, never neither. */
export type VectorStoreFieldTooltip =
  | { tooltip: string; tooltipKey?: never }
  | { tooltip?: never; tooltipKey: ParseKeys<"vectorStores"> };

// Define field types for provider-specific configurations
export type VectorStoreFieldConfig = VectorStoreFieldConfigBase & VectorStoreFieldLabel & VectorStoreFieldTooltip;

// Provider-specific field configurations
export const vectorStoreProviderFields: Record<string, VectorStoreFieldConfig[]> = {
  bedrock: [],
  pg_vector: [
    {
      name: "api_base",
      labelKey: "form.providerFields.pgVector.apiBase.label",
      tooltipKey: "form.providerFields.pgVector.apiBase.tooltip",
      placeholder: "http://your-deployed-server:8000",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      labelKey: "form.providerFields.pgVector.apiKey.label",
      tooltipKey: "form.providerFields.pgVector.apiKey.tooltip",
      placeholder: "your-deployed-api-key",
      required: true,
      type: "password",
    },
  ],
  vertex_rag_engine: [],
  "vertex_ai/search_api": [
    {
      name: "vertex_project",
      labelKey: "form.providerFields.vertexSearch.vertexProject.label",
      tooltipKey: "form.providerFields.vertexSearch.vertexProject.tooltip",
      placeholder: "my-gcp-project-id",
      required: true,
      type: "text",
    },
    {
      name: "vertex_location",
      labelKey: "form.providerFields.vertexSearch.vertexLocation.label",
      tooltipKey: "form.providerFields.vertexSearch.vertexLocation.tooltip",
      required: true,
      type: "select",
      options: [
        { value: "global", label: "global" },
        { value: "us", label: "us" },
        { value: "eu", label: "eu" },
      ],
      initialValue: "global",
    },
    {
      name: "vertex_collection_id",
      labelKey: "form.providerFields.vertexSearch.vertexCollectionId.label",
      tooltipKey: "form.providerFields.vertexSearch.vertexCollectionId.tooltip",
      placeholder: "e.g. my-custom-collection",
      required: false,
      type: "text",
    },
    {
      name: "vertex_engine_id",
      labelKey: "form.providerFields.vertexSearch.vertexEngineId.label",
      tooltipKey: "form.providerFields.vertexSearch.vertexEngineId.tooltip",
      placeholder: "e.g. my-search-app_1234567890",
      required: false,
      type: "text",
    },
  ],
  openai: [
    {
      name: "api_key",
      labelKey: "form.providerFields.openai.apiKey.label",
      tooltipKey: "form.providerFields.openai.apiKey.tooltip",
      placeholder: "sk-...",
      required: true,
      type: "password",
    },
  ],
  azure: [
    {
      name: "api_key",
      labelKey: "form.providerFields.azure.apiKey.label",
      tooltipKey: "form.providerFields.azure.apiKey.tooltip",
      placeholder: "your-azure-api-key",
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      labelKey: "form.providerFields.azure.apiBase.label",
      tooltipKey: "form.providerFields.azure.apiBase.tooltip",
      placeholder: "https://your-resource.openai.azure.com/",
      required: true,
      type: "text",
    },
  ],
  milvus: [
    {
      name: "api_key",
      labelKey: "form.providerFields.milvus.apiKey.label",
      tooltipKey: "form.providerFields.milvus.apiKey.tooltip",
      placeholder: "username:password or api key",
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      labelKey: "form.providerFields.milvus.apiBase.label",
      tooltipKey: "form.providerFields.milvus.apiBase.tooltip",
      placeholder: "https://your-milvus-endpoint.com/",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      labelKey: "form.providerFields.milvus.embeddingModel.label",
      tooltipKey: "form.providerFields.milvus.embeddingModel.tooltip",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
  mongodb: [
    {
      name: "api_base",
      labelKey: "form.providerFields.mongodb.apiBase.label",
      tooltipKey: "form.providerFields.mongodb.apiBase.tooltip",
      placeholder: "http://127.0.0.1:8080",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      labelKey: "form.providerFields.mongodb.apiKey.label",
      tooltipKey: "form.providerFields.mongodb.apiKey.tooltip",
      placeholder: "Enter sidecar API key",
      required: true,
      type: "password",
    },
    {
      name: "mongodb_database",
      labelKey: "form.providerFields.mongodb.mongodbDatabase.label",
      tooltipKey: "form.providerFields.mongodb.mongodbDatabase.tooltip",
      placeholder: "sample_mflix",
      required: true,
      type: "text",
    },
    {
      name: "mongodb_collection",
      labelKey: "form.providerFields.mongodb.mongodbCollection.label",
      tooltipKey: "form.providerFields.mongodb.mongodbCollection.tooltip",
      placeholder: "embedded_movies",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      labelKey: "form.providerFields.mongodb.embeddingModel.label",
      tooltipKey: "form.providerFields.mongodb.embeddingModel.tooltip",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "mongodb_embedding_field",
      labelKey: "form.providerFields.mongodb.mongodbEmbeddingField.label",
      tooltipKey: "form.providerFields.mongodb.mongodbEmbeddingField.tooltip",
      placeholder: "embedding",
      required: false,
      type: "text",
      initialValue: "embedding",
    },
    {
      name: "mongodb_text_field",
      labelKey: "form.providerFields.mongodb.mongodbTextField.label",
      tooltipKey: "form.providerFields.mongodb.mongodbTextField.tooltip",
      placeholder: "text",
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "mongodb_num_candidates",
      labelKey: "form.providerFields.mongodb.mongodbNumCandidates.label",
      tooltipKey: "form.providerFields.mongodb.mongodbNumCandidates.tooltip",
      placeholder: "100",
      required: false,
      type: "text",
    },
  ],
  valkey: [
    {
      name: "valkey_host",
      labelKey: "form.providerFields.valkey.valkeyHost.label",
      tooltipKey: "form.providerFields.valkey.valkeyHost.tooltip",
      placeholder: "my-valkey.example.com",
      required: true,
      type: "text",
    },
    {
      name: "valkey_port",
      labelKey: "form.providerFields.valkey.valkeyPort.label",
      tooltipKey: "form.providerFields.valkey.valkeyPort.tooltip",
      placeholder: "6379",
      required: false,
      type: "text",
      initialValue: "6379",
    },
    {
      name: "valkey_password",
      labelKey: "form.providerFields.valkey.valkeyPassword.label",
      tooltipKey: "form.providerFields.valkey.valkeyPassword.tooltip",
      required: false,
      type: "password",
    },
    {
      name: "valkey_ssl",
      labelKey: "form.providerFields.valkey.valkeySsl.label",
      tooltipKey: "form.providerFields.valkey.valkeySsl.tooltip",
      required: false,
      type: "select",
      options: [
        { value: "false", label: "false" },
        { value: "true", label: "true" },
      ],
      initialValue: "false",
    },
    {
      name: "embedding_model",
      labelKey: "form.providerFields.valkey.embeddingModel.label",
      tooltipKey: "form.providerFields.valkey.embeddingModel.tooltip",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "valkey_text_field",
      labelKey: "form.providerFields.valkey.valkeyTextField.label",
      tooltipKey: "form.providerFields.valkey.valkeyTextField.tooltip",
      placeholder: "text",
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "valkey_embedding_field",
      labelKey: "form.providerFields.valkey.valkeyEmbeddingField.label",
      tooltipKey: "form.providerFields.valkey.valkeyEmbeddingField.tooltip",
      placeholder: "embedding",
      required: false,
      type: "text",
      initialValue: "embedding",
    },
  ],
  s3_vectors: [
    {
      name: "vector_bucket_name",
      labelKey: "form.providerFields.s3Vectors.vectorBucketName.label",
      tooltipKey: "form.providerFields.s3Vectors.vectorBucketName.tooltip",
      placeholder: "my-vector-bucket",
      required: true,
      type: "text",
    },
    {
      name: "index_name",
      labelKey: "form.providerFields.s3Vectors.indexName.label",
      tooltipKey: "form.providerFields.s3Vectors.indexName.tooltip",
      placeholder: "my-vector-index",
      required: false,
      type: "text",
    },
    {
      name: "aws_region_name",
      labelKey: "form.providerFields.s3Vectors.awsRegionName.label",
      tooltipKey: "form.providerFields.s3Vectors.awsRegionName.tooltip",
      placeholder: "us-west-2",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      labelKey: "form.providerFields.s3Vectors.embeddingModel.label",
      tooltipKey: "form.providerFields.s3Vectors.embeddingModel.tooltip",
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
};

export const getVectorStoreProviderLogoAndName = (providerValue: string): { logo: string; displayName: string } => {
  const enumKey = Object.keys(vectorStoreProviderMap).find(
    (key) => vectorStoreProviderMap[key].toLowerCase() === providerValue.toLowerCase(),
  );
  if (!enumKey) {
    return getProviderLogoAndName(providerValue);
  }
  const displayName = VectorStoreProviders[enumKey as keyof typeof VectorStoreProviders];
  return { logo: vectorStoreProviderLogoMap[displayName], displayName };
};

export const getProviderSpecificFields = (providerValue: string): VectorStoreFieldConfig[] => {
  return vectorStoreProviderFields[providerValue] || [];
};
